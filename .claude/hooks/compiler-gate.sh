#!/bin/sh
# CLAUDE.md, "Compiler first": a search (the Grep tool, or grep/rg/git grep/
# ack/ag in the shell) is refused while code is changed and the typecheck
# hasn't run since the newest change. Judged by file times, so it doesn't
# matter which tool made the edit. A clean tree (just reading code) searches
# freely.
. "$(dirname "$0")/mtime.sh"
input=$(cat)
tool=$(printf "%s" "$input" | jq -r '.tool_name // ""')
if [ "$tool" = "Bash" ]; then
  cmd=$(printf "%s" "$input" | jq -r '.tool_input.command // ""')
  printf "%s\n" "$cmd" | grep -qE '(^|[;&|( ]|\$\()(grep|egrep|rg|ag|ack|git +grep)( |$)' || exit 0
fi
cd "$CLAUDE_PROJECT_DIR" || exit 0
changed=$(git status --porcelain --untracked-files=all 2>/dev/null | sed 's/^...//; s/.* -> //' | grep -E '\.(ts|tsx)$')
[ -z "$changed" ] && exit 0
stamp=.claude/.state/compiled
newest=$(for f in $changed; do [ -f "$f" ] && mtime "$f"; done | sort -n | tail -1)
if [ -f "$stamp" ] && [ -n "$newest" ]; then
  stamped=$(mtime "$stamp")
  later=$(printf '%s\n%s\n' "$stamped" "$newest" | sort -n | tail -1)
  # Open only when the stamp is strictly newer than the newest change.
  if [ "$later" = "$stamped" ] && [ "$stamped" != "$newest" ]; then exit 0; fi
fi
jq -n '{hookSpecificOutput:{hookEventName:"PreToolUse",permissionDecision:"deny",permissionDecisionReason:"Compiler first (CLAUDE.md): code has changed since the last typecheck. Run npm run typecheck (or npm run check) and follow what it lists; then search, for the untyped edges only (baked files, strings, storage keys, protocol)."}}'
