# src/vehicle/drive-force.ts

Drawn from the code by `npm run diagrams` (TypeScript compiler, no AI). Do not edit by hand: change the code, then run it again.

## engineRpm

```mermaid
flowchart TD
  n1(["engineRpm"])
  n2(["return (forwardSpeedMs * gearRatio * vehicle.engine.finalDr…"])
  n1 --> n2
```

## engineTorqueNm

```mermaid
flowchart TD
  n1(["engineTorqueNm"])
  n2["const { peakTorqueNm, peakPowerKw, redlineRpm } = vehicle.e…"]
  n3{"rpm #gt; redlineRpm"}
  n4(["return 0;"])
  n5{"rpm #gt; 0"}
  n6(["return Math.min(peakTorqueNm, (peakPowerKw * 1000) / ((rpm …"])
  n7(["return peakTorqueNm;"])
  n1 --> n2
  n2 --> n3
  n3 -->|"yes"| n4
  n3 -->|"no"| n5
  n5 -->|"yes"| n6
  n5 -->|"no"| n7
```

## gearboxAfter

```mermaid
flowchart TD
  n1(["gearboxAfter"])
  n2{"gearbox.changeLeftS #gt; 0"}
  n3(["return { gear: gearbox.gear, changeLeftS: Math.max(0, gearb…"])
  n4["const { forwardGearRatios: ratios, redlineRpm, gearChangeS …"]
  n5{"ratios[gearbox.gear - 1] is missing?"}
  n6["Number.NaN"]
  n7["const ratio = ratios[gearbox.gear - 1] ?? Number.NaN;"]
  n8["const ratioAbove = ratios[gearbox.gear];"]
  n9["const ratioBelow = ratios[gearbox.gear - 2];"]
  n10{"ratioAbove !== undefined"}
  n11{"engineRpm(vehicle, forwardSpeedMs, ratio) #gt;= redlineRpm<br/>calls engineRpm"}
  n12(["return { gear: gearbox.gear + 1, changeLeftS: gearChangeS };"])
  n13{"ratioBelow !== undefined"}
  n14{"engineRpm(vehicle, forwardSpeedMs, ratioBelow) #lt;= (redlineR…<br/>calls engineRpm"}
  n15(["return { gear: gearbox.gear - 1, changeLeftS: gearChangeS };"])
  n16(["return gearbox;"])
  n1 --> n2
  n2 -->|"yes"| n3
  n2 -->|"no"| n4
  n4 --> n5
  n5 -->|"yes"| n6
  n5 -->|"no"| n7
  n6 --> n7
  n7 --> n8
  n8 --> n9
  n9 --> n10
  n10 -->|"yes"| n11
  n11 -->|"yes"| n12
  n10 -->|"no"| n13
  n11 -->|"no"| n13
  n13 -->|"yes"| n14
  n14 -->|"yes"| n15
  n13 -->|"no"| n16
  n14 -->|"no"| n16
```

## forwardDriveForceN

```mermaid
flowchart TD
  n1(["forwardDriveForceN"])
  n2{"gearbox.changeLeftS #gt; 0"}
  n3(["return 0;"])
  n4["const { finalDriveRatio, drivetrainEfficiency } = vehicle.e…"]
  n5{"vehicle.engine.forwardGearRatios[gearbox.gear - 1] is missing?"}
  n6["Number.NaN"]
  n7["const ratio = vehicle.engine.forwardGearRatios[gearbox.gear…"]
  n8["const torque = engineTorqueNm(vehicle, engineRpm(vehicle, f…<br/>calls engineTorqueNm, engineRpm"]
  n9["const wheelForceN = (throttle * torque * ratio * finalDrive…"]
  n10(["return wheelForceN / rotatingMassFactor(ratio * finalDriveR…<br/>calls rotatingMassFactor"])
  n1 --> n2
  n2 -->|"yes"| n3
  n2 -->|"no"| n4
  n4 --> n5
  n5 -->|"yes"| n6
  n5 -->|"no"| n7
  n6 --> n7
  n7 --> n8
  n8 --> n9
  n9 --> n10
```

## rotatingMassFactor

```mermaid
flowchart TD
  n1(["rotatingMassFactor"])
  n2(["return 1.04 + 0.0025 * overallRatio * overallRatio;"])
  n1 --> n2
```

## reverseDriveForceN

```mermaid
flowchart TD
  n1(["reverseDriveForceN"])
  n2["const { peakTorqueNm, reverseGearRatio, finalDriveRatio, dr…"]
  n3["const limitMs = (redlineRpm * 2 * Math.PI * vehicle.wheels.…"]
  n4{"backwardSpeedMs #gt;= limitMs"}
  n5(["return 0;"])
  n6(["return (throttle * peakTorqueNm * reverseGearRatio * finalD…"])
  n1 --> n2
  n2 --> n3
  n3 --> n4
  n4 -->|"yes"| n5
  n4 -->|"no"| n6
```

## airDragN

```mermaid
flowchart TD
  n1(["airDragN"])
  n2(["return -0.5 * airDensityKgM3 * vehicle.air.dragCoefficient …"])
  n1 --> n2
```

## rollingResistanceN

```mermaid
flowchart TD
  n1(["rollingResistanceN"])
  n2(["return vehicle.wheels.rollingResistance * vehicle.body.mass…"])
  n1 --> n2
```
