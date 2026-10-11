#!/bin/sh
# CLAUDE.md, "Diagram first, code from the diagram": a commit lands only if
# (1) docs/flows/ matches what the compiler draws from the code now,
# (2) every function in src/ and tools/ has an entry in docs/designs/, and
# (3) every design is approved: the last commit that changed it carries one
#     of two trailers as a whole line, or this very commit changes it and
#     carries one: `Approved-by: Daramola` (the owner approved in chat) or
#     `Approved-by: reviewer (delegated by Daramola)` (the delegated approver,
#     docs/roles/approver.md). Anything else, even `Approved-by: reviewer`
#     alone, does not count. A trailer can't prove who typed it; the
#     orchestrating session adds it only after that approval.
# Only TypeScript in src/ and tools/ is drawn. Shell hooks (.claude/hooks/*.sh)
# are not TypeScript and are exempt; the push review reads them instead.
# Our own design (scope 002); plumbing is POSIX sh, git, diff and jq.
. "$(dirname "$0")/lib/runs-git.sh"
input=$(cat)
cmd=$(printf "%s" "$input" | jq -r '.tool_input.command // ""')
runs_git commit "$cmd" || exit 0
cd "$CLAUDE_PROJECT_DIR" || exit 0

block() { printf 'Blocked: %s\n' "$1" >&2; exit 2; }

# True when the text on stdin has one of the two approval trailers as a whole line.
has_approval() {
  grep -qxF -e 'Approved-by: Daramola' -e 'Approved-by: reviewer (delegated by Daramola)'
}

# The same for a commit command still to run: quote marks count as line breaks,
# so `-m "Approved-by: Daramola"` is a whole line, but `-m "x Approved-by: Daramola"`
# is not.
command_has_approval() {
  tr "\"'" '\n\n' | has_approval
}

fresh=$(mktemp -d) || block "could not make a temporary folder for the diagram check."
trap 'rm -rf "$fresh"' EXIT
out=$(npm run -s diagrams -- --out "$fresh" 2>&1) || block "the diagram generator failed, so the diagrams cannot be checked.
$(printf '%s' "$out" | tail -20)"

# 1. Stale diagrams: the folders and file the generator owns must be identical.
stale=""
for part in src tools modules.md; do
  if [ -e "$fresh/$part" ] || [ -e "docs/flows/$part" ]; then
    diff -rq "$fresh/$part" "docs/flows/$part" >/dev/null 2>&1 || stale="$stale $part"
  fi
done
[ -z "$stale" ] || block "the diagrams are out of date (differs:$stale). Run npm run diagrams and commit the result."

# 2. Every function needs an entry in its design file (named by its heading).
pages=$(cd "$fresh" && find src tools -name '*.md' 2>/dev/null | sort)
missing=""
for page in $pages; do
  design="docs/designs/$page"
  grep '^## ' "$fresh/$page" > "$fresh/headings.txt"
  while IFS= read -r heading; do
    if [ ! -f "$design" ] || ! grep -qxF -- "$heading" "$design"; then
      missing="$missing
  ${page%.md}.ts: ${heading#\#\# }"
    fi
  done < "$fresh/headings.txt"
done
[ -z "$missing" ] || block "these functions have no design in docs/designs/ (write the design first, get it approved):$missing"

# 3. Every design needs an approval: the owner's, or the delegated approver's.
file=$(printf "%s" "$cmd" | sed -n 's/.*-F[= ]\([^ -][^ ]*\).*/\1/p' | head -1)
message="$cmd"
[ -n "$file" ] && [ -f "$file" ] && message="$cmd
$(cat "$file")"
approving=no
printf '%s\n' "$message" | command_has_approval && approving=yes
unapproved=""
for page in $pages; do
  design="docs/designs/$page"
  if [ -n "$(git status --porcelain -- "$design")" ]; then
    [ "$approving" = yes ] || unapproved="$unapproved
  $design (changed, and this commit has no approval trailer)"
  elif ! git log -1 --format=%B -- "$design" | has_approval; then
    unapproved="$unapproved
  $design (the last commit that changed it has no approval trailer)"
  fi
done
[ -z "$unapproved" ] || block "these designs are not approved. A design is approved by a whole-line trailer, Approved-by: Daramola or Approved-by: reviewer (delegated by Daramola):$unapproved"
exit 0
