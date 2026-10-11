# tools/bake/bake.ts

Drawn from the code by `npm run diagrams` (TypeScript compiler, no AI). Do not edit by hand: change the code, then run it again.

## bakePlace

```mermaid
flowchart TD
  n1(["bakePlace"])
  n2["const place = validatePlace(placeFileName, placeText, plane…<br/>calls validatePlace"]
  n3{"!place.ok"}
  n4(["return { ok: false, problems: place.messages };"])
  n5["const read = readOplRoadWays(extractText);<br/>calls readOplRoadWays"]
  n6{"read.problems.length #gt; 0"}
  n7(["return { ok: false, problems: read.problems };"])
  n8["const { centre, laneWidthM, mapHalfSizeM } = place.value;"]
  n9["const drivable = drivableRoadsInMetres(read.ways, centre, l…<br/>calls drivableRoadsInMetres"]
  n10{"drivable.roads.length === 0"}
  n11(["return { ok: false, problems: [#96;${placeFileName}: the extra…"])
  n12["const extent = { westM: -mapHalfSizeM, southM: -mapHalfSize…"]
  n13["const mapEdges: Edge[] = [ { axis: #quot;eastM#quot;, atM: extent.wes…"]
  n14["const pieces = drivable.roads .flatMap((road) =#gt; roadPieces…<br/>calls roadPieces, clipAgainstEdge"]
  n15["const byCell = trianglesByCell(pieces);<br/>calls trianglesByCell"]
  n16["const start = carStartOnRoad(drivable.roads);<br/>calls carStartOnRoad"]
  n17["const chunks = [...byCell.entries()] .map(([key, triangles]…<br/>calls chunkFileText"]
  n18["const cells: Cell[] = chunks.map((file) =#gt; file.cell);"]
  n19{"buildingsText === undefined"}
  n20["emptyBuildingBake()<br/>calls emptyBuildingBake"]
  n21["bakeBuildings(placeFileName, place.value, buildingsText, ex…<br/>calls bakeBuildings"]
  n22["const buildings = buildingsText === undefined ? emptyBuildi…<br/>calls emptyBuildingBake, bakeBuildings"]
  n23{"!buildings.ok"}
  n24(["return buildings;"])
  n25(["return { ok: true, placeId: place.value.id, files: [ ...chu…<br/>calls indexFileText, streetsFileText"])
  n1 --> n2
  n2 --> n3
  n3 -->|"yes"| n4
  n3 -->|"no"| n5
  n5 --> n6
  n6 -->|"yes"| n7
  n6 -->|"no"| n8
  n8 --> n9
  n9 --> n10
  n10 -->|"yes"| n11
  n10 -->|"no"| n12
  n12 --> n13
  n13 --> n14
  n14 --> n15
  n15 --> n16
  n16 --> n17
  n17 --> n18
  n18 --> n19
  n19 -->|"yes"| n20
  n19 -->|"no"| n21
  n20 --> n22
  n21 --> n22
  n22 --> n23
  n23 -->|"yes"| n24
  n23 -->|"no"| n25
```

## emptyBuildingBake

```mermaid
flowchart TD
  n1(["emptyBuildingBake"])
  n2(["return { ok: true, files: [], cells: [], notes: [], count: …"])
  n1 --> n2
```

## bakeBuildings

```mermaid
flowchart TD
  n1(["bakeBuildings"])
  n2{"place.buildingHeights === undefined"}
  n3(["return { ok: false, problems: [#96;${placeFileName}: a buildin…"])
  n4["const read = readOplBuildings(buildingsText);<br/>calls readOplBuildings"]
  n5{"read.problems.length #gt; 0"}
  n6(["return { ok: false, problems: read.problems };"])
  n7["const grouped = buildingsByCell(read.buildings, place.centr…<br/>calls buildingsByCell"]
  n8["const squares = [...grouped.byCell.values()];"]
  n9(["return { ok: true, files: squares.map((square) =#gt; ({ name: …<br/>calls buildingFileName, buildingFileText"])
  n1 --> n2
  n2 -->|"yes"| n3
  n2 -->|"no"| n4
  n4 --> n5
  n5 -->|"yes"| n6
  n5 -->|"no"| n7
  n7 --> n8
  n8 --> n9
```

## bakeBuildings > isInsideMap

```mermaid
flowchart TD
  n1(["bakeBuildings #gt; isInsideMap"])
  n2{"point.eastM #gt;= extent.westM"}
  n3{"point.eastM #lt; extent.eastM"}
  n4{"point.northM #gt;= extent.southM"}
  n5["point.northM #lt; extent.northM"]
  n6(["return point.eastM #gt;= extent.westM && point.eastM #lt; extent.…"])
  n1 --> n2
  n2 -->|"yes"| n3
  n3 -->|"yes"| n4
  n4 -->|"yes"| n5
  n2 -->|"no"| n6
  n3 -->|"no"| n6
  n4 -->|"no"| n6
  n5 --> n6
```

## drivableRoadsInMetres

```mermaid
flowchart TD
  n1(["drivableRoadsInMetres"])
  n2["const metresFromCentre = localProjection(centre);<br/>calls localProjection"]
  n3["const roads: RoadInMetres[] = [];"]
  n4["const notes: string[] = [];"]
  n5{"for each const way of ways.toSorted((a, b) =#gt; a.id - b.id)"}
  n6{"!isDrivableRoad(way.tags)<br/>calls isDrivableRoad"}
  n7["continue"]
  n8["const width = roadWidthMetres(way.id, way.tags, laneWidthM);<br/>calls roadWidthMetres"]
  n9["roads.push({ wayId: way.id, tags: way.tags, widthM: width.w…"]
  n10["notes.push(...width.notes);"]
  n11(["return { roads, notes };"])
  n1 --> n2
  n2 --> n3
  n3 --> n4
  n4 --> n5
  n5 -->|"next item"| n6
  n6 -->|"yes"| n7
  n6 -->|"no"| n8
  n8 --> n9
  n9 --> n10
  n10 --> n5
  n7 --> n5
  n5 -->|"done"| n11
```
