#!/bin/sh
# CLAUDE.md, "How a change is built": a session started with a role
# (WE_ROLE=test-writer or WE_ROLE=coder, set by the orchestrator when it starts
# the session) may only do what its role file in docs/roles/ allows.
#   test-writer: never reads, searches or lists src/ or docs/flows/ (the code,
#     and the pictures drawn from it); writes under tests/ only; its shell is
#     an allow-list (lib/test-writer-shell.awk).
#   coder: never writes, moves or deletes anything under tests/.
#   any role: never changes .claude/ (the hooks and settings, which could
#     switch the role off), CLAUDE.md, docs/roles/, .git/, nor starts another
#     claude (which could start without a role).
# The role is read from the environment only. A command a session runs is a
# child process and cannot change its parent's environment, so the session
# cannot change its own role (research/35-blind-tests.md, "What we take" 1-3).
# No role set: this hook does nothing. An unknown role refuses everything, so a
# misspelt role fails safe.
# Our own design (scope 004 item 2); plumbing is POSIX sh, awk and jq, with the
# tool inputs from Claude Code's sdk-tools.d.ts (Read/Write/Edit file_path,
# NotebookEdit notebook_path, Grep/Glob path).
role=${WE_ROLE:-}
[ -z "$role" ] && exit 0
input=$(cat)
here=$(dirname "$0")
root=${CLAUDE_PROJECT_DIR:-$(pwd)}

deny() {
  jq -n --arg why "Role $role: $1" '{hookSpecificOutput:{hookEventName:"PreToolUse",permissionDecision:"deny",permissionDecisionReason:$why}}'
  exit 0
}

case "$role" in
  test-writer|coder) ;;
  *) deny "WE_ROLE='$role' is not a role (test-writer or coder), so nothing may run. Tell the orchestrator; only it can restart this session with the right role." ;;
esac

tool=$(printf '%s' "$input" | jq -r '.tool_name // ""')
target=$(printf '%s' "$input" | jq -r '.tool_input.file_path // .tool_input.notebook_path // .tool_input.path // ""')

# A path as seen from the project folder: "tests/a.ts", "." for the folder
# itself, or the absolute path when it is outside.
project_path() {
  p=$1
  case "$p" in
    "$root") p=. ;;
    "$root"/*) p=${p#"$root"/} ;;
  esac
  while case "$p" in ./*) true ;; *) false ;; esac; do p=${p#./}; done
  [ -z "$p" ] && p=.
  printf '%s' "$p"
}

climbs() {
  case "/$1/" in */../*) return 0 ;; esac
  case "$1" in "~"*) return 0 ;; esac
  return 1
}

# Paths no role may change: the rules, the hooks, the settings, git itself.
protected() {
  case "$1" in
    .claude|.claude/*|*/.claude|*/.claude/*|CLAUDE.md|docs/roles|docs/roles/*|.git|.git/*) return 0 ;;
  esac
  return 1
}

# For the test-writer: is this path the code, or drawn from the code?
hidden() {
  case "$1" in
    docs/designs|docs/designs/*) return 1 ;;
    src|src/*|*/src|*/src/*|docs/flows|docs/flows/*|*/docs/flows|*/docs/flows/*) return 0 ;;
  esac
  return 1
}

# For a search: true when the folder is src/ or docs/flows/, or holds one.
reaches_hidden() {
  hidden "$1" && return 0
  case "$1" in .|docs) return 0 ;; esac
  return 1
}

is_write_tool() {
  case "$tool" in Write|Edit|MultiEdit|NotebookEdit) return 0 ;; esac
  return 1
}

# The folder a Glob really searches: its path plus the pattern's plain start.
glob_folder() {
  base=$(project_path "${1:-.}")
  plain=$(printf '%s' "$2" | awk -F/ '{ out = ""; for (i = 1; i < NF; i++) { if ($i ~ /[*?[{]/) break; out = out (out == "" ? "" : "/") $i } print out }')
  if [ -z "$plain" ]; then printf '%s' "$base"
  elif [ "$base" = . ]; then printf '%s' "$plain"
  else printf '%s/%s' "$base" "$plain"; fi
}

test_writer_search() {
  case "$tool" in
    Glob)
      pattern=$(printf '%s' "$input" | jq -r '.tool_input.pattern // ""')
      climbs "$pattern" && deny "the pattern climbs out with ..; write a plain pattern under tests/ or docs/designs/."
      folder=$(glob_folder "$target" "$pattern") ;;
    Grep) folder=$(project_path "${target:-.}") ;;
    *) folder=$(project_path "$target") ;;
  esac
  climbs "$folder" && deny "the path climbs out with .. or ~; give the plain path."
  reaches_hidden "$folder" && deny "searching or listing '$folder' would reach src/ or docs/flows/, which the test-writer never reads. Search a folder that does not hold them, such as tests/ or docs/designs/."
  exit 0
}

test_writer() {
  rel=$(project_path "$target")
  if is_write_tool; then
    climbs "$rel" && deny "the path climbs out with .. or ~; give the plain path."
    case "$rel" in tests/*) exit 0 ;; esac
    deny "the test-writer writes under tests/ only, and '$rel' is not there."
  fi
  case "$tool" in
    Read|NotebookRead)
      climbs "$rel" && deny "the path climbs out with .. or ~; give the plain path."
      hidden "$rel" && deny "'$rel' is inside src/ or docs/flows/, which the test-writer never reads. Test the approved design in docs/designs/, not the code."
      exit 0 ;;
    Grep|Glob|LS) test_writer_search ;;
    Bash)
      cmd=$(printf '%s' "$input" | jq -r '.tool_input.command // ""')
      why=$(printf '%s' "$cmd" | awk -v root="$root" -f "$here/lib/test-writer-shell.awk") || deny "$why"
      exit 0 ;;
  esac
  exit 0
}

# For the coder's shell, a block-list: the commit check (tests-lock.sh verify)
# is the real guarantee, this only stops the plain routes early.
writes_something() {
  printf '%s' "$1" | sed -e 's/[0-9]*>&[0-9]//g' -e 's#[0-9]*>>* */dev/null##g' | grep -qE '>|(^|[^A-Za-z0-9_-])(rm|rmdir|mv|cp|touch|tee|truncate|ln|chmod|chown|dd|install|rsync|patch|unlink|mkdir|writeFile|writeFileSync|appendFile|appendFileSync|rmSync|unlinkSync|renameSync|copyFile|copyFileSync|cpSync)([^A-Za-z0-9_-]|$)|(sed|perl).*(-i|--in-place)|git +(checkout|restore|rm|mv|apply|stash|reset|clean|am|cherry-pick|revert|merge|rebase|pull|switch|update-index)'
}

mentions_tests() {
  printf '%s' "$1" | grep -qE '(^|[^A-Za-z0-9_.-])(\./)?tests(/|[^A-Za-z0-9_.-]|$)|/tests(/|[^A-Za-z0-9_.-]|$)'
}

mentions_protected() {
  printf '%s' "$1" | grep -qE '\.claude([/"'"'"' ]|$)|CLAUDE\.md|docs/roles|(^|[^A-Za-z0-9_])\.git(/|[ "'"'"']|$)'
}

# Starting another claude, which could start without a role. Quotes count as
# command breaks, so `sh -c 'claude -p'` is caught too.
starts_claude() {
  printf '%s\n' "$1" | tr "\"'\`(" ';;;;' | tr '&|' ';;' | tr ';' '\n' | awk '
    { for (i = 1; i <= NF; i++) {
        if ($i == "-u" || $i == "--unset") { i++; continue }
        if ($i !~ /^[A-Za-z_][A-Za-z0-9_]*=/ && $i !~ /^(env|exec|nohup|command|time|sudo|then|do|npx|-.*)$/) break
      }
      w = $i; sub(/.*\//, "", w)
      if (w == "claude" || w ~ /^@anthropic-ai\/claude-code/ || $i ~ /claude-code/) found = 1 }
    END { exit found ? 0 : 1 }'
}

any_role_bash() {
  starts_claude "$1" && deny "a session with a role may not start another claude (it could start without a role). Ask the orchestrator."
  mentions_protected "$1" && writes_something "$1" && deny "this command looks like it changes .claude/, CLAUDE.md, docs/roles/ or .git/, which no role may change. Ask the orchestrator."
  return 0
}

any_role_write() {
  rel=$(project_path "$target")
  climbs "$rel" && deny "the path climbs out with .. or ~; give the plain path."
  protected "$rel" && deny "'$rel' holds the rules, the hooks or the settings, which no role may change. Ask the orchestrator."
  return 0
}

coder() {
  if is_write_tool; then
    case "$(project_path "$target")" in
      tests|tests/*) deny "the coder never changes tests/ (the test-writer's tests are locked, and new helper files go through the orchestrator too). If a test looks wrong, stop and report it." ;;
    esac
    exit 0
  fi
  if [ "$tool" = Bash ]; then
    cmd=$(printf '%s' "$input" | jq -r '.tool_input.command // ""')
    mentions_tests "$cmd" && writes_something "$cmd" && deny "this command looks like it changes tests/, which the coder never changes. If a test looks wrong, stop and report it to the orchestrator."
  fi
  exit 0
}

if is_write_tool; then any_role_write; fi
if [ "$tool" = Bash ]; then any_role_bash "$(printf '%s' "$input" | jq -r '.tool_input.command // ""')"; fi
case "$role" in
  test-writer) test_writer ;;
  coder) coder ;;
esac
