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

## figurePresenceProblemsInVehicle

```mermaid
flowchart TD
  n1(["figurePresenceProblemsInVehicle"])
  n2{"vehicle.dynamics === #quot;wheeled#quot;"}
  n3(["return DRIVING_FIELDS.filter((name) =#gt; vehicle[name] === un…<br/>calls problemAt, labelForPath"])
  n4(["return DRIVING_FIELDS.filter((name) =#gt; vehicle[name] !== un…<br/>calls problemAt, labelForPath"])
  n1 --> n2
  n2 -->|"yes"| n3
  n2 -->|"no"| n4
```

## figureNamesInShape

```mermaid
flowchart TD
  n1(["figureNamesInShape"])
  n2(["return Object.entries(groups).flatMap(([group, fields]) =#gt; …"])
  n1 --> n2
```

## sizeProblemsInVehicle

```mermaid
flowchart TD
  n1(["sizeProblemsInVehicle"])
  n2["const { body, wheels } = vehicle;"]
  n3{"body === undefined"}
  n4{"wheels === undefined"}
  n5(["return [];"])
  n6["const problems: Problem[] = [];"]
  n7{"!(body.wheelbaseM #lt; body.lengthM)"}
  n8["problems.push(problemAt([#quot;body#quot;, #quot;wheelbaseM#quot;], #96;\#96;body.whe…<br/>calls problemAt"]
  n9{"!(body.trackM #lt; body.widthM)"}
  n10["problems.push(problemAt([#quot;body#quot;, #quot;trackM#quot;], #96;\#96;body.trackM\…<br/>calls problemAt"]
  n11{"!(body.centreOfMassHeightM #lt; body.heightM)"}
  n12["problems.push( problemAt( [#quot;body#quot;, #quot;centreOfMassHeightM#quot;], …<br/>calls problemAt"]
  n13{"!(2 * wheels.radiusM #lt; body.heightM)"}
  n14["problems.push(problemAt([#quot;wheels#quot;, #quot;radiusM#quot;], #96;\#96;wheels.ra…<br/>calls problemAt"]
  n15(["return problems;"])
  n1 --> n2
  n2 --> n3
  n3 -->|"no"| n4
  n3 -->|"yes"| n5
  n4 -->|"yes"| n5
  n4 -->|"no"| n6
  n6 --> n7
  n7 -->|"yes"| n8
  n8 --> n9
  n7 -->|"no"| n9
  n9 -->|"yes"| n10
  n10 --> n11
  n9 -->|"no"| n11
  n11 -->|"yes"| n12
  n12 --> n13
  n11 -->|"no"| n13
  n13 -->|"yes"| n14
  n14 --> n15
  n13 -->|"no"| n15
```

## turningProblemInVehicle

```mermaid
flowchart TD
  n1(["turningProblemInVehicle"])
  n2["const { body, wheels } = vehicle;"]
  n3{"body === undefined"}
  n4{"wheels === undefined"}
  n5(["return [];"])
  n6{"wheels.turningCircleM / 2 - body.trackM / 2 #gt; body.wheelbas…"}
  n7(["return [];"])
  n8(["return [ problemAt( [#quot;wheels#quot;, #quot;turningCircleM#quot;], #96;\#96;wheels…<br/>calls problemAt"])
  n1 --> n2
  n2 --> n3
  n3 -->|"no"| n4
  n3 -->|"yes"| n5
  n4 -->|"yes"| n5
  n4 -->|"no"| n6
  n6 -->|"yes"| n7
  n6 -->|"no"| n8
```

## gearOrderProblemInVehicle

```mermaid
flowchart TD
  n1(["gearOrderProblemInVehicle"])
  n2{"vehicle.engine?.forwardGearRatios is missing?"}
  n3["[]"]
  n4["const gears = vehicle.engine?.forwardGearRatios ?? [];"]
  n5["const outOfOrder = gears.slice(1).findIndex((ratio, index) …"]
  n6{"outOfOrder === 0"}
  n7(["return [];"])
  n8(["return [ problemAt( [#quot;engine#quot;, #quot;forwardGearRatios#quot;], #96;\#96;eng…<br/>calls problemAt"])
  n1 --> n2
  n2 -->|"yes"| n3
  n2 -->|"no"| n4
  n3 --> n4
  n4 --> n5
  n5 --> n6
  n6 -->|"yes"| n7
  n6 -->|"no"| n8
```

## figureSourceProblems

```mermaid
flowchart TD
  n1(["figureSourceProblems"])
  n2["const sources = vehicle.figureSources;"]
  n3{"sources === undefined"}
  n4(["return [];"])
  n5(["return figureNamesInShape(FIGURE_GROUPS).flatMap((name) =#gt; …<br/>calls figureNamesInShape, sourceCountProblem"])
  n1 --> n2
  n2 --> n3
  n3 -->|"yes"| n4
  n3 -->|"no"| n5
```

## validateVehicle

```mermaid
flowchart TD
  n1(["validateVehicle"])
  n2(["return validateJsonFile(fileName, text, vehicleChecker as P…<br/>calls validateJsonFile"])
  n1 --> n2
```
