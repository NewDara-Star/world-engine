#!/bin/sh
# CLAUDE.md, "The player's story": a commit that changes the game (src/)
# carries a `Story:` paragraph saying what the player does, expects and sees.
# Checked against the commit command itself, since the message is in it (-m,
# or a heredoc / file given to -F).
input=$(cat)
cmd=$(printf "%s" "$input" | jq -r '.tool_input.command // ""')
case "$cmd" in
  *"git commit"*) ;;
  *) exit 0 ;;
esac
cd "$CLAUDE_PROJECT_DIR" || exit 0
# Everything changed, staged or not: `git add -A && git commit` stages after this runs.
game=$(git status --porcelain --untracked-files=all -- src | head -1)
[ -z "$game" ] && exit 0
case "$cmd" in
  *--amend*--no-edit*) exit 0 ;;
esac
if printf "%s" "$cmd" | grep -q "Story:"; then exit 0; fi
# -F <file>: read the file the message comes from.
file=$(printf "%s" "$cmd" | sed -n 's/.*-F[= ]\([^ -][^ ]*\).*/\1/p' | head -1)
if [ -n "$file" ] && [ -f "$file" ] && grep -q "Story:" "$file"; then exit 0; fi
echo "Blocked: this commit changes the game (src/) and its message has no Story: paragraph. Say what the player does, what they expect, and what they now see (CLAUDE.md, \"The player's story\"). If what they expect and what they see differ, fix that first." >&2
exit 2
