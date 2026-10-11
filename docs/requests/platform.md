# Requests to Platform (kept by the first orchestrator until track 13 starts)

## 2026-10-11, from World data: `npm run check` fails on main

- **What:** four tests in `tests/decisions/` fail on `main` (commit 8083091),
  before any World data change:
  `log.test.ts` "keeps every entry when nothing is replaced",
  `clash.test.ts` "finds D-0022 for only the owner pushes" and
  "finds D-0022 for sessions may push to GitHub",
  `cli.test.ts` "finds D-0022 for only the owner pushes, with its date…".
- **Why:** the tests read the real `docs/DECISIONS.md`. D-0040 now replaces
  D-0022 (and D-0042/D-0043 replace D-0041/D-0042), so the checker rightly
  leaves D-0022 out and the log is no longer "nothing replaced". The code is
  right; the tests describe the log as it was.
- **Ask:** point those tests at the rule now in force (D-0040) and make the
  "nothing replaced" test use a made-up log, so they stop breaking each time
  a decision is replaced. World data did not change them: they are not its
  folder, and changing tests to get a branch green is the owner's call.
- **By when:** before the next pull request into main, since every track's
  check is red until then.
