# src/place/json-text.ts

Status: draft. Waiting for approval; the approval commit changes this line to `Status: approved`.

New in scope 002b (item 2d). Reads the raw text of a place or vehicle file once, with jsonc-parser 3.3.1 (MIT, see `research/33-json-lines.md`), and keeps where every field sits so each message can name its line. The pictures drawn from the code will be in `docs/flows/src/place/json-text.md`.

## readJsonText

Why the game needs it: a place-maker edits the file by hand, so a missing comma must come back as "line 7", not as a crash or a vague "bad file".

```mermaid
flowchart TD
  s(["readJsonText with the file's text"])
  a["read the text into a tree with jsonc-parser, strict: no comments, no trailing commas"]
  b{"did the reader report any syntax error, or find nothing at all"}
  c(["return not read, with the first error's kind and where in the text it is"])
  d["turn the tree into plain values; a field called __proto__ stays an ordinary field"]
  e(["return read, with the tree and the values"])
  s --> a
  a --> b
  b -->|"yes"| c
  b -->|"no"| d
  d --> e
```

## lineStartOffsets

Why the game needs it: finding a line must stay quick in a very large place file with many problems, so the line starts are listed once.

```mermaid
flowchart TD
  s(["lineStartOffsets of the text"])
  a["the first line starts at the very beginning"]
  b["go through the text; after every line break, note where the next line starts"]
  c(["return the list of line starts"])
  s --> a
  a --> b
  b --> c
```

## lineAtOffset

Why the game needs it: turns a place in the text into the line number the place-maker sees in their editor, counting from 1.

```mermaid
flowchart TD
  s(["lineAtOffset with the line starts and a place in the text"])
  a["search the line starts by halving: find the last line that starts at or before that place"]
  b(["return its number, counting the first line as 1"])
  s --> a
  a --> b
```

## lineOfPath

Why the game needs it: every message points at the line of the field it is about; a missing field points at the line where its object starts.

```mermaid
flowchart TD
  s(["lineOfPath with the tree, the line starts and a field path"])
  a["find the part of the tree at that path"]
  b{"is there nothing at that path"}
  c["use the start of the whole file"]
  d{"is that part the value of a field"}
  e["use where the field's name starts"]
  f["use where that part starts, such as an item in a list"]
  g(["return lineAtOffset of that place"])
  s --> a
  a --> b
  b -->|"yes"| c
  b -->|"no"| d
  d -->|"yes"| e
  d -->|"no"| f
  c --> g
  e --> g
  f --> g
```

## syntaxProblemInWords

Why the game needs it: the reader's error codes ("CommaExpected") mean nothing to a place-maker; each one becomes a plain sentence that says what to fix.

```mermaid
flowchart TD
  s(["syntaxProblemInWords for an error kind"])
  a["look the kind up in a fixed table of plain sentences, for example: a comma is missing between two fields or items; there is a comma with nothing after it; comments are not allowed in this file; text is not closed with a quote mark"]
  b{"is the kind in the table"}
  c(["return: is not valid JSON, then that sentence"])
  d(["return: is not valid JSON here"])
  s --> a
  a --> b
  b -->|"yes"| c
  b -->|"no"| d
```
