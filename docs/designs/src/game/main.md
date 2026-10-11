# src/game/main.ts

Status: approved by the orchestrator in one pass (Scope 005b, the owner's lighter process for non-physics work, 2026-10-11).

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
  h["show any notes about the link with showNotice; hide the loading line; show touch controls if shouldShowTouchControls, and on the first touch show them and placeHud; listenForResize, and run it once so the fog, the portrait hint and the small map fit the screen from the start"]
  j["listenToMiniMapTaps; start loading the streets with loadStreetsForPlace, without waiting, then streetsArrived (Scope 005b)"]
  i(["start the frames with runFrame"])
  s --> a --> b --> c
  c -->|"yes"| d
  c -->|"no"| e --> f
  f -->|"yes"| d
  f -->|"no"| g --> h --> j --> i
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
  f(["return the game: everything above, with the time left over 0 and flip upright not pressed, the pose before and the pose now both the start pose, no streets yet, no street name, and the small map small and not yet placed"])
  s --> a --> b --> c --> d --> e --> f
```

## listenForResize

Why the game needs it: turning the phone sideways or resizing the window keeps the picture filling the screen without stretching. The fog depends on the screen's shape (`fogRangeForView`, `scene.md`; approver's F13), and the hint to turn the phone shows only while it is held upright (`portraitHintShown`, `touch.md`; decision E3 (a)), so both are worked out again here.

```mermaid
flowchart TD
  s(["listenForResize with the game (its renderer, camera and scene) and the page"])
  a["on resize: set the renderer to the canvas's new size and the camera's aspect to width over height"]
  b["set the scene's fog from fogRangeForView for the new aspect"]
  c["show the portrait hint, Turn your phone sideways for a wider view., if portraitHintShown; otherwise hide it"]
  e["placeHud, so the small map moves clear of the controls (Scope 005b)"]
  d(["return a function that removes the listener"])
  s --> a --> b --> c --> e --> d
```

## listenForResize > fitToScreen

Added by the coder in Scope 005 slice 1, approved by the orchestrator on 2026-10-11 (common sense: the check the approved design already asked for): the approved design asked for this check (see below) but named no function for it, and the diagram gate needs one heading per function. `listenForResize` says "on resize: …"; this is the function the browser calls on each resize, holding exactly those steps. Why the game needs it: the same steps run on every resize and once at the start.

```mermaid
flowchart TD
  s(["fitToScreen"])
  a["set the renderer to the canvas's new size and the camera's aspect to width over height"]
  b["set the scene's fog from fogRangeForView for the new aspect"]
  c["show the portrait hint if portraitHintShown; otherwise hide it"]
  e["placeHud (Scope 005b)"]
  d(["return"])
  s --> a --> b --> c --> e --> d
```

## startGame > inner function 1

New in Scope 005b. Why the game needs it: a touch screen on a computer gets the thumb controls once it is touched, and the small map moves clear of them at once.

```mermaid
flowchart TD
  s(["on the first touch"])
  a["show the thumb controls"]
  b(["placeHud"])
  s --> a --> b
```
