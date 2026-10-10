# tools/diagrams/flow.ts

Status: draft. Waiting for the owner's approval; the approval commit changes this line to `Status: approved`.

The design for each function, written in plain words. The pictures drawn from the code are in `docs/flows/tools/diagrams/flow.md`.

## drawConciseBody

Draws a one-line function that just returns an expression.

```mermaid
flowchart TD
  s(["drawConciseBody"])
  a["draw the decisions inside the expression"]
  b["add a return box with the start of the expression"]
  c["join the open arrows to it"]
  d(["return no open arrows"])
  s --> a
  a --> b
  b --> c
  c --> d
```

## drawBody

Draws a function body.

```mermaid
flowchart TD
  s(["drawBody"])
  a{"is the body a block of statements"}
  b(["draw the statements"])
  c(["draw the one-line body"])
  s --> a
  a -->|"yes"| b
  a -->|"no"| c
```

## buildFlow

Draws one whole function.

```mermaid
flowchart TD
  s(["buildFlow"])
  a["start with an empty picture and a start box with the function name"]
  b["draw the body from the start box"]
  c{"are any arrows left open at the bottom"}
  d["add an end box and join them to it"]
  e(["return the picture"])
  s --> a
  a --> b
  b --> c
  c -->|"yes"| d
  c -->|"no"| e
  d --> e
```
