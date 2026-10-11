# src/world/grid.ts

Drawn from the code by `npm run diagrams` (TypeScript compiler, no AI). Do not edit by hand: change the code, then run it again.

## cellOfPoint

```mermaid
flowchart TD
  n1(["cellOfPoint"])
  n2(["return { east: Math.floor(point.eastM / CELL_SIZE_M) + 0, n…"])
  n1 --> n2
```

## cellKey

```mermaid
flowchart TD
  n1(["cellKey"])
  n2(["return #96;${String(cell.east)}_${String(cell.north)}#96;;"])
  n1 --> n2
```

## cellBounds

```mermaid
flowchart TD
  n1(["cellBounds"])
  n2["const westM = cell.east * CELL_SIZE_M;"]
  n3["const southM = cell.north * CELL_SIZE_M;"]
  n4(["return { westM, southM, eastM: westM + CELL_SIZE_M, northM:…"])
  n1 --> n2
  n2 --> n3
  n3 --> n4
```

## distanceToCell

```mermaid
flowchart TD
  n1(["distanceToCell"])
  n2["const bounds = cellBounds(cell);<br/>calls cellBounds"]
  n3["const outsideEast = Math.max(bounds.westM - point.eastM, 0,…"]
  n4["const outsideNorth = Math.max(bounds.southM - point.northM,…"]
  n5(["return Math.hypot(outsideEast, outsideNorth);"])
  n1 --> n2
  n2 --> n3
  n3 --> n4
  n4 --> n5
```

## cellsWithin

```mermaid
flowchart TD
  n1(["cellsWithin"])
  n2["const from = cellOfPoint({ eastM: point.eastM - radiusM, no…<br/>calls cellOfPoint"]
  n3["const to = cellOfPoint({ eastM: point.eastM + radiusM, nort…<br/>calls cellOfPoint"]
  n4["const near: { cell: Cell; distance: number; key: string }[]…"]
  n5["let east = from.east"]
  n6{"east #lt;= to.east"}
  n7["let north = from.north"]
  n8{"north #lt;= to.north"}
  n9["const cell = { east, north };"]
  n10["const distance = distanceToCell(point, cell);<br/>calls distanceToCell"]
  n11{"distance #lt;= radiusM"}
  n12["near.push({ cell, distance, key: cellKey(cell) });<br/>calls cellKey"]
  n13["north += 1"]
  n14["east += 1"]
  n15["near.sort((a, b) =#gt; Number(a.key #gt; b.key) - Number(a.key #lt; …"]
  n16["near.sort((a, b) =#gt; a.distance - b.distance);"]
  n17(["return near.map((one) =#gt; one.cell);"])
  n1 --> n2
  n2 --> n3
  n3 --> n4
  n4 --> n5
  n5 --> n6
  n6 -->|"yes"| n7
  n7 --> n8
  n8 -->|"yes"| n9
  n9 --> n10
  n10 --> n11
  n11 -->|"yes"| n12
  n12 --> n13
  n11 -->|"no"| n13
  n13 --> n8
  n8 -->|"no"| n14
  n14 --> n6
  n6 -->|"no"| n15
  n15 --> n16
  n16 --> n17
```
