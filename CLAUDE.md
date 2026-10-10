# How we work on world-engine

world-engine is a driving engine and game that is not tied to any one place.
Real places are built from open map data; each place is a data file in
`places/`, not code. First places: Finglas (Dublin, drives on the left) and
Yaba (Lagos, drives on the right). Later: boats, planes, other countries,
maybe other planets. It runs in the browser (three.js and Rapier on the
client), with Cloudflare Workers and Durable Objects on the server. The core
mode is deliveries in Lagos, and the server decides every payout.

The owner is a designer, not a coder. Explain in plain words, say what you
tested and what you did not, and recommend one option instead of listing
several.

These rules are adapted from the Spes and World Drive rules. Where a script
can enforce one, it does (see "Checks and hooks"). The rest you follow.

## One scope per session

- Each session does exactly one scope from `docs/scopes/`. Read it first and do
  what it says, nothing more.
- A new idea, however good, goes in `PARKING_LOT.md` as one line. It never goes
  into the current scope.
- Scopes are copied from `docs/scopes/TEMPLATE.md`.

## Find code before writing code

Before writing any system from scratch (traffic, a tyre model, a city
importer, weather), assume someone has built it and look first: GitHub,
published datasets, game-dev write-ups.

- Study the best two or three. Read their licences.
- Write what you found to `research/`, naming the source (repo, page, dataset).
- Take **techniques only**. Never copy GPL code. Never copy code from sites.
- Licences for anything we use: CC0, CC-BY, MIT or Apache, and credited.
  Map data from OpenStreetMap is ODbL, which the place format accepts for map
  data only. Check the credit is in the place file's `dataSources`.
- Never touch leaked or proprietary source code (for example GTA source on the
  owner's machine). Not to read, not to port, not to "just check".

## References at block level

Each block of code (a function, or a group of lines that follow from one
source) says where its idea came from: the standard and clause, the open
project and file and licence, the paper, the dataset, or our own measurement
and how it was made. A block may share one reference at its top. Plumbing that
only joins pieces cites the API it uses.

- Never invent a reference. If you cannot find the source, say so and do the
  research first.
- The reviewer checks that cited sources exist.

## Diagram first, code from the diagram

- Every scope has a design diagram the owner approved before code is written.
- Diagrams generated from the code (Scope 002 builds this) must match the
  approved one. If they differ, either the code or the diagram is wrong: tell
  the owner, do not quietly change one.

## Write code that reads like a diagram

- **Small functions.** Each one does one thing and reads as a diagram. Lint
  refuses a function with too many branches (complexity over 8) or blocks
  nested more than 3 deep; length alone is not the test. Split it; do not
  loosen the rule.
- **Names say what things are.** When the name you want is taken, rename the
  existing thing to what it really is, then use the good name. No `name2`,
  `newX`, `finalX`. Lint refuses a name that hides another.
- **Delete what is dead.** Unused code, files, and comments or docs that no
  longer describe the code go in the same change that finds them. Git keeps
  history.
- **One source of truth.** If two things can disagree, one should not exist.
  Work it out from the other.
- **Comments say why**, in plain words.
- **Fix every cascade.** A change is not done until everything it touches is
  fixed. No "X still does the old thing".

## Finding what a change touches: the compiler first

1. Change the types to the new model, then run `npm run typecheck` and follow
   its list. The compiler follows the data; a search only finds spellings.
2. Only then search, and only for the untyped edges the compiler cannot see:
   baked data files, strings, storage keys, the network protocol.
3. Then the data already out there: places and saved games from before the
   change.

The compiler gate hook refuses searches while code is changed and the typecheck
has not run since.

## The engine knows no place

- Nothing about a specific place in engine code: no "Finglas", "Lagos", "left",
  "km/h", no currency. Driving side, speed units, road rules, gravity and air
  density all come from the place file (`src/place/`).
- To add a town, you add a file in `places/`. If you had to edit engine code
  to add it, the engine is wrong.
- A new kind of vehicle is a vehicle file the same way.

## The server decides

- The server decides every reward and payout. Never trust a number from the
  client: a delivery counts because the server saw it done, not because the
  phone said so.
- Anything the game says about the player's progress ("delivered", "paid")
  needs the server fact that makes it true.

## The player's story

Before building a change in behaviour, and again before shipping it, tell it
from the player's side: what they do, what they expect, what they will see. If
those differ, the change is wrong, however clean the code.

- Every commit that changes the game (`src/`) has a `Story:` paragraph in its
  message. A hook refuses the commit without one.
- The word on a button means what it means to everyone. "Undo" puts it back
  exactly. "Skip" is not done.
- Nothing happens to the player's progress behind their back. Anything the
  game does by itself is shown, with the reason.
- Never invent numbers. Read real ones and say what you checked.

## Tests: four paths

Every change is tested down four paths. Test names say the rule in plain
words. A bug gets a test that reproduces it first.

1. **Happy:** it does what it is for, with normal input.
2. **Sad:** things go wrong the normal way: a missing field, a failed fetch,
   a place with no road network. The player or the editor is told something
   useful.
3. **Idiot-proof:** someone does the unexpected: two pedals at once, a
   misspelt field, a number sent as text, a request with fields missing.
4. **Tragedy:** slow disasters of time and scale: a three-hour session, the
   clock passing midnight or changing, precision far from the origin, a very
   large city, a file written by an older version.

## Checks and hooks

`npm run check` runs the typecheck, lint and tests. It must pass before
anything is committed or pushed. The hooks in `.claude/hooks/` (wired in
`.claude/settings.json`; each has a test in `tests/hooks/`) enforce the rest:

- **Checks before commit:** a commit or push is blocked while typecheck, lint
  or tests fail.
- **Checks before stop:** ending a turn with changed code that fails them sends
  Claude back to fix it.
- **Compiler gate:** searches are refused while code is changed and the
  typecheck has not run since.
- **Story before commit:** a commit that changes `src/` is blocked without a
  `Story:` paragraph.
- **Second-model review before push:** a separate Claude reads this file, the
  commit messages and the diff, and blocks the push with findings when a rule
  here is broken. If a finding is wrong, say why in a commit message paragraph
  starting `Review:`. Never work around the review; if it is stuck, tell the
  owner. If the reviewer cannot run, the push is blocked.

Never skip a hook (`--no-verify`) or loosen a test or a lint rule to get
through. Fix the thing.

## Working here

- Node 22. `npm install`, then `npm run check`.
- Scripts: `typecheck`, `lint`, `test`, `check`. Versions are pinned exactly.
- The hook scripts are POSIX `sh` plus `jq`.
- Place and vehicle file formats live in `src/place/`; examples in `places/`.
- Do not push unless the owner or the orchestrating session says so.

## Talking to the owner

- Be honest. Critique the work on its merits, whoever built it.
- Recommend one option. Do not list options you would not choose.
- Plain words. Say what was tested and what was not.
