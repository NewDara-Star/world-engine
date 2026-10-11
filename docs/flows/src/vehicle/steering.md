# src/vehicle/steering.ts

Drawn from the code by `npm run diagrams` (TypeScript compiler, no AI). Do not edit by hand: change the code, then run it again.

## steeringLimitRad

```mermaid
flowchart TD
  n1(["steeringLimitRad"])
  n2(["return maxSteerAngleRad(vehicle) / Math.max(1, STEER_SHRINK…<br/>calls maxSteerAngleRad"])
  n1 --> n2
```

## steerRateFor

```mermaid
flowchart TD
  n1(["steerRateFor"])
  n2{"currentFraction * wantedFraction #lt; 0"}
  n3(["return STEER_RATE_ACROSS_MIDDLE;"])
  n4{"Math.abs(wantedFraction) #lt; Math.abs(currentFraction)"}
  n5(["return STEER_RATE_BACK_TO_MIDDLE;"])
  n6(["return STEER_RATE_TOWARD_LOCK;"])
  n1 --> n2
  n2 -->|"yes"| n3
  n2 -->|"no"| n4
  n4 -->|"yes"| n5
  n4 -->|"no"| n6
```

## steeringAfter

```mermaid
flowchart TD
  n1(["steeringAfter"])
  n2["const most = steerRateFor(currentFraction, steer) * stepS;<br/>calls steerRateFor"]
  n3{"Math.abs(steer - currentFraction) #lt;= most"}
  n4(["return steer;"])
  n5(["return currentFraction + Math.sign(steer - currentFraction)…"])
  n1 --> n2
  n2 --> n3
  n3 -->|"yes"| n4
  n3 -->|"no"| n5
```
