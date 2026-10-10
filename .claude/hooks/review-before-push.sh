#!/bin/sh
# CLAUDE.md, "A second model reviews every push": before Claude pushes, a
# separate Claude reads CLAUDE.md, the commit messages and the diff since
# origin/main, and blocks the push with findings when a change breaks a rule
# no script can check (the player's story, place-agnostic engine, server
# authority, scope discipline, small functions, dead code, the four test
# paths, real references). A pass is remembered per commit, so pushing the
# same commits twice reviews once. If the reviewer can't run, the push is
# blocked: a check that quietly doesn't happen is no check.
. "$(dirname "$0")/lib/runs-git.sh"
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

prompt="$state/review-prompt.md"
{
  cat <<'PROMPT'
You are reviewing a change to world-engine, a place-agnostic driving engine and game built from real open map data, before it is pushed. The owner is a designer, not a coder. The team's rules are in CLAUDE.md below. Your job is the rules no script can check. Typecheck, lint and tests already pass; don't review for those.

Judge the change against these:
- The player's story: for every change in behaviour, is there a `Story:` in the commit message (what the player does, expects, sees), and does what they will actually see match what they'd expect? Look for words that don't mean what they say and things done to the player's progress without telling them.
- Place-agnostic engine: nothing about a specific place (Finglas, Yaba, Dublin, Lagos, left or right driving, a currency, a unit) in engine code. Driving side, rules, gravity, units and the like come from place files.
- Server authority: the server decides every reward and payout; nothing trusts a number sent by the client.
- Scope discipline: the change stays inside the scope it was started for (docs/scopes/). New ideas belong in PARKING_LOT.md, not in the code.
- Small functions: each one readable as a diagram. Names say what things are; no `name2`, `newX`, `finalX`. One source of truth: no two things that can disagree. Every cascade fixed.
- Dead code or stale comments and docs left behind.
- Tests down the four paths (happy, sad, idiot-proof, tragedy) for what changed; a bug fix with a test that reproduces it.
- References are real: a cited source (repo, standard, dataset, research note) must exist; check that cited files in research/ are there. Never an invented reference. Licences CC0/CC-BY/MIT/Apache only; no copied GPL code; nothing from leaked or proprietary source.

Only block for a clear breach you can point to (file and line, or the commit), with what the fix is. Don't block on taste, style, or things outside this change. A commit message paragraph starting `Review:` is the author disagreeing with an earlier finding: weigh it honestly, and accept it if it's sound.

You may read files in the repository to check context. Be brief.

Finish with exactly one of these as the very last line:
VERDICT: PASS
VERDICT: BLOCK
Before a BLOCK, list each finding as: `- [rule] where: what's wrong. Fix: what to do.`

---
# CLAUDE.md
PROMPT
  cat CLAUDE.md
  printf "\n---\n# Commits being pushed (oldest last)\n\n"
  git log --format='commit %h%n%B' origin/main..HEAD
  printf "\n---\n# The diff\n\n"
  git diff --stat origin/main...HEAD
  git diff origin/main...HEAD -- . ':(exclude)package-lock.json' | head -c 180000
  [ "$(git diff origin/main...HEAD | wc -c)" -gt 180000 ] && printf "\n[diff cut at 180 KB: read the files for the rest]\n"
} > "$prompt"

out=$(timeout 540 claude -p --model opus --allowedTools "Read,Grep,Glob" < "$prompt" 2>&1)
status=$?
verdict=$(printf "%s" "$out" | grep -E "^VERDICT: (PASS|BLOCK)" | tail -1)
if [ "$verdict" = "VERDICT: PASS" ]; then
  touch "$state/review-pass-$head"
  exit 0
fi
if [ "$verdict" = "VERDICT: BLOCK" ]; then
  printf "Blocked by the review (a second model checked this push against CLAUDE.md):\n\n%s\n\nFix what it found and commit. If a finding is wrong, explain why in a commit message paragraph starting \"Review:\"; the reviewer reads it on the next push.\n" "$out" | tail -60 >&2
  exit 2
fi
printf "Blocked: the review before push couldn't run (exit %s). Output:\n%s\n\nDon't work around it: tell the owner.\n" "$status" "$(printf "%s" "$out" | tail -15)" >&2
exit 2
