#!/bin/sh
# CLAUDE.md, "Checks and hooks": before Claude pushes, a separate Claude reads
# CLAUDE.md, the commit messages and the diff since origin/main, and blocks the
# push with findings when a change breaks a rule no script can check.
# How big the review is follows the size and risk of the change (lib/
# review-route.sh): one Opus review for big or risky pushes, otherwise three
# Sonnet reviewers in parallel, one lens each (review/lens-*.md). A pass is
# remembered per commit, so pushing the same commits twice reviews once. If a
# reviewer can't run, the push is blocked: a check that quietly doesn't happen
# is no check.
. "$(dirname "$0")/lib/runs-git.sh"
here=$(dirname "$0")
input=$(cat)
cmd=$(printf "%s" "$input" | jq -r '.tool_input.command // ""')
runs_git push "$cmd" || exit 0
cd "$CLAUDE_PROJECT_DIR" || exit 0
state=.claude/.state
mkdir -p "$state"
git fetch -q origin main 2>/dev/null || git fetch -q origin main 2>/dev/null
head=$(git rev-parse HEAD)
[ -f "$state/review-pass-$head" ] && exit 0
count=$(git rev-list --count origin/main..HEAD 2>/dev/null || echo 0)
[ "$count" = "0" ] && exit 0

# Everything every reviewer reads: the rules, the commits, the diff.
write_context() {
  printf "\n---\n# CLAUDE.md\n"
  cat CLAUDE.md
  printf "\n---\n# Commits being pushed (oldest last)\n\n"
  git log --format='commit %h%n%B' origin/main..HEAD
  printf "\n---\n# The diff\n\n"
  git diff --stat origin/main...HEAD
  git diff origin/main...HEAD -- . ':(exclude)package-lock.json' | head -c 180000
  [ "$(git diff origin/main...HEAD | wc -c)" -gt 180000 ] && printf "\n[diff cut at 180 KB: read the files for the rest]\n"
}

# Lines added plus removed; a binary file counts as 0 (git prints "-").
lines_changed() {
  git diff --numstat origin/main...HEAD -- . ':(exclude)package-lock.json' | awk '{ if ($1 != "-") n += $1 + $2 } END { print n + 0 }'
}

# prompt_for <lens file> <out file>
prompt_for() {
  { cat "$here/review/intro.md"; printf "\n"; cat "$1"; printf "\n"; cat "$here/review/outro.md"; cat "$state/review-context.md"; } > "$2"
}

# run_reviewer <model> <name>: leaves the reviewer's answer in $state/review-<name>.out
run_reviewer() {
  timeout 540 claude -p --model "$1" --allowedTools "Read,Grep,Glob" < "$state/review-$2.prompt" > "$state/review-$2.out" 2>&1
  echo $? > "$state/review-$2.status"
}

write_context > "$state/review-context.md"
git diff --name-only origin/main...HEAD > "$state/review-paths.txt"
git log --format=%B origin/main..HEAD > "$state/review-messages.txt"
route=$("$here/lib/review-route.sh" "$(lines_changed)" "$state/review-messages.txt" "$here/review-risk-paths.txt" < "$state/review-paths.txt")

rm -f "$state"/review-*.out "$state"/review-*.status
if [ "${route%% *}" = "opus" ]; then
  names="opus"
  prompt_for "$here/review/all-lenses.md" "$state/review-opus.prompt"
  run_reviewer opus opus
else
  names="story rules tests"
  for name in $names; do
    prompt_for "$here/review/lens-$name.md" "$state/review-$name.prompt"
    run_reviewer sonnet "$name" &
  done
  wait
fi

# Collect: any reviewer that couldn't run blocks; any BLOCK blocks, with everything said.
nl='
'
failed=""
blocking=""
for name in $names; do
  out=$(cat "$state/review-$name.out" 2>/dev/null)
  verdict=$(printf "%s" "$out" | grep -E "^VERDICT: (PASS|BLOCK)" | tail -1)
  case "$verdict" in
    "VERDICT: PASS") ;;
    "VERDICT: BLOCK") blocking="$blocking$nl--- $name reviewer ---$nl$out$nl" ;;
    *) failed="$failed$nl--- $name reviewer couldn't run (exit $(cat "$state/review-$name.status" 2>/dev/null)) ---$nl$(printf "%s" "$out" | tail -15)$nl" ;;
  esac
done
if [ -n "$failed" ]; then
  printf "Blocked: the review before push couldn't run (%s).%s\nDon't work around it: tell the owner.\n" "${route#* }" "$failed" >&2
  exit 2
fi
if [ -n "$blocking" ]; then
  printf "Blocked by the review (%s: %s):\n%s\nFix what it found and commit. If a finding is wrong, explain why in a commit message paragraph starting \"Review:\"; the reviewer reads it on the next push.\n" "${route%% *}" "${route#* }" "$blocking" | tail -90 >&2
  exit 2
fi
touch "$state/review-pass-$head"
exit 0
