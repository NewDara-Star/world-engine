# src/world/chunk.ts

Drawn from the code by `npm run diagrams` (TypeScript compiler, no AI). Do not edit by hand: change the code, then run it again.

## requireSquareNames

```mermaid
flowchart TD
  n1(["requireSquareNames"])
  n2["const checkNames = requireListOf(requireTextMatching(/^-?\d…<br/>calls requireListOf, requireTextMatching"]
  n3(["return checkSquareNames;"])
  n1 --> n2
  n2 --> n3
```

## requireSquareNames > checkSquareNames

```mermaid
flowchart TD
  n1(["requireSquareNames #gt; checkSquareNames"])
  n2["const names = checkNames(value, path);<br/>calls checkNames"]
  n3{"!names.ok"}
  n4(["return names;"])
  n5["const repeated = names.value.findIndex((key, at) =#gt; names.v…"]
  n6{"repeated #lt; 0"}
  n7(["return names;"])
  n8(["return { ok: false, problems: [problemAt([...path, repeated…<br/>calls problemAt"])
  n1 --> n2
  n2 --> n3
  n3 -->|"yes"| n4
  n3 -->|"no"| n5
  n5 --> n6
  n6 -->|"yes"| n7
  n6 -->|"no"| n8
```

## extentOrderProblems

```mermaid
flowchart TD
  n1(["extentOrderProblems"])
  n2["const { westM, southM, eastM, northM } = index.extent;"]
  n3["const problems: Problem[] = [];"]
  n4{"!(westM #lt; eastM)"}
  n5["problems.push(problemAt([#quot;extent#quot;, #quot;westM#quot;], #96;\#96;extent.west…<br/>calls problemAt"]
  n6{"!(southM #lt; northM)"}
  n7["problems.push(problemAt([#quot;extent#quot;, #quot;southM#quot;], #96;\#96;extent.sou…<br/>calls problemAt"]
  n8(["return problems;"])
  n1 --> n2
  n2 --> n3
  n3 --> n4
  n4 -->|"yes"| n5
  n5 --> n6
  n4 -->|"no"| n6
  n6 -->|"yes"| n7
  n7 --> n8
  n6 -->|"no"| n8
```

## validateChunk

```mermaid
flowchart TD
  n1(["validateChunk"])
  n2["let value: unknown;"]
  n3["try"]
  n4["value = JSON.parse(text);"]
  n5["catch"]
  n6(["return { ok: false, messages: [#96;${fileName}: the file is no…"])
  n7["const problems = chunkShapeProblems(value, cell);<br/>calls chunkShapeProblems"]
  n8{"problems.length #gt; 0"}
  n9(["return { ok: false, messages: problems.map((problem) =#gt; #96;${…"])
  n10["const chunk = value as Chunk;"]
  n11(["return { ok: true, value: { cell: { east: chunk.cell.east, …"])
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

## chunkShapeProblems

```mermaid
flowchart TD
  n1(["chunkShapeProblems"])
  n2["const chunk = Object(value) as Record#lt;string, unknown#gt;;"]
  n3["const found = Object(chunk[#quot;cell#quot;]) as Record#lt;string, unkno…"]
  n4{"Array.isArray(chunk[#quot;corners#quot;])"}
  n5["chunk[#quot;corners#quot;]"]
  n6["[Number.NaN]"]
  n7["const corners: unknown[] = Array.isArray(chunk[#quot;corners#quot;]) …"]
  n8{"Array.isArray(chunk[#quot;triangles#quot;])"}
  n9["chunk[#quot;triangles#quot;]"]
  n10["[Number.NaN]"]
  n11["const triangles: unknown[] = Array.isArray(chunk[#quot;triangles…"]
  n12["const cornerCount = Math.floor(corners.length / 2);"]
  n13["const cornersGood = [ corners.length % 2 === 0, corners.eve…"]
  n14["const trianglesGood = [ triangles.length % 3 === 0, triangl…"]
  n15["const problems: string[] = [];"]
  n16{"chunk[#quot;format#quot;] !== FORMAT"}
  n17["problems.push(#96;made by a different bake version (format ${J…"]
  n18{"found[#quot;east#quot;] !== cell.east"}
  n19{"found[#quot;north#quot;] !== cell.north"}
  n20["problems.push(#96;this file is for square ${String(found[#quot;east…<br/>calls cellKey"]
  n21{"!cornersGood"}
  n22["problems.push(#96;the corner list is broken: it must be an eve…"]
  n23{"!trianglesGood"}
  n24["problems.push(#quot;the triangle list is broken: it must be thre…"]
  n25(["return problems;"])
  n1 --> n2
  n2 --> n3
  n3 --> n4
  n4 -->|"yes"| n5
  n4 -->|"no"| n6
  n5 --> n7
  n6 --> n7
  n7 --> n8
  n8 -->|"yes"| n9
  n8 -->|"no"| n10
  n9 --> n11
  n10 --> n11
  n11 --> n12
  n12 --> n13
  n13 --> n14
  n14 --> n15
  n15 --> n16
  n16 -->|"yes"| n17
  n17 --> n18
  n16 -->|"no"| n18
  n18 -->|"no"| n19
  n18 -->|"yes"| n20
  n19 -->|"yes"| n20
  n20 --> n21
  n19 -->|"no"| n21
  n21 -->|"yes"| n22
  n22 --> n23
  n21 -->|"no"| n23
  n23 -->|"yes"| n24
  n24 --> n25
  n23 -->|"no"| n25
```

## validateChunkIndex

```mermaid
flowchart TD
  n1(["validateChunkIndex"])
  n2(["return validateJsonFile(fileName, text, indexChecker);<br/>calls validateJsonFile"])
  n1 --> n2
```

## indexProblemsForPlace

```mermaid
flowchart TD
  n1(["indexProblemsForPlace"])
  n2["const problems: string[] = [];"]
  n3{"index.cellSizeM !== cellSizeM"}
  n4["problems.push(#96;The map was baked with ${index.cellSizeM} m …"]
  n5{"index.centre.lat !== place.centre.lat"}
  n6{"index.centre.lon !== place.centre.lon"}
  n7["problems.push(#quot;The map was baked for a different centre tha…"]
  n8(["return problems;"])
  n1 --> n2
  n2 --> n3
  n3 -->|"yes"| n4
  n4 --> n5
  n3 -->|"no"| n5
  n5 -->|"no"| n6
  n5 -->|"yes"| n7
  n6 -->|"yes"| n7
  n7 --> n8
  n6 -->|"no"| n8
```
