# tools/bake/chunk-text.ts

Drawn from the code by `npm run diagrams` (TypeScript compiler, no AI). Do not edit by hand: change the code, then run it again.

## chunkFileText

```mermaid
flowchart TD
  n1(["chunkFileText"])
  n2["const southWest = cellBounds(cell);<br/>calls cellBounds"]
  n3["const corners: number[] = [];"]
  n4["const numbers = new Map#lt;string, number#gt;();"]
  n5["const kept: number[] = [];"]
  n6{"for each const triangle of triangles"}
  n7["const [a, b, c] = triangle.map((point) =#gt; ({ east: Math.rou…"]
  n8["const indices = [a, b, c].map((corner) =#gt; cornerIndexFor(co…<br/>calls cornerIndexFor"]
  n9["const twiceArea = (b.east - a.east) * (c.north - a.north) -…"]
  n10{"twiceArea #gt; 0"}
  n11["kept.push(...indices);"]
  n12(["return #96;${JSON.stringify({ format: CHUNK_FORMAT, cell: { ea…"])
  n1 --> n2
  n2 --> n3
  n3 --> n4
  n4 --> n5
  n5 --> n6
  n6 -->|"next item"| n7
  n7 --> n8
  n8 --> n9
  n9 --> n10
  n10 -->|"yes"| n11
  n11 --> n6
  n10 -->|"no"| n6
  n6 -->|"done"| n12
```

## chunkFileText > cornerIndexFor

```mermaid
flowchart TD
  n1(["chunkFileText #gt; cornerIndexFor"])
  n2["const key = #96;${east},${north}#96;;"]
  n3["const seen = numbers.get(key);"]
  n4{"seen !== undefined"}
  n5(["return seen;"])
  n6["numbers.set(key, corners.length / 2);"]
  n7["corners.push(east, north);"]
  n8(["return corners.length / 2 - 1;"])
  n1 --> n2
  n2 --> n3
  n3 --> n4
  n4 -->|"yes"| n5
  n4 -->|"no"| n6
  n6 --> n7
  n7 --> n8
```

## indexFileText

```mermaid
flowchart TD
  n1(["indexFileText"])
  n2["const sorted = cells.toSorted((a, b) =#gt; a.east - b.east).to…"]
  n3["const index = { format: CHUNK_FORMAT, cellSizeM: CELL_SIZE_…"]
  n4(["return #96;${JSON.stringify(index, null, 2)}\n#96;;"])
  n1 --> n2
  n2 --> n3
  n3 --> n4
```
