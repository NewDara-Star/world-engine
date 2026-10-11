# tools/bake/chunk-text.ts

Status: draft

New in scope 005 (item 2). Writes the chunk files and the index as text, the
same bytes every time for the same input (the scope's determinism rule, and
the reason the published ODbL data can be checked by anyone who re-runs the
bake). The file formats are checked on the game side by `src/world/chunk.ts`,
whose design states them. The pictures drawn from the code will be in
`docs/flows/tools/bake/chunk-text.md`.

How the same bytes are guaranteed: no dates, no machine names, no random
order; every list is written in an order fixed by the input (way ids, node
order, square position); every number in a chunk is a whole number of
centimetres; JSON keys are written in one fixed order; one newline at the end.

## chunkFileText

Why the game needs it: one small file per 100 m square, with numbers small enough to be precise on any phone and short enough to download fast.

```mermaid
flowchart TD
  s(["chunkFileText with a square and its triangles in metres"])
  a["take the square's south-west corner from cellBounds"]
  b["for each triangle corner: centimetres east and north of that corner, rounded to whole numbers"]
  c["give each different corner one number with cornerIndexFor, so a corner shared by triangles is written once"]
  d{"is any triangle now flat, two of its corners the same after rounding"}
  e["leave that triangle out"]
  f(["return the JSON text: format 1, the square's east and north grid numbers, the corner list as east,north pairs, the triangle list as three corner numbers each"])
  s --> a --> b --> c --> d
  d -->|"yes"| e --> f
  d -->|"no"| f
```

## chunkFileText > cornerIndexFor

Why the game needs it: sharing corners makes the files about half the size.

```mermaid
flowchart TD
  s(["cornerIndexFor a corner in whole centimetres"])
  a{"has this exact corner been seen in this square already"}
  b(["return its number"])
  c["add it to the end of the corner list; its number is its place in the list"]
  d(["return the new number"])
  s --> a
  a -->|"yes"| b
  a -->|"no"| c --> d
```

## indexFileText

Why the game needs it: the game must know which squares have road (so it never asks for a file that does not exist), what centre and square size the map was baked for (so an old bake is caught, not drawn in the wrong place), how far the map goes, and where the car starts.

```mermaid
flowchart TD
  s(["indexFileText with the squares that have road, the place centre, the map's extent and the car's start"])
  a["sort the squares: south row first, then west to east"]
  b(["return the JSON text: format 1, the square size 100, the centre's latitude and longitude as written in the place file, the extent as west, south, east, north metres rounded out to whole squares, the start as metres east, metres north and compass heading in whole degrees, and the list of squares"])
  s --> a --> b
```
