# tools/bake/buildings.ts

Drawn from the code by `npm run diagrams` (TypeScript compiler, no AI). Do not edit by hand: change the code, then run it again.

## isBuilding

```mermaid
flowchart TD
  n1(["isBuilding"])
  n2["const building = tags[#quot;building#quot;];"]
  n3{"building !== undefined"}
  n4["building !== #quot;no#quot;"]
  n5(["return building !== undefined && building !== #quot;no#quot;;"])
  n1 --> n2
  n2 --> n3
  n3 -->|"yes"| n4
  n3 -->|"no"| n5
  n4 --> n5
```

## readOplBuildings

```mermaid
flowchart TD
  n1(["readOplBuildings"])
  n2["const read = readOplWaysAndRelations(text);<br/>calls readOplWaysAndRelations"]
  n3["const outlines = buildingOutlines(read.ways, read.relations…<br/>calls buildingOutlines"]
  n4(["return { buildings: outlines.buildings, problems: read.prob…"])
  n1 --> n2
  n2 --> n3
  n3 --> n4
```

## readOplWaysAndRelations

```mermaid
flowchart TD
  n1(["readOplWaysAndRelations"])
  n2["const read: OplObjects = { ways: new Map#lt;number, OsmWay#gt;(),…"]
  n3["const lines = text.split(/\r?\n/);"]
  n4["let at = 0"]
  n5{"at #lt; lines.length"}
  n6["addOplLine(read, lines[at] as string, at + 1);<br/>calls addOplLine"]
  n7["at += 1"]
  n8(["return read;"])
  n1 --> n2
  n2 --> n3
  n3 --> n4
  n4 --> n5
  n5 -->|"yes"| n6
  n6 --> n7
  n7 --> n5
  n5 -->|"no"| n8
```

## addOplLine

```mermaid
flowchart TD
  n1(["addOplLine"])
  n2{"line.startsWith(#quot;w#quot;)"}
  n3["const way = parseWayLine(line, lineNumber);<br/>calls parseWayLine"]
  n4{"way.kind === #quot;problem#quot;"}
  n5["read.problems.push(way.problem);"]
  n6{"way.kind === #quot;way#quot;"}
  n7["read.ways.set(way.way.id, way.way);"]
  n8{"line.startsWith(#quot;r#quot;)"}
  n9["const relation = parseRelationLine(line, lineNumber);<br/>calls parseRelationLine"]
  n10{"typeof relation === #quot;string#quot;"}
  n11["read.problems.push(relation);"]
  n12["read.relations.push(relation);"]
  n13(["end"])
  n1 --> n2
  n2 -->|"yes"| n3
  n3 --> n4
  n4 -->|"yes"| n5
  n5 --> n6
  n4 -->|"no"| n6
  n6 -->|"yes"| n7
  n7 --> n8
  n6 -->|"no"| n8
  n2 -->|"no"| n8
  n8 -->|"yes"| n9
  n9 --> n10
  n10 -->|"yes"| n11
  n10 -->|"no"| n12
  n11 --> n13
  n12 --> n13
  n8 -->|"no"| n13
```

## buildingOutlines

```mermaid
flowchart TD
  n1(["buildingOutlines"])
  n2["const fromRelations = relations.toSorted((a, b) =#gt; a.id - b…"]
  n3["const ringWayIds = new Set(fromRelations.flatMap((relation)…"]
  n4["const fromWays = [...ways.values()].toSorted((a, b) =#gt; a.id…"]
  n5["const buildings: BuildingOutline[] = [];"]
  n6["const notes: string[] = [];"]
  n7{"for each const way of fromWays"}
  n8{"isClosed(way.nodes)<br/>calls isClosed"}
  n9["buildings.push({ source: #96;w${way.id}#96;, sourceId: way.id, ta…"]
  n10["notes.push(#96;building way ${way.id} does not close on itself…"]
  n11{"for each const relation of fromRelations"}
  n12["const outlines = relationOutlines(relation, ways);<br/>calls relationOutlines"]
  n13{"typeof outlines === #quot;string#quot;"}
  n14["notes.push(outlines);"]
  n15["buildings.push(...outlines);"]
  n16(["return { buildings, notes };"])
  n1 --> n2
  n2 --> n3
  n3 --> n4
  n4 --> n5
  n5 --> n6
  n6 --> n7
  n7 -->|"next item"| n8
  n8 -->|"yes"| n9
  n8 -->|"no"| n10
  n9 --> n7
  n10 --> n7
  n7 -->|"done"| n11
  n11 -->|"next item"| n12
  n12 --> n13
  n13 -->|"yes"| n14
  n13 -->|"no"| n15
  n14 --> n11
  n15 --> n11
  n11 -->|"done"| n16
```

## buildingOutlines > inner function 1

```mermaid
flowchart TD
  n1(["buildingOutlines #gt; inner function 1"])
  n2{"isBuilding(relation.tags)<br/>calls isBuilding"}
  n3["relation.tags[#quot;type#quot;] === #quot;multipolygon#quot;"]
  n4(["return isBuilding(relation.tags) && relation.tags[#quot;type#quot;] === #quot;mul"])
  n1 --> n2
  n2 -->|"yes"| n3
  n2 -->|"no"| n4
  n3 --> n4
```

## buildingOutlines > inner function 2

```mermaid
flowchart TD
  n1(["buildingOutlines #gt; inner function 2"])
  n2{"isBuilding(way.tags)<br/>calls isBuilding"}
  n3["!ringWayIds.has(way.id)"]
  n4(["return isBuilding(way.tags) && !ringWayIds.has(way.id)"])
  n1 --> n2
  n2 -->|"yes"| n3
  n2 -->|"no"| n4
  n3 --> n4
```

## parseRelationLine

```mermaid
flowchart TD
  n1(["parseRelationLine"])
  n2["const fields = line.split(#quot; #quot;);"]
  n3{"fields[0] is missing?"}
  n4["#quot;#quot;"]
  n5["const id = RELATION_ID.exec(fields[0] ?? #quot;#quot;);"]
  n6{"id === null"}
  n7(["return #96;line ${lineNumber}: does not start with a relation …"])
  n8{"fields.find((field) =#gt; field.startsWith(#quot;T#quot;)) is missing?"}
  n9["#quot;T#quot;"]
  n10["const tags = parseTags((fields.find((field) =#gt; field.starts…<br/>calls parseTags"]
  n11{"typeof tags === #quot;string#quot;"}
  n12(["return #96;line ${lineNumber}: ${tags}#96;;"])
  n13{"fields.find((field) =#gt; field.startsWith(#quot;M#quot;)) is missing?"}
  n14["#quot;M#quot;"]
  n15["const membersText = (fields.find((field) =#gt; field.startsWit…"]
  n16{"membersText === #quot;#quot;"}
  n17["[]"]
  n18["membersText.split(#quot;,#quot;).map((member) =#gt; MEMBER.exec(member))"]
  n19["const members = membersText === #quot;#quot; ? [] : membersText.split…"]
  n20{"members.some((member) =#gt; member === null)"}
  n21(["return #96;line ${lineNumber}: a relation member is not writte…"])
  n22(["return { id: Number(id[1]), tags, members: members.map((mem…"])
  n1 --> n2
  n2 --> n3
  n3 -->|"yes"| n4
  n3 -->|"no"| n5
  n4 --> n5
  n5 --> n6
  n6 -->|"yes"| n7
  n6 -->|"no"| n8
  n8 -->|"yes"| n9
  n8 -->|"no"| n10
  n9 --> n10
  n10 --> n11
  n11 -->|"yes"| n12
  n11 -->|"no"| n13
  n13 -->|"yes"| n14
  n13 -->|"no"| n15
  n14 --> n15
  n15 --> n16
  n16 -->|"yes"| n17
  n16 -->|"no"| n18
  n17 --> n19
  n18 --> n19
  n19 --> n20
  n20 -->|"yes"| n21
  n20 -->|"no"| n22
```

## parseRelationLine > inner function 1

```mermaid
flowchart TD
  n1(["parseRelationLine #gt; inner function 1"])
  n2{"member?.[1] is missing?"}
  n3["#quot;#quot;"]
  n4{"member?.[3] is missing?"}
  n5["#quot;#quot;"]
  n6(["return ({ kind: member?.[1] ?? #quot;#quot;, id: Number(member?.[2]), role: "])
  n1 --> n2
  n2 -->|"yes"| n3
  n2 -->|"no"| n4
  n3 --> n4
  n4 -->|"yes"| n5
  n4 -->|"no"| n6
  n5 --> n6
```

## isClosed

```mermaid
flowchart TD
  n1(["isClosed"])
  n2{"nodes.length #gt;= 4"}
  n3["nodes[0]?.id === nodes[nodes.length - 1]?.id"]
  n4(["return nodes.length #gt;= 4 && nodes[0]?.id === nodes[nodes.le…"])
  n1 --> n2
  n2 -->|"yes"| n3
  n2 -->|"no"| n4
  n3 --> n4
```

## relationOutlines

```mermaid
flowchart TD
  n1(["relationOutlines"])
  n2["const rings = relation.members.map((member) =#gt; ({ role: mem…"]
  n3{"rings.some((ring) =#gt; ring.nodes === undefined || !isClosed(…"}
  n4(["return #96;building relation ${relation.id} has a ring that is…"])
  n5["const outers = rings.filter((ring) =#gt; ring.role !== #quot;inner#quot;…"]
  n6["const inners = rings.filter((ring) =#gt; ring.role === #quot;inner#quot;…"]
  n7(["return outers.map((outer) =#gt; ({ source: #96;r${relation.id}#96;, …<br/>calls pointInRing"])
  n1 --> n2
  n2 --> n3
  n3 -->|"yes"| n4
  n3 -->|"no"| n5
  n5 --> n6
  n6 --> n7
```

## relationOutlines > inner function 1

```mermaid
flowchart TD
  n1(["relationOutlines #gt; inner function 1"])
  n2{"ring.nodes === undefined"}
  n3["!isClosed(ring.nodes)<br/>calls isClosed"]
  n4(["return ring.nodes === undefined || !isClosed(ring.nodes)"])
  n1 --> n2
  n2 -->|"no"| n3
  n2 -->|"yes"| n4
  n3 --> n4
```

## pointInRing

```mermaid
flowchart TD
  n1(["pointInRing"])
  n2["let inside = false;"]
  n3["let at = 0, before = ring.length - 1"]
  n4{"at #lt; ring.length"}
  n5["const a = ring[at] as WayNode;"]
  n6["const b = ring[before] as WayNode;"]
  n7{"a.lat #gt; point.lat !== b.lat #gt; point.lat"}
  n8["point.lon #lt; ((b.lon - a.lon) * (point.lat - a.lat)) / (b.la…"]
  n9["const crosses = a.lat #gt; point.lat !== b.lat #gt; point.lat && …"]
  n10{"crosses"}
  n11["inside = !inside;"]
  n12["before = at, at += 1"]
  n13(["return inside;"])
  n1 --> n2
  n2 --> n3
  n3 --> n4
  n4 -->|"yes"| n5
  n5 --> n6
  n6 --> n7
  n7 -->|"yes"| n8
  n7 -->|"no"| n9
  n8 --> n9
  n9 --> n10
  n10 -->|"yes"| n11
  n11 --> n12
  n10 -->|"no"| n12
  n12 --> n4
  n4 -->|"no"| n13
```

## buildingHeightM

```mermaid
flowchart TD
  n1(["buildingHeightM"])
  n2["const notes: string[] = [];"]
  n3["const height = heightFromTag(tags[#quot;height#quot;]);<br/>calls heightFromTag"]
  n4{"typeof height === #quot;number#quot;"}
  n5(["return { heightM: height, notes };"])
  n6{"height === #quot;unreadable#quot;"}
  n7["notes.push(#96;building ${source} has a height we could not re…"]
  n8["const levels = levelsFromTag(tags[#quot;building:levels#quot;]);<br/>calls levelsFromTag"]
  n9{"typeof levels === #quot;number#quot;"}
  n10(["return { heightM: levels * heights.metresPerLevel, notes };"])
  n11{"levels === #quot;unreadable#quot;"}
  n12["notes.push(#96;building ${source} has levels we could not read…"]
  n13["const byType = heights.byType.find((entry) =#gt; entry.type ==…"]
  n14{"byType?.heightM is missing?"}
  n15["heights.defaultM"]
  n16(["return { heightM: byType?.heightM ?? heights.defaultM, note…"])
  n1 --> n2
  n2 --> n3
  n3 --> n4
  n4 -->|"yes"| n5
  n4 -->|"no"| n6
  n6 -->|"yes"| n7
  n7 --> n8
  n6 -->|"no"| n8
  n8 --> n9
  n9 -->|"yes"| n10
  n9 -->|"no"| n11
  n11 -->|"yes"| n12
  n12 --> n13
  n11 -->|"no"| n13
  n13 --> n14
  n14 -->|"yes"| n15
  n14 -->|"no"| n16
  n15 --> n16
```

## heightFromTag

```mermaid
flowchart TD
  n1(["heightFromTag"])
  n2{"text === undefined"}
  n3(["return undefined;"])
  n4["const number = text.trim().replace(TRAILING_METRES, #quot;#quot;);"]
  n5["const metres = Number(number);"]
  n6{"PLAIN_NUMBER.test(number)"}
  n7{"metres #gt; 0"}
  n8{"metres #lt;= TALLEST_M"}
  n9(["return metres;"])
  n10(["return #quot;unreadable#quot;;"])
  n1 --> n2
  n2 -->|"yes"| n3
  n2 -->|"no"| n4
  n4 --> n5
  n5 --> n6
  n6 -->|"yes"| n7
  n7 -->|"yes"| n8
  n8 -->|"yes"| n9
  n6 -->|"no"| n10
  n7 -->|"no"| n10
  n8 -->|"no"| n10
```

## levelsFromTag

```mermaid
flowchart TD
  n1(["levelsFromTag"])
  n2{"text === undefined"}
  n3(["return undefined;"])
  n4["const levels = Number(text.trim());"]
  n5{"WHOLE_NUMBER.test(text.trim())"}
  n6{"levels #gt;= 1"}
  n7{"levels #lt;= MOST_LEVELS"}
  n8(["return levels;"])
  n9(["return #quot;unreadable#quot;;"])
  n1 --> n2
  n2 -->|"yes"| n3
  n2 -->|"no"| n4
  n4 --> n5
  n5 -->|"yes"| n6
  n6 -->|"yes"| n7
  n7 -->|"yes"| n8
  n5 -->|"no"| n9
  n6 -->|"no"| n9
  n7 -->|"no"| n9
```

## ringInCentimetres

```mermaid
flowchart TD
  n1(["ringInCentimetres"])
  n2["const flat: number[] = [];"]
  n3{"for each const node of nodes.slice(0, -1)"}
  n4["const point = metresFromCentre(node);<br/>calls metresFromCentre"]
  n5["const east = Math.round((point.eastM - southWest.eastM) * C…"]
  n6["const north = Math.round((point.northM - southWest.northM) …"]
  n7{"flat.length #gt; 0"}
  n8{"flat[flat.length - 2] === east"}
  n9["flat[flat.length - 1] === north"]
  n10["const sameAsBefore = flat.length #gt; 0 && flat[flat.length - …"]
  n11{"!sameAsBefore"}
  n12["flat.push(east, north);"]
  n13{"flat.length #gt; 2"}
  n14{"flat[0] === flat[flat.length - 2]"}
  n15{"flat[1] === flat[flat.length - 1]"}
  n16["flat.splice(-2);"]
  n17(["return flat;"])
  n1 --> n2
  n2 --> n3
  n3 -->|"next item"| n4
  n4 --> n5
  n5 --> n6
  n6 --> n7
  n7 -->|"yes"| n8
  n8 -->|"yes"| n9
  n7 -->|"no"| n10
  n8 -->|"no"| n10
  n9 --> n10
  n10 --> n11
  n11 -->|"yes"| n12
  n12 --> n3
  n11 -->|"no"| n3
  n3 -->|"done"| n13
  n13 -->|"yes"| n14
  n14 -->|"yes"| n15
  n15 -->|"yes"| n16
  n16 --> n17
  n13 -->|"no"| n17
  n14 -->|"no"| n17
  n15 -->|"no"| n17
```

## twiceSignedArea

```mermaid
flowchart TD
  n1(["twiceSignedArea"])
  n2["let sum = 0;"]
  n3["let at = 0"]
  n4{"at #lt; ring.length"}
  n5["const next = (at + 2) % ring.length;"]
  n6["sum += (ring[at] as number) * (ring[next + 1] as number) - …"]
  n7["at += 2"]
  n8(["return sum;"])
  n1 --> n2
  n2 --> n3
  n3 --> n4
  n4 -->|"yes"| n5
  n5 --> n6
  n6 --> n7
  n7 --> n4
  n4 -->|"no"| n8
```

## reversedRing

```mermaid
flowchart TD
  n1(["reversedRing"])
  n2["const turned: number[] = [];"]
  n3["let at = ring.length - 2"]
  n4{"at #gt;= 0"}
  n5["turned.push(ring[at] as number, ring[at + 1] as number);"]
  n6["at -= 2"]
  n7(["return turned;"])
  n1 --> n2
  n2 --> n3
  n3 --> n4
  n4 -->|"yes"| n5
  n5 --> n6
  n6 --> n4
  n4 -->|"no"| n7
```

## roofTriangles

```mermaid
flowchart TD
  n1(["roofTriangles"])
  n2["const asPoints = rings.map((ring) =#gt; Array.from({ length: r…"]
  n3["const flat = rings.flat();"]
  n4{"asPoints[0] is missing?"}
  n5["[]"]
  n6["const found = ShapeUtils.triangulateShape(asPoints[0] ?? []…"]
  n7["const roof: number[] = [];"]
  n8{"for each const [a, b, c] of found as [number, number, number][]"}
  n9["const area = twiceSignedArea([flat[a * 2] as number, flat[a…<br/>calls twiceSignedArea"]
  n10{"area #gt; 0"}
  n11["roof.push(a, b, c);"]
  n12{"area #lt; 0"}
  n13["roof.push(a, c, b);"]
  n14(["return roof;"])
  n1 --> n2
  n2 --> n3
  n3 --> n4
  n4 -->|"yes"| n5
  n4 -->|"no"| n6
  n5 --> n6
  n6 --> n7
  n7 --> n8
  n8 -->|"next item"| n9
  n9 --> n10
  n10 -->|"yes"| n11
  n11 --> n12
  n10 -->|"no"| n12
  n12 -->|"yes"| n13
  n13 --> n8
  n12 -->|"no"| n8
  n8 -->|"done"| n14
```

## cellForOutline

```mermaid
flowchart TD
  n1(["cellForOutline"])
  n2["const easts = outer.map((point) =#gt; point.eastM);"]
  n3["const norths = outer.map((point) =#gt; point.northM);"]
  n4(["return cellOfPoint({ eastM: (Math.min(...easts) + Math.max(…<br/>calls cellOfPoint"])
  n1 --> n2
  n2 --> n3
  n3 --> n4
```

## ringsFitTheirSquare

```mermaid
flowchart TD
  n1(["ringsFitTheirSquare"])
  n2["const largest = 10_000 + REACH_OUTSIDE_SQUARE_CM;"]
  n3(["return rings.every((ring) =#gt; ring.every((value) =#gt; value #gt;=…"])
  n1 --> n2
  n2 --> n3
```

## ringsFitTheirSquare > inner function 1

```mermaid
flowchart TD
  n1(["ringsFitTheirSquare #gt; inner function 1"])
  n2{"value #gt;= -REACH_OUTSIDE_SQUARE_CM"}
  n3["value #lt;= largest"]
  n4(["return value #gt;= -REACH_OUTSIDE_SQUARE_CM && value #lt;= largest"])
  n1 --> n2
  n2 -->|"yes"| n3
  n2 -->|"no"| n4
  n3 --> n4
```

## bakeBuilding

```mermaid
flowchart TD
  n1(["bakeBuilding"])
  n2["const cell = cellForOutline(outline.outer.map(metresFromCen…<br/>calls cellForOutline"]
  n3["const bounds = cellBounds(cell);<br/>calls cellBounds"]
  n4["const southWest = { eastM: bounds.westM, northM: bounds.sou…"]
  n5["const outer = ringInCentimetres(outline.outer, metresFromCe…<br/>calls ringInCentimetres"]
  n6{"outer.length #lt; 6"}
  n7{"twiceSignedArea(outer) === 0<br/>calls twiceSignedArea"}
  n8(["return #96;building ${outline.source} has no area once rounded…"])
  n9["const holes = outline.holes.map((hole) =#gt; ringInCentimetres…<br/>calls ringInCentimetres"]
  n10{"twiceSignedArea(outer) #gt; 0<br/>calls twiceSignedArea"}
  n11["outer"]
  n12["reversedRing(outer)<br/>calls reversedRing"]
  n13["const rings = [twiceSignedArea(outer) #gt; 0 ? outer : reverse…<br/>calls twiceSignedArea, reversedRing"]
  n14{"!ringsFitTheirSquare(rings)<br/>calls ringsFitTheirSquare"}
  n15(["return #96;building ${outline.source} reaches more than ${REAC…"])
  n16["const height = buildingHeightM(outline.source, outline.tags…<br/>calls buildingHeightM"]
  n17["const building = { heightCm: Math.round(height.heightM * CE…<br/>calls roofTriangles"]
  n18(["return { cell, building, notes: height.notes };"])
  n1 --> n2
  n2 --> n3
  n3 --> n4
  n4 --> n5
  n5 --> n6
  n6 -->|"no"| n7
  n6 -->|"yes"| n8
  n7 -->|"yes"| n8
  n7 -->|"no"| n9
  n9 --> n10
  n10 -->|"yes"| n11
  n10 -->|"no"| n12
  n11 --> n13
  n12 --> n13
  n13 --> n14
  n14 -->|"yes"| n15
  n14 -->|"no"| n16
  n16 --> n17
  n17 --> n18
```

## bakeBuilding > inner function 1

```mermaid
flowchart TD
  n1(["bakeBuilding #gt; inner function 1"])
  n2{"hole.length #gt;= 6"}
  n3["twiceSignedArea(hole) !== 0<br/>calls twiceSignedArea"]
  n4(["return hole.length #gt;= 6 && twiceSignedArea(hole) !== 0"])
  n1 --> n2
  n2 -->|"yes"| n3
  n2 -->|"no"| n4
  n3 --> n4
```

## bakeBuilding > inner function 2

```mermaid
flowchart TD
  n1(["bakeBuilding #gt; inner function 2"])
  n2{"twiceSignedArea(hole) #lt; 0<br/>calls twiceSignedArea"}
  n3["hole"]
  n4["reversedRing(hole)<br/>calls reversedRing"]
  n5(["return (twiceSignedArea(hole) #lt; 0 ? hole : reversedRing(hole))"])
  n1 --> n2
  n2 -->|"yes"| n3
  n2 -->|"no"| n4
  n3 --> n5
  n4 --> n5
```

## buildingsByCell

```mermaid
flowchart TD
  n1(["buildingsByCell"])
  n2["const metresFromCentre = localProjection(centre);<br/>calls localProjection"]
  n3["const byCell = new Map#lt;string, { cell: Cell; buildings: Bak…"]
  n4["const notes: string[] = [];"]
  n5{"for each const outline of outlines"}
  n6["const first = metresFromCentre(outline.outer[0] as WayNode);<br/>calls metresFromCentre"]
  n7{"!isInsideMap(first)<br/>calls isInsideMap"}
  n8["continue"]
  n9["const baked = bakeBuilding(outline, metresFromCentre, heigh…<br/>calls bakeBuilding"]
  n10{"typeof baked === #quot;string#quot;"}
  n11["notes.push(baked);"]
  n12["continue"]
  n13["notes.push(...baked.notes);"]
  n14["const key = cellKey(baked.cell);<br/>calls cellKey"]
  n15{"byCell.get(key) is missing?"}
  n16["{ cell: baked.cell, buildings: [] }"]
  n17["const square = byCell.get(key) ?? { cell: baked.cell, build…"]
  n18["square.buildings.push(baked.building);"]
  n19["byCell.set(key, square);"]
  n20(["return { byCell, notes };"])
  n1 --> n2
  n2 --> n3
  n3 --> n4
  n4 --> n5
  n5 -->|"next item"| n6
  n6 --> n7
  n7 -->|"yes"| n8
  n7 -->|"no"| n9
  n9 --> n10
  n10 -->|"yes"| n11
  n11 --> n12
  n10 -->|"no"| n13
  n13 --> n14
  n14 --> n15
  n15 -->|"yes"| n16
  n15 -->|"no"| n17
  n16 --> n17
  n17 --> n18
  n18 --> n19
  n19 --> n5
  n8 --> n5
  n12 --> n5
  n5 -->|"done"| n20
```

## buildingFileText

```mermaid
flowchart TD
  n1(["buildingFileText"])
  n2["const written = buildings.map((building) =#gt; ({ heightCm: bu…"]
  n3(["return #96;${JSON.stringify({ format: BUILDINGS_FORMAT, cell: …"])
  n1 --> n2
  n2 --> n3
```

## buildingFileName

```mermaid
flowchart TD
  n1(["buildingFileName"])
  n2(["return #96;buildings_${cellKey(cell)}.json#96;;<br/>calls cellKey"])
  n1 --> n2
```
