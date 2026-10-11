# Scope 004: tests written blind, and a decision log

Status: approved by Daramola (owner) in chat, 2026-10-11 ("approve Scope 004,
then build slice 1").
Architecture: V5, "How we build" (proposed Scope 004).

## Goal

From here on, every game change is built in this order: approved design →
tests written by a session that never sees the code, failing first → code
written by a separate Opus session that cannot change those tests → gates →
reviewers. And every decision the owner makes lives in one readable file that
every session checks before acting.

## Why the game needs it

The session that writes code should not mark its own homework: its tests
quietly fit what it built, bugs included. Driving, money and cheating checks
are where that would hurt players. And decisions spread across chats get lost
or contradicted; one log, checked every time, stops the game drifting from
what the owner decided.

## In scope

1. **Roles** in `docs/roles/`, one file each, plain words, same style as
   `approver.md`:
   - `test-writer.md`: reads the scope, CLAUDE.md and the approved designs;
     never reads `src/`; writes tests only; the four paths; names that say the
     rule; confirms each new test fails before handing over (and says why it
     fails: "function does not exist yet" counts).
   - `coder.md`: Opus; reads everything; writes code to match the approved
     designs; never edits a test the test-writer committed; if a test looks
     wrong, stops and reports it (the orchestrator decides, never the coder).
   - `orchestrator.md`: the pipeline step by step, with the exact commands to
     start each headless session (prompt on stdin, `--model`, which role file),
     which model for what (Opus for designs, code and approval; Sonnet for
     review lenses and the note-taker; Haiku only for narrow repetitive tasks
     like renames listed in a table), and when to stop a session stuck
     apologising in a loop.
2. **Enforcement by hooks** (`.claude/hooks/`, POSIX sh plus jq, each with a
   test in `tests/hooks/`), switched on by a role marker the orchestrator sets
   when it starts a session (an environment variable such as `WE_ROLE`, read by
   the hooks; design it so a session cannot change its own role):
   - test-writer: reading, searching or listing anything under `src/` is
     refused; writing outside `tests/` is refused.
   - coder: editing or deleting any file under `tests/` that the test-writer
     committed for this scope is refused (new helper files in tests are also
     refused; ask the orchestrator).
   - Tests fail first: a script records, at the test-writer's commit, which
     tests fail and that they fail for an expected reason (not a syntax error
     in the test itself); the coder's final commit is refused unless those
     same tests now pass and the test files are byte-identical to the
     test-writer's commit.
   - No role set: everything behaves as today.
   Research first (`research/35-blind-tests.md`): how others separate test
   writing from coding with AI agents or in teams (for example test-first
   practice, mutation testing, published agent workflows), what we take.
3. **Decision log** `docs/DECISIONS.md`: one entry per decision, newest last,
   each with an id (`D-0001`), date, the decision in one line, why in one or
   two lines, who decided (owner, or orchestrator for common sense), topic
   tags, and `Replaces: D-00xx` when it overrides an older one. Backfill it
   from the decisions recorded so far (the orchestrator supplies the list from
   its handover; keep each entry short).
4. **Clash check**: a small tool (`npm run decisions -- check "<text>" --tags
   a,b`) that lists existing decisions with the same tags or close wording, so
   the orchestrator can tell the owner "you decided X on <date> because Y;
   this would change Z" before acting. Built by the new pipeline itself
   (designs, blind tests, code), as its first real use.
5. **Note-taker**: `docs/roles/note-taker.md`, a Sonnet session the
   orchestrator runs after a reply in which the owner decided something. It
   reads that exchange (given as text), writes candidate entries to
   `docs/decisions-inbox.md`, and runs the clash check on each. The
   orchestrator confirms each one into `DECISIONS.md` or drops it. Nothing
   enters `DECISIONS.md` without the orchestrator.
6. **CLAUDE.md**: a short section "How a change is built" pointing at the
   roles, and a line: read `docs/DECISIONS.md` before acting; never contradict
   an entry without the owner.

## Out of scope

Any game code. Changing the push review. Running the note-taker automatically
from the Cowork app (it cannot host repo hooks); the orchestrator runs it.

## Design diagram

V5's proposed Scope 004 picture; the designs for the clash-check tool go
through the delegated approver before its tests are written.

## Done when

- Hook tests prove: a test-writer cannot read `src/`; a coder cannot edit a
  locked test; a coder's commit is refused when a locked test changed or still
  fails; with no role set nothing changes.
- The clash-check tool was built through the full pipeline, and the report
  says how each step went (what the blind tests caught, what was awkward).
- `docs/DECISIONS.md` exists with the backfill; the note-taker ran once on a
  real exchange.
- `npm run check` passes. Small commits. Do not push.

## References

- `docs/roles/approver.md`, `docs/reviews/002b/`, CLAUDE.md.
