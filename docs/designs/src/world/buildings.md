# src/world/buildings.ts

Status: approved by the orchestrator in one pass (Scope 006, lighter process, 2026-10-11).

New in scope 006 (items 1 and 2). The buildings file the bake writes for a
square and the game reads, its checker, and the walls and flat roofs drawn
from it. A bad file is skipped with a problem naming it, never a crash, like
a road file (`chunk.ts`). Extruding a footprint into walls and a flat roof is
the plain prism every OSM renderer starts from (OSM2World and Streets GL, MIT,
research/world-drive/24 section 3; technique only). The pictures drawn from
the code will be in `docs/flows/src/world/buildings.md`.

**Buildings file** `places/<id>/chunks/buildings_<east>_<north>.json`:
`{"format":1,"cell":{"east":3,"north":-2},"buildings":[{"heightCm":600,"shade":2,"rings":[[e0,n0,…],[hole…]],"roof":[a,b,c,…]}]}`.
Corners are whole centimetres from the square's south-west corner, and may
reach 200 m outside it (a building belongs to the square holding its middle).
The first ring is the outline, anticlockwise from above; the rest are holes,
clockwise. The roof lists three corner numbers per triangle, counting the
outline's corners first, then each hole's. Heights up to 300 m; shades 0 to 3.

Walls facing east or west are drawn a little lighter (tone 1) than walls
facing north or south (tone 0.86), our own choice, so two walls meeting at a
corner never look like one surface whatever the sun does.

## validateBuildingChunk

Why the game needs it: a damaged or half-downloaded buildings file must not crash the game or draw a spike across the sky; it is skipped and the player is told part of the map did not load.

```mermaid
flowchart TD
  s(["validateBuildingChunk with the file's name, its text and the square it should be"])
  a{"is the text JSON"}
  b(["return a problem: not readable JSON, it may be cut short"])
  c["look for problems with buildingChunkProblems"]
  d{"any problems"}
  e(["return the problems, each starting with the file's name"])
  f(["return the square and its buildings"])
  s --> a
  a -->|"no"| b
  a -->|"yes"| c --> d
  d -->|"yes"| e
  d -->|"no"| f
```

## buildingChunkProblems

Why the game needs it: each check catches one way a file goes wrong: an old format, the wrong square, a broken building.

```mermaid
flowchart TD
  s(["buildingChunkProblems with any JSON value and the square"])
  a["if the format is not 1: made by a different bake version, bake again"]
  b["if the square written in it is not this one: say which square it is for"]
  c["if the buildings list is missing, or any building fails isGoodBuilding: name the first broken one"]
  d(["return the problems"])
  s --> a --> b --> c --> d
```

## isGoodBuilding

Why the game needs it: one wrong number (a height written as text, a roof corner that does not exist) would draw garbage; every number is checked.

```mermaid
flowchart TD
  s(["isGoodBuilding with one building as read"])
  a["height: a whole number of centimetres, 1 to 300 m, by isWholeNumberFrom"]
  b["shade: a whole number 0 to 3"]
  c["rings: at least one, each passing isGoodRing"]
  d["roof: three numbers per triangle, each a corner the rings have"]
  e(["return yes only when all four hold"])
  s --> a --> b --> c --> d --> e
```

## isGoodBuilding > inner function 1

Counts the corners across the rings.

```mermaid
flowchart TD
  s(["the count so far and one ring"])
  a(["return the count plus half the ring's numbers, or plus nothing when it is not a list"])
  s --> a
```

## isWholeNumberFrom

Why the game needs it: one check for every number in the file: whole, and within its range.

```mermaid
flowchart TD
  s(["isWholeNumberFrom with a value, the lowest and the highest"])
  a(["return yes when it is a whole number from the lowest to the highest"])
  s --> a
```

## isGoodRing

Why the game needs it: a ring needs three corners to have an inside, and each corner must be within reach of its square.

```mermaid
flowchart TD
  s(["isGoodRing with one ring as read"])
  a{"a list of an even count of at least six numbers"}
  b(["return no"])
  c(["return yes when every number is whole and from −200 m to 300 m, in centimetres"])
  s --> a
  a -->|"no"| b
  a -->|"yes"| c
```

## surfaceSizes

Why the game needs it: the drawing lists are made once at their full size, not grown corner by corner.

```mermaid
flowchart TD
  s(["surfaceSizes with a square's buildings"])
  a["for each building: four corners and six numbers of triangles per wall, plus one corner per roof corner and its roof's numbers"]
  b(["return the corner count and the triangle-number count"])
  s --> a --> b
```

## buildingSurfaces

Why the game needs it: a square's buildings are drawn in one go, so the phone keeps up (scope 006, item 2).

```mermaid
flowchart TD
  s(["buildingSurfaces with a square's buildings"])
  a["make the lists at the sizes surfaceSizes gives"]
  b["for each building: addWalls for each of its rings, then addRoof"]
  c(["return positions, normals, shades, tones and triangles"])
  s --> a --> b --> c
```

## addWalls

Why the game needs it: each side of a ring is one wall, lit flat, facing out of the building; a hole's walls face into its courtyard.

```mermaid
flowchart TD
  s(["addWalls with the lists, where to write next, a ring and its building"])
  a["for each side, from a corner to the next one round the ring"]
  b["its outward normal: the side turned a quarter right, in game axes (north change, 0, east change)"]
  c["its tone: lighter the more it faces east or west"]
  d["four corners with putCorner: bottom of a, bottom of b, top of b, top of a"]
  e["two triangles over the four corners, facing out"]
  f(["return when every side is done"])
  s --> a --> b --> c --> d --> e --> a
  a -->|"all sides done"| f
```

## addRoof

Why the game needs it: the flat roof closes the block at its height.

```mermaid
flowchart TD
  s(["addRoof with the lists, where to write next and a building"])
  a["every ring corner at the building's height, facing up, roof-coloured, with putCorner"]
  b["the roof's triangles, moved to where its corners were written"]
  c(["return"])
  s --> a --> b --> c
```

## putCorner

Why the game needs it: writes one corner's position, normal, shade and tone in one place, so the four lists never get out of step.

```mermaid
flowchart TD
  s(["putCorner with the lists, where to write next, a position, a normal, a shade and a tone"])
  a["write each at the next corner"]
  b(["move on one corner"])
  s --> a --> b
```

## buildingOutlinesInMetres

Why the game needs it: each building's outline and height in metres, for its solid (src/game/physics.ts).

```mermaid
flowchart TD
  s(["buildingOutlinesInMetres with a square's buildings"])
  a(["return for each building its outline's corners in metres from the square's south-west corner, and its height in metres"])
  s --> a
```

## buildingOutlinesInMetres > inner function 1

```mermaid
flowchart TD
  s(["one building"])
  a(["return its first ring's corners in metres, and its height in metres"])
  s --> a
```
