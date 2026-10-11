# src/game/streaming.ts

Drawn from the code by `npm run diagrams` (TypeScript compiler, no AI). Do not edit by hand: change the code, then run it again.

## streamingPlan

```mermaid
flowchart TD
  n1(["streamingPlan"])
  n2["const loadedKeys = new Set(loaded.map(cellKey));"]
  n3["const toLoad: Cell[] = [];"]
  n4{"for each const cell of cellsWithin(car, loadRadiusM)<br/>calls cellsWithin"}
  n5["const bounds = cellBounds(cell);<br/>calls cellBounds"]
  n6{"bounds.westM #gt;= extent.westM"}
  n7{"bounds.eastM #lt;= extent.eastM"}
  n8{"bounds.southM #gt;= extent.southM"}
  n9["bounds.northM #lt;= extent.northM"]
  n10["const inside = bounds.westM #gt;= extent.westM && bounds.eastM…"]
  n11{"inside"}
  n12{"!loadedKeys.has(cellKey(cell))<br/>calls cellKey"}
  n13["toLoad.push(cell);"]
  n14["const toLetGo = loaded.filter((cell) =#gt; distanceToCell(car,…<br/>calls distanceToCell"]
  n15(["return { toLoad, toLetGo };"])
  n1 --> n2
  n2 --> n3
  n3 --> n4
  n4 -->|"next item"| n5
  n5 --> n6
  n6 -->|"yes"| n7
  n7 -->|"yes"| n8
  n8 -->|"yes"| n9
  n6 -->|"no"| n10
  n7 -->|"no"| n10
  n8 -->|"no"| n10
  n9 --> n10
  n10 --> n11
  n11 -->|"yes"| n12
  n12 -->|"yes"| n13
  n13 --> n4
  n11 -->|"no"| n4
  n12 -->|"no"| n4
  n4 -->|"done"| n14
  n14 --> n15
```

## loadCell

```mermaid
flowchart TD
  n1(["loadCell"])
  n2["const key = cellKey(cell);<br/>calls cellKey"]
  n3["const groundMesh = groundTileMesh(cell, game.parts.groundMa…<br/>calls groundTileMesh"]
  n4["game.parts.scene.add(groundMesh);"]
  n5["const groundCollider = addGroundCollider(game.world, cell);<br/>calls addGroundCollider"]
  n6["const hasRoad = game.roadCells.has(key);"]
  n7{"hasRoad"}
  n8["#quot;loading#quot;"]
  n9["#quot;not-needed#quot;"]
  n10["game.squares.set(key, { cell, groundMesh, groundCollider, r…"]
  n11{"!hasRoad"}
  n12(["return;"])
  n13["void fetchText(#96;places/${game.data.place.id}/chunks/${key}.…<br/>calls fetchText, roadArrived"]
  n14(["end"])
  n1 --> n2
  n2 --> n3
  n3 --> n4
  n4 --> n5
  n5 --> n6
  n6 --> n7
  n7 -->|"yes"| n8
  n7 -->|"no"| n9
  n8 --> n10
  n9 --> n10
  n10 --> n11
  n11 -->|"yes"| n12
  n11 -->|"no"| n13
  n13 --> n14
```

## roadArrived

```mermaid
flowchart TD
  n1(["roadArrived"])
  n2["const key = cellKey(cell);<br/>calls cellKey"]
  n3["const square = game.squares.get(key);"]
  n4{"square === undefined"}
  n5{"square.road !== #quot;loading#quot;"}
  n6(["return;"])
  n7{"answer.ok"}
  n8["validateChunk(#96;${key}.json#96;, answer.value, cell)<br/>calls validateChunk"]
  n9["undefined"]
  n10["const chunk = answer.ok ? validateChunk(#96;${key}.json#96;, answ…<br/>calls validateChunk"]
  n11{"chunk === undefined"}
  n12{"!chunk.ok"}
  n13["square.road = #quot;failed#quot;;"]
  n14["square.failedAtMs = performance.now();"]
  n15{"!square.failedBefore"}
  n16["showNotice(game.page, #quot;Part of the map did not load; trying…<br/>calls showNotice"]
  n17["square.failedBefore = true;"]
  n18(["return;"])
  n19["square.roadMesh = roadMeshFromChunk(chunk.value, game.parts…<br/>calls roadMeshFromChunk"]
  n20["game.parts.scene.add(square.roadMesh);"]
  n21["square.road = #quot;loaded#quot;;"]
  n22(["end"])
  n1 --> n2
  n2 --> n3
  n3 --> n4
  n4 -->|"no"| n5
  n4 -->|"yes"| n6
  n5 -->|"yes"| n6
  n5 -->|"no"| n7
  n7 -->|"yes"| n8
  n7 -->|"no"| n9
  n8 --> n10
  n9 --> n10
  n10 --> n11
  n11 -->|"no"| n12
  n11 -->|"yes"| n13
  n12 -->|"yes"| n13
  n13 --> n14
  n14 --> n15
  n15 -->|"yes"| n16
  n16 --> n17
  n15 -->|"no"| n17
  n17 --> n18
  n12 -->|"no"| n19
  n19 --> n20
  n20 --> n21
  n21 --> n22
```

## unloadCell

```mermaid
flowchart TD
  n1(["unloadCell"])
  n2["const key = cellKey(cell);<br/>calls cellKey"]
  n3["const square = game.squares.get(key);"]
  n4{"square === undefined"}
  n5(["return;"])
  n6["releaseMesh(square.groundMesh, game.parts.scene);<br/>calls releaseMesh"]
  n7["game.world.removeCollider(game.world.getCollider(square.gro…"]
  n8{"square.roadMesh !== undefined"}
  n9["releaseMesh(square.roadMesh, game.parts.scene);<br/>calls releaseMesh"]
  n10["game.squares.delete(key);"]
  n11(["end"])
  n1 --> n2
  n2 --> n3
  n3 --> n4
  n4 -->|"yes"| n5
  n4 -->|"no"| n6
  n6 --> n7
  n7 --> n8
  n8 -->|"yes"| n9
  n9 --> n10
  n8 -->|"no"| n10
  n10 --> n11
```

## retryFailedRoads

```mermaid
flowchart TD
  n1(["retryFailedRoads"])
  n2{"for each const [key, square] of game.squares"}
  n3{"square.road === #quot;failed#quot;"}
  n4{"square.failedAtMs is missing?"}
  n5["nowMs"]
  n6{"nowMs - (square.failedAtMs ?? nowMs) #gt;= RETRY_AFTER_MS"}
  n7["square.road = #quot;loading#quot;;"]
  n8["void fetchText(#96;places/${game.data.place.id}/chunks/${key}.…<br/>calls fetchText, roadArrived"]
  n9(["end"])
  n1 --> n2
  n2 -->|"next item"| n3
  n3 -->|"yes"| n4
  n4 -->|"yes"| n5
  n4 -->|"no"| n6
  n5 --> n6
  n6 -->|"yes"| n7
  n7 --> n8
  n8 --> n2
  n3 -->|"no"| n2
  n6 -->|"no"| n2
  n2 -->|"done"| n9
```

## updateStreaming

```mermaid
flowchart TD
  n1(["updateStreaming"])
  n2["const plan = streamingPlan(car, [...game.squares.values()].…<br/>calls streamingPlan"]
  n3{"for each const cell of plan.toLetGo"}
  n4["unloadCell(game, cell);<br/>calls unloadCell"]
  n5{"for each const cell of plan.toLoad"}
  n6["loadCell(game, cell);<br/>calls loadCell"]
  n7["retryFailedRoads(game, nowMs);<br/>calls retryFailedRoads"]
  n8(["end"])
  n1 --> n2
  n2 --> n3
  n3 -->|"next item"| n4
  n4 --> n3
  n3 -->|"done"| n5
  n5 -->|"next item"| n6
  n6 --> n5
  n5 -->|"done"| n7
  n7 --> n8
```
