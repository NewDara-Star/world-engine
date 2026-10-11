# src/place/start.ts

Drawn from the code by `npm run diagrams` (TypeScript compiler, no AI). Do not edit by hand: change the code, then run it again.

## validateStartChoice

```mermaid
flowchart TD
  n1(["validateStartChoice"])
  n2(["return validateJsonFile(fileName, text, startChecker);<br/>calls validateJsonFile"])
  n1 --> n2
```

## startChoiceFromLink

```mermaid
flowchart TD
  n1(["startChoiceFromLink"])
  n2["const asked = new URLSearchParams(query);"]
  n3["const checkShortId = requireShortId();<br/>calls requireShortId"]
  n4["const chosen = { place: start.place, vehicle: start.vehicle…"]
  n5["const notes: string[] = [];"]
  n6{"for each const field of [#quot;place#quot;, #quot;vehicle#quot;] as const"}
  n7{"asked.get(field) is missing?"}
  n8["#quot;#quot;"]
  n9["const fromLink = asked.get(field) ?? #quot;#quot;;"]
  n10{"fromLink !== #quot;#quot;"}
  n11{"checkShortId(fromLink, [field]).ok<br/>calls checkShortId"}
  n12["chosen[field] = fromLink;"]
  n13{"fromLink !== #quot;#quot;"}
  n14["notes.push(#96;The link asked for ${field} #quot;${fromLink}#quot;, whic…"]
  n15(["return { placeId: chosen.place, vehicleId: chosen.vehicle, …"])
  n1 --> n2
  n2 --> n3
  n3 --> n4
  n4 --> n5
  n5 --> n6
  n6 -->|"next item"| n7
  n7 -->|"yes"| n8
  n7 -->|"no"| n9
  n8 --> n9
  n9 --> n10
  n10 -->|"yes"| n11
  n11 -->|"yes"| n12
  n10 -->|"no"| n13
  n11 -->|"no"| n13
  n13 -->|"yes"| n14
  n12 --> n6
  n14 --> n6
  n13 -->|"no"| n6
  n6 -->|"done"| n15
```
