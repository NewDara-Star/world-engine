# tools/bake/bake.ts

Status: approved by the orchestrator in one pass (Scope 006, lighter process, 2026-10-11).

New in scope 005 (item 2). The whole bake, from the place file and the
extract's text to the text of every output file, without touching the disk,
so tests can run it on a small made-up extract and compare bytes. The
pictures drawn from the code will be in `docs/flows/tools/bake/bake.md`.

## bakePlace

Why the game needs it: the map the player drives on is made from open map data in one repeatable step, and anything wrong with the input is reported, not baked into a broken map. The map's size comes from the place file's `mapHalfSizeM`, not from the extract: `osmium extract` keeps every node of a way that crosses its box (its default `complete_ways`), so one trunk road could stretch the map, its ground and its edge walls kilometres past the place (approver's F20). A way with fewer than two nodes is skipped with a note, not a problem (F19).

```mermaid
flowchart TD
  s(["bakePlace with the place file's name and text, the checked planets, the extract's text, and the buildings extract's text if there is one (scope 006)"])
  a["check the place with validatePlace"]
  b{"is the place file good"}
  c(["return the place file's problems; nothing is baked"])
  d["read the extract with readOplRoadWays; its notes (ways skipped for fewer than two nodes) go into the report notes"]
  e{"were there broken lines"}
  f(["return those problems with their line numbers; nothing is baked, because a missing road would look like a real gap"])
  g["turn the ways into roads with drivableRoadsInMetres"]
  h{"is at least one road left"}
  i(["return one problem: the extract has no roads a car can use; check the extract covers the place centre and was cut with the highway ways"])
  j["cut the roads into squares: roadPieces for each, clipped to the square of plus and minus mapHalfSizeM around the centre, then trianglesByCell"]
  k["find the start with carStartOnRoad; the extent is that square, rounded out to whole 100 m squares"]
  m["the buildings: bakeBuildings when a buildings extract was given, otherwise none"]
  n{"problems with the buildings"}
  o(["return those problems; nothing is baked"])
  l(["return the files: one chunkFileText per square named east_north.json, the buildings files, and index.json from indexFileText with the squares that have road and those that have buildings; the street file's text from streetsFileText of the same roads, centre and mapHalfSizeM (Scope 005b); the report notes, and how many roads and buildings"])
  s --> a --> b
  b -->|"no"| c
  b -->|"yes"| d --> e
  e -->|"yes"| f
  e -->|"no"| g --> h
  h -->|"no"| i
  h -->|"yes"| j --> k --> m --> n
  n -->|"yes"| o
  n -->|"no"| l
```

## drivableRoadsInMetres

Why the game needs it: from every way in the extract to just the streets, each with its width and its line in metres, in way-id order so the output never depends on the order of the file.

```mermaid
flowchart TD
  s(["drivableRoadsInMetres with the ways, the place centre and lane width"])
  a["make metresFromCentre with localProjection for the centre"]
  b["sort the ways by id"]
  c["for each way"]
  d{"is it a drivable road, by isDrivableRoad"}
  e["skip it"]
  f["width and any note from roadWidthMetres; points from metresFromCentre for each node"]
  g["keep the road: way id, its tags, width, points; keep the note for the report"]
  h(["return the roads and the report notes"])
  s --> a --> b --> c --> d
  d -->|"no"| e --> c
  d -->|"yes"| f --> g --> c
  c -->|"all ways done"| h
```

## emptyBuildingBake

Why the game needs it: a map baked without a buildings extract has roads only, and an index that says so.

```mermaid
flowchart TD
  s(["emptyBuildingBake"])
  a(["return no files, no squares, no notes and a count of 0"])
  s --> a
```

## bakeBuildings

Why the game needs it (scope 006): one buildings file per square that has buildings, for the game to load with the square; a building counts as on the map when its first corner is inside the same square the roads are clipped to.

```mermaid
flowchart TD
  s(["bakeBuildings with the place file's name, the checked place, the buildings extract's text and the map's extent"])
  a{"does the place file have buildingHeights"}
  b(["return one problem: add buildingHeights to the place file, or bake without --buildings"])
  c["read the extract with readOplBuildings"]
  d{"broken lines"}
  e(["return those problems with their line numbers"])
  f["group the buildings by square with buildingsByCell, using isInsideMap"]
  g(["return one file per square, buildingFileName and buildingFileText; the squares; the notes; and how many buildings"])
  s --> a
  a -->|"no"| b
  a -->|"yes"| c --> d
  d -->|"yes"| e
  d -->|"no"| f --> g
```

## bakeBuildings > isInsideMap

```mermaid
flowchart TD
  s(["isInsideMap with a point"])
  a(["return yes when it is at or east of the west edge and west of the east edge, and at or north of the south edge and south of the north edge"])
  s --> a
```
