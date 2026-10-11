# Tests written blind, code that cannot change them (scope 004, item 2)

Written 2026-10-11 by the session doing the first part of scope 004.

**Honest limit:** from this session the web is closed except the npm
registry. `curl` to arxiv.org, code.claude.com, code.visualstudio.com and
stryker-mutator.io got "CONNECT tunnel failed, response 403"; WebFetch got
"proxy refused the connection" for the same hosts; `gh api` to GitHub said
access is not enabled for this session. So **no web page was opened**. Web
search did return titles and short summaries; those are listed at the end as
leads for the owner to open, and nothing below relies on them. What was
opened: npm registry metadata (`npm view`), package files fetched with
`npm pack` and read on disk, the installed `claude` CLI's own `--help`, and an
experiment run with our pinned Vitest 5.0.3.

## The job

Item 2 asks that a session which never sees the code writes the tests, that
they fail first for a good reason, and that a separate coder session cannot
change them; enforced by hooks switched on by a role the session cannot
change.

## What we opened

- **Claude Code 2.1.296** (`npm pack @anthropic-ai/claude-code`; licence:
  "© Anthropic PBC. All rights reserved", proprietary, so we read its type
  file for facts only and copy nothing). Opened `README.md` and
  `sdk-tools.d.ts`. The tool inputs our hooks see: Read, Write and Edit take
  `file_path` (absolute); NotebookEdit takes `notebook_path`; Glob takes
  `pattern` and an optional `path` ("if not specified, the current working
  directory will be used"); Grep takes `pattern`, optional `path` ("defaults
  to current working directory") and optional `glob`. So a Grep or Glob with
  no `path` searches the whole project, `src/` included.
- **`claude --help`** (the installed 2.1.296). Flags the orchestrator needs:
  `-p/--print` (headless, prompt on stdin), `--model`,
  `--append-system-prompt`, `--settings`, `--setting-sources user,project,local`.
  A session's environment comes from the shell that starts it; nothing in the
  help lets a running session change its own environment.
- **StrykerJS** `@stryker-mutator/core` 10.0.0 (npm, Apache-2.0, modified
  2026-08-14; repository stryker-mutator/stryker-js from the registry, the
  GitHub page itself would not open). Opened `README.md` and `package.json`;
  `@stryker-mutator/vitest-runner` 10.0.0 is also Apache-2.0 (registry
  metadata only). Mutation testing makes small changes to the code ("mutants")
  and checks the tests notice; a mutant that survives shows a test that does
  not really pin the behaviour. The README says it runs `npm test` and mutates
  `lib` and `src` by default.
- **Vitest 5.0.3** (already pinned; MIT). We ran four throwaway test files
  with `--reporter=json` to see how each kind of failure is reported:

  | Test file | What Vitest reports |
  | --- | --- |
  | imports a module that does not exist yet | file failed, no tests, message `Cannot find module '../../src/…'` |
  | imports a name the module does not export yet | test failed, `TypeError: (0 , __vite_ssr_import_1__.nope) is not a function` |
  | an `expect` that does not hold | test failed, `AssertionError: expected 1 to be 2` |
  | a typo in the test (missing bracket) | file failed, no tests, message `Transform failed … PARSE_ERROR` |
  | uses a name nobody defined | test failed, `ReferenceError: undefinedThing is not defined` |
  | `it.skip` | test `skipped` |

  So "fails for an expected reason" can be read from the JSON: a missing
  module, a missing export or an assertion is expected; a parse error or a
  ReferenceError is a broken test.

## What we take

1. **The role comes from the environment the orchestrator starts the session
   with** (`WE_ROLE=test-writer claude -p …`), and the hooks read it from
   there only, never from a file. A command a session runs is a child process;
   it cannot change its parent's environment, so `export WE_ROLE=` inside a
   Bash call does not reach the next hook. (Standard POSIX process behaviour;
   our own design on top of it.)
2. **Close the side doors.** A session could otherwise rewrite the hooks or the
   settings (`.claude/`, including `settings.local.json`, which can set
   environment variables), edit its own role file, or start a fresh `claude`
   with no role. Under any role, all of those are refused.
3. **Allow-list the test-writer's shell, block-list the coder's.** The
   test-writer needs very few commands (run tests, list and read docs, commit),
   so its shell is limited to those, with every path checked. The coder needs
   the whole shell, so only writes that touch `tests/` are refused, and the
   commit check below is the real guarantee.
4. **Check the result, not just the route.** Hooks on the route can be dodged
   by a determined session (for example a test file that reads `src/` when it
   runs). So the hand-over is checked at the end too: at the coder's commit,
   every file under `tests/` must be byte-identical to the test-writer's
   commit (named by the orchestrator in `WE_LOCK`, which the session cannot
   change), and every test in the fails-first record must now pass, none
   skipped. The orchestrator runs the same check itself after the coder
   stops.
5. **Fails first, read from Vitest's JSON** (the table above). Already-passing
   tests are refused at hand-over: a test that passes before the code exists
   does not test the code.
6. **Not now: mutation testing.** It answers a different question (are the
   tests strong enough?) and costs a long run per change. Parked.

## What we did not take

- Telling the coder "do not edit the tests" in the prompt only: an instruction
  is not a check.
- Making test files read-only on disk: the coder runs as the same user and can
  `chmod` them back; the byte-identical check catches it either way.

## Leads seen only as search results (not opened, not relied on)

The owner can open these to check the claims; they were titles and one-line
summaries in a web search on 2026-10-11:

- TDFlow, arXiv 2510.23761: sub-agents with tightly limited tools, working
  from human-written tests. <https://arxiv.org/abs/2510.23761>
- VS Code, "Set up a test-driven development flow": one custom agent per
  phase (red, green, refactor) with hand-offs.
  <https://code.visualstudio.com/docs/agents/guides/test-driven-development-guide>
- A community Claude Code skill (glebis/claude-skills, "tdd") that keeps the
  test writer from seeing the implementation. <https://www.skills.sh/glebis/claude-skills/tdd>
- Claude Code hooks reference (PreToolUse `permissionDecision: "deny"`, exit
  code 2). <https://code.claude.com/docs/en/hooks>
- StrykerJS site. <https://stryker-mutator.io/>
