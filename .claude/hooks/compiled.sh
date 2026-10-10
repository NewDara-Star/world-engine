#!/bin/sh
# After a typecheck runs (pass or fail: its list is what matters), stamp the
# time, which opens the compiler gate until the next code change.
cmd=$(jq -r '.tool_input.command // ""')
printf "%s\n" "$cmd" | grep -qE 'npm run( -s)? (typecheck|check)|(^|[ ;&])(npx )?tsc( |$)' || exit 0
cd "$CLAUDE_PROJECT_DIR" && mkdir -p .claude/.state && touch .claude/.state/compiled
