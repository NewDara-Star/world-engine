# src/place/planet.ts

Drawn from the code by `npm run diagrams` (TypeScript compiler, no AI). Do not edit by hand: change the code, then run it again.

## requirePlanetRange

```mermaid
flowchart TD
  n1(["requirePlanetRange"])
  n2["const rangeShape = { min: requireNumberAtLeast(0, unit), ma…<br/>calls requireNumberAtLeast, requireOneOf, requireText"]
  n3(["return addCrossFieldRules(rangeShape, [{ reads: [#quot;min#quot;, #quot;ma…<br/>calls addCrossFieldRules"])
  n1 --> n2
  n2 --> n3
```

## minAboveMaxProblems

```mermaid
flowchart TD
  n1(["minAboveMaxProblems"])
  n2{"range.min #gt; range.max"}
  n3(["return [problemAt([#quot;min#quot;], #96;\#96;min\#96; is ${range.min}, above …<br/>calls problemAt"])
  n4(["return [];"])
  n1 --> n2
  n2 -->|"yes"| n3
  n2 -->|"no"| n4
```

## validatePlanet

```mermaid
flowchart TD
  n1(["validatePlanet"])
  n2(["return validateJsonFile(fileName, text, planetChecker);<br/>calls validateJsonFile"])
  n1 --> n2
```
