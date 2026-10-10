# tools/diagrams/context.ts

Status: draft. Waiting for the owner's approval; the approval commit changes this line to `Status: approved`.

The design for each function, written in plain words. The pictures drawn from the code are in `docs/flows/tools/diagrams/context.md`.

## codeText

The code of a node on one line, shortened.

```mermaid
flowchart TD
  s(["codeText"])
  a(["return the node text, shortened"])
  s --> a
```

## declaredInOurFiles

Says whether a symbol is declared in one of our own files.

```mermaid
flowchart TD
  s(["declaredInOurFiles"])
  a{"is the symbol an alias such as an import"}
  b["follow it to the real symbol"]
  c["keep the symbol"]
  d(["return true if any declaration sits in one of our files"])
  s --> a
  a -->|"yes"| b
  a -->|"no"| c
  b --> d
  c --> d
```

## calleeSymbol

Finds the compiler symbol for the thing a call calls.

```mermaid
flowchart TD
  s(["calleeSymbol"])
  a{"is the callee written a.b"}
  b["use the b part"]
  c["use the whole callee"]
  d(["return the symbol the compiler knows for it, or nothing"])
  s --> a
  a -->|"yes"| b
  a -->|"no"| c
  b --> d
  c --> d
```

## collectCalls

Collects the names of our functions called inside a piece of code.

```mermaid
flowchart TD
  s(["collectCalls"])
  a{"is the node a call or a new"}
  b["find the symbol it calls"]
  c{"is it one of ours"}
  d["record the name"]
  e["visit each child"]
  f{"is the child a function with its own picture"}
  g["skip it"]
  h["collect from it"]
  s --> a
  a -->|"yes"| b
  a -->|"no"| e
  b --> c
  c -->|"yes"| d
  c -->|"no"| e
  d --> e
  e --> f
  f -->|"yes"| g
  f -->|"no"| h
```

## collectCalls > inner function 1

Visits one child.

```mermaid
flowchart TD
  s(["child"])
  a{"is it a function with its own picture"}
  b(["do nothing, it has its own picture"])
  c(["collect the calls inside it"])
  s --> a
  a -->|"yes"| b
  a -->|"no"| c
```

## callsNote

The line saying which of our functions a piece of code calls.

```mermaid
flowchart TD
  s(["callsNote"])
  a["collect the calls in order, without repeats"]
  b{"are there none"}
  c(["return empty text"])
  d(["return a line break and calls followed by the names"])
  s --> a
  a --> b
  b -->|"yes"| c
  b -->|"no"| d
```
