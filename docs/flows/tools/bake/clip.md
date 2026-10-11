# tools/bake/clip.ts

Drawn from the code by `npm run diagrams` (TypeScript compiler, no AI). Do not edit by hand: change the code, then run it again.

## trianglesByCell

```mermaid
flowchart TD
  n1(["trianglesByCell"])
  n2["const byCell = new Map#lt;string, MapPoint[][]#gt;();"]
  n3{"for each const piece of pieces"}
  n4{"for each const cell of cellsUnderPiece(piece)<br/>calls cellsUnderPiece"}
  n5["const inside = clipPieceToCell(piece, cell);<br/>calls clipPieceToCell"]
  n6{"inside === undefined"}
  n7["continue"]
  n8["const key = cellKey(cell);<br/>calls cellKey"]
  n9{"byCell.get(key) is missing?"}
  n10["[]"]
  n11["byCell.set(key, [...(byCell.get(key) ?? []), ...fanTriangle…<br/>calls fanTriangles"]
  n12(["return byCell;"])
  n1 --> n2
  n2 --> n3
  n3 -->|"next item"| n4
  n4 -->|"next item"| n5
  n5 --> n6
  n6 -->|"yes"| n7
  n6 -->|"no"| n8
  n8 --> n9
  n9 -->|"yes"| n10
  n9 -->|"no"| n11
  n10 --> n11
  n11 --> n4
  n7 --> n4
  n4 -->|"done"| n3
  n3 -->|"done"| n12
```

## cellsUnderPiece

```mermaid
flowchart TD
  n1(["cellsUnderPiece"])
  n2["const easts = corners.map((corner) =#gt; corner.eastM);"]
  n3["const norths = corners.map((corner) =#gt; corner.northM);"]
  n4["const southWest = cellOfPoint({ eastM: Math.min(...easts), …<br/>calls cellOfPoint"]
  n5["const northEast = cellOfPoint({ eastM: Math.max(...easts), …<br/>calls cellOfPoint"]
  n6["const cells: Cell[] = [];"]
  n7["let north = southWest.north"]
  n8{"north #lt;= northEast.north"}
  n9["let east = southWest.east"]
  n10{"east #lt;= northEast.east"}
  n11["cells.push({ east, north });"]
  n12["east += 1"]
  n13["north += 1"]
  n14(["return cells;"])
  n1 --> n2
  n2 --> n3
  n3 --> n4
  n4 --> n5
  n5 --> n6
  n6 --> n7
  n7 --> n8
  n8 -->|"yes"| n9
  n9 --> n10
  n10 -->|"yes"| n11
  n11 --> n12
  n12 --> n10
  n10 -->|"no"| n13
  n13 --> n8
  n8 -->|"no"| n14
```

## clipPieceToCell

```mermaid
flowchart TD
  n1(["clipPieceToCell"])
  n2["const bounds = cellBounds(cell);<br/>calls cellBounds"]
  n3["const edges: Edge[] = [ { axis: #quot;eastM#quot;, atM: bounds.westM,…"]
  n4["const left = edges.reduce#lt;MapPoint[]#gt;((kept, edge) =#gt; clipA…<br/>calls clipAgainstEdge"]
  n5{"left.length #lt; 3"}
  n6(["return undefined;"])
  n7(["return left;"])
  n1 --> n2
  n2 --> n3
  n3 --> n4
  n4 --> n5
  n5 -->|"yes"| n6
  n5 -->|"no"| n7
```

## clipAgainstEdge

```mermaid
flowchart TD
  n1(["clipAgainstEdge"])
  n2["const kept: MapPoint[] = [];"]
  n3["let index = 0"]
  n4{"index #lt; corners.length"}
  n5["const corner = corners[index] as MapPoint;"]
  n6["const before = corners[(index + corners.length - 1) % corne…"]
  n7["const cornerInside = edge.insideIsAbove === corner[edge.axi…"]
  n8["const beforeInside = edge.insideIsAbove === before[edge.axi…"]
  n9["const fraction = (edge.atM - before[edge.axis]) / (corner[e…"]
  n10["const crossing = { eastM: before.eastM + fraction * (corner…"]
  n11{"cornerInside !== beforeInside"}
  n12["kept.push(crossing);"]
  n13{"cornerInside"}
  n14["kept.push(corner);"]
  n15["index += 1"]
  n16(["return kept;"])
  n1 --> n2
  n2 --> n3
  n3 --> n4
  n4 -->|"yes"| n5
  n5 --> n6
  n6 --> n7
  n7 --> n8
  n8 --> n9
  n9 --> n10
  n10 --> n11
  n11 -->|"yes"| n12
  n12 --> n13
  n11 -->|"no"| n13
  n13 -->|"yes"| n14
  n14 --> n15
  n13 -->|"no"| n15
  n15 --> n4
  n4 -->|"no"| n16
```

## fanTriangles

```mermaid
flowchart TD
  n1(["fanTriangles"])
  n2["const first = corners[0] as MapPoint;"]
  n3["const triangles: MapPoint[][] = [];"]
  n4["let from = corners[1] as MapPoint;"]
  n5["let at = 1"]
  n6{"at + 1 #lt; corners.length"}
  n7["const next = corners[at + 1] as MapPoint;"]
  n8["const twiceArea = (from.eastM - first.eastM) * (next.northM…"]
  n9{"twiceArea / 2 #gt;= SMALLEST_TRIANGLE_M2"}
  n10["triangles.push([first, from, next]);"]
  n11["from = next;"]
  n12["at += 1"]
  n13(["return triangles;"])
  n1 --> n2
  n2 --> n3
  n3 --> n4
  n4 --> n5
  n5 --> n6
  n6 -->|"yes"| n7
  n7 --> n8
  n8 --> n9
  n9 -->|"yes"| n10
  n10 --> n11
  n11 --> n12
  n9 -->|"no"| n12
  n12 --> n6
  n6 -->|"no"| n13
```
