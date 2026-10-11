# tools/bake/clip.ts

Status: draft

New in scope 005 (item 2). Cuts the road pieces into the 100 m squares the
game streams (D-0008), and turns each cut piece into triangles the phone can
draw. Clipping a convex shape against the four edges of a square, one edge at
a time, is the Sutherland–Hodgman method (Sutherland and Hodgman, "Reentrant
polygon clipping", Communications of the ACM 17(1), 1974; named from our own
knowledge, not opened this session; the approver checks the citation). A
convex piece cut by a square stays convex, so a fan of triangles from its
first corner is always right. The square sums come from `src/world/grid.ts`.
The pictures drawn from the code will be in `docs/flows/tools/bake/clip.md`.

## trianglesByCell

Why the game needs it: the phone loads the map one 100 m square at a time, so every bit of road must be in the square it lies in, and nowhere else.

```mermaid
flowchart TD
  s(["trianglesByCell with every road piece, in bake order"])
  a["for each piece, find the squares it may touch with cellsUnderPiece"]
  b["for each of those squares, cut the piece with clipPieceToCell"]
  c{"is anything left inside the square"}
  d["skip: the piece's box touched the square but the piece does not"]
  e["turn what is left into triangles with fanTriangles, and add them to that square's list"]
  f(["return each square's triangles, squares keyed by their grid position; the order inside each square is the bake order, so the result is the same every time"])
  s --> a --> b --> c
  c -->|"no"| d --> b
  c -->|"yes"| e --> b
  b -->|"all squares done"| a
  a -->|"all pieces done"| f
```

## cellsUnderPiece

Why the game needs it: cutting every piece against every square would be slow for a whole town; a piece's bounding box says which few squares to try.

```mermaid
flowchart TD
  s(["cellsUnderPiece with one piece's corners"])
  a["find the smallest and largest east and north of its corners"]
  b["find the squares of the south-west and north-east of that box with cellOfPoint"]
  c(["return every square from the south-west one to the north-east one, west to east within each row, south row first"])
  s --> a --> b --> c
```

## clipPieceToCell

Why the game needs it: keeps exactly the part of a piece that lies inside one square, so neighbouring squares meet with no gap and no overlap.

```mermaid
flowchart TD
  s(["clipPieceToCell with a piece and a square"])
  a["take the square's west, south, east and north edges from cellBounds"]
  b["cut the piece by the west edge, then what is left by the south, east and north edges, each with clipAgainstEdge"]
  c{"are fewer than three corners left"}
  d(["return nothing"])
  e(["return the corners that are left, still anticlockwise"])
  s --> a --> b --> c
  c -->|"yes"| d
  c -->|"no"| e
```

## clipAgainstEdge

Why the game needs it: one step of the cut: keep what is on the inside of one straight edge of the square.

```mermaid
flowchart TD
  s(["clipAgainstEdge with corners and one edge of the square"])
  a["walk round the corners, each with the one before it"]
  b{"is this corner inside the edge"}
  c{"was the corner before it inside"}
  d["keep this corner"]
  e["keep the point where the side crosses the edge, then this corner"]
  f{"was the corner before it inside"}
  g["keep the point where the side crosses the edge"]
  h["keep nothing for this corner"]
  i(["return the corners kept, in order"])
  s --> a --> b
  b -->|"yes"| c
  c -->|"yes"| d --> a
  c -->|"no"| e --> a
  b -->|"no"| f
  f -->|"yes"| g --> a
  f -->|"no"| h --> a
  a -->|"all corners done"| i
```

## fanTriangles

Why the game needs it: the graphics card draws triangles, not shapes with many corners.

```mermaid
flowchart TD
  s(["fanTriangles with a convex shape's corners"])
  a["for each corner from the second to the one before last, make a triangle: first corner, this one, the next one"]
  b{"is the triangle's area below 1 square centimetre"}
  c["drop it: a sliver left by the cut, invisible and a cause of shading glitches"]
  d["keep it"]
  e(["return the triangles kept"])
  s --> a --> b
  b -->|"yes"| c --> a
  b -->|"no"| d --> a
  a -->|"all done"| e
```
