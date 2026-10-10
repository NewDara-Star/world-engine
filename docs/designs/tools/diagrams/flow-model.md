# tools/diagrams/flow-model.ts

Status: approved by Daramola in chat, 2026-10-10 (batch approval of the diagram tool's own designs; written after the code, see Scope 002).

The design for each function, written in plain words. The pictures drawn from the code are in `docs/flows/tools/diagrams/flow-model.md`.

## newFlow

An empty picture.

```mermaid
flowchart TD
  s(["newFlow"])
  a(["return no boxes and no arrows"])
  s --> a
```

## addNode

Adds a box and gives it the next number.

```mermaid
flowchart TD
  s(["addNode"])
  a["make the id from the number of boxes plus one"]
  b(["add the box, return its id"])
  s --> a
  a --> b
```

## link

Draws an arrow from every open end to a box.

```mermaid
flowchart TD
  s(["link"])
  a["take the next open end"]
  b{"is the same arrow already drawn"}
  c["skip it"]
  d["add the arrow with the end's label"]
  s --> a
  a --> b
  b -->|"yes"| c
  b -->|"no"| d
```

## link > inner function 1

Compares one drawn arrow with the new one.

```mermaid
flowchart TD
  s(["edge"])
  a(["true if from, to and label are all the same"])
  s --> a
```

## shorten

Code text on one line, cut short so a box stays readable.

```mermaid
flowchart TD
  s(["shorten"])
  a["squeeze all spaces and line breaks into single spaces"]
  b{"is it longer than the limit"}
  c(["cut it and add an ellipsis"])
  d(["keep it"])
  s --> a
  a --> b
  b -->|"yes"| c
  b -->|"no"| d
```

## escapeLabel

Turns characters Mermaid would read as syntax into entity codes.

```mermaid
flowchart TD
  s(["escapeLabel"])
  a["replace the hash first, so later codes are not escaped again"]
  b["replace quotes, angle brackets and backticks"]
  c(["turn line breaks into br tags"])
  s --> a
  a --> b
  b --> c
```

## renderNode

The Mermaid text for one box.

```mermaid
flowchart TD
  s(["renderNode"])
  a["pick the brackets for its shape"]
  b(["write id, brackets and the escaped label in quotes"])
  s --> a
  a --> b
```

## renderEdge

The Mermaid text for one arrow.

```mermaid
flowchart TD
  s(["renderEdge"])
  a{"is the label empty"}
  b(["write a plain arrow"])
  c(["write an arrow with the escaped label on it"])
  s --> a
  a -->|"yes"| b
  a -->|"no"| c
```

## renderMermaid

The Mermaid text for a whole picture.

```mermaid
flowchart TD
  s(["renderMermaid"])
  a(["flowchart TD, then every box, then every arrow, one per line"])
  s --> a
```
