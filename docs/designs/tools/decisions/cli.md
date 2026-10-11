# tools/decisions/cli.ts

Status: draft

New in scope 004 (item 4, the clash check). The command the orchestrator and
the note-taker run: `npm run decisions -- check "<text>" --tags a,b`. It
reads `docs/DECISIONS.md`, finds the decisions in force that share a tag or
close wording with the text, and prints each so the orchestrator can tell the
owner "you decided X on <date> because Y; this would change Z". It prints
and nothing else: it never changes the log. The pictures drawn from the code
will be in `docs/flows/tools/decisions/cli.md`.

Exit codes: 0 when the check ran (whether or not it found anything); 1 when
it could not run (wrong arguments, no log, a broken log). A match is not a
failure: deciding whether it really clashes is a person's job.

## parseCheckArguments

Why the game needs it: the orchestrator runs this before acting on the owner's words; a mistyped command must say exactly what is wrong instead of checking nothing and reporting "no clash".

```mermaid
flowchart TD
  s(["parseCheckArguments with the command-line words after npm run decisions --"])
  a{"is the first word check"}
  b(["return a problem: the usage line, check followed by the text in quotes and optionally --tags a,b"])
  c["the text is the next word that is not an option; --tags takes the word after it, or the part after --tags="]
  d{"is there exactly one text, and is it not blank"}
  e(["return a problem: no text to check (or: more than one text; put the text in quotes), with the usage line"])
  f{"was --tags given without a value, or any other option given"}
  g(["return a problem naming the option, with the usage line"])
  h(["return the text and the tags split on commas, trimmed, lower case, empty ones dropped"])
  s --> a
  a -->|"no"| b
  a -->|"yes"| c
  c --> d
  d -->|"no"| e
  d -->|"yes"| f
  f -->|"yes"| g
  f -->|"no"| h
```

## unknownTags

Why the game needs it: a misspelt tag (monye for money) would quietly match nothing; naming it, with the tags in use, lets the orchestrator fix the check instead of trusting an empty answer.

```mermaid
flowchart TD
  s(["unknownTags with the query tags and all the entries"])
  a["collect every tag used by any entry, including replaced ones"]
  b(["return the query tags not in that collection, each with the closest tag in use when one is close"])
  s --> a
  a --> b
```

## describeMatch

Why the game needs it: the owner hears the old decision in its own words, with its date, its reason and who made it, and why it came up, so the conversation starts from facts.

```mermaid
flowchart TD
  s(["describeMatch with one match"])
  a["first line: the id, the date and who decided, then the decision"]
  b["second line: why, as the entry gives it"]
  c{"does the entry replace an older one"}
  d["add a line: it replaces that id"]
  e(["last line: what matched, the shared tags and the shared words, and return the lines"])
  s --> a
  a --> b
  b --> c
  c -->|"yes"| d
  c -->|"no"| e
  d --> e
```

## main

Why the game needs it: one command, run before acting, that answers "has the owner already decided something about this?" from the one log every session reads.

```mermaid
flowchart TD
  s(["main with the command-line words"])
  a["parseCheckArguments"]
  b{"a problem"}
  c(["print the problem and stop with exit code 1"])
  d{"can docs/DECISIONS.md be read, from the project folder"}
  e(["print: the decision log was not found at that path; stop with exit code 1"])
  f["readDecisionLog"]
  g{"any problems in the log"}
  h(["print every problem with its line, then: fix the log first, a broken entry could hide a clash; stop with exit code 1"])
  i["print a warning for each of unknownTags, if any"]
  j["findClashes with entriesInForce, the text and the tags"]
  k{"any matches"}
  l(["print: no decision in force shares these tags or close wording; exit code 0"])
  m(["print how many were found, then describeMatch for each, a blank line between; exit code 0"])
  s --> a
  a --> b
  b -->|"yes"| c
  b -->|"no"| d
  d -->|"no"| e
  d -->|"yes"| f
  f --> g
  g -->|"yes"| h
  g -->|"no"| i
  i --> j
  j --> k
  k -->|"no"| l
  k -->|"yes"| m
```
