# src/place/closest-word.ts

Status: draft. Waiting for approval; the approval commit changes this line to `Status: approved`.

New in scope 002b (item 2b). Finds the word someone most likely meant, for "Did you mean `name`?". The distance is the optimal string alignment distance, the restricted form of Damerau–Levenshtein; the sources and their limits are in `research/33-json-lines.md`. The pictures drawn from the code will be in `docs/flows/src/place/closest-word.md`.

## editDistance

Why the game needs it: measures how many slips of the fingers turn what was typed into a word we know, so `nmae` is one slip from `name`.

```mermaid
flowchart TD
  s(["editDistance between two words"])
  a["make a table with a row for each letter of the first word and a column for each letter of the second"]
  b["fill the first row and column: turning a word into nothing costs one per letter"]
  c["fill every other cell with editCostAt, row by row"]
  d(["return the number in the last cell"])
  s --> a
  a --> b
  b --> c
  c --> d
```

## editCostAt

Why the game needs it: one step of the distance; it is what lets a swap of two neighbouring letters count as one slip, not two.

```mermaid
flowchart TD
  s(["editCostAt one cell of the table"])
  a["take the cheapest of: delete a letter, insert a letter, replace a letter (free if the two letters are the same)"]
  b{"are these two letters the previous two swapped"}
  c["also consider swapping them, at one more than the cell two back on both words"]
  d(["return the cheapest"])
  s --> a
  a --> b
  b -->|"yes"| c
  b -->|"no"| d
  c --> d
```

## closeEnoughLimit

Why the game needs it: a guess is only offered when it is very likely right; short words allow fewer slips, so `id` is never "corrected" to something else.

```mermaid
flowchart TD
  s(["closeEnoughLimit for a word we might suggest"])
  a(["return the smaller of 2 and a third of the word's length, rounded down"])
  s --> a
```

## closestWord

Why the game needs it: picks the one word to suggest, or none when nothing is close or two words are equally close, so the hint never sends someone the wrong way.

```mermaid
flowchart TD
  s(["closestWord for what was typed, among the words we know"])
  a["measure editDistance from what was typed to each word we know"]
  b["keep only the words within their closeEnoughLimit"]
  c{"is exactly one word the closest of those kept"}
  d(["return that word"])
  e(["return nothing: no hint"])
  s --> a
  a --> b
  b --> c
  c -->|"yes"| d
  c -->|"no"| e
```
