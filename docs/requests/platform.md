# Requests to Platform (track 13)

## From Assets, 2026-10-11: `npm run check` fails on main

- **What:** 4 tests fail on `main` (commit 8083091) before any track change:
  `tests/decisions/clash.test.ts` (2), `tests/decisions/cli.test.ts` (1) and
  `tests/decisions/log.test.ts` ("keeps every entry when nothing is
  replaced"). They expect D-0022 ("only the owner pushes") to be in force,
  but D-0040 now replaces it.
- **Why:** every track may push only when `npm run check` passes, and the
  commit hook blocks every commit while tests fail, so no track can commit.
- **By when:** as soon as possible; it blocks all tracks.
- **Suggested fix:** point those tests at an entry nobody replaces, or at a
  fixture decisions file instead of the live one, so a new decision can never
  break them again.
