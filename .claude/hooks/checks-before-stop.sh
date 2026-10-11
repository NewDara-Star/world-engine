#!/bin/sh
# CLAUDE.md, "Checks": a change isn't done until it typechecks, lints and its
# tests pass. When Claude ends a turn with code changed but not committed, run
# the checks; a failure sends it back to fix them. Only once per stop
# (stop_hook_active), so it can't loop. With a role, the same role checks as
# checks-before-commit.sh: the test-writer's hand-over, the coder's lock.
input=$(cat)
[ "$(printf "%s" "$input" | jq -r '.stop_hook_active // false')" = "true" ] && exit 0
cd "$CLAUDE_PROJECT_DIR" || exit 0
git status --porcelain --untracked-files=all 2>/dev/null | grep -qE '\.(ts|tsx)$' || exit 0
lock() { out=$(sh "$(dirname "$0")/tests-lock.sh" "$@" 2>&1) || { printf "Role %s, before stopping: %s\n" "$WE_ROLE" "$out" | tail -40 >&2; exit 2; }; }
if [ "${WE_ROLE:-}" = test-writer ]; then lock hand-over; exit 0; fi
out=$(npm run -s typecheck 2>&1) || { printf "Code changed and the typecheck fails. Fix it before stopping (CLAUDE.md).\n%s\n" "$out" | tail -40 >&2; exit 2; }
out=$(npm run -s lint 2>&1) || { printf "Code changed and lint fails. Fix it before stopping (CLAUDE.md).\n%s\n" "$out" | tail -40 >&2; exit 2; }
out=$(npm run -s test 2>&1) || { printf "Code changed and tests fail. Fix them before stopping (CLAUDE.md).\n%s\n" "$out" | tail -40 >&2; exit 2; }
[ "${WE_ROLE:-}" = coder ] && lock verify "${WE_LOCK:-}"
exit 0
