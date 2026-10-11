# The test-writer's shell (docs/roles/test-writer.md): only the few commands a
# blind test-writer needs, and no path into src/ or docs/flows/ (the code and
# the pictures drawn from it). An allow-list, because a block-list of every way
# a shell can read a file can never be complete (research/35-blind-tests.md,
# "What we take" 3).
# Reference: POSIX awk (IEEE Std 1003.1 awk utility); shell quoting and lists
# from POSIX sh, "Shell Command Language" 2.2 (quoting), 2.9.4 (lists) and
# 2.7.4 (here-documents). Tokenising follows our runs-git.awk. Our own design.
# Run: awk -v root="$CLAUDE_PROJECT_DIR" -f test-writer-shell.awk  (command on
# stdin). Exit 0 = allowed; otherwise prints why and exits 1.

BEGIN { RS = "\001" }
{ text = text $0 }
END {
  why = judge(text)
  if (why == "") exit 0
  print why
  exit 1
}

# Where a word points, as a path inside the project when it is one.
function project_path(word) {
  if (word == root) return "."
  if (index(word, root "/") == 1) word = substr(word, length(root) + 2)
  while (substr(word, 1, 2) == "./") word = substr(word, 3)
  return word
}

# Why a word may not be used as a path, or "" when it may.
function path_problem(word,    p, n, seg, i) {
  p = project_path(word)
  if (p ~ /(^|\/)\.\.(\/|$)/ || p ~ /^~/) return "the path " word " climbs out of where it says (.. or ~); write the plain path"
  if (p ~ /[*?[{]/ && p !~ /^tests\//) return "the pattern " word " could reach src/; patterns are only allowed under tests/"
  if (p ~ /^docs\/designs(\/|$)/) return ""
  n = split(p, seg, "/")
  for (i = 1; i <= n; i++)
    if (seg[i] == "src" || seg[i] == "flows")
      return "the path " word " is inside src/ or docs/flows/, which the test-writer never reads (it tests the design, not the code)"
  return ""
}

# Checks every non-flag word, and the value of --flag=value words.
function paths_problem(w, from, n,    i, v, why) {
  for (i = from; i <= n; i++) {
    v = w[i]
    if (v ~ /^-/) { if (index(v, "=") == 0) continue; v = substr(v, index(v, "=") + 1) }
    why = path_problem(v)
    if (why != "") return why
  }
  return ""
}

function npm_problem(w, n,    i, script) {
  i = 2
  while (i <= n && (w[i] == "-s" || w[i] == "--silent")) i++
  if (w[i] == "test" || w[i] == "t") return paths_problem(w, i + 1, n)
  if (w[i] != "run" && w[i] != "run-script") return "npm " w[i] " is not one of the test-writer's commands (npm test, npm run test|typecheck|lint|check)"
  i++
  while (i <= n && (w[i] == "-s" || w[i] == "--silent")) i++
  script = w[i]
  if (script !~ /^(test|typecheck|lint|check)$/) return "npm run " script " is not one of the test-writer's commands (test, typecheck, lint, check)"
  return paths_problem(w, i + 1, n)
}

function git_log_problem(w, n,    i) {
  for (i = 3; i <= n; i++)
    if (w[i] ~ /^(-p|-u|--patch|-L.*|--stat.*|--name-only|--name-status|--numstat|--raw|--follow|-S.*|-G.*|--full-diff|-c|--cc|-m)$/)
      return "git log " w[i] " shows the code's history; plain git log only"
  return paths_problem(w, 3, n)
}

function git_diff_problem(w, n,    i, after) {
  for (i = 3; i <= n; i++) {
    if (w[i] == "--") { after = 1; continue }
    if (!after && w[i] !~ /^-/ && w[i] != "HEAD") return "git diff " w[i] " compares with older code; use git diff, git diff HEAD or git diff -- <path>"
  }
  return paths_problem(w, 3, n)
}

function git_commit_problem(w, n,    i) {
  for (i = 3; i <= n; i++) {
    if (w[i] == "-m" || w[i] == "--message") { i++; continue }
    if (w[i] ~ /^(-m|--message=)/) continue
    if (w[i] == "-F" && w[i + 1] == "-") { i++; continue }
    if (w[i] !~ /^-/ || index(w[i], "=")) { if (path_problem(w[i]) != "") return path_problem(w[i]) }
  }
  return ""
}

function git_problem(w, n) {
  if (w[2] == "status" || w[2] == "rev-parse") return ""
  if (w[2] == "add") return paths_problem(w, 3, n)
  if (w[2] == "commit") return git_commit_problem(w, n)
  if (w[2] == "log") return git_log_problem(w, n)
  if (w[2] == "diff") return git_diff_problem(w, n)
  return "git " w[2] " is not one of the test-writer's commands (status, add, commit, log, diff, rev-parse)"
}

function ls_problem(w, n,    i) {
  for (i = 2; i <= n; i++) if (w[i] ~ /^-[A-Za-z]*R/ || w[i] == "--recursive") return "ls -R would list src/; list one folder at a time"
  return paths_problem(w, 2, n)
}

function mkdir_problem(w, n,    i) {
  for (i = 2; i <= n; i++) {
    if (w[i] ~ /^-/) continue
    if (project_path(w[i]) !~ /^tests\// || project_path(w[i]) ~ /(^|\/)\.\.(\/|$)/) return "the test-writer makes folders under tests/ only"
  }
  return ""
}

function lock_problem(w, n) {
  if (n == 3 && w[2] == ".claude/hooks/tests-lock.sh" && w[3] ~ /^(record|hand-over)$/) return ""
  return "sh may only run .claude/hooks/tests-lock.sh record or hand-over"
}

# Why one simple command is refused, or "".
function segment_problem(w, n) {
  if (w[1] ~ /^[A-Za-z_][A-Za-z0-9_]*=/) return "setting a variable in front of a command (" w[1] ") is not allowed for the test-writer"
  if (w[1] ~ /^(pwd|echo|true)$/) return ""
  if (w[1] ~ /^(cat|head|tail|wc|cd)$/) return paths_problem(w, 2, n)
  if (w[1] == "ls") return ls_problem(w, n)
  if (w[1] == "mkdir") return mkdir_problem(w, n)
  if (w[1] == "npm") return npm_problem(w, n)
  if (w[1] == "npx") return w[2] == "vitest" ? paths_problem(w, 3, n) : "npx " w[2] " is not one of the test-writer's commands (npx vitest only)"
  if (w[1] == "git") return git_problem(w, n)
  if (w[1] == "sh") return lock_problem(w, n)
  return w[1] " is not one of the test-writer's commands. Allowed: ls, cat, head, tail, wc, cd, pwd, echo, mkdir (under tests/), npm test, npm run test|typecheck|lint|check, npx vitest, git status|add|commit|log|diff|rev-parse, sh .claude/hooks/tests-lock.sh record|hand-over. Use the Read, Grep and Glob tools for the rest."
}

# A redirect: only to /dev/null, or 2>&1. Returns "why\034next position".
function redirect(s, i,    t) {
  if (substr(s, i + 1, 1) == "&") return (substr(s, i + 2, 1) ~ /[0-9]/ ? "" : "a redirect to " substr(s, i, 3) " is not allowed") "\034" (i + 3)
  i++
  if (substr(s, i, 1) == ">") return "appending with >> is not allowed for the test-writer; use the Write tool\034" i
  while (substr(s, i, 1) ~ /[ \t]/) i++
  t = substr(s, i, 9)
  if (t == "/dev/null") return "\034" (i + 9)
  return "writing with > is not allowed for the test-writer; use the Write tool (under tests/ only)\034" i
}

# Why the whole command is refused, or "".
function judge(s,    i, len, c, q, cur, has, n, w, why, parts, heredoc, line, end) {
  len = length(s)
  for (i = 1; i <= len; i++) {
    c = substr(s, i, 1)
    if (q == "'") { if (c == "'") q = ""; else cur = cur c; continue }
    if (c == "`" || (c == "$" && q != "'")) return "$ and ` (variables and command substitution) are not allowed for the test-writer; write the plain command"
    if (c == "\\") return "backslashes are not allowed for the test-writer; write the plain command"
    if (q == "\"") { if (c == "\"") q = ""; else cur = cur c; continue }
    if (c == "'" || c == "\"") { q = c; has = 1; continue }
    if (c == "<") {
      # Only `git commit -F - <<'EOF'`: skip its body.
      if (substr(s, i, 2) != "<<" || !(w[1] == "git" && w[2] == "commit")) return "reading with < is not allowed for the test-writer; use the Read tool"
      i += 2
      while (substr(s, i, 1) ~ /[ \t'"-]/) i++
      heredoc = ""
      while (i <= len && substr(s, i, 1) !~ /[ \t\n'";&|]/) heredoc = heredoc substr(s, i++, 1)
      continue
    }
    if (c == ">") {
      if (cur ~ /^[0-9]$/) { cur = ""; has = 0 }
      split(redirect(s, i), parts, "\034")
      if (parts[1] != "") return parts[1]
      i = parts[2] - 1
      continue
    }
    if (c == "(" || c == ")") return "( ) subshells are not allowed for the test-writer; write the plain command"
    if (c ~ /[ \t]/ || c ~ /[\n;&|]/) {
      if (has) { w[++n] = cur; cur = ""; has = 0 }
      if (c ~ /[\n;&|]/) {
        if (n > 0) { why = segment_problem(w, n); if (why != "") return why }
        n = 0; split("", w)
      }
      if (c == "\n" && heredoc != "") {
        # Skip lines until the one that is exactly the delimiter.
        while (i < len) {
          end = index(substr(s, i + 1), "\n")
          line = end ? substr(s, i + 1, end - 1) : substr(s, i + 1)
          i += end ? end : len - i
          if (line == heredoc) break
        }
        heredoc = ""
      }
      continue
    }
    cur = cur c; has = 1
  }
  if (q != "") return "an unclosed quote; write the plain command"
  if (has) w[++n] = cur
  return n > 0 ? segment_problem(w, n) : ""
}
