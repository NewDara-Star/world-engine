# Scope 001b: hook fixes, review routing, place data

Status: approved by Daramola (owner), 2026-10-10, after the architecture review
(V5 doc, section "Architecture review").

## Goal

Hooks fire only on a real commit or push; the push review's size follows the
size and risk of the change; place data uses verifiable, cited values; the
rules in CLAUDE.md match the owner's decisions of 2026-10-10.

## In scope

1. **Real-command detection** (shared helper used by every commit/push hook).
   A command triggers commit checks only if `git commit` (or `git push` for push
   hooks) is an actual command, not text. Split the command on `&&`, `||`, `;`,
   `|` and newlines; ignore heredoc bodies and quoted strings; allow leading env
   assignments, `git -C <dir>` and `git -c k=v`. Must pass this table:

   | Command | Triggers? |
   | --- | --- |
   | `git commit -m "x"` | yes |
   | `cd sub && git commit -m "x"` | yes |
   | `git -C dir commit` | yes |
   | `FOO=1 git commit -m x` | yes |
   | `echo "git commit"` | no |
   | heredoc writing a file whose body mentions `git commit` | no |
   | `bash -c "git commit"` | yes (can't be sure, so check) |
   | `git commit-tree ...` / `git log --grep commit` | no |

   Keep it small, pure and tested; the four test paths (happy, sad,
   idiot-proof, tragedy).
2. **Review routing in `review-before-push.sh`.** "Big or risky" → one Opus
   review. Big or risky = any of: more than 400 lines changed since
   `origin/main`; touches money or trust (paths you define for server rewards,
   economy, payments, anti-cheat — create the path list in one config file even
   though the folders don't exist yet); touches the rules (`.claude/hooks/`,
   `CLAUDE.md`, `src/place/` schema); or the commit message contains
   `Scope-complete:`. Otherwise → three Sonnet reviewers run in parallel, one lens
   each: (a) the player's story and fun/mechanics fit, (b) the rules in CLAUDE.md
   and first principles, (c) tests, four paths and cascades. Any block → push
   blocked with combined findings. Reviewer unable to run → block. Remember a
   pass per commit. The routing decision must be a pure function with tests;
   the model calls themselves are not exercised in tests.
3. **Lint: complexity, not length.** Replace the 30-line function limit with
   ESLint `complexity` (max paths, start at 8) and `max-depth` (3). Remove
   `max-lines-per-function` or raise it to a generous safety net (~120). Fix any
   code that breaks the new rules.
4. **Place data, verifiable values only.**
   - Gravity: keep the WGS84 normal-gravity (Somigliana) formula; add the source
     next to the value (name the standard and where its constants come from).
   - Air density: one fixed value per place for physics, computed from official
     climate normals (Met Éireann for Dublin; for Lagos, NiMet or NOAA/WMO
     climate normals), with the source and the period (e.g. 1991–2020) cited.
     Do the research and cite real pages you opened. If you cannot verify a
     number, say so in the place file and in your report; never invent one.
   - Note in the place format that live weather is visual only and never feeds
     physics.
5. **CLAUDE.md updates** (plain words):
   - Licences: attribution-only licences are allowed (CC-BY, ODbL, and
     similar like Copernicus), because all credits live on the game's About
     page and nowhere else. For Google Open Buildings choose ODbL. Map data we
     improve and hand out stays open under ODbL; baked map data shipped to
     players may count as a derivative database, so the bake script and
     extracted data will be published. Game code stays private.
   - Target device: a mid-range Android phone is the reference; every slice is
     measured on it; under ~30 MB downloaded before you can drive; the wheel is
     a desktop bonus.
   - Streaming: plain 100 m grid chunks (visual + collider per cell), not 3D
     Tiles.
   - Server authority: samples streamed live and timed by the server clock; the
     server assigns jobs; earn caps; pin guesses rate-limited per device and IP.
   - Diagram gate (built in Scope 002) blocks everywhere, per the owner.
   - Never use leaked or proprietary source code (e.g. a GTA source folder).
6. **Research note** `research/29-machine-sight.md`: techniques only from the
   Machine Sight project at `/home/claude/ref/machine-sight/` (its licence is
   not on our list, so no code may be copied and nothing is credited): how cars
   are built in code from side profiles, how pedestrians are animated in the
   vertex shader, and how the white-clay look is made (materials, ambient
   occlusion, post-processing). Name files and functions you read.
7. **Slice roadmap** in `README.md` or `docs/roadmap.md`, matching V5's new
   order: street → server-paid grey-box delivery with a cheat test → traffic
   and lights → buildings → shared world → economy → first hunt.

## Out of scope

The diagram generator and diagram gate (Scope 002); any game code; any
networking.

## Done when

- `npm run check` passes; every hook test passes, including the detection table.
- Routing tests prove: 401 changed lines → Opus; a hooks change → Opus;
  `Scope-complete:` → Opus; a small src change → three Sonnet lenses.
- Both places validate with cited air density and gravity sources.
- Small commits with clear messages ending with
  `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Do not push.
