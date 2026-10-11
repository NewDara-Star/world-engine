# How we work on world-engine

world-engine is a driving engine and game that is not tied to any one place.
Real places are built from open map data; each place is a data file in
`places/`, not code. First places: Finglas (Dublin, drives on the left) and
Yaba (Lagos, drives on the right). Later: boats, planes, other countries,
Mars, invented planets and galaxies: the engine is built for the whole
universe and names none of it. It runs in the browser (three.js and Rapier on the
client), with Cloudflare Workers and Durable Objects on the server. The core
mode is deliveries in Lagos, and the server decides every payout.

The owner is a designer, not a coder. Explain in plain words, say what you
tested and what you did not, and recommend one option instead of listing
several.

**The owner's examples are examples, never the whole list.** When he says
"for example New York, Tokyo" or "like a blue sky", look at everything of
that kind (every city, night skies, auroras), not only the words he used.

These rules are adapted from the Spes and World Drive rules. Where a script
can enforce one, it does (see "Checks and hooks"). The rest you follow.

## Tracks

The game is built by several track chats at once (world data, assets,
gameplay, server, and more). `docs/TRACKS.md` says what each owns and how
they work together: read it first. Read anyone's code; change only your
track's folders; ask for changes elsewhere in `docs/requests/`.

## One scope per session

- Each session does exactly one scope from `docs/scopes/`. Read it first and do
  what it says, nothing more.
- A new idea, however good, goes in `PARKING_LOT.md` as one line. It never goes
  into the current scope.
- Scopes are copied from `docs/scopes/TEMPLATE.md`.

## Find code before writing code

Before writing anything (a whole system or a small feature), assume someone
has built it and look first: GitHub, published datasets, papers, game-dev
write-ups. Research is always the first step, never the code.

- Study the best two or three. Read their licences.
- Write what you found to `research/`, naming the source (repo, page, dataset).
- Take **techniques only**. Never copy GPL code. Never copy code from sites.
- Licences for anything we use: CC0, MIT or Apache, or an attribution-only
  licence (CC-BY, ODbL, and similar such as Copernicus), credited. Every
  credit lives on the game's About page and nowhere else, so each source goes
  in the place file's `dataSources` and the About page is built from those.
  For Google Open Buildings, which is offered under more than one licence, we
  choose ODbL.
- Map data we improve and hand out stays open under ODbL. Baked map data
  shipped to players may count as a derivative database, so the bake script
  and the extracted data are published. Game code stays private.
- Never touch leaked or proprietary source code (for example GTA source on the
  owner's machine). Not to read, not to port, not to "just check".
- A site whose robots.txt disallows us (for example Pinterest, Nominatim,
  Overpass) is never fetched by any route: no curl, no other tool, no mirror.
  Give the owner the link and what to look for, and he opens it himself.
- Vehicles are invented makes and models, with no real brand names, logos or
  badges. Common forms (a danfo, a BRT bus, a double-decker) are fine in our
  own liveries.

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
- **Designs** live in `docs/designs/`, mirroring the source path
  (`src/place/parse.ts` has `docs/designs/src/place/parse.md`): one `## name`
  heading per function, the same name the generated flow uses, and one Mermaid
  flowchart under it. Written before the code, in plain words.
- **Flows** are drawn from the code by the TypeScript compiler, no AI:
  `npm run diagrams` writes `docs/flows/` (one chart per function, plus
  `modules.md`, which file uses which). Run it before every commit that
  changes TypeScript; commit the result.
- A design is **approved** when the commit that last changed it has one of
  two trailers, each as a whole line:
  - `Approved-by: Daramola` when the owner decided it in chat (anything the
    approver escalated, and any design the owner approves himself);
  - `Approved-by: reviewer (delegated by Daramola)` when the delegated design
    approver (`docs/roles/approver.md`) approved it on its own.

  Only the orchestrating session adds either trailer, and only after that
  approval; no other session (a coding session, the approver itself) adds one.
  Anything else, even `Approved-by: reviewer` alone, does not count. **A hook
  cannot prove who typed it**: the trailer is a record the orchestrator is
  trusted to keep honest, not a signature. To approve, the orchestrator
  changes each approved design's `Status:` line from `draft` to `approved` and
  commits with the trailer. Any later edit to a design is unapproved until it
  is approved again.
- Generated flows must match the approved design. If they differ, either the
  code or the design is wrong: tell the owner, do not quietly change one. The
  push review's design-match lens checks this for every changed function.
- The diagram gate (`.claude/hooks/diagram-gate.sh`) blocks every commit
  whose diagrams are stale, whose functions lack a design, or whose designs
  are unapproved, with no exceptions. `src/` and `tools/` are covered; shell
  hooks, tests and `places/` are not.

## How a change is built

Owner, 2026-10-11 (Scope 004). Read `docs/DECISIONS.md` before acting; never
contradict an entry without the owner.

Physics, money, cheating and saved progress go: approved design, then tests
written blind by a session that never sees the code (failing first), then
code by a separate Opus session that cannot change those tests, then the
gates and reviewers. Everything else (screens, maps, labels, data, tools) is
built by one session with its designs and ordinary tests, approved by the
orchestrator in one pass (owner, 2026-10-11: "strike a balance between
moving things forward and actually writing code"). Every session ends with
something the owner can see or play.
The roles are in `docs/roles/`: `orchestrator.md` (runs the pipeline, the
only one who approves, sets roles and records decisions), `approver.md`,
`test-writer.md`, `coder.md`, `note-taker.md`. A session started with
`WE_ROLE` is held to its role by hooks and cannot change it. The test-writer's
commit is the one commit allowed with failing tests, and only its new ones,
each failing for an expected reason (`tests/fails-first.json`).

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
- Samples (position, speed, route) stream live and are timed by the server
  clock, not the phone's.
- The server assigns jobs; the phone never picks its own.
- Earnings have caps.
- Guessing a pin is rate-limited per device and per IP.

## The target device and streaming

- A mid-range Android phone is the reference device. Every slice is measured
  on it. Under about 30 MB is downloaded before you can drive. The steering
  wheel is a desktop bonus, never required.
- Every action you can do with a wheel, a gamepad or a keyboard can also be
  done on a touchscreen (a thumb stick on one side, buttons on the other,
  shoulder-style buttons where they fit). Two thumbs can only do so much, so
  touch may combine or simplify controls, but nothing is out of reach on a
  phone. (Owner, 2026-10-11.)
- The world streams in plain 100 m grid chunks (a visual piece and a collider
  per cell), not 3D Tiles.

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
- **Where a number comes from (the data rule).** In order: (1) an official
  figure, when one exists; (2) otherwise a figure derived from real
  measurements, with the source and its weaknesses named; (3) otherwise the
  owner's creative call, recorded as his. Never a silent guess. A place file
  records which one each constant is with `status`: `official`, `derived` or
  `owner-choice`.

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
- **Diagram gate:** a commit is blocked while the diagrams in `docs/flows/`
  are out of date, while a function in `src/` or `tools/` has no design in
  `docs/designs/`, or while a design is not approved (see "Diagram first").
  Shell hooks are not TypeScript, so they are exempt; the push review reads them.
- **Role guard:** with `WE_ROLE=test-writer`, reading or listing `src/` or
  `docs/flows/` and writing outside `tests/` are refused; with
  `WE_ROLE=coder`, changing `tests/` is refused; under any role, changing
  `.claude/`, `CLAUDE.md`, `docs/roles/` or `.git/`, or starting another
  `claude`, is refused. No role: nothing changes.
- **Tests lock:** the test-writer's commit needs its new tests to fail first
  for an expected reason; the coder's commit needs `tests/` byte-identical to
  the test-writer's commit (`WE_LOCK`) and those tests passing.
- **Story before commit:** a commit that changes `src/` is blocked without a
  `Story:` paragraph.
- **Second-model review before push:** separate Claudes read this file, the
  commit messages and the diff, and block the push with findings when a rule
  here is broken. A big or risky push (over 400 lines, money or trust code,
  the rules themselves, or a `Scope-complete:` commit) gets one Opus review;
  any other push gets four Sonnet reviewers, one each for the player's story,
  the rules, the tests, and the design match (the code's drawn flow against
  its approved design; this lens runs on every push, and is part of the Opus
  review when the push is routed there). The risky paths are listed in
  `.claude/hooks/review-risk-paths.txt`. If a finding is wrong, say why in a commit message paragraph
  starting `Review:`. Never work around the review; if it is stuck, tell the
  owner. If the reviewer cannot run, the push is blocked.

Never skip a hook (`--no-verify`) or loosen a test or a lint rule to get
through. Fix the thing.

## Working here

- Node 22. `npm install`, then `npm run check`.
- Scripts: `typecheck`, `lint`, `test`, `check`. Versions are pinned exactly.
- The hook scripts are POSIX `sh` plus `jq`.
- `npm run diagrams` redraws `docs/flows/`; `npm run modules` checks that
  engine code does not import `places/` (part of `npm run check`).
- Place and vehicle file formats live in `src/place/`; examples in `places/`.
- Push only your track's own branch (`track/<name>`), never `main`; work
  reaches `main` through a pull request the owner merges (D-0040).

## Talking to the owner

- Be honest. Critique the work on its merits, whoever built it.
- Recommend one option. Do not list options you would not choose.
- Plain words. Say what was tested and what was not.
