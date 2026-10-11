#!/bin/sh
# Tests fail first, and the coder cannot change them (scope 004 item 2,
# docs/roles/test-writer.md and coder.md).
#
#   tests-lock.sh record      the test-writer, before handing over: runs the
#                             test files it added since WE_BASE, checks each
#                             test fails for an expected reason, and writes
#                             tests/fails-first.json (commit it with them).
#   tests-lock.sh hand-over   the test-writer's commit check: the record is
#                             current, nothing outside tests/ changed, lint
#                             passes, typecheck errors are only the new tests
#                             naming code that does not exist yet, and every
#                             other test passes.
#   tests-lock.sh verify LOCK the coder's commit check (LOCK is WE_LOCK, the
#                             test-writer's commit): tests/ is byte-identical
#                             to LOCK, and every test in the files recorded
#                             there now passes, none skipped.
#
# "Expected reason" comes from what Vitest 5.0.3 reports for each kind of
# failure (research/35-blind-tests.md, the table): a missing module, a missing
# export or a failed assertion is expected; a parse error, a ReferenceError or
# anything else is a broken test. Our own design; plumbing is POSIX sh, git, jq
# and Vitest's JSON reporter.
set -u
record_path=tests/fails-first.json
cd "${CLAUDE_PROJECT_DIR:-.}" || exit 1
work=$(mktemp -d) || exit 1
trap 'rm -rf "$work"' EXIT

fail() { printf '%s\n' "$1" >&2; exit 1; }

need_commit() {
  [ -n "$2" ] || fail "$1 is not set. The orchestrator sets it when it starts the session (docs/roles/orchestrator.md)."
  git rev-parse -q --verify "$2^{commit}" >/dev/null || fail "$1='$2' is not a commit in this repository."
}

# Runs Vitest on the given files and leaves its JSON report in $work/run.json.
run_vitest() {
  rm -f "$work/run.json"
  npx vitest run "$@" --reporter=json --outputFile="$work/run.json" >"$work/run.log" 2>&1
  [ -s "$work/run.json" ] || fail "Vitest wrote no report, so the tests could not be checked:
$(tail -20 "$work/run.log")"
}

# Test files added under tests/ since WE_BASE, committed or not, one per line.
# A changed or deleted test file is refused: the test-writer adds new files
# only, and changing an old test is the orchestrator's call.
added_test_files() {
  git diff --name-status "$WE_BASE" -- tests/ | grep -v "	$record_path\$" > "$work/status"
  changed=$(awk -F'\t' '$1 != "A" { print "  " $0 }' "$work/status")
  [ -z "$changed" ] || fail "These files under tests/ existed before and were changed or removed. The test-writer adds new files only; ask the orchestrator to change an old test:
$changed"
  { awk -F'\t' '{ print $2 }' "$work/status"; git ls-files --others --exclude-standard -- tests/; } |
    grep -E '\.test\.ts$' | sort -u
}

# Turns the Vitest report into the record, or lists what is wrong and fails.
# Paths are made relative to the project so the record is the same anywhere.
make_record() {
  jq --arg root "$(pwd)/" --arg base "$(git rev-parse "$WE_BASE")" -S '
    def reason($text):
      if ($text | test("Cannot find module|Failed to load url|Failed to resolve import")) then "the module does not exist yet"
      elif ($text | test("does not provide an export named|^TypeError: .* is not a (function|constructor)")) then "the function does not exist yet"
      elif ($text | test("^AssertionError")) then "an expectation does not hold yet"
      else null end;
    [ .testResults[] | (.name | ltrimstr($root)) as $file |
      if (.assertionResults | length) == 0 then
        { file: $file, test: "(the whole file)", reason: reason(.message // ""), detail: ((.message // "") | split("\n")[0]) }
      else
        .assertionResults[] |
        { file: $file, test: .fullName,
          reason: (if .status == "failed" then reason(.failureMessages[0] // "") else null end),
          detail: (if .status == "failed" then ((.failureMessages[0] // "") | split("\n")[0]) else "it " + .status + " already" end) }
      end ] as $tests |
    { base: $base,
      files: ([$tests[].file] | unique),
      tests: ($tests | map({file, test, reason}) | sort_by(.file, .test)),
      problems: [$tests[] | select(.reason == null) | "  " + .file + ": " + .test + ": " + .detail] }
  ' "$work/run.json" > "$work/full.json" || fail "Could not read Vitest's report."
  problems=$(jq -r '.problems[]' "$work/full.json")
  [ -z "$problems" ] || fail "Not every new test fails first for an expected reason (a missing module or function, or an expectation that does not hold). A test that passes already does not test the new code; a parse error or an unknown name is a broken test:
$problems"
  jq -S 'del(.problems)' "$work/full.json"
}

record_now() {
  need_commit WE_BASE "${WE_BASE:-}"
  added_test_files > "$work/files"
  [ -s "$work/files" ] || fail "No new test files (*.test.ts) under tests/ since WE_BASE, so there is nothing to hand over."
  # shellcheck disable=SC2046
  run_vitest $(cat "$work/files")
  make_record
}

record() {
  [ "${WE_ROLE:-}" = coder ] && fail "The coder may not make the fails-first record."
  record_now > "$work/record.json" || exit 1
  cp "$work/record.json" "$record_path"
  printf 'Wrote %s: %s tests in %s files fail first, each for an expected reason. Commit it with the tests.\n' \
    "$record_path" "$(jq '.tests | length' "$record_path")" "$(jq '.files | length' "$record_path")"
}

# Typecheck errors are allowed only in the new test files, and only "this does
# not exist or does not fit yet" (TypeScript's TS2xxx); a TS1xxx is a syntax
# error in the test itself.
typecheck_allowed() {
  npm run -s typecheck > "$work/tsc.log" 2>&1 && return 0
  grep -E '^[^ ].*\([0-9]+,[0-9]+\): error TS[0-9]+' "$work/tsc.log" > "$work/tsc.errors"
  [ -s "$work/tsc.errors" ] || fail "The typecheck fails without naming a file:
$(tail -20 "$work/tsc.log")"
  bad=$(awk -v files="$work/files" '
    BEGIN { while ((getline f < files) > 0) ok[f] = 1 }
    { file = $0; sub(/\(.*/, "", file); code = $0; sub(/.*error TS/, "", code); sub(/:.*/, "", code)
      if (!(file in ok) || code + 0 < 2000 || code + 0 >= 3000) print "  " $0 }' "$work/tsc.errors")
  [ -z "$bad" ] || fail "The typecheck fails for a reason other than the new tests naming code that does not exist yet:
$bad"
}

hand_over() {
  record_now > "$work/record.json" || exit 1
  [ -f "$record_path" ] && cmp -s "$work/record.json" "$record_path" ||
    fail "$record_path is missing or out of date. Run: sh .claude/hooks/tests-lock.sh record, then commit it with the tests."
  outside=$(git status --porcelain --untracked-files=all | sed 's/^...//; s/.* -> //' | grep -v '^tests/')
  [ -z "$outside" ] || fail "The test-writer changes tests/ only, but these changed too:
$outside"
  npm run -s lint > "$work/lint.log" 2>&1 || fail "Lint fails. Fix the tests:
$(tail -30 "$work/lint.log")"
  typecheck_allowed
  # Every other test must still pass: only the new ones may fail.
  excludes=$(sed 's/^/--exclude /' "$work/files")
  # shellcheck disable=SC2086
  npx vitest run $excludes > "$work/others.log" 2>&1 || fail "Tests other than the new ones fail:
$(tail -30 "$work/others.log")"
}

verify() {
  need_commit WE_LOCK "${1:-}"
  lock=$1
  changed=$( { git diff --name-only "$lock" -- tests/; git diff --cached --name-only "$lock" -- tests/; git ls-files --others --exclude-standard -- tests/; } | sort -u)
  [ -z "$changed" ] || fail "tests/ must be byte-identical to the test-writer's commit ($lock), but these differ. The coder never changes tests; if one looks wrong, report it to the orchestrator:
$(printf '%s\n' "$changed" | sed 's/^/  /')"
  git show "$lock:$record_path" > "$work/record.json" 2>/dev/null || fail "The test-writer's commit ($lock) has no $record_path, so there is nothing to check against."
  jq -r '.files[]' "$work/record.json" > "$work/files"
  [ -s "$work/files" ] || fail "$record_path at $lock lists no test files."
  # shellcheck disable=SC2046
  run_vitest $(cat "$work/files")
  problems=$(jq -r --arg root "$(pwd)/" --slurpfile want "$work/record.json" '
    [ .testResults[] | { file: (.name | ltrimstr($root)), tests: .assertionResults, message } ] as $ran |
    ( $want[0].files[] as $f | ($ran | map(select(.file == $f)) | first) as $r |
      if $r == null then "  " + $f + ": did not run"
      elif ($r.tests | length) == 0 then "  " + $f + ": no test ran (" + (($r.message // "") | split("\n")[0]) + ")"
      else $r.tests[] | select(.status != "passed") | "  " + $f + ": " + .fullName + ": " + .status
      end )' "$work/run.json")
  [ -z "$problems" ] || fail "Every test the test-writer locked must now pass, none skipped. Not yet:
$problems"
}

case "${1:-}" in
  record) record ;;
  hand-over) hand_over ;;
  verify) verify "${2:-}" ;;
  *) fail "Usage: tests-lock.sh record | hand-over | verify <test-writer's commit>" ;;
esac
