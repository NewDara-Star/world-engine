# tools/bake/streets.ts

Status: approved by the orchestrator in one pass (Scope 005b, the owner's lighter process for non-physics work, 2026-10-11).

New in scope 005b (item 1). Writes `places/<id>/streets.json` (format in
`src/world/streets.md`): every road a car may use, as its name when
OpenStreetMap has one, its size and its centre line, in the same projection
as the chunks. The same bytes every time for the same input: streets in name
order, lines in way-id order (the order `drivableRoadsInMetres` gives), every
number a whole decimetre. Roads are kept 150 m past the map's edge, half the
small map's 300 m, so the map near the edge shows what is there rather than a
blank (our own choice, from the scope's map size). Omole's file is 91,988
bytes (37 kB compressed). The pictures drawn from the code will be in
`docs/flows/tools/bake/streets.md`.

## streetsFileText

Why the game needs it: the game needs every road's line to draw the small map, and every name to say which street the car is on.

```mermaid
flowchart TD
  s(["streetsFileText with the drivable roads in metres, the place centre and mapHalfSizeM"])
  a["reach = mapHalfSizeM plus 150 m"]
  b["for each road, in way-id order"]
  c["name = its name tag with spaces trimmed, none if empty; size = roadSize"]
  d["lines = linesInsideSquare of reach, each turned into whole decimetres by decimetreLine, keeping those of at least two points"]
  e{"any lines left"}
  f["add the lines to the group for this name and size, making it if new"]
  g["sort the groups with compareStreets"]
  h(["return the text: format 1, the centre, then one street per line from streetLineText, ending with one newline"])
  s --> a --> b --> c --> d --> e
  e -->|"no, skip the road"| b
  e -->|"yes"| f --> b
  b -->|"all roads done"| g --> h
```

## streetLineText

Why the game needs it: one street on one line keeps the file readable and its changes small in git; a road with no name has no name key at all, rather than an empty one.

```mermaid
flowchart TD
  s(["streetLineText of one group"])
  a{"does it have a name"}
  b(["return JSON of size and lines"])
  c(["return JSON of name, size and lines, in that order"])
  s --> a
  a -->|"no"| b
  a -->|"yes"| c
```

## compareStreets

Why the game needs it: every machine bakes the same bytes, so names are compared in plain UTF-16 order, not the computer's language; the street first in the file also wins a tie in the game's street finder.

```mermaid
flowchart TD
  s(["compareStreets a and b"])
  a{"does exactly one of them have no name"}
  b(["the one with no name goes last"])
  c{"are the names different"}
  d(["order by name, plain UTF-16 order"])
  e(["major before minor"])
  s --> a
  a -->|"yes"| b
  a -->|"no"| c
  c -->|"yes"| d
  c -->|"no"| e
```

## linesInsideSquare

Why the game needs it: `osmium extract` keeps whole ways, so one trunk road can run kilometres past the place; only the part near the map is kept, and a road that leaves and comes back becomes two lines.

```mermaid
flowchart TD
  s(["linesInsideSquare with a road's points and the reach"])
  a["for each segment"]
  b{"does the segment reach the square, by segmentReachesSquare"}
  c["end the current line, if it has points; start a new empty one"]
  d["add the segment to the current line: its first point if the line is empty, then its second"]
  e(["return the lines, the last one included if it has points"])
  s --> a --> b
  b -->|"no"| c --> a
  b -->|"yes"| d --> a
  a -->|"all segments done"| e
```

## segmentReachesSquare

Why the game needs it: a long segment that crosses the map with both ends outside it must still be kept (found by the trunk road in the tiny test town).

```mermaid
flowchart TD
  s(["segmentReachesSquare with the segment's two ends and the reach"])
  a(["return yes when the segment's box overlaps the square of plus and minus reach both east-west and north-south"])
  s --> a
```

## decimetreLine

Why the game needs it: decimetres are plenty for a name within 15 m and a map at 2 m a pixel, and keep the file small.

```mermaid
flowchart TD
  s(["decimetreLine of points in metres"])
  a["for each point: east and north rounded to whole decimetres, minus zero written as 0"]
  b{"is it the same as the point before"}
  c["leave it out"]
  d["add east, north"]
  e(["return the numbers"])
  s --> a --> b
  b -->|"yes"| c --> a
  b -->|"no"| d --> a
  a -->|"all points done"| e
```
