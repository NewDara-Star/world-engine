# Does a shell command line really run `git <want>`, as opposed to mentioning
# it in text? Used by every commit/push hook (CLAUDE.md, "Checks and hooks").
# Reference: POSIX awk (IEEE Std 1003.1 awk utility); shell word and operator
# rules from POSIX sh, "Shell Command Language" sections 2.2 (quoting), 2.9.4
# (lists: && || ; | newline) and 2.7.4 (here-documents). Our own design; no
# third-party code.
# Run: awk -v want=commit -f runs-git.awk   (command on stdin). Exit 0 = yes.

BEGIN {
  RS = "\001" # read the whole command, newlines included, as one record
}
{ text = text $0 }
END { exit scan(text) ? 0 : 1 }

# Words that sit in front of a command without being it.
function is_prefix(word) {
  return word ~ /^[A-Za-z_][A-Za-z0-9_]*=/ || word ~ /^(env|time|command|exec|nohup|then|do|else|elif|if|while|until|!|\{)$/
}

# git options that take a value in the next word.
function takes_value(word) {
  return word == "-C" || word == "-c" || word == "--git-dir" || word == "--work-tree" || word == "--namespace"
}

function git_subcommand_is_wanted(w, n, i) {
  for (; i <= n; i++) {
    if (takes_value(w[i])) { i++; continue }
    if (w[i] !~ /^-/) break
  }
  return w[i] == want
}

# A shell run with -c, or eval, runs text we cannot be sure about: look inside.
function inner_text_hits(w, n, i,    j, rest) {
  if (w[i] == "eval") {
    for (j = i + 1; j <= n; j++) rest = rest " " w[j]
    return scan(rest)
  }
  for (j = i + 1; j < n; j++) if (w[j] ~ /^-[a-zA-Z]*c[a-zA-Z]*$/) return scan(w[j + 1])
  return 0
}

function segment_hits(w, n,    i, base) {
  for (i = 1; i <= n && is_prefix(w[i]); i++) ;
  base = w[i]
  sub(/.*\//, "", base)
  if (base == "git") return git_subcommand_is_wanted(w, n, i + 1)
  if (base ~ /^(bash|sh|zsh|dash|ksh|eval)$/) return inner_text_hits(w, n, i)
  return 0
}

# After a newline, skip the bodies of the here-documents opened on that line.
function skip_heredoc_bodies(s, pos, delims, count,    line, end, k) {
  for (k = 1; k <= count; k++) {
    while (pos <= length(s)) {
      end = index(substr(s, pos), "\n")
      line = end ? substr(s, pos, end - 1) : substr(s, pos)
      pos += end ? end : length(s) - pos + 1
      sub(/^\t+/, "", line)
      if (line == delims[k]) break
    }
  }
  return pos
}

# Reads the word after << (quotes around it are dropped). Returns "delim\034nextpos".
function heredoc_delimiter(s, pos,    c, d, q) {
  while (substr(s, pos, 1) ~ /[ \t-]/) pos++
  while (pos <= length(s)) {
    c = substr(s, pos, 1)
    if (q == "") {
      if (c ~ /[ \t\n;&|()<>]/) break
      if (c == "'" || c == "\"") { q = c; pos++; continue }
    } else if (c == q) { q = ""; pos++; continue }
    d = d c; pos++
  }
  return d "\034" pos
}

# True when some command in the text is `git <want>` (see header).
function scan(s,    i, len, c, q, cur, has, n, w, hits, ndel, delims, parts) {
  len = length(s)
  for (i = 1; i <= len; i++) {
    c = substr(s, i, 1)
    if (q == "'") { if (c == "'") q = ""; else cur = cur c; continue }
    if (c == "\\") { cur = cur substr(s, ++i, 1); has = 1; continue }
    if (q == "\"") { if (c == "\"") q = ""; else cur = cur c; continue }
    if (c == "'" || c == "\"") { q = c; has = 1; continue }
    if (c == "#" && !has) { while (i < len && substr(s, i + 1, 1) != "\n") i++; continue }
    if (c == "<" && substr(s, i, 2) == "<<" && substr(s, i, 3) != "<<<") {
      split(heredoc_delimiter(s, i + 2), parts, "\034")
      delims[++ndel] = parts[1]; i = parts[2] - 1; continue
    }
    if (c ~ /[ \t]/ || c ~ /[\n;&|()`]/) {
      if (has) { w[++n] = cur; cur = ""; has = 0 }
      if (c ~ /[\n;&|()`]/) {
        if (n > 0 && segment_hits(w, n)) return 1
        n = 0
      }
      if (c == "\n" && ndel > 0) { i = skip_heredoc_bodies(s, i + 1, delims, ndel) - 1; ndel = 0 }
      continue
    }
    cur = cur c; has = 1
  }
  if (has) w[++n] = cur
  return n > 0 && segment_hits(w, n)
}
