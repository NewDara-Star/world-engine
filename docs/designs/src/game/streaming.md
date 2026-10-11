# src/game/streaming.ts

Status: draft

New in scope 005 (item 4: "the chunks around the car, all chunks within a
view distance; unload far ones"). Squares are loaded within the **load
radius** of the car and let go beyond the **keep radius**, which is larger, so
a car driving along a square's edge does not load and drop the same square
over and over. Both are performance numbers, the owner's choice, proposed at
300 m and 400 m as named constants here, to be confirmed by the frame-rate
measurement on the phone. Only squares inside the map's extent are loaded. The
plan is a pure function the blind tests can run; loading and letting go touch
the scene and the physics. The pictures drawn from the code will be in
`docs/flows/src/game/streaming.md`.

Each loaded square keeps: its ground mesh, its ground collider, its road mesh
when it has arrived, and whether its road is loading, loaded, failed (with
the time) or not needed (the index has no road there).

## streamingPlan

Why the game needs it: only a few dozen squares are ever in the phone's memory, and the ones around the car are always there.

```mermaid
flowchart TD
  s(["streamingPlan with the car's point, the loaded squares, the map's extent, and the two radii"])
  a["wanted = cellsWithin the load radius of the car, keeping only squares inside the extent; nearest first"]
  b["to load = wanted squares not loaded yet, in that order"]
  c["to let go = loaded squares whose distanceToCell from the car is more than the keep radius"]
  d(["return to load and to let go"])
  s --> a --> b --> c --> d
```

## loadCell

Why the game needs it: the ground and its collider appear at once, so the car can never fall through a square whose road file is slow; the road follows when it arrives.

```mermaid
flowchart TD
  s(["loadCell with the game and a square"])
  a["add groundTileMesh to the scene and addGroundCollider to the world; keep both under the square's key"]
  b{"does the map index list road in this square"}
  c(["return; the road is not needed"])
  d["mark the road loading; start fetching the chunk file, and hand its answer to roadArrived"]
  e(["return without waiting"])
  s --> a --> b
  b -->|"no"| c
  b -->|"yes"| d --> e
```

## roadArrived

Why the game needs it: a road file that arrives after the car has driven away is thrown away instead of being drawn in a square nobody holds; a broken one is reported once and tried again later.

```mermaid
flowchart TD
  s(["roadArrived with the game, the square, and the fetch's answer"])
  a{"is the square still loaded and its road still loading"}
  b(["return; drop the answer"])
  c["check the answer with validateChunk for that square"]
  d{"a failure or problems"}
  e["mark the road failed with the time; the first time this square fails, showNotice: Part of the map did not load; trying again. Retries of the same square stay quiet"]
  f["add roadMeshFromChunk to the scene; mark the road loaded"]
  g(["return"])
  s --> a
  a -->|"no"| b
  a -->|"yes"| c --> d
  d -->|"yes"| e --> g
  d -->|"no"| f --> g
```

## unloadCell

Why the game needs it: letting go of a square removes everything it added, so a three-hour drive uses the same memory as a three-minute one.

```mermaid
flowchart TD
  s(["unloadCell with the game and a square"])
  a["releaseMesh the ground tile; remove the ground collider from the world"]
  b{"has its road mesh arrived"}
  c["releaseMesh the road"]
  d(["forget the square; a road still loading will be dropped by roadArrived"])
  s --> a --> b
  b -->|"yes"| c --> d
  b -->|"no"| d
```

## retryFailedRoads

Why the game needs it: a road that failed on a weak signal comes back by itself when the signal does, without the player reloading.

```mermaid
flowchart TD
  s(["retryFailedRoads with the game and the time now"])
  a["for each loaded square whose road failed"]
  b{"did it fail at least 5 seconds ago"}
  c["mark it loading and fetch it again, as in loadCell"]
  d(["return"])
  s --> a --> b
  b -->|"yes"| c --> a
  b -->|"no"| a
  a -->|"all done"| d
```

## updateStreaming

Why the game needs it: once a frame, the squares follow the car.

```mermaid
flowchart TD
  s(["updateStreaming with the game, the car's point and the time now"])
  a["the plan from streamingPlan"]
  b["unloadCell each square to let go"]
  c["loadCell each square to load"]
  d["retryFailedRoads"]
  e(["return"])
  s --> a --> b --> c --> d --> e
```
