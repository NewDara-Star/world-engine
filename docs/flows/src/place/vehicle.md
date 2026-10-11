# src/place/vehicle.ts

Drawn from the code by `npm run diagrams` (TypeScript compiler, no AI). Do not edit by hand: change the code, then run it again.

## movementProblemInVehicle

```mermaid
flowchart TD
  n1(["movementProblemInVehicle"])
  n2["const allowed = dynamicsFor[vehicle.class];"]
  n3{"allowed.includes(vehicle.dynamics)"}
  n4(["return [];"])
  n5["const ways = allowed.map((way) =#gt; #96;\#96;${way}\#96;#96;).join(#quot;, #quot;);"]
  n6(["return [problemAt([#quot;dynamics#quot;], #96;a ${vehicle.class} cannot …<br/>calls problemAt"])
  n1 --> n2
  n2 --> n3
  n3 -->|"yes"| n4
  n3 -->|"no"| n5
  n5 --> n6
```

## validateVehicle

```mermaid
flowchart TD
  n1(["validateVehicle"])
  n2(["return validateJsonFile(fileName, text, vehicleChecker);<br/>calls validateJsonFile"])
  n1 --> n2
```
