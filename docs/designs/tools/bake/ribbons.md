# tools/bake/ribbons.ts

Status: approved. Judged by the delegated approver (docs/reviews/slice-1-approver.md); its fixes F1 to F24 and the orchestrator's decisions on E1 to E3 applied in one pass.

New in scope 005 (item 2). Turns one road (its line in metres and its width)
into flat convex pieces of grey road: a rectangle along each segment and an
octagon at each node. Overlaps are invisible because every road is the same
grey and is drawn without depth (research/36 section 2, items 3 and 4). Our
own simplification; osm2streets' junction polygons (Apache-2.0,
`geometry/general_case.rs`) are the later replacement. The pictures drawn from
the code will be in `docs/flows/tools/bake/ribbons.md`.

Every piece is a list of corners in metres (east, north), going round
anticlockwise seen from above, so the clipping and triangles that follow all
face up.

## roadPieces

Why the game needs it: a road on the map is a line; in the game it is a strip as wide as the real street, with no gaps at bends, ends or junctions.

```mermaid
flowchart TD
  s(["roadPieces with the road's points in metres and its width"])
  a["half width = width over 2"]
  b["for each pair of neighbouring points, add segmentRectangle"]
  c["for each point, add nodeOctagon"]
  d(["return the pieces, rectangles first then octagons, in the road's own order"])
  s --> a --> b --> c --> d
```

## segmentRectangle

Why the game needs it: the straight part of a road between two map points.

```mermaid
flowchart TD
  s(["segmentRectangle from point A to point B, half width h"])
  a{"are A and B the same point, or closer than 1 cm"}
  b(["return no piece: a zero-length segment has no direction; the octagon at that point already covers it"])
  c["the direction along the road from A to B, made length 1; the side direction is it turned a quarter left"]
  d(["return four corners: A right, B right, B left, A left, each h from the line, anticlockwise"])
  s --> a
  a -->|"yes"| b
  a -->|"no"| c --> d
```

## nodeOctagon

Why the game needs it: fills the wedge on the outside of every bend, rounds dead ends, and fills junctions where roads meet, without any junction maths.

```mermaid
flowchart TD
  s(["nodeOctagon around a point, half width h"])
  a["corner distance = h divided by the cosine of 22.5 degrees, so the octagon's flat sides sit exactly h from the point and fully cover the rectangle ends"]
  b(["return eight corners, starting due east and going anticlockwise in steps of 45 degrees"])
  s --> a --> b
```
