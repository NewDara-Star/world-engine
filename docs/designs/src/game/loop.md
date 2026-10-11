# src/game/loop.ts

Status: draft

New in scope 005 (item 4). One frame of the game, about 60 times a second
(browser `requestAnimationFrame`). Order: read the controls, put the car back
if asked, run the physics in fixed steps, check the car is still on the map,
move the squares, move the camera, draw. The pictures drawn from the code will
be in `docs/flows/src/game/loop.md`.

## frameSeconds

Why the game needs it: when the phone locks or the tab is hidden, the next frame comes minutes later; the game must not try to simulate those minutes.

```mermaid
flowchart TD
  s(["frameSeconds from the last frame's time to this one's, in milliseconds"])
  a(["return the difference in seconds, kept from 0 to 0.25; a clock that went backwards gives 0"])
  s --> a
```

## readActions

Why the game needs it: every device is read every frame and combined, so the player can switch from thumbs to keys at any time.

```mermaid
flowchart TD
  s(["readActions with the game"])
  a["keyboardActions of the held keys; touchActions of the touch state; gamepadActions of the browser's pads"]
  b(["return strongestActions of the three, each through cleanActions"])
  s --> a --> b
```

## stepCarPhysics

Why the game needs it: the car is driven and the world moves in equal steps, and the pose before the last step is kept for smooth drawing.

```mermaid
flowchart TD
  s(["stepCarPhysics with the game, the actions and the number of steps"])
  a["for each step"]
  b["keep the car's pose as the pose before"]
  c["driveCar for one step's length, then step the world"]
  d(["return the pose before the last step and the pose now"])
  s --> a --> b --> c --> a
  a -->|"all steps done"| d
```

## rescueCarIfNeeded

Why the game needs it: whether the player asked or the car fell off the world, it is put back, and the player is told why.

```mermaid
flowchart TD
  s(["rescueCarIfNeeded with the game and the actions"])
  a{"was put back pressed just now, by pressedJustNow"}
  b["putCarBack here; showNotice: Car put back on its wheels."]
  c["carRescueNeeded for the car's position and the extent"]
  d{"is a rescue needed"}
  e["putCarBack at the start; showNotice: The car fell through the ground, or left the map, so it is back at the start."]
  f(["return whether the car was put back, for the camera"])
  s --> a
  a -->|"yes"| b --> f
  a -->|"no"| c --> d
  d -->|"yes"| e --> f
  d -->|"no"| f
```

## warnAtMapEdge

Why the game needs it: the invisible wall at the map's edge is explained, not a mystery; the notice is not repeated while the player stays there.

```mermaid
flowchart TD
  s(["warnAtMapEdge with the game, the car's point and the time now"])
  a{"is the car within 20 m of the extent's edge"}
  b(["return"])
  c{"was this notice shown in the last 10 seconds"}
  d(["showNotice: This is the edge of the map for now. Remember the time"])
  s --> a
  a -->|"no"| b
  a -->|"yes"| c
  c -->|"yes"| b
  c -->|"no"| d
```

## measureFrame

Why the game needs it: in measuring mode, the moment the player could first drive is marked once, frames are recorded for 60 seconds from then, and the report appears on screen when done.

```mermaid
flowchart TD
  s(["measureFrame with the game, the frame's length and the time now"])
  a{"is the game measuring"}
  b(["return"])
  c{"is the drivable moment unmarked, and is the start square's road drawn"}
  d["mark the drivable moment as now"]
  e["recordFrame with the length"]
  f{"did the recorder just finish"}
  g(["show measureReportLines of bytesBeforeDriving and frameRateSummary in the measure panel"])
  s --> a
  a -->|"no"| b
  a -->|"yes"| c
  c -->|"yes"| d --> e
  c -->|"no"| e
  e --> f
  f -->|"yes"| g
  f -->|"no"| b
```

## runFrame

Why the game needs it: the whole game, once a frame.

```mermaid
flowchart TD
  s(["runFrame with the game and the time now"])
  a["length = frameSeconds since the last frame"]
  b["actions = readActions"]
  c["put back = rescueCarIfNeeded"]
  d["steps and blend fraction from physicsStepsForFrame; poses from stepCarPhysics"]
  e["updateStreaming at the car's position"]
  f["updateCarModel with blendPoses of the two poses"]
  g["moveChaseCamera toward chaseCameraGoal, jumping if the car was put back"]
  h["warnAtMapEdge; measureFrame; draw the scene"]
  i(["ask the browser for the next frame"])
  s --> a --> b --> c --> d --> e --> f --> g --> h --> i
```
