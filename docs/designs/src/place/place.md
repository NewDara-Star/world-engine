# src/place/place.ts

Status: draft. Waiting for the owner's approval; the approval commit changes this line to `Status: approved`.

The design for each function, written in plain words. The pictures drawn from the code are in `docs/flows/src/place/place.md`.

## repeatedClass

Finds a vehicle class that is listed twice.

```mermaid
flowchart TD
  s(["repeatedClass"])
  a(["return the first class that also appears earlier in the list, or nothing"])
  s --> a
```

## missingSource

Finds a constant that has no source.

```mermaid
flowchart TD
  s(["missingSource"])
  a(["return the first constant (gravity, air density) that no source names, or nothing"])
  s --> a
```

## placeProblem

Checks the rules that span several fields of a place.

```mermaid
flowchart TD
  s(["placeProblem"])
  a["look for a repeated vehicle class"]
  b{"is there one"}
  c(["return the sentence saying that class is listed twice"])
  d["look for a constant with no source"]
  e{"is there one"}
  f(["return the sentence saying constantsSources lacks that constant"])
  g(["return nothing, the place is fine"])
  s --> a
  a --> b
  b -->|"yes"| c
  b -->|"no"| d
  d --> e
  e -->|"yes"| f
  e -->|"no"| g
```

## validatePlace

Checks a place file read from JSON.

```mermaid
flowchart TD
  s(["validatePlace"])
  a(["return success with the place, or failure with every problem found"])
  s --> a
```
