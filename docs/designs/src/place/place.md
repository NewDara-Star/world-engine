# src/place/place.ts

Status: draft. Waiting for approval; the approval commit changes this line to `Status: approved`.

The design for each function, written in plain words. The pictures drawn from the code are in `docs/flows/src/place/place.md`.

Redrawn for scope 002b: new names (item 1) and the new behaviour (items 2d and 2f). What changed is in `CHANGES-002b.md` next to this file. The place's fields and their checkers are unchanged; only how the file is read and reported changes.

## firstRepeatedVehicleClass

Why the game needs it: a vehicle class listed twice is a slip in the file, so we point at it.

```mermaid
flowchart TD
  s(["firstRepeatedVehicleClass in the allowed vehicle classes"])
  a(["return the first class that also appears earlier in the list, or nothing"])
  s --> a
```

## sourceProblemForOneConstant

Why the game needs it: the owner's data rule says each physical constant has exactly one source, so nobody has to guess which one the number came from.

```mermaid
flowchart TD
  s(["sourceProblemForOneConstant: one constant, such as gravity, and the list of sources"])
  a["count the sources that name this constant"]
  b{"how many"}
  c(["return a problem at constantsSources: has no source for the constant"])
  d(["return no problem"])
  e(["return a problem at the second source that names it: constantsSources has that many sources for the constant; each constant needs exactly one"])
  s --> a
  a --> b
  b -->|"none"| c
  b -->|"exactly one"| d
  b -->|"more than one"| e
```

## sourceProblemsForConstants

Why the game needs it: every constant with no source and every constant with more than one is listed in the same report, not just the first.

```mermaid
flowchart TD
  s(["sourceProblemsForConstants in the list of sources"])
  a(["return sourceProblemForOneConstant for every constant the place file must state (gravity, air density), put together"])
  s --> a
```

## repeatedClassProblemsInPlace

Why the game needs it: a vehicle class listed twice is reported in the same pass as every other mistake, as soon as the class list itself is good, whatever else in the file is wrong.

```mermaid
flowchart TD
  s(["repeatedClassProblemsInPlace with the allowed vehicle classes, once that list is good"])
  a["find firstRepeatedVehicleClass"]
  b{"is there one"}
  c(["return a problem at allowedVehicleClasses: lists that class twice"])
  d(["return no problems"])
  s --> a
  a --> b
  b -->|"yes"| c
  b -->|"no"| d
```

## validatePlace

Why the game needs it: adding a town is adding a file; this is the referee that checks it, by file name and line.

```mermaid
flowchart TD
  s(["validatePlace with the file's name and its text"])
  a(["return validateJsonFile with the name, the text, and the place checker: addCrossFieldRules with the place's shape and a list of two rules, repeatedClassProblemsInPlace reading allowedVehicleClasses, and sourceProblemsForConstants reading constantsSources; the fields are checked once, and neither rule waits for the other"])
  s --> a
```
