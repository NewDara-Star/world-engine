# src/place/place.ts

Drawn from the code by `npm run diagrams` (TypeScript compiler, no AI). Do not edit by hand: change the code, then run it again.

## firstRepeatedVehicleClass

```mermaid
flowchart TD
  n1(["firstRepeatedVehicleClass"])
  n2(["return classes.find((name, index) =#gt; classes.indexOf(name) …"])
  n1 --> n2
```

## sourceProblemForOneConstant

```mermaid
flowchart TD
  n1(["sourceProblemForOneConstant"])
  n2["const positions = sources .map((source, index) =#gt; ({ quanti…"]
  n3{"positions.length === 0"}
  n4(["return [problemAt([#quot;constantsSources#quot;], #96;\#96;constantsSources…<br/>calls problemAt"])
  n5{"positions.length === 1"}
  n6(["return [];"])
  n7(["return [ problemAt( [#quot;constantsSources#quot;, ...positions.slice…<br/>calls problemAt"])
  n1 --> n2
  n2 --> n3
  n3 -->|"yes"| n4
  n3 -->|"no"| n5
  n5 -->|"yes"| n6
  n5 -->|"no"| n7
```

## sourceProblemsForConstants

```mermaid
flowchart TD
  n1(["sourceProblemsForConstants"])
  n2(["return CONSTANT_QUANTITIES.flatMap((quantity) =#gt; sourceProb…<br/>calls sourceProblemForOneConstant"])
  n1 --> n2
```

## repeatedClassProblemsInPlace

```mermaid
flowchart TD
  n1(["repeatedClassProblemsInPlace"])
  n2["const repeated = firstRepeatedVehicleClass(place.allowedVeh…<br/>calls firstRepeatedVehicleClass"]
  n3{"repeated !== undefined"}
  n4(["return [problemAt([#quot;allowedVehicleClasses#quot;], #96;\#96;allowedVehi…<br/>calls problemAt"])
  n5(["return [];"])
  n1 --> n2
  n2 --> n3
  n3 -->|"yes"| n4
  n3 -->|"no"| n5
```

## validatePlace

```mermaid
flowchart TD
  n1(["validatePlace"])
  n2(["return validateJsonFile(fileName, text, placeChecker);<br/>calls validateJsonFile"])
  n1 --> n2
```
