# src/camera/chase.ts

Drawn from the code by `npm run diagrams` (TypeScript compiler, no AI). Do not edit by hand: change the code, then run it again.

## followFraction

```mermaid
flowchart TD
  n1(["followFraction"])
  n2(["return 1 - Math.exp(-ratePerS * frameS);"])
  n1 --> n2
```

## chaseCameraGoal

```mermaid
flowchart TD
  n1(["chaseCameraGoal"])
  n2["const forward = flatHeading(car.rotation);<br/>calls flatHeading"]
  n3(["return { cameraPoint: { x: car.position.x - forward.x * CAM…"])
  n1 --> n2
  n2 --> n3
```

## moveChaseCamera

```mermaid
flowchart TD
  n1(["moveChaseCamera"])
  n2{"carJumped"}
  n3(["return goal;"])
  n4["const fraction = followFraction(FOLLOW_RATE_PER_S, frameS);<br/>calls followFraction"]
  n5(["return { cameraPoint: { x: camera.cameraPoint.x + (goal.cam…"])
  n1 --> n2
  n2 -->|"yes"| n3
  n2 -->|"no"| n4
  n4 --> n5
```
