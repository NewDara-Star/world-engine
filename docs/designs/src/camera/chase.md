# src/camera/chase.ts

Status: draft

New in scope 005 (item 4). A chase camera behind and above the car. It
follows the car's position smoothly instead of being bolted to the body, so
every bump of the springs does not shake the picture (our
research/world-drive/12, item 1). Smoothing uses a fraction worked out from
the time step, 1 − e^(−rate × time), which gives the same feel at 60 and 120
frames a second (research 12, item 6). Distance, height, look-ahead, field of
view and following rate are game-feel numbers, the owner's choice, proposed
as named constants in this file: 6 m behind, 2.5 m above the ground, looking
at a point 3 m ahead of the car and 1 m up, field of view 60 degrees,
following rate 4 per second. The pictures drawn from the code will be in
`docs/flows/src/camera/chase.md`.

## followFraction

Why the game needs it: smoothing that does not depend on the phone's frame rate.

```mermaid
flowchart TD
  s(["followFraction with a rate per second and the frame's length in seconds"])
  a(["return 1 minus e to the power of minus rate times length; 0 for a zero-length frame, close to 1 for a long one"])
  s --> a
```

## chaseCameraGoal

Why the game needs it: where the camera wants to be: behind the car along its heading, at a fixed height, and what it looks at.

```mermaid
flowchart TD
  s(["chaseCameraGoal with the car's position and its heading on the ground"])
  a["the car's forward direction flat on the ground, ignoring pitch and roll, so the horizon stays level"]
  b["camera point = car position minus forward times the distance behind, at the camera height above the ground"]
  c(["return the camera point and the look point: car position plus forward times the look-ahead, at the look height"])
  s --> a --> b --> c
```

## moveChaseCamera

Why the game needs it: the camera glides toward its goal each frame and never jumps, except when the car is put back, where gliding across the map would be confusing.

```mermaid
flowchart TD
  s(["moveChaseCamera with the camera's point and look point, the goal, the frame's length, and whether the car was just put back"])
  a{"was the car just put back"}
  b(["return the goal itself"])
  c["fraction = followFraction of the following rate and the frame's length"]
  d(["return the camera point and the look point each moved that fraction of the way to the goal"])
  s --> a
  a -->|"yes"| b
  a -->|"no"| c --> d
```
