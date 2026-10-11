# tools/bake/buildings.ts

Status: approved by the orchestrator in one pass (Scope 006, lighter process, 2026-10-11).

New in scope 006 (item 1). Every OpenStreetMap building in the buildings
extract becomes a flat-roofed block on its real footprint, written into the
100 m square that holds the middle of its footprint, so a building across a
square's edge is drawn once. The extract is read in the same OPL format as
the roads (`opl.ts`, libosmium's format, technique only); a multipolygon
relation (OSM wiki, Relation:multipolygon) gives an outline and its holes.
Roofs are cut into triangles by earcut (mapbox/earcut, ISC), as bundled in
three.js 0.186.1 and reached through `ShapeUtils.triangulateShape` (MIT).
Heights follow the OSM wiki's Key:height and Key:building:levels, then the
place file's `buildingHeights` (owner-choice). Our own sanity limits: at most
300 m tall, 100 levels, and corners at most 200 m outside their square.
The pictures drawn from the code will be in `docs/flows/tools/bake/buildings.md`.

**What it does not do yet** (parked): rings made of several ways joined end
to end are skipped with a note; `building=roof` (an open canopy) is drawn as
a solid block.

## isBuilding

Why the game needs it: OSM says "not a building" with building=no, so only a building tag with another value is drawn.

```mermaid
flowchart TD
  s(["isBuilding with an object's tags"])
  a(["return yes when there is a building tag and it is not no"])
  s --> a
```

## readOplBuildings

Why the game needs it: every building in the extract is found once, in an order that never depends on the order of the file, so the bake gives the same bytes every time.

```mermaid
flowchart TD
  s(["readOplBuildings with the extract's text"])
  a["read every way and relation with readOplWaysAndRelations"]
  b["turn them into building outlines with buildingOutlines"]
  c(["return the outlines, the broken lines as problems, and the notes"])
  s --> a --> b --> c
```

## readOplWaysAndRelations

Why the game needs it: a relation's rings are untagged ways, so every way is kept by its id, tagged or not.

```mermaid
flowchart TD
  s(["readOplWaysAndRelations with the text"])
  a["split the text into lines, Windows or Unix line ends"]
  b["for each line, addOplLine with its line number"]
  c(["return the ways by id, the relations, and the problems"])
  s --> a --> b --> c
```

## addOplLine

Why the game needs it: a broken line is reported with its number instead of quietly leaving a building out.

```mermaid
flowchart TD
  s(["addOplLine with what has been read, a line and its number"])
  a{"does it start with w"}
  b["read it with parseWayLine; keep a good way by its id, keep a problem"]
  c{"does it start with r"}
  d["read it with parseRelationLine; keep a good relation, keep a problem"]
  e(["return; any other line, such as a node, is skipped"])
  s --> a
  a -->|"yes"| b --> c
  a -->|"no"| c
  c -->|"yes"| d --> e
  c -->|"no"| e
```

## buildingOutlines

Why the game needs it: a way that is a ring of a building relation would otherwise be drawn twice, once alone and once in its relation.

```mermaid
flowchart TD
  s(["buildingOutlines with the ways by id and the relations"])
  a["building relations: relations in id order that are buildings and multipolygons"]
  b["ring ways: every way named as a member of those relations"]
  c["building ways: ways in id order that are buildings and not ring ways"]
  d["for each building way: if isClosed, keep it as an outline with no holes; otherwise note that it does not close"]
  e["for each building relation: relationOutlines; keep its outlines, or its note"]
  f(["return the outlines, ways first, and the notes"])
  s --> a --> b --> c --> d --> e --> f
```

## buildingOutlines > inner function 1

Keeps a relation that is a building and a multipolygon.

```mermaid
flowchart TD
  s(["a relation"])
  a(["return yes when isBuilding of its tags and its type is multipolygon"])
  s --> a
```

## buildingOutlines > inner function 2

Keeps a way that is a building and not already a ring of a building relation.

```mermaid
flowchart TD
  s(["a way"])
  a(["return yes when isBuilding of its tags and its id is not a ring way"])
  s --> a
```

## parseRelationLine

Why the game needs it: courtyard buildings are mapped as relations, and their tags and rings are on the relation's line.

```mermaid
flowchart TD
  s(["parseRelationLine with a line and its number"])
  a{"does it start with r and a whole number"}
  b(["return a problem naming the line"])
  c["read the T field's tags with parseTags"]
  d{"a broken escape"}
  e(["return the problem with the line number"])
  f["split the M field into members: a type letter, an id, @ and a role"]
  g{"is any member written some other way"}
  h(["return a problem naming the line"])
  i(["return the relation's id, its tags and its members"])
  s --> a
  a -->|"no"| b
  a -->|"yes"| c --> d
  d -->|"yes"| e
  d -->|"no"| f --> g
  g -->|"yes"| h
  g -->|"no"| i
```

## parseRelationLine > inner function 1

Turns one member's match into its type, id and role.

```mermaid
flowchart TD
  s(["one member as matched"])
  a(["return its type letter, its id as a number, and its role, each empty if missing"])
  s --> a
```

## isClosed

Why the game needs it: only a ring that ends where it starts has an inside to stand a building on.

```mermaid
flowchart TD
  s(["isClosed with a way's nodes"])
  a(["return yes when there are at least four nodes and the last is the first"])
  s --> a
```

## relationOutlines

Why the game needs it: each outer ring of a building relation is a building, and each hole belongs to the outer ring it lies in.

```mermaid
flowchart TD
  s(["relationOutlines with a relation and the ways by id"])
  a["find each member's way"]
  b{"is any member's way missing from the extract, or not closed"}
  c(["return a note: the relation was skipped"])
  d["outer rings: members whose role is not inner; holes: members whose role is inner"]
  e(["return one outline per outer ring, with the relation's tags and the holes whose first corner pointInRing finds inside it"])
  s --> a --> b
  b -->|"yes"| c
  b -->|"no"| d --> e
```

## relationOutlines > inner function 1

Finds a ring that cannot be used.

```mermaid
flowchart TD
  s(["one member's ring"])
  a(["return yes when its way is missing, or not isClosed"])
  s --> a
```

## pointInRing

Why the game needs it: says which outer ring a hole belongs to. Even-odd ray casting (W. Randolph Franklin's PNPOLY test), in degrees, which is fine for rings a few metres apart.

```mermaid
flowchart TD
  s(["pointInRing with a point and a ring"])
  a["for each side of the ring: does a line going east from the point cross it? If so, flip inside"]
  b(["return inside"])
  s --> a --> b
```

## buildingHeightM

Why the game needs it: a tall building tagged by a mapper stands tall; everything else stands at the place's own height for its type, never a silent guess.

```mermaid
flowchart TD
  s(["buildingHeightM with the building's name, its tags and the place's buildingHeights"])
  a["read the height tag with heightFromTag"]
  b{"a number"}
  c(["return that height"])
  d["if it was there but unreadable, note it"]
  e["read the building:levels tag with levelsFromTag"]
  f{"a number"}
  g(["return levels times the place's metres per level"])
  h["if it was there but unreadable, note it"]
  i(["return the place's height for the building's type, or else its default, with the notes"])
  s --> a --> b
  b -->|"yes"| c
  b -->|"no"| d --> e --> f
  f -->|"yes"| g
  f -->|"no"| h --> i
```

## heightFromTag

Why the game needs it: only metres are safe to use without guessing; feet and words are not guessed at.

```mermaid
flowchart TD
  s(["heightFromTag with the height tag's text"])
  a{"no tag"}
  b(["return nothing"])
  c["trim it and take off a trailing m"]
  d{"a plain number above 0 and at most 300"}
  e(["return it in metres"])
  f(["return unreadable"])
  s --> a
  a -->|"yes"| b
  a -->|"no"| c --> d
  d -->|"yes"| e
  d -->|"no"| f
```

## levelsFromTag

Why the game needs it: a storey count is used only when it is a whole number from 1 to 100.

```mermaid
flowchart TD
  s(["levelsFromTag with the building:levels tag's text"])
  a{"no tag"}
  b(["return nothing"])
  c{"a whole number from 1 to 100"}
  d(["return it"])
  e(["return unreadable"])
  s --> a
  a -->|"yes"| b
  a -->|"no"| c
  c -->|"yes"| d
  c -->|"no"| e
```

## ringInCentimetres

Why the game needs it: every baked number is a whole centimetre from the square's south-west corner, like the roads, so the files are small and the same every time.

```mermaid
flowchart TD
  s(["ringInCentimetres with a ring's nodes, the projection and the square's south-west corner"])
  a["for each node but the closing one: metres from the centre, then whole centimetres from the square's corner"]
  b["leave out a corner that rounds onto the one before it"]
  c["if the last corner rounds onto the first, leave it out"]
  d(["return the corners as east, north, east, north…"])
  s --> a --> b --> c --> d
```

## twiceSignedArea

Why the game needs it: says which way round a ring goes (the shoelace formula), so outlines can be turned anticlockwise and holes clockwise.

```mermaid
flowchart TD
  s(["twiceSignedArea with a ring's corners"])
  a["add up east times the next north, less the next east times north, round the ring"]
  b(["return the sum: positive when anticlockwise"])
  s --> a --> b
```

## reversedRing

Why the game needs it: turns a ring round without splitting any corner's east from its north.

```mermaid
flowchart TD
  s(["reversedRing with a ring"])
  a(["return the corners last to first, each still east then north"])
  s --> a
```

## roofTriangles

Why the game needs it: a flat roof over any footprint, with a courtyard left open, cut into triangles the phone can draw.

```mermaid
flowchart TD
  s(["roofTriangles with the outline and its holes, in centimetres"])
  a["cut them into triangles with ShapeUtils.triangulateShape (earcut); corners count the outline first, then each hole"]
  b["for each triangle: anticlockwise, keep it; clockwise, turn it round; no area, leave it out"]
  c(["return the triangles' corner numbers"])
  s --> a --> b --> c
```

## cellForOutline

Why the game needs it: one square per building, so a building across a square's edge is drawn once.

```mermaid
flowchart TD
  s(["cellForOutline with the outline in metres"])
  a(["return the square, by cellOfPoint, of the middle of the outline's box"])
  s --> a
```

## ringsFitTheirSquare

Why the game needs it: the game's checker refuses corners more than 200 m outside a square, so the bake never writes one.

```mermaid
flowchart TD
  s(["ringsFitTheirSquare with the rings in centimetres"])
  a(["return yes when every number is from −200 m to 300 m from the square's south-west corner"])
  s --> a
```

## ringsFitTheirSquare > inner function 1

```mermaid
flowchart TD
  s(["one ring"])
  a(["return yes when every number in it is within reach"])
  s --> a
```

## bakeBuilding

Why the game needs it: one building, from OSM nodes to the block in its square's file, or a note saying plainly why it was left out.

```mermaid
flowchart TD
  s(["bakeBuilding with an outline, the projection and the place's buildingHeights"])
  a["its square: cellForOutline of the outline in metres"]
  b["the outline with ringInCentimetres from that square's south-west corner"]
  c{"fewer than three corners, or no area"}
  d(["return a note: no area once rounded"])
  e["the holes the same way, leaving out any with fewer than three corners or no area"]
  f["turn the outline anticlockwise and each hole clockwise with twiceSignedArea and reversedRing"]
  g{"ringsFitTheirSquare"}
  h(["return a note: it reaches too far outside its square"])
  i["its height with buildingHeightM, in whole centimetres; its shade from its OSM id, 0 to 3"]
  j(["return the square and the building: height, shade, rings, roofTriangles; with the height notes"])
  s --> a --> b --> c
  c -->|"yes"| d
  c -->|"no"| e --> f --> g
  g -->|"no"| h
  g -->|"yes"| i --> j
```

## bakeBuilding > inner function 1

Keeps a hole with an inside.

```mermaid
flowchart TD
  s(["one hole"])
  a(["return yes when it has at least three corners and some area"])
  s --> a
```

## bakeBuilding > inner function 2

Turns a hole clockwise.

```mermaid
flowchart TD
  s(["one hole"])
  a{"already clockwise"}
  b(["return it"])
  c(["return it reversed"])
  s --> a
  a -->|"yes"| b
  a -->|"no"| c
```

## buildingsByCell

Why the game needs it: each square's buildings together, in bake order, for one file per square.

```mermaid
flowchart TD
  s(["buildingsByCell with the outlines, the place centre, its buildingHeights and the map's edge"])
  a["for each outline: is its first corner inside the map? If not, skip it"]
  b["bakeBuilding; a note means it is left out, and the note is kept"]
  c["add the building to its square's list, keeping the order squares were first seen"]
  d(["return the squares with their buildings, and the notes"])
  s --> a --> b --> c --> d
```

## buildingFileText

Why the game needs it: the same bytes every time for the same input: keys in one order, whole numbers only, one newline at the end.

```mermaid
flowchart TD
  s(["buildingFileText with a square and its buildings"])
  a(["return format 1, the square, and each building's heightCm, shade, rings and roof, as JSON with one newline"])
  s --> a
```

## buildingFileName

Why the game needs it: a square's buildings file sits beside its road file and is found by the same name.

```mermaid
flowchart TD
  s(["buildingFileName with a square"])
  a(["return buildings_, the square's cellKey, .json"])
  s --> a
```
