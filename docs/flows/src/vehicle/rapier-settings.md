# src/vehicle/rapier-settings.ts

Drawn from the code by `npm run diagrams` (TypeScript compiler, no AI). Do not edit by hand: change the code, then run it again.

## cornerMassKg

```mermaid
flowchart TD
  n1(["cornerMassKg"])
  n2{"axle === #quot;front#quot;"}
  n3(["return (vehicle.body.massKg * vehicle.body.frontAxleLoadSha…"])
  n4(["return (vehicle.body.massKg * (1 - vehicle.body.frontAxleLo…"])
  n1 --> n2
  n2 -->|"yes"| n3
  n2 -->|"no"| n4
```

## suspensionForAxle

```mermaid
flowchart TD
  n1(["suspensionForAxle"])
  n2["const omega = 2 * Math.PI * vehicle.wheels.rideFrequencyHz;"]
  n3["const corner = cornerMassKg(vehicle, axle);<br/>calls cornerMassKg"]
  n4["const wheelRate = omega ** 2 * corner;"]
  n5["const damping = 2 * vehicle.wheels.dampingRatio * omega * c…"]
  n6["const restLength = gravityMs2 / omega ** 2 + vehicle.wheels…"]
  n7(["return { suspensionStiffness: wheelRate / vehicle.body.mass…"])
  n1 --> n2
  n2 --> n3
  n3 --> n4
  n4 --> n5
  n5 --> n6
  n6 --> n7
```

## wheelMountPoints

```mermaid
flowchart TD
  n1(["wheelMountPoints"])
  n2["const { body, wheels, drivenAxle } = vehicle;"]
  n3["const toFront = body.wheelbaseM * (1 - body.frontAxleLoadSh…"]
  n4["const toRear = body.wheelbaseM * body.frontAxleLoadShare;"]
  n5["const height = wheels.radiusM + wheels.suspensionTravelM / …"]
  n6["const halfTrack = body.trackM / 2;"]
  n7["const frontDriven = drivenAxle !== #quot;rear#quot;;"]
  n8["const rearDriven = drivenAxle !== #quot;front#quot;;"]
  n9(["return [ { axle: #quot;front#quot;, position: { x: toFront, y: height…"])
  n1 --> n2
  n2 --> n3
  n3 --> n4
  n4 --> n5
  n5 --> n6
  n6 --> n7
  n7 --> n8
  n8 --> n9
```

## chassisMassProperties

```mermaid
flowchart TD
  n1(["chassisMassProperties"])
  n2["const { body, wheels } = vehicle;"]
  n3["const length = body.lengthM;"]
  n4["const height = body.heightM - wheels.radiusM;"]
  n5["const width = body.widthM;"]
  n6["const offsetUp = (wheels.radiusM + body.heightM) / 2 - body…"]
  n7["const mass = body.massKg;"]
  n8(["return { halfExtents: { x: length / 2, y: height / 2, z: wi…"])
  n1 --> n2
  n2 --> n3
  n3 --> n4
  n4 --> n5
  n5 --> n6
  n6 --> n7
  n7 --> n8
```

## maxSteerAngleRad

```mermaid
flowchart TD
  n1(["maxSteerAngleRad"])
  n2(["return Math.asin(vehicle.body.wheelbaseM / (vehicle.wheels.…"])
  n1 --> n2
```

## maxBrakeForceN

```mermaid
flowchart TD
  n1(["maxBrakeForceN"])
  n2["const deceleration = vehicle.brakes.testFromSpeedMs ** 2 / …"]
  n3(["return vehicle.body.massKg * deceleration;"])
  n1 --> n2
  n2 --> n3
```

## tyreSettings

```mermaid
flowchart TD
  n1(["tyreSettings"])
  n2(["return { frictionSlip: vehicle.wheels.tyreFriction, sideFri…"])
  n1 --> n2
```
