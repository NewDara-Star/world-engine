# src/controls/actions.ts

Drawn from the code by `npm run diagrams` (TypeScript compiler, no AI). Do not edit by hand: change the code, then run it again.

## noActions

```mermaid
flowchart TD
  n1(["noActions"])
  n2(["return { steer: 0, accelerate: 0, brake: 0, flipUpright: fa…"])
  n1 --> n2
```

## cleanActions

```mermaid
flowchart TD
  n1(["cleanActions"])
  n2{"Number.isFinite(actions.steer)"}
  n3["actions.steer"]
  n4["0"]
  n5["const steer = Number.isFinite(actions.steer) ? actions.stee…"]
  n6{"Number.isFinite(actions.accelerate)"}
  n7["actions.accelerate"]
  n8["0"]
  n9["const accelerate = Number.isFinite(actions.accelerate) ? ac…"]
  n10{"Number.isFinite(actions.brake)"}
  n11["actions.brake"]
  n12["0"]
  n13["const brake = Number.isFinite(actions.brake) ? actions.brak…"]
  n14(["return { steer: Math.max(-1, Math.min(1, steer)), accelerat…"])
  n1 --> n2
  n2 -->|"yes"| n3
  n2 -->|"no"| n4
  n3 --> n5
  n4 --> n5
  n5 --> n6
  n6 -->|"yes"| n7
  n6 -->|"no"| n8
  n7 --> n9
  n8 --> n9
  n9 --> n10
  n10 -->|"yes"| n11
  n10 -->|"no"| n12
  n11 --> n13
  n12 --> n13
  n13 --> n14
```

## strongestActions

```mermaid
flowchart TD
  n1(["strongestActions"])
  n2{"fromDevices.length === 0"}
  n3(["return noActions();<br/>calls noActions"])
  n4["const steers = fromDevices.map((one) =#gt; one.steer);"]
  n5["const furthest = Math.max(...steers.map((steer) =#gt; Math.abs…"]
  n6{"steers.find((steer) =#gt; Math.abs(steer) === furthest) is missing?"}
  n7["0"]
  n8(["return { // find gives the first, so on a tie the first dev…"])
  n1 --> n2
  n2 -->|"yes"| n3
  n2 -->|"no"| n4
  n4 --> n5
  n5 --> n6
  n6 -->|"yes"| n7
  n6 -->|"no"| n8
  n7 --> n8
```

## pressedJustNow

```mermaid
flowchart TD
  n1(["pressedJustNow"])
  n2{"thisFrame"}
  n3["!lastFrame"]
  n4(["return thisFrame && !lastFrame;"])
  n1 --> n2
  n2 -->|"yes"| n3
  n2 -->|"no"| n4
  n3 --> n4
```
