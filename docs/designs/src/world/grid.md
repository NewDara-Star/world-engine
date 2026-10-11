# src/world/grid.ts

Status: draft

New in scope 005 (items 2 and 4). The 100 m squares the world is cut into
(D-0008, owner, 2026-10-10: "plain 100 m grid chunks"). Used by the bake to
cut and by the game to stream, so the two can never disagree about where a
square is. Positions are in map words: metres east and north of the place
centre. The pictures drawn from the code will be in
`docs/flows/src/world/grid.md`.

The square size, 100 m, is one named constant here, with D-0008 beside it.
A square is named by two whole numbers: how many squares east and north of
the centre's square it is (negative for west and south).

## cellOfPoint

Why the game needs it: every road piece and the car's position must land in exactly one square, including points on a square's edge.

```mermaid
flowchart TD
  s(["cellOfPoint with metres east and north"])
  a(["return east = east metres divided by 100 rounded down, north = north metres divided by 100 rounded down; rounding down, not toward zero, so -0.5 m is in square -1"])
  s --> a
```

## cellKey

Why the game needs it: one short name per square, used for file names and for keeping track of which squares are loaded.

```mermaid
flowchart TD
  s(["cellKey of a square"])
  a(["return east, an underscore, north, such as 3_-2; minus zero is written as 0"])
  s --> a
```

## cellBounds

Why the game needs it: the bake cuts at these edges and the game places the ground and the road at the south-west corner.

```mermaid
flowchart TD
  s(["cellBounds of a square"])
  a(["return west = east number times 100, south = north number times 100, east = west plus 100, north = south plus 100, all in metres"])
  s --> a
```

## distanceToCell

Why the game needs it: a square counts as near when any part of it is near the car, not only its middle, so the road ahead never pops in late.

```mermaid
flowchart TD
  s(["distanceToCell from a point to a square"])
  a["how far the point is outside the square east-west, 0 if between the edges; the same north-south"]
  b(["return the straight-line distance from those two; 0 when the point is inside"])
  s --> a --> b
```

## cellsWithin

Why the game needs it: the game loads the squares near the car, nearest first, so the road under and in front of the car arrives before the far ones.

```mermaid
flowchart TD
  s(["cellsWithin a radius of a point"])
  a["take the squares of the point's box: from cellOfPoint of point minus the radius to cellOfPoint of point plus the radius"]
  b["keep those whose distanceToCell is at most the radius"]
  c(["return them nearest first; equal distances in key order, so the order never changes between runs"])
  s --> a --> b --> c
```
