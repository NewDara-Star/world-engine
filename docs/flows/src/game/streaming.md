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
  n7["const hasBuildings = game.buildingCells.has(key);"]
  n8{"hasRoad"}
  n9["#quot;loading#quot;"]
  n10["#quot;not-needed#quot;"]
  n11{"hasBuildings"}
  n12["#quot;loading#quot;"]
  n13["#quot;not-needed#quot;"]
  n14["game.squares.set(key, { cell, groundMesh, groundCollider, r…"]
  n15{"hasRoad"}
  n16["fetchRoad(game, cell);<br/>calls fetchRoad"]
  n17{"hasBuildings"}
  n18["fetchBuildings(game, cell);<br/>calls fetchBuildings"]
  n19(["end"])
  n1 --> n2
  n2 --> n3
  n3 --> n4
  n4 --> n5
  n5 --> n6
  n6 --> n7
  n7 --> n8
  n8 -->|"yes"| n9
  n8 -->|"no"| n10
  n9 --> n11
  n10 --> n11
  n11 -->|"yes"| n12
  n11 -->|"no"| n13
  n12 --> n14
  n13 --> n14
  n14 --> n15
  n15 -->|"yes"| n16
  n16 --> n17
  n15 -->|"no"| n17
  n17 -->|"yes"| n18
  n18 --> n19
  n17 -->|"no"| n19
```

## fetchRoad

```mermaid
flowchart TD
  n1(["fetchRoad"])
  n2["void fetchText(#96;places/${game.data.place.id}/chunks/${cellK…<br/>calls fetchText, cellKey, roadArrived"]
  n3(["end"])
  n1 --> n2
  n2 --> n3
```

## fetchBuildings

```mermaid
flowchart TD
  n1(["fetchBuildings"])
  n2["void fetchText(#96;places/${game.data.place.id}/chunks/buildin…<br/>calls fetchText, cellKey, buildingsArrived"]
  n3(["end"])
  n1 --> n2
  n2 --> n3
```

## tellFirstFailure

```mermaid
flowchart TD
  n1(["tellFirstFailure"])
  n2{"!square.failedBefore"}
  n3["showNotice(game.page, #quot;Part of the map did not load; trying…<br/>calls showNotice"]
  n4["square.failedBefore = true;"]
  n5(["end"])
  n1 --> n2
  n2 -->|"yes"| n3
  n3 --> n4
  n2 -->|"no"| n4
  n4 --> n5
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
  n15["tellFirstFailure(game, square);<br/>calls tellFirstFailure"]
  n16(["return;"])
  n17["square.roadMesh = roadMeshFromChunk(chunk.value, game.parts…<br/>calls roadMeshFromChunk"]
  n18["game.parts.scene.add(square.roadMesh);"]
  n19["square.road = #quot;loaded#quot;;"]
  n20(["end"])
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
  n15 --> n16
  n12 -->|"no"| n17
  n17 --> n18
  n18 --> n19
  n19 --> n20
```

## buildingsArrived

```mermaid
flowchart TD
  n1(["buildingsArrived"])
  n2["const key = cellKey(cell);<br/>calls cellKey"]
  n3["const square = game.squares.get(key);"]
  n4{"square === undefined"}
  n5{"square.buildings !== #quot;loading#quot;"}
  n6(["return;"])
  n7{"answer.ok"}
  n8["validateBuildingChunk(#96;buildings_${key}.json#96;, answer.value…<br/>calls validateBuildingChunk"]
  n9["undefined"]
  n10["const chunk = answer.ok ? validateBuildingChunk(#96;buildings_…<br/>calls validateBuildingChunk"]
  n11{"chunk === undefined"}
  n12{"!chunk.ok"}
  n13["square.buildings = #quot;failed#quot;;"]
  n14["square.buildingsFailedAtMs = performance.now();"]
  n15["tellFirstFailure(game, square);<br/>calls tellFirstFailure"]
  n16(["return;"])
  n17["square.buildingMesh = buildingMeshFromChunk(chunk.value, ga…<br/>calls buildingMeshFromChunk"]
  n18["game.parts.scene.add(square.buildingMesh);"]
  n19["square.buildingColliders = addBuildingColliders(game.world,…<br/>calls addBuildingColliders"]
  n20["square.buildings = #quot;loaded#quot;;"]
  n21(["end"])
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
  n15 --> n16
  n12 -->|"no"| n17
  n17 --> n18
  n18 --> n19
  n19 --> n20
  n20 --> n21
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
  n10{"square.buildingMesh !== undefined"}
  n11["releaseMesh(square.buildingMesh, game.parts.scene);<br/>calls releaseMesh"]
  n12{"for each const handle of square.buildingColliders"}
  n13["game.world.removeCollider(game.world.getCollider(handle), f…"]
  n14["game.squares.delete(key);"]
  n15(["end"])
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
  n10 -->|"yes"| n11
  n11 --> n12
  n10 -->|"no"| n12
  n12 -->|"next item"| n13
  n13 --> n12
  n12 -->|"done"| n14
  n14 --> n15
```

## retryFailedFiles

```mermaid
flowchart TD
  n1(["retryFailedFiles"])
  n2{"for each const square of game.squares.values()"}
  n3{"square.road === #quot;failed#quot;"}
  n4{"square.failedAtMs is missing?"}
  n5["nowMs"]
  n6{"nowMs - (square.failedAtMs ?? nowMs) #gt;= RETRY_AFTER_MS"}
  n7["square.road = #quot;loading#quot;;"]
  n8["fetchRoad(game, square.cell);<br/>calls fetchRoad"]
  n9{"square.buildings === #quot;failed#quot;"}
  n10{"square.buildingsFailedAtMs is missing?"}
  n11["nowMs"]
  n12{"nowMs - (square.buildingsFailedAtMs ?? nowMs) #gt;= RETRY_AFTE…"}
  n13["square.buildings = #quot;loading#quot;;"]
  n14["fetchBuildings(game, square.cell);<br/>calls fetchBuildings"]
  n15(["end"])
  n1 --> n2
  n2 -->|"next item"| n3
  n3 -->|"yes"| n4
  n4 -->|"yes"| n5
  n4 -->|"no"| n6
  n5 --> n6
  n6 -->|"yes"| n7
  n7 --> n8
  n8 --> n9
  n3 -->|"no"| n9
  n6 -->|"no"| n9
  n9 -->|"yes"| n10
  n10 -->|"yes"| n11
  n10 -->|"no"| n12
  n11 --> n12
  n12 -->|"yes"| n13
  n13 --> n14
  n14 --> n2
  n9 -->|"no"| n2
  n12 -->|"no"| n2
  n2 -->|"done"| n15
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
  n7["retryFailedFiles(game, nowMs);<br/>calls retryFailedFiles"]
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
