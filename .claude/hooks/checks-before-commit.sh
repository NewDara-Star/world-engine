#!/bin/sh
# CLAUDE.md, "Checks": typecheck, lint and tests must pass before a commit or
# push. A failure blocks it (exit 2) and the output goes back to Claude.
. "$(dirname "$0")/lib/runs-git.sh"
cmd=$(jq -r '.tool_input.command // ""')
# Only a real commit or push, not text that mentions one.
runs_git commit "$cmd" || runs_git push "$cmd" || exit 0
cd "$CLAUDE_PROJECT_DIR" || exit 0
out=$(npm run -s typecheck 2>&1) || { printf "Blocked: typecheck fails. Fix it before committing (CLAUDE.md).\n%s\n" "$out" | tail -40 >&2; exit 2; }
out=$(npm run -s lint 2>&1) || { printf "Blocked: lint fails (a function has too many paths or nests too deep, or a name hides another). Fix the thing, not the rule (CLAUDE.md).\n%s\n" "$out" | tail -40 >&2; exit 2; }
out=$(npm run -s test 2>&1) || { printf "Blocked: tests fail. Fix them before committing; never loosen a test to pass (CLAUDE.md).\n%s\n" "$out" | tail -40 >&2; exit 2; }
exit 0
