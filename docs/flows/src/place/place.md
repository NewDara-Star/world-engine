# src/place/place.ts

Drawn from the code by `npm run diagrams` (TypeScript compiler, no AI). Do not edit by hand: change the code, then run it again.

## repeatedClass

```mermaid
flowchart TD
  n1(["repeatedClass"])
  n2(["return classes.find((name, index) =#gt; classes.indexOf(name) …"])
  n1 --> n2
```

## missingSource

```mermaid
flowchart TD
  n1(["missingSource"])
  n2(["return CONSTANT_QUANTITIES.find((quantity) =#gt; !sources.some…"])
  n1 --> n2
```

## placeProblem

```mermaid
flowchart TD
  n1(["placeProblem"])
  n2["const repeated = repeatedClass(place.allowedVehicleClasses);<br/>calls repeatedClass"]
  n3{"repeated !== undefined"}
  n4(["return #96;allowedVehicleClasses lists #quot;${repeated}#quot; twice#96;;"])
  n5["const missing = missingSource(place.constantsSources);<br/>calls missingSource"]
  n6{"missing === undefined"}
  n7["undefined"]
  n8["#96;constantsSources has no source for #quot;${missing}#quot;#96;"]
  n9(["return missing === undefined ? undefined : #96;constantsSource…"])
  n1 --> n2
  n2 --> n3
  n3 -->|"yes"| n4
  n3 -->|"no"| n5
  n5 --> n6
  n6 -->|"yes"| n7
  n6 -->|"no"| n8
  n7 --> n9
  n8 --> n9
```

## validatePlace

```mermaid
flowchart TD
  n1(["validatePlace"])
  n2(["return placeParser(json, #quot;#quot;);<br/>calls placeParser"])
  n1 --> n2
```
