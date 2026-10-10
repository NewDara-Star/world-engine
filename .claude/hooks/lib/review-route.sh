#!/bin/sh
# Decides how big the push review is. Pure: it reads only its arguments and
# stdin, so it can be tested without a model. Our own design, scope 001b item 2.
#
#   review-route.sh <lines changed> <file with the commit messages> <risk paths file>
#   (changed file paths, one per line, on stdin)
#
# Prints one line: "opus <why>" for a big or risky change, else "sonnet".
# Big or risky = more than 400 lines changed, a money/trust or rules path
# (from the risk paths file), or `Scope-complete:` in a commit message.
lines=$1
messages=$2
risk=$3
limit=400

paths=$(cat)
case "$lines" in
  ''|*[!0-9]*) echo "opus the line count '$lines' is not a number, so assume big"; exit 0 ;;
esac
if [ "$lines" -gt "$limit" ]; then echo "opus $lines lines changed (more than $limit)"; exit 0; fi
if [ -f "$messages" ] && grep -q "Scope-complete:" "$messages"; then
  echo "opus a commit says Scope-complete:"; exit 0
fi
# A risk file we cannot read must not quietly mean "nothing is risky".
if [ ! -r "$risk" ]; then echo "opus the risk paths file is missing"; exit 0; fi

hit=$(printf '%s\n' "$paths" | awk -v rules="$risk" '
  BEGIN { while ((getline line < rules) > 0) if (line !~ /^[ \t]*(#|$)/) { split(line, f, " "); kind[++n] = f[1]; prefix[n] = f[2] } }
  { for (i = 1; i <= n; i++) if (index($0, prefix[i]) == 1) { print kind[i] " " $0; exit } }')
case "$hit" in
  money*) echo "opus touches money or trust (${hit#money })" ;;
  rules*) echo "opus touches the rules (${hit#rules })" ;;
  *) echo "sonnet a small change" ;;
esac
