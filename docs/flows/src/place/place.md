# src/place/place.ts

Drawn from the code by `npm run diagrams` (TypeScript compiler, no AI). Do not edit by hand: change the code, then run it again.

## firstRepeatedVehicleClass

```mermaid
flowchart TD
  n1(["firstRepeatedVehicleClass"])
  n2(["return classes.find((name, index) =#gt; classes.indexOf(name) …"])
  n1 --> n2
```

## sourceProblemsForConstants

```mermaid
flowchart TD
  n1(["sourceProblemsForConstants"])
  n2(["return CONSTANT_QUANTITIES.flatMap((quantity) =#gt; sourceCoun…<br/>calls sourceCountProblem"])
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

## decimalPointSlipHint

```mermaid
flowchart TD
  n1(["decimalPointSlipHint"])
  n2["const oneLeft = Number(#96;${value}e-1#96;);"]
  n3["const twoLeft = Number(#96;${value}e-2#96;);"]
  n4{"oneLeft #gt;= min"}
  n5["oneLeft #lt;= max"]
  n6["const oneLeftFits = oneLeft #gt;= min && oneLeft #lt;= max;"]
  n7{"twoLeft #gt;= min"}
  n8["twoLeft #lt;= max"]
  n9["const twoLeftFits = twoLeft #gt;= min && twoLeft #lt;= max;"]
  n10{"oneLeftFits !== twoLeftFits"}
  n11{"oneLeftFits"}
  n12["oneLeft"]
  n13["twoLeft"]
  n14(["return String(oneLeftFits ? oneLeft : twoLeft);"])
  n15(["return undefined;"])
  n1 --> n2
  n2 --> n3
  n3 --> n4
  n4 -->|"yes"| n5
  n4 -->|"no"| n6
  n5 --> n6
  n6 --> n7
  n7 -->|"yes"| n8
  n7 -->|"no"| n9
  n8 --> n9
  n9 --> n10
  n10 -->|"yes"| n11
  n11 -->|"yes"| n12
  n11 -->|"no"| n13
  n12 --> n14
  n13 --> n14
  n10 -->|"no"| n15
```

## planetRangeRule

```mermaid
flowchart TD
  n1(["planetRangeRule"])
  n2["const field = PLACE_FIELD_FOR_CONSTANT[quantity];"]
  n3(["return { reads: [#quot;planet#quot;, field], problems: rangeProblemsO…"])
  n1 --> n2
  n2 --> n3
```

## planetRangeRule > rangeProblemsOnPlanet

```mermaid
flowchart TD
  n1(["planetRangeRule #gt; rangeProblemsOnPlanet"])
  n2["const planet = planets.find((known) =#gt; known.id === place.p…"]
  n3{"planet === undefined"}
  n4{{"throw new Error(#96;planetRangeRule: \#96;${place.planet}\#96; passe…"}}
  n5["const range = planet.ranges[quantity];"]
  n6["const value = place[field];"]
  n7{"value #gt;= range.min"}
  n8{"value #lt;= range.max"}
  n9(["return [];"])
  n10["let sentence = #96;${labelForPath([field])} must be from ${ran…<br/>calls labelForPath"]
  n11["const hint = decimalPointSlipHint(value, range.min, range.m…<br/>calls decimalPointSlipHint"]
  n12{"hint !== undefined"}
  n13["sentence += #96; Did you mean ${hint}?#96;;"]
  n14(["return [problemAt([field], sentence)];<br/>calls problemAt"])
  n1 --> n2
  n2 --> n3
  n3 -->|"yes"| n4
  n3 -->|"no"| n5
  n5 --> n6
  n6 --> n7
  n7 -->|"yes"| n8
  n8 -->|"yes"| n9
  n7 -->|"no"| n10
  n8 -->|"no"| n10
  n10 --> n11
  n11 --> n12
  n12 -->|"yes"| n13
  n13 --> n14
  n12 -->|"no"| n14
```

## placeCheckerFor

```mermaid
flowchart TD
  n1(["placeCheckerFor"])
  n2["const shape = { ...placeShape, planet: requireKnownId({ one…<br/>calls requireKnownId"]
  n3["const rules: CrossFieldRule#lt;PlaceFields#gt;[] = [ { reads: [#quot;a…<br/>calls planetRangeRule"]
  n4(["return addCrossFieldRules(shape, rules, OPTIONAL_PLACE_FIEL…<br/>calls addCrossFieldRules"])
  n1 --> n2
  n2 --> n3
  n3 --> n4
```

## validatePlace

```mermaid
flowchart TD
  n1(["validatePlace"])
  n2(["return validateJsonFile(fileName, text, placeCheckerFor(pla…<br/>calls validateJsonFile, placeCheckerFor"])
  n1 --> n2
```
