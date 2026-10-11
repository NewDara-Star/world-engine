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
  n19(["return { ok: true, placeId: place.value.id, files: [...chun…<br/>calls indexFileText"])
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
