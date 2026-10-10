# src/place/vehicle.ts

Drawn from the code by `npm run diagrams` (TypeScript compiler, no AI). Do not edit by hand: change the code, then run it again.

## module > inner function 1

```mermaid
flowchart TD
  n1(["module #gt; inner function 1"])
  n2{"dynamicsFor[vehicle.class].includes(vehicle.dynamics)"}
  n3["undefined"]
  n4["#96;a ${vehicle.class} cannot move as #quot;${vehicle.dynamics}#quot; (i…"]
  n5(["return dynamicsFor[vehicle.class].includes(vehicle.dynamics) ? und"])
  n1 --> n2
  n2 -->|"yes"| n3
  n2 -->|"no"| n4
  n3 --> n5
  n4 --> n5
```

## validateVehicle

```mermaid
flowchart TD
  n1(["validateVehicle"])
  n2(["return vehicleParser(json, #quot;#quot;);<br/>calls vehicleParser"])
  n1 --> n2
```
