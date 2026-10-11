# src/game/main.ts

Status: approved. Judged by the delegated approver (docs/reviews/slice-1-approver.md); its fixes F1 to F24 and the orchestrator's decisions on E1 to E3 applied in one pass.

New in scope 005 (item 4). The page's starting point: load, build the world,
put the car on the street, start the frames. Anything that fails on the way
ends in `showFailure`, so the player never sees a blank page (the scope's
story). The pictures drawn from the code will be in
`docs/flows/src/game/main.md`.

## startGame

Why the game needs it: from opening the link to driving, or to a plain message saying why not.

```mermaid
flowchart TD
  s(["startGame on the page"])
  a["show the loading line: Loading the map"]
  b["loadGameData with the link's query text; at the same time startPhysicsEngine"]
  c{"a failure from either"}
  d(["showFailure with failureMessage; stop"])
  e["createRenderer"]
  f{"a failure"}
  g["buildGame: scene, physics world, map edge walls, car, controls, camera"]
  h["show any notes about the link with showNotice; hide the loading line; show touch controls if shouldShowTouchControls; listenForResize, and run it once so the fog and the portrait hint fit the screen from the start"]
  i(["start the frames with runFrame"])
  s --> a --> b --> c
  c -->|"yes"| d
  c -->|"no"| e --> f
  f -->|"yes"| d
  f -->|"no"| g --> h --> i
```

## startGameSafely

Why the game needs it: an error nobody planned for still ends in a message on screen, never a frozen loading line.

```mermaid
flowchart TD
  s(["startGameSafely on the page"])
  a["run startGame"]
  b{"did it throw"}
  c(["showFailure with failureMessage of something unexpected, with the error's text"])
  d(["return"])
  s --> a --> b
  b -->|"yes"| c
  b -->|"no"| d
```

## buildGame

Why the game needs it: everything the frames need, made once, with the car parked on the street.

```mermaid
flowchart TD
  s(["buildGame with the loaded data and the renderer"])
  a["createScene with the load radius and the screen's aspect; createPhysicsWorld for the place; addMapEdgeWalls for the index's extent"]
  b["the car: createCar at carStartPose; its drawing from carModel, added to the scene"]
  c["controls: listenToKeyboard and listenToTouches"]
  d["the camera: field of view from chase.ts, placed at its goal at once"]
  e["updateStreaming once at the start, so the ground under the car exists before the first step"]
  f(["return the game: everything above, with the time left over 0 and flip upright not pressed, and the pose before and the pose now both the start pose"])
  s --> a --> b --> c --> d --> e --> f
```

## listenForResize

Why the game needs it: turning the phone sideways or resizing the window keeps the picture filling the screen without stretching. The fog depends on the screen's shape (`fogRangeForView`, `scene.md`; approver's F13), and the hint to turn the phone shows only while it is held upright (`portraitHintShown`, `touch.md`; decision E3 (a)), so both are worked out again here.

```mermaid
flowchart TD
  s(["listenForResize with the renderer, the camera, the scene and the portrait hint"])
  a["on resize: set the renderer to the canvas's new size and the camera's aspect to width over height"]
  b["set the scene's fog from fogRangeForView for the new aspect"]
  c["show the portrait hint, Turn your phone sideways for a wider view., if portraitHintShown; otherwise hide it"]
  d(["return a function that removes the listener"])
  s --> a --> b --> c --> d
```
