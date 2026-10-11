# src/world/buildings.ts

Drawn from the code by `npm run diagrams` (TypeScript compiler, no AI). Do not edit by hand: change the code, then run it again.

## validateBuildingChunk

```mermaid
flowchart TD
  n1(["validateBuildingChunk"])
  n2["let value: unknown;"]
  n3["try"]
  n4["value = JSON.parse(text);"]
  n5["catch"]
  n6(["return { ok: false, messages: [#96;${fileName}: the file is no…"])
  n7["const problems = buildingChunkProblems(value, cell);<br/>calls buildingChunkProblems"]
  n8{"problems.length #gt; 0"}
  n9(["return { ok: false, messages: problems.map((problem) =#gt; #96;${…"])
  n10["const chunk = value as BuildingChunk;"]
  n11(["return { ok: true, value: { cell: { east: cell.east, north:…"])
  n1 --> n2
  n2 --> n3
  n3 --> n4
  n3 -->|"throws"| n5
  n5 --> n6
  n4 --> n7
  n7 --> n8
  n8 -->|"yes"| n9
  n8 -->|"no"| n10
  n10 --> n11
```

## buildingChunkProblems

```mermaid
flowchart TD
  n1(["buildingChunkProblems"])
  n2["const chunk = Object(value) as Record#lt;string, unknown#gt;;"]
  n3["const found = Object(chunk[#quot;cell#quot;]) as Record#lt;string, unkno…"]
  n4["const problems: string[] = [];"]
  n5{"chunk[#quot;format#quot;] !== FORMAT"}
  n6["problems.push(#96;made by a different bake version (format ${J…"]
  n7{"found[#quot;east#quot;] !== cell.east"}
  n8{"found[#quot;north#quot;] !== cell.north"}
  n9["problems.push(#96;this file is for square ${String(found[#quot;east…<br/>calls cellKey"]
  n10{"Array.isArray(chunk[#quot;buildings#quot;])"}
  n11["chunk[#quot;buildings#quot;]"]
  n12["[undefined]"]
  n13["const buildings: unknown[] = Array.isArray(chunk[#quot;buildings…"]
  n14["const broken = buildings.findIndex((building) =#gt; !isGoodBui…<br/>calls isGoodBuilding"]
  n15{"broken #gt;= 0"}
  n16["problems.push(#96;building ${broken} is broken: it needs a hei…"]
  n17(["return problems;"])
  n1 --> n2
  n2 --> n3
  n3 --> n4
  n4 --> n5
  n5 -->|"yes"| n6
  n6 --> n7
  n5 -->|"no"| n7
  n7 -->|"no"| n8
  n7 -->|"yes"| n9
  n8 -->|"yes"| n9
  n9 --> n10
  n8 -->|"no"| n10
  n10 -->|"yes"| n11
  n10 -->|"no"| n12
  n11 --> n13
  n12 --> n13
  n13 --> n14
  n14 --> n15
  n15 -->|"yes"| n16
  n16 --> n17
  n15 -->|"no"| n17
```

## isGoodBuilding

```mermaid
flowchart TD
  n1(["isGoodBuilding"])
  n2["const building = Object(value) as Record#lt;string, unknown#gt;;"]
  n3{"Array.isArray(building[#quot;rings#quot;])"}
  n4["building[#quot;rings#quot;]"]
  n5["[]"]
  n6["const rings: unknown[] = Array.isArray(building[#quot;rings#quot;]) ?…"]
  n7{"Array.isArray(building[#quot;roof#quot;])"}
  n8["building[#quot;roof#quot;]"]
  n9["[Number.NaN]"]
  n10["const roof: unknown[] = Array.isArray(building[#quot;roof#quot;]) ? b…"]
  n11["const heightCm = building[#quot;heightCm#quot;];"]
  n12["const shade = building[#quot;shade#quot;];"]
  n13["const cornerCount = rings.reduce#lt;number#gt;((count, ring) =#gt; c…"]
  n14{"rings.length #gt;= 1"}
  n15["rings.every(isGoodRing)"]
  n16{"roof.length % 3 === 0"}
  n17["roof.every((corner) =#gt; isWholeNumberFrom(corner, 0, cornerC…<br/>calls isWholeNumberFrom"]
  n18(["return [ isWholeNumberFrom(heightCm, 1, TALLEST_CM), isWhol…<br/>calls isWholeNumberFrom"])
  n1 --> n2
  n2 --> n3
  n3 -->|"yes"| n4
  n3 -->|"no"| n5
  n4 --> n6
  n5 --> n6
  n6 --> n7
  n7 -->|"yes"| n8
  n7 -->|"no"| n9
  n8 --> n10
  n9 --> n10
  n10 --> n11
  n11 --> n12
  n12 --> n13
  n13 --> n14
  n14 -->|"yes"| n15
  n14 -->|"no"| n16
  n15 --> n16
  n16 -->|"yes"| n17
  n16 -->|"no"| n18
  n17 --> n18
```

## isGoodBuilding > inner function 1

```mermaid
flowchart TD
  n1(["isGoodBuilding #gt; inner function 1"])
  n2{"Array.isArray(ring)"}
  n3["ring.length / 2"]
  n4["0"]
  n5(["return count + (Array.isArray(ring) ? ring.length / 2 : 0)"])
  n1 --> n2
  n2 -->|"yes"| n3
  n2 -->|"no"| n4
  n3 --> n5
  n4 --> n5
```

## isWholeNumberFrom

```mermaid
flowchart TD
  n1(["isWholeNumberFrom"])
  n2{"Number.isInteger(value)"}
  n3{"Number(value) #gt;= lowest"}
  n4["Number(value) #lt;= highest"]
  n5(["return Number.isInteger(value) && Number(value) #gt;= lowest &…"])
  n1 --> n2
  n2 -->|"yes"| n3
  n3 -->|"yes"| n4
  n2 -->|"no"| n5
  n3 -->|"no"| n5
  n4 --> n5
```

## isGoodRing

```mermaid
flowchart TD
  n1(["isGoodRing"])
  n2{"!Array.isArray(ring)"}
  n3{"ring.length #lt; 6"}
  n4{"ring.length % 2 !== 0"}
  n5(["return false;"])
  n6(["return ring.every((value) =#gt; isWholeNumberFrom(value, LOWES…<br/>calls isWholeNumberFrom"])
  n1 --> n2
  n2 -->|"no"| n3
  n3 -->|"no"| n4
  n2 -->|"yes"| n5
  n3 -->|"yes"| n5
  n4 -->|"yes"| n5
  n4 -->|"no"| n6
```

## surfaceSizes

```mermaid
flowchart TD
  n1(["surfaceSizes"])
  n2["let corners = 0;"]
  n3["let indices = 0;"]
  n4{"for each const building of chunk.buildings"}
  n5["const ringCorners = building.rings.reduce((count, ring) =#gt; …"]
  n6["corners += ringCorners * 4 + ringCorners;"]
  n7["indices += ringCorners * 6 + building.roof.length;"]
  n8(["return { corners, indices };"])
  n1 --> n2
  n2 --> n3
  n3 --> n4
  n4 -->|"next item"| n5
  n5 --> n6
  n6 --> n7
  n7 --> n4
  n4 -->|"done"| n8
```

## buildingSurfaces

```mermaid
flowchart TD
  n1(["buildingSurfaces"])
  n2["const sizes = surfaceSizes(chunk);<br/>calls surfaceSizes"]
  n3["const surfaces: BuildingSurfaces = { positions: new Float32…"]
  n4["const next = { corner: 0, index: 0 };"]
  n5{"for each const building of chunk.buildings"}
  n6{"for each const ring of building.rings"}
  n7["addWalls(surfaces, next, ring, building);<br/>calls addWalls"]
  n8["addRoof(surfaces, next, building);<br/>calls addRoof"]
  n9(["return surfaces;"])
  n1 --> n2
  n2 --> n3
  n3 --> n4
  n4 --> n5
  n5 -->|"next item"| n6
  n6 -->|"next item"| n7
  n7 --> n6
  n6 -->|"done"| n8
  n8 --> n5
  n5 -->|"done"| n9
```

## addWalls

```mermaid
flowchart TD
  n1(["addWalls"])
  n2["const top = building.heightCm / 100;"]
  n3["const count = ring.length / 2;"]
  n4["let side = 0"]
  n5{"side #lt; count"}
  n6["const [aEast, aNorth] = [(ring[side * 2] as number) / 100, …"]
  n7["const after = (side + 1) % count;"]
  n8["const [bEast, bNorth] = [(ring[after * 2] as number) / 100,…"]
  n9{"Math.hypot(bEast - aEast, bNorth - aNorth)"}
  n10["1"]
  n11["const length = Math.hypot(bEast - aEast, bNorth - aNorth) |…"]
  n12["const normal = [(bNorth - aNorth) / length, 0, (bEast - aEa…"]
  n13["const tone = TONE_FACING_NORTH_OR_SOUTH + (1 - TONE_FACING_…"]
  n14["const first = next.corner;"]
  n15["const corners = [ [aEast, 0, -aNorth], [bEast, 0, -bNorth],…"]
  n16{"for each const corner of corners"}
  n17["putCorner(surfaces, next, corner, normal, building.shade, t…<br/>calls putCorner"]
  n18["surfaces.indices.set([first, first + 1, first + 2, first, f…"]
  n19["next.index += 6;"]
  n20["side += 1"]
  n21(["end"])
  n1 --> n2
  n2 --> n3
  n3 --> n4
  n4 --> n5
  n5 -->|"yes"| n6
  n6 --> n7
  n7 --> n8
  n8 --> n9
  n9 -->|"no"| n10
  n9 -->|"yes"| n11
  n10 --> n11
  n11 --> n12
  n12 --> n13
  n13 --> n14
  n14 --> n15
  n15 --> n16
  n16 -->|"next item"| n17
  n17 --> n16
  n16 -->|"done"| n18
  n18 --> n19
  n19 --> n20
  n20 --> n5
  n5 -->|"no"| n21
```

## addRoof

```mermaid
flowchart TD
  n1(["addRoof"])
  n2["const top = building.heightCm / 100;"]
  n3["const first = next.corner;"]
  n4{"for each const ring of building.rings"}
  n5["let at = 0"]
  n6{"at #lt; ring.length"}
  n7["putCorner(surfaces, next, [(ring[at] as number) / 100, top,…<br/>calls putCorner"]
  n8["at += 2"]
  n9["surfaces.indices.set( building.roof.map((corner) =#gt; first +…"]
  n10["next.index += building.roof.length;"]
  n11(["end"])
  n1 --> n2
  n2 --> n3
  n3 --> n4
  n4 -->|"next item"| n5
  n5 --> n6
  n6 -->|"yes"| n7
  n7 --> n8
  n8 --> n6
  n6 -->|"no"| n4
  n4 -->|"done"| n9
  n9 --> n10
  n10 --> n11
```

## putCorner

```mermaid
flowchart TD
  n1(["putCorner"])
  n2["surfaces.positions.set(position, next.corner * 3);"]
  n3["surfaces.normals.set(normal, next.corner * 3);"]
  n4["surfaces.shades[next.corner] = shade;"]
  n5["surfaces.tones[next.corner] = tone;"]
  n6["next.corner += 1;"]
  n7(["end"])
  n1 --> n2
  n2 --> n3
  n3 --> n4
  n4 --> n5
  n5 --> n6
  n6 --> n7
```

## buildingOutlinesInMetres

```mermaid
flowchart TD
  n1(["buildingOutlinesInMetres"])
  n2(["return chunk.buildings.map((building) =#gt; { const outer = bu…"])
  n1 --> n2
```

## buildingOutlinesInMetres > inner function 1

```mermaid
flowchart TD
  n1(["buildingOutlinesInMetres #gt; inner function 1"])
  n2{"building.rings[0] is missing?"}
  n3["[]"]
  n4["const outer = building.rings[0] ?? [];"]
  n5["const outline = Array.from({ length: outer.length / 2 }, (_…"]
  n6(["return { outline, heightM: building.heightCm / 100 };"])
  n1 --> n2
  n2 -->|"yes"| n3
  n2 -->|"no"| n4
  n3 --> n4
  n4 --> n5
  n5 --> n6
```
