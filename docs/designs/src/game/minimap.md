# src/game/minimap.ts

Status: approved by the orchestrator in one pass (Scope 005b, the owner's lighter process for non-physics work, 2026-10-11).

New in scope 005b (item 3). The small round map: north up, 300 m across (the
scope's "about 300 m"), centred on the car, with its roads from
`streets.json`, the names of the bigger roads, an arrow for the car, a ring
and an N. Drawn with the browser's 2D canvas (MDN CanvasRenderingContext2D:
`arc`, `clip`, `moveTo`, `lineTo`, `stroke`, `fillText`, `strokeText`,
`measureText`). Names are placed first come, first served, and one that would
overlap a placed name is left out: the greedy collision test web maps use
(MapLibre GL JS, `src/symbol/collision_index.ts`, BSD-3-Clause, technique
only; research/38). The view sums and the label rule are pure and tested;
drawing only follows them. The pictures drawn from the code will be in
`docs/flows/src/game/minimap.md`.

Which names: on the small map, major roads (tertiary and up) only, as the
scope asks; on the big map, every named road, since there is room. Each name
once. Look-and-feel (colours near the 3D world's, road widths 5 px major and
3 px minor, a 10 px font) is the owner's choice, proposed by the coder on
2026-10-11.

## mapView

Why the game needs it: one place says how many pixels a metre is, from the map's size on screen.

```mermaid
flowchart TD
  s(["mapView with the car's point and the map's size in pixels"])
  a(["return the centre = the car, the size, and pixels per metre = size divided by 300"])
  s --> a
```

## toScreen

Why the game needs it: north up, so the player can hold the map against a real one: metres east go right, metres north go up.

```mermaid
flowchart TD
  s(["toScreen a point with the view"])
  a(["return x = half the size plus (east less the centre's east) times pixels per metre; y = half the size less (north less the centre's north) times pixels per metre"])
  s --> a
```

## lineInView

Why the game needs it: of Omole's roads only a few dozen are near the car; the rest are skipped by their box.

```mermaid
flowchart TD
  s(["lineInView with a line's box and the view"])
  a(["return yes when the box overlaps the square of half the map's width in metres around the centre"])
  s --> a
```

## headingFromFlat

Why the game needs it: the arrow points the way the car faces; game axes are x east, z south (`src/vehicle/car.md`, `flatHeading`).

```mermaid
flowchart TD
  s(["headingFromFlat with the car's flat facing, x and z"])
  a["angle = arctangent of (x, minus z), in degrees"]
  b(["return it moved into 0 up to but not including 360"])
  s --> a --> b
```

## labelSpots

Why the game needs it: the player sees the names of the streets around him, never two on top of each other, never over his car, and never cut by the map's edge.

```mermaid
flowchart TD
  s(["labelSpots with the streets, the view, small or big, and a way to measure text"])
  a["for each street, in file order"]
  b{"no name, or minor on the small map"}
  c{"is its name placed already"}
  d["measure the name; the candidate spots from labelCandidates"]
  e["the first candidate that fits, by labelFits"]
  f{"is there one"}
  g["place it"]
  i(["return the placed names"])
  s --> a --> b
  b -->|"yes, skip"| a
  b -->|"no"| c
  c -->|"yes, skip"| a
  c -->|"no"| d --> e --> f
  f -->|"no, skip"| a
  f -->|"yes"| g --> a
  a -->|"all streets done"| i
```

## labelCandidates

Why the game needs it: a name sits on road the player can see, inside the round map, and reads best on the longest piece; when that spot is taken (by the car, or another name) the next longest is tried. A road longer than the map is cut to the circle first, so it still gets its name (found driving: Isheri Road had none).

```mermaid
flowchart TD
  s(["labelCandidates of a street in the view"])
  a["for each line whose box is in view, by lineInView: its points on screen, by toScreen"]
  b["for each segment"]
  c{"is part of it inside the circle, by segmentPartInCircle"}
  d["keep that part's length and middle"]
  e(["return the middles, longest part first; equal lengths in the street's own order"])
  s --> a --> b --> c
  c -->|"yes"| d --> b
  c -->|"no"| b
  b -->|"all done"| e
```

## segmentPartInCircle

Why the game needs it: the part of a segment inside the round map. Where the point a + t(b − a) is exactly one radius from the centre is a quadratic in t (line–circle intersection, standard geometry); the part between the two answers, kept between the segment's ends, is inside.

```mermaid
flowchart TD
  s(["segmentPartInCircle with two screen points and the radius"])
  a["the quadratic's three numbers from the segment and the circle's centre, half the side across"]
  b{"is the segment a point, or does the line miss the circle"}
  n(["return nothing"])
  c["enter and leave: the two answers, kept between 0 and 1"]
  d{"does it leave no later than it enters"}
  e(["return the part's length and its middle"])
  s --> a --> b
  b -->|"yes"| n
  b -->|"no"| c --> d
  d -->|"yes"| n
  d -->|"no"| e
```

## labelFits

Why the game needs it: a name is written only where it is whole inside the circle, clear of the car arrow and clear of every placed name.

```mermaid
flowchart TD
  s(["labelFits with the spot, the placed names and the view"])
  a{"is the box's corner farthest from the centre outside the circle"}
  n(["return no"])
  b{"is it within 14 px of the car at the centre"}
  c(["return yes when it is apart from every placed name, by labelsApart"])
  s --> a
  a -->|"yes"| n
  a -->|"no"| b
  b -->|"yes"| n
  b -->|"no"| c
```

## labelsApart

Why the game needs it: two names are apart when they are side by side or one above the other.

```mermaid
flowchart TD
  s(["labelsApart a and b"])
  a(["return yes when they are at least half their widths added apart across, or at least one line height apart up and down"])
  s --> a
```

## drawMiniMap

Why the game needs it: the whole map, drawn in one go ten times a second.

```mermaid
flowchart TD
  s(["drawMiniMap with the canvas, the streets, the view, the car's heading, small or big"])
  a["clear; fill a circle with the ground colour and keep drawing inside it"]
  b["drawRoads"]
  c["drawLabels at labelSpots, measured with the canvas's own font"]
  d["drawCarArrow at the centre"]
  e(["stop clipping; drawEdgeAndNorth"])
  s --> a --> b --> c --> d --> e
```

## drawRoads

Why the game needs it: every road twice, a grey casing then white on top, so crossings join up like on a printed map; major roads wider.

```mermaid
flowchart TD
  s(["drawRoads with the canvas, the streets and the view"])
  a["for the casing, then the white"]
  b["for each street: line width by its size, plus 2 px for the casing"]
  c["trace each of its lines in view, by lineInView and traceLine; stroke"]
  d(["return"])
  s --> a --> b --> c --> b
  b -->|"all streets"| a
  a -->|"both done"| d
```

## traceLine

Why the game needs it: one line of points becomes one path on the canvas.

```mermaid
flowchart TD
  s(["traceLine with the canvas, the points and the view"])
  a["for each point, on screen by toScreen"]
  b{"is it the first"}
  c["move to it"]
  d["draw a line to it"]
  e(["return"])
  s --> a --> b
  b -->|"yes"| c --> a
  b -->|"no"| d --> a
  a -->|"all done"| e
```

## drawLabels

Why the game needs it: a white halo under each name, so it reads over roads.

```mermaid
flowchart TD
  s(["drawLabels with the canvas and the spots"])
  a["centre the text on its spot; halo 3 px white"]
  b["for each spot: the halo, then the name"]
  c(["return"])
  s --> a --> b --> c
```

## drawCarArrow

Why the game needs it: the player sees where he is and which way he faces; the canvas turns clockwise for a positive angle, as a compass heading does.

```mermaid
flowchart TD
  s(["drawCarArrow with the canvas, the centre and the heading"])
  a["move to the centre and turn by the heading"]
  b["draw an arrowhead pointing up, outlined white, filled red"]
  c(["undo the move and the turn"])
  s --> a --> b --> c
```

## drawEdgeAndNorth

Why the game needs it: a ring shows where the map ends, and an N at the top says north is always up.

```mermaid
flowchart TD
  s(["drawEdgeAndNorth with the canvas and the centre"])
  a["a dark ring round the map"]
  b(["an N at the top middle, with a white halo"])
  s --> a --> b
```
