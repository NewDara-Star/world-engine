# src/game/physics.ts

Drawn from the code by `npm run diagrams` (TypeScript compiler, no AI). Do not edit by hand: change the code, then run it again.

## startPhysicsEngine

```mermaid
flowchart TD
  n1(["startPhysicsEngine"])
  n2["try"]
  n3["await RAPIER.init();"]
  n4(["return { ok: true };"])
  n5["catch (error)"]
  n6(["return { ok: false, reason: String(error) };"])
  n1 --> n2
  n2 --> n3
  n3 --> n4
  n2 -->|"throws"| n5
  n5 --> n6
```

## createPhysicsWorld

```mermaid
flowchart TD
  n1(["createPhysicsWorld"])
  n2["const world = new RAPIER.World({ x: 0, y: -place.gravityMs2…"]
  n3["world.timestep = PHYSICS_STEP_S;"]
  n4(["return world;"])
  n1 --> n2
  n2 --> n3
  n3 --> n4
```

## addGroundCollider

```mermaid
flowchart TD
  n1(["addGroundCollider"])
  n2["const bounds = cellBounds(cell);<br/>calls cellBounds"]
  n3["const half = CELL_SIZE_M / 2;"]
  n4["const ground = RAPIER.ColliderDesc.cuboid(half, 0.5, half).…"]
  n5(["return world.createCollider(ground).handle;"])
  n1 --> n2
  n2 --> n3
  n3 --> n4
  n4 --> n5
```

## addBuildingColliders

```mermaid
flowchart TD
  n1(["addBuildingColliders"])
  n2["const bounds = cellBounds(chunk.cell);<br/>calls cellBounds"]
  n3["const handles: number[] = [];"]
  n4{"for each const building of buildingOutlinesInMetres(chunk)<br/>calls buildingOutlinesInMetres"}
  n5["const points = new Float32Array(building.outline.length * 6…"]
  n6["building.outline.forEach((corner, at) =#gt; { points.set([corn…"]
  n7["const hull = RAPIER.ColliderDesc.convexHull(points);"]
  n8{"hull === null"}
  n9["continue"]
  n10["handles.push(world.createCollider(hull.setTranslation(bound…"]
  n11(["return handles;"])
  n1 --> n2
  n2 --> n3
  n3 --> n4
  n4 -->|"next item"| n5
  n5 --> n6
  n6 --> n7
  n7 --> n8
  n8 -->|"yes"| n9
  n8 -->|"no"| n10
  n10 --> n4
  n9 --> n4
  n4 -->|"done"| n11
```

## addBuildingColliders > inner function 1

```mermaid
flowchart TD
  n1(["addBuildingColliders #gt; inner function 1"])
  n2["points.set([corner.eastM, 0, -corner.northM, corner.eastM, …"]
  n3(["end"])
  n1 --> n2
  n2 --> n3
```

## addMapEdgeWalls

```mermaid
flowchart TD
  n1(["addMapEdgeWalls"])
  n2["const middleEast = (extent.westM + extent.eastM) / 2;"]
  n3["const middleNorth = (extent.southM + extent.northM) / 2;"]
  n4["const halfAcross = (extent.eastM - extent.westM) / 2 + 1;"]
  n5["const halfAlong = (extent.northM - extent.southM) / 2 + 1;"]
  n6["const walls = [ RAPIER.ColliderDesc.cuboid(0.5, 1.5, halfAl…"]
  n7(["return walls.map((wall) =#gt; world.createCollider(wall).handl…"])
  n1 --> n2
  n2 --> n3
  n3 --> n4
  n4 --> n5
  n5 --> n6
  n6 --> n7
```

## physicsStepsForFrame

```mermaid
flowchart TD
  n1(["physicsStepsForFrame"])
  n2["const owedS = leftOverS + frameS;"]
  n3["const steps = Math.floor(owedS / PHYSICS_STEP_S);"]
  n4{"steps #gt; MOST_STEPS_A_FRAME"}
  n5(["return { steps: MOST_STEPS_A_FRAME, leftOverS: 0, blend: 1 …"])
  n6["const left = owedS - steps * PHYSICS_STEP_S;"]
  n7(["return { steps, leftOverS: left, blend: left / PHYSICS_STEP…"])
  n1 --> n2
  n2 --> n3
  n3 --> n4
  n4 -->|"yes"| n5
  n4 -->|"no"| n6
  n6 --> n7
```

## blendPoses

```mermaid
flowchart TD
  n1(["blendPoses"])
  n2["const turn = new Quaternion(before.rotation.x, before.rotat…"]
  n3(["return { position: { x: before.position.x + (after.position…"])
  n1 --> n2
  n2 --> n3
```
