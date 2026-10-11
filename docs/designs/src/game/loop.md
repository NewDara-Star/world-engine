# src/game/loop.ts

Status: approved by the orchestrator in one pass (Scope 005b, the owner's lighter process for non-physics work, 2026-10-11).

New in scope 005 (item 4). One frame of the game, about 60 times a second
(browser `requestAnimationFrame`). Order: read the controls, flip the car
upright if asked (or return it to the start if it left the world, then load
the squares there), run the physics in fixed steps, move the squares, move
the camera, draw. The pose before and the pose now are kept in the game
between frames, for smooth drawing (approver's F17). The pictures drawn from the code will
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

Why the game needs it: the car is driven and the world moves in equal steps, and the pose before the last step is kept for smooth drawing. The pose before and the pose now live in the game between frames: a frame with no step (most frames on a 120 Hz screen) leaves them as they were, so the drawing still blends between them; a flip or a return to the start sets both to the new pose, so the car never smears across the map for a frame (approver's F17).

```mermaid
flowchart TD
  s(["stepCarPhysics with the game, the actions and the number of steps"])
  a["for each step"]
  b["set the game's pose before to the car's pose"]
  c["driveCar for one step's length, then step the world; set the game's pose now to the car's pose"]
  d(["return; with no steps, the game's two poses are as they were"])
  s --> a --> b --> c --> a
  a -->|"all steps done"| d
```

## rescueCarIfNeeded

Why the game needs it: whether the player asked or the car fell off the world, it is put right, and the player is told why, in the same words as the button. Flip upright works only when the car has nearly stopped or tipped over (`canFlipUpright`, `car.md`; orchestrator's decision E2 (b)); otherwise the player is told when it works, and nothing happens to the car.

```mermaid
flowchart TD
  s(["rescueCarIfNeeded with the game and the actions"])
  a{"was Flip upright pressed just now, by pressedJustNow"}
  g{"canFlipUpright for the car's speed and turn"}
  b["flipCarUpright within the extent; set the game's pose before and pose now to the new pose; showNotice: Flipped upright."]
  h["showNotice: Flip upright works when the car has stopped or tipped over."]
  c["carRescueNeeded for the car's position and the extent"]
  d{"is a rescue needed"}
  e["returnCarToStart; set the game's pose before and pose now to the new pose; showNotice: The car fell through the ground, or left the map, so it is back at the start."]
  f(["return what happened: flipped, returned to the start, or nothing, for the camera and the streaming"])
  s --> a
  a -->|"yes"| g
  g -->|"yes"| b --> f
  g -->|"no"| h --> f
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

## playFrame

Why the game needs it: the whole game, once a frame.

```mermaid
flowchart TD
  s(["playFrame with the game and the time now"])
  a["length = frameSeconds since the last frame"]
  b["actions = readActions"]
  c["what happened = rescueCarIfNeeded"]
  r{"was the car returned to the start"}
  r1["updateStreaming at the start, before the physics steps, so the start square's ground exists when the car lands there"]
  d["steps and blend fraction from physicsStepsForFrame; stepCarPhysics"]
  e["updateStreaming at the car's position"]
  f["blended pose = blendPoses of the game's pose before and pose now; updateCarModel with it"]
  g["moveChaseCamera toward chaseCameraGoal of the blended pose, jumping if the car was flipped or returned to the start"]
  h(["warnAtMapEdge; updateHud at the car's position (Scope 005b); measureFrame; draw the scene"])
  s --> a --> b --> c --> r
  r -->|"yes"| r1 --> d
  r -->|"no"| d
  d --> e --> f --> g --> h
```

## runFrame

Why the game needs it: frames keep coming while all is well, and a frame that goes wrong ends with a message on screen. Without this, a throw inside a frame stops `requestAnimationFrame` and freezes the picture with no word; `startGameSafely` covers only the start (approver's F17).

```mermaid
flowchart TD
  s(["runFrame with the game and the time now"])
  a["run playFrame"]
  b{"did it throw"}
  c(["showFailure with failureMessage of something unexpected, with the error's text; stop: no next frame"])
  d(["ask the browser for the next frame"])
  s --> a --> b
  b -->|"yes"| c
  b -->|"no"| d
```
