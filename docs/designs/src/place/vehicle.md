# src/place/vehicle.ts

Status: draft. Waiting for approval; the approval commit changes this line to `Status: approved`.

The design for each function, written in plain words. The pictures drawn from the code are in `docs/flows/src/place/vehicle.md`.

Redrawn for scope 002b: new names (item 1) and the same shape as `validatePlace` (item 2h). What changed is in `CHANGES-002b.md` next to this file.

## movementProblemInVehicle

Why the game needs it: a vehicle class can only move in the ways that suit it, so a bus that floats like a boat is refused.

```mermaid
flowchart TD
  s(["movementProblemInVehicle with the class and the way it moves, once both are good"])
  a{"is the way it moves one of those allowed for the class"}
  b(["return no problems"])
  c(["return one problem at dynamics: a class cannot move as that way, then the ways it can"])
  s --> a
  a -->|"yes"| b
  a -->|"no"| c
```

## validateVehicle

Why the game needs it: a new kind of vehicle is a file, checked the same way as a place, by file name and line.

```mermaid
flowchart TD
  s(["validateVehicle with the file's name and its text"])
  a(["return validateJsonFile with the name, the text, and the vehicle checker: the vehicle's shape with movementProblemInVehicle added as a cross-field rule reading class and dynamics"])
  s --> a
```
