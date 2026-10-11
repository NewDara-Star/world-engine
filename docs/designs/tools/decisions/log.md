# tools/decisions/log.ts

Status: approved. Judged by the delegated approver (docs/reviews/clash-approver.md); its fixes drawn in.

New in scope 004 (item 4, the clash check). Reads `docs/DECISIONS.md` into
entries the clash check can compare, and finds what is wrong with the file so
a broken entry is never silently skipped. The entry format is the one
`docs/DECISIONS.md` describes at its top: a `## D-0001` heading, then the
fields `Date`, `Decision`, `Why`, `Decided by`, `Tags`, and `Replaces` when
there is one, each as a `- Field: value` line. The pictures drawn from the
code will be in `docs/flows/tools/decisions/log.md`.

## readDecisionLog

Why the game needs it: the clash check is only as good as the log it reads. If one entry is broken and quietly skipped, the orchestrator would tell the owner "no clash" when there is one, and the game drifts from what the owner decided.

```mermaid
flowchart TD
  s(["readDecisionLog with the text of DECISIONS.md"])
  a["drop a byte-order mark at the very start, then split the text into lines, treating Windows line ends the same as plain ones"]
  b["cut the lines into blocks: each block starts at a line beginning with ## D- and runs to the next one; lines before the first block are the introduction and are ignored"]
  c{"is there at least one block"}
  d(["return no entries and one problem: the file has no decisions in it (no line starting ## D-)"])
  e["read every block with parseEntry, keeping the line number it starts on"]
  f["collect the entries and the problems from all blocks"]
  g{"does any id appear on more than one block"}
  h["add a problem for each repeated id, naming both line numbers"]
  i{"does any Replaces name an id that is not in the log, the entry itself, or an entry that comes after it"}
  j["add a problem for each one: the line, the id it names, and which of the three it is"]
  k(["return the entries and the problems, problems in line order"])
  s --> a
  a --> b
  b --> c
  c -->|"no"| d
  c -->|"yes"| e
  e --> f
  f --> g
  g -->|"yes"| h
  g -->|"no"| i
  h --> i
  i -->|"yes"| j
  i -->|"no"| k
  j --> k
```

## parseEntry

Why the game needs it: each decision must carry its date, its reason and who made it, because the orchestrator tells the owner "you decided X on that date because Y". A missing field is reported by line, so whoever wrote the entry can fix it at once. A bad heading does not stop the rest of the block being checked, so every problem is reported in one pass.

```mermaid
flowchart TD
  s(["parseEntry with one block's lines and the line number it starts on"])
  a{"is the heading exactly ## D- followed by four digits (trailing spaces allowed)"}
  b["add a problem: line N, the heading is not an id like ## D-0001"]
  c["read every line of the form - Field: value, where the field name ends at the first colon-and-space (a value may itself contain colons); other non-empty lines are a problem: line N is not a field"]
  d{"are Date, Decision, Why, Decided by and Tags each there exactly once with a non-empty value, and Replaces at most once"}
  e["add a problem for each one missing, empty, or written twice, at the heading's line (or at the second copy's line when written twice)"]
  f{"is Date a real calendar date written YYYY-MM-DD"}
  g["add a problem: line N, the date is not YYYY-MM-DD"]
  r{"if Replaces is given, is it an id like D-0001"}
  q["add a problem: line N, Replaces must name one id like D-0001"]
  h{"is any field name not one of the six known ones"}
  i["add a problem for each: line N, an unknown field, and the closest known name (at most two letter-changes away, edit distance ≤ 2, case ignored)"]
  l["split Tags on commas, trim each, make each lower case, drop empty ones"]
  t{"is Tags given but left empty after dropping empty ones"}
  u["add a problem: line N, at least one tag is needed"]
  j{"any problem"}
  k(["return the problems"])
  m(["return the entry: id, date, decision, why, decided by, tags, and replaces if given"])
  s --> a
  a -->|"no"| b
  a -->|"yes"| c
  b --> c
  c --> d
  d -->|"no"| e
  d -->|"yes"| f
  e --> f
  f -->|"no"| g
  f -->|"yes"| r
  g --> r
  r -->|"no"| q
  r -->|"yes"| h
  q --> h
  h -->|"yes"| i
  h -->|"no"| l
  i --> l
  l --> t
  t -->|"yes"| u
  t -->|"no"| j
  u --> j
  j -->|"yes"| k
  j -->|"no"| m
```

## entriesInForce

Why the game needs it: when the owner changes a decision, the newer entry says `Replaces: D-00xx`. The clash check must compare against what holds today, not against a decision the owner already overturned.

```mermaid
flowchart TD
  s(["entriesInForce with all the entries"])
  a["collect every id named by a Replaces field"]
  b(["return the entries whose id is not in that collection, in log order"])
  s --> a
  a --> b
```
