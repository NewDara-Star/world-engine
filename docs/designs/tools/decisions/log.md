# tools/decisions/log.ts

Status: draft

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
  a["split the text into lines, treating Windows line ends the same as plain ones"]
  b["cut the lines into blocks: each block starts at a line beginning with ## D- and runs to the next one; lines before the first block are the introduction and are ignored"]
  c{"is there at least one block"}
  d(["return no entries and one problem: the file has no decisions in it (no line starting ## D-)"])
  e["read every block with parseEntry, keeping the line number it starts on"]
  f["collect the entries and the problems from all blocks"]
  g{"does any id appear on more than one block"}
  h["add a problem for each repeated id, naming both line numbers"]
  i{"does any Replaces name an id that is not in the log"}
  j["add a problem for each one: the line, and the id it names"]
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

Why the game needs it: each decision must carry its date, its reason and who made it, because the orchestrator tells the owner "you decided X on that date because Y". A missing field is reported by line, so whoever wrote the entry can fix it at once.

```mermaid
flowchart TD
  s(["parseEntry with one block's lines and the line number it starts on"])
  a{"is the heading exactly ## D- followed by four digits"}
  b(["return a problem: line N, the heading is not an id like ## D-0001"])
  c["read every line of the form - Field: value into a field and its value; other non-empty lines are a problem: line N is not a field"]
  d{"are Date, Decision, Why, Decided by and Tags all there, each once"}
  e["add a problem for each one missing or written twice, at the heading's line"]
  f{"is Date a real calendar date written YYYY-MM-DD"}
  g["add a problem: line N, the date is not YYYY-MM-DD"]
  h{"is any field name not one of the six known ones"}
  i["add a problem for each: line N, an unknown field, and the closest known name"]
  j{"any problem"}
  k(["return the problems"])
  l["split Tags on commas, trim each, make each lower case, drop empty ones"]
  m(["return the entry: id, date, decision, why, decided by, tags, and replaces if given"])
  s --> a
  a -->|"no"| b
  a -->|"yes"| c
  c --> d
  d -->|"no"| e
  d -->|"yes"| f
  e --> f
  f -->|"no"| g
  f -->|"yes"| h
  g --> h
  h -->|"yes"| i
  h -->|"no"| j
  i --> j
  j -->|"yes"| k
  j -->|"no"| l
  l --> m
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
