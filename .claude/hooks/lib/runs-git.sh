# Sourced by the commit/push hooks. `runs_git commit "$cmd"` succeeds only when
# the command line really runs `git commit` (see runs-git.awk for the rules).
runs_git() {
  printf '%s' "$2" | awk -v want="$1" -f "$(dirname "$0")/lib/runs-git.awk"
}
