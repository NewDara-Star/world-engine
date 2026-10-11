# src/vehicle/pedals.ts

Drawn from the code by `npm run diagrams` (TypeScript compiler, no AI). Do not edit by hand: change the code, then run it again.

## pedalCommand

```mermaid
flowchart TD
  n1(["pedalCommand"])
  n2{"accelerate #gt; 0"}
  n3{"brake #gt; 0"}
  n4(["return { drive: #quot;none#quot;, throttle: 0, brake };"])
  n5{"accelerate #gt; 0"}
  n6{"forwardSpeedMs #lt; -STOPPED_SPEED_MS"}
  n7(["return { drive: #quot;none#quot;, throttle: 0, brake: accelerate };"])
  n8(["return { drive: #quot;forward#quot;, throttle: accelerate, brake: 0 };"])
  n9{"brake #gt; 0"}
  n10{"forwardSpeedMs #gt; STOPPED_SPEED_MS"}
  n11(["return { drive: #quot;none#quot;, throttle: 0, brake };"])
  n12(["return { drive: #quot;reverse#quot;, throttle: brake, brake: 0 };"])
  n13(["return { drive: #quot;none#quot;, throttle: 0, brake: 0 };"])
  n1 --> n2
  n2 -->|"yes"| n3
  n3 -->|"yes"| n4
  n2 -->|"no"| n5
  n3 -->|"no"| n5
  n5 -->|"yes"| n6
  n6 -->|"yes"| n7
  n6 -->|"no"| n8
  n5 -->|"no"| n9
  n9 -->|"yes"| n10
  n10 -->|"yes"| n11
  n10 -->|"no"| n12
  n9 -->|"no"| n13
```
