# src/game/physics.ts

Status: draft

New in scope 005 (items 4 and 5). The physics world: Rapier, started once,
pulling down with the place's gravity (D-0009), the flat ground one collider
per 100 m square (D-0008; research/36 section 2, item 7: road colliders add
nothing while ground and road are both flat at 0 m), walls at the map's
edge, and fixed 1/60 s steps (Sketchbook `World.ts`, research/36 section 3).
Rapier 0.21.0 API from its type files: `init`, `World`, `timestep`,
`ColliderDesc.cuboid`, `createCollider`, `removeCollider`. The pictures drawn
from the code will be in `docs/flows/src/game/physics.md`.

## startPhysicsEngine

Why the game needs it: the physics engine is WebAssembly and must be started before anything moves; on a phone that cannot run it, the player is told.

```mermaid
flowchart TD
  s(["startPhysicsEngine"])
  a["start Rapier's WebAssembly"]
  b{"did it start"}
  c(["return failure: physics did not start, with the browser's reason"])
  d(["return started"])
  s --> a --> b
  b -->|"no"| c
  b -->|"yes"| d
```

## createPhysicsWorld

Why the game needs it: things fall at the place's own gravity, so a Mars place later falls slower with no code change.

```mermaid
flowchart TD
  s(["createPhysicsWorld for the place"])
  a(["return a world with gravity 0, minus the place's gravity, 0, and a fixed time step of 1/60 s"])
  s --> a
```

## addGroundCollider

Why the game needs it: the car can drive anywhere on the flat ground, on the road and off it, in every square near it, whether or not that square's road file has arrived.

```mermaid
flowchart TD
  s(["addGroundCollider to the world for a square"])
  a["a fixed box 100 m by 100 m across and 1 m deep, its top at height 0, centred on the square"]
  b(["return the collider's handle, kept with the square so it can be removed"])
  s --> a --> b
```

## addMapEdgeWalls

Why the game needs it: the map ends somewhere; the player meets an invisible wall at the edge instead of driving off into nothing.

```mermaid
flowchart TD
  s(["addMapEdgeWalls to the world for the map's extent"])
  a["four fixed boxes, 1 m thick and 3 m tall, standing just outside the west, south, east and north edges, each long enough to close the corners"]
  b(["return their handles"])
  s --> a --> b
```

## physicsStepsForFrame

Why the game needs it: the car behaves the same on a 60 Hz phone, a 120 Hz Mac and a phone that stutters, because physics always moves in equal steps; after a long pause it catches up only a little instead of fast-forwarding.

```mermaid
flowchart TD
  s(["physicsStepsForFrame with the time left over from the last frame and this frame's length"])
  a["time owed = left over plus this frame"]
  b["steps = whole number of 1/60 s steps in the time owed"]
  c{"more than 5 steps"}
  d(["return 5 steps, nothing left over, and a blend fraction of 1: the rest of a long pause is dropped"])
  e(["return the steps, the time left over, and the blend fraction: left over divided by one step"])
  s --> a --> b --> c
  c -->|"yes"| d
  c -->|"no"| e
```

## blendPoses

Why the game needs it: the car is drawn between its last two physics positions, so it glides on a 120 Hz screen instead of moving in 60 Hz jerks.

```mermaid
flowchart TD
  s(["blendPoses with the pose before the last step, the pose after it, and the blend fraction"])
  a(["return the position moved that fraction of the way, and the turn blended the same fraction along the shortest arc"])
  s --> a
```
