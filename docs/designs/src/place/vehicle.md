# src/place/vehicle.ts

Status: draft. Waiting for the owner's approval; the approval commit changes this line to `Status: approved`.

The design for each function, written in plain words. The pictures drawn from the code are in `docs/flows/src/place/vehicle.md`.

## module > inner function 1

The rule that a vehicle class can only move in the ways that suit it.

```mermaid
flowchart TD
  s(["check vehicle"])
  a{"is the dynamics value one of those allowed for the class"}
  b(["return nothing, the vehicle is fine"])
  c(["return the sentence a class cannot move as that, listing the ways it can"])
  s --> a
  a -->|"yes"| b
  a -->|"no"| c
```

## validateVehicle

Checks a vehicle file read from JSON.

```mermaid
flowchart TD
  s(["validateVehicle"])
  a(["return success with the vehicle, or failure with every problem found"])
  s --> a
```
