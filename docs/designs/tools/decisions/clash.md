# tools/decisions/clash.ts

Status: draft

New in scope 004 (item 4, the clash check). Given what the orchestrator is
about to do (a line of text and some tags), finds the decisions in force that
share a tag with it or are worded close to it. It only finds candidates; a
person (the orchestrator, then the owner) judges whether they really clash.
The pictures drawn from the code will be in
`docs/flows/tools/decisions/clash.md`.

Open choices for the approver (each a number or a rule the tests will pin):

- "Close wording" here means: at least two content words in common between
  the query and the entry's Decision line, after dropping short and common
  words. Two is a starting value, the owner's call to keep or change.
- The list of common words to drop is short and fixed in the code (words
  such as the, and, every, must). Its source is our own choice; no
  stemming, so "push" and "pushes" are different words.
- Before code is written, the pipeline should look for an existing small
  MIT or Apache text-matching technique (CLAUDE.md, "Find code before
  writing code") and note it in `research/`; this design does not depend
  on one.

## contentWords

Why the game needs it: "a push review" and "Push review:" must count as the same words, or the check misses a clash over capital letters and punctuation.

```mermaid
flowchart TD
  s(["contentWords with a piece of text"])
  a["make the text lower case"]
  b["split it into words at anything that is not a letter or a digit, so letters with accents stay inside their word"]
  c["drop words shorter than three letters and the fixed list of common words"]
  d(["return the remaining words, each once"])
  s --> a
  a --> b
  b --> c
  c --> d
```

## matchOf

Why the game needs it: the orchestrator has to tell the owner why an old decision came up ("it shares the tag money", "it also talks about payouts"), so each match says what matched.

```mermaid
flowchart TD
  s(["matchOf with one entry, the query's words and the query's tags"])
  a["the shared tags: the query's tags that are also the entry's tags"]
  b["the shared words: the query's words that are also contentWords of the entry's Decision line"]
  c{"is there a shared tag, or at least two shared words"}
  d(["return nothing"])
  e(["return the match: the entry, the shared tags, the shared words, and the strength: both, tags only, or words only"])
  s --> a
  a --> b
  b --> c
  c -->|"no"| d
  c -->|"yes"| e
```

## findClashes

Why the game needs it: the strongest and newest candidates come first, so the owner hears about the decision most likely to clash before older or weaker ones.

```mermaid
flowchart TD
  s(["findClashes with the entries in force, the query text and the query tags"])
  a["make the query tags lower case and trimmed, and drop empty ones"]
  b["find contentWords of the query text"]
  c{"are there no query words and no query tags"}
  d(["return nothing to match against, so the caller can say so"])
  e["run matchOf on every entry and keep the matches"]
  f["sort: strength both first, then tags only, then words only; within each, the newest date first, then the higher id first"]
  g(["return the sorted matches"])
  s --> a
  a --> b
  b --> c
  c -->|"yes"| d
  c -->|"no"| e
  e --> f
  f --> g
```
