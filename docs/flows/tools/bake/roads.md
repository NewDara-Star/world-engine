# tools/bake/roads.ts

Drawn from the code by `npm run diagrams` (TypeScript compiler, no AI). Do not edit by hand: change the code, then run it again.

## isDrivableRoad

```mermaid
flowchart TD
  n1(["isDrivableRoad"])
  n2{"tags[#quot;highway#quot;] is missing?"}
  n3["#quot;#quot;"]
  n4{"!DRIVABLE_HIGHWAYS.includes(tags[#quot;highway#quot;] ?? #quot;#quot;)"}
  n5(["return false;"])
  n6{"tags[#quot;area#quot;] === #quot;yes#quot;"}
  n7(["return false;"])
  n8["const deciding = ACCESS_TAGS_MOST_SPECIFIC_FIRST.find((key)…"]
  n9{"deciding !== undefined"}
  n10{"tags[deciding] === #quot;no#quot;"}
  n11(["return false;"])
  n12(["return true;"])
  n1 --> n2
  n2 -->|"yes"| n3
  n2 -->|"no"| n4
  n3 --> n4
  n4 -->|"yes"| n5
  n4 -->|"no"| n6
  n6 -->|"yes"| n7
  n6 -->|"no"| n8
  n8 --> n9
  n9 -->|"yes"| n10
  n10 -->|"yes"| n11
  n9 -->|"no"| n12
  n10 -->|"no"| n12
```

## isOneWay

```mermaid
flowchart TD
  n1(["isOneWay"])
  n2["const oneway = tags[#quot;oneway#quot;];"]
  n3{"oneway !== undefined"}
  n4(["return ONE_WAY_VALUES.includes(oneway);"])
  n5(["return tags[#quot;junction#quot;] === #quot;roundabout#quot;;"])
  n1 --> n2
  n2 --> n3
  n3 -->|"yes"| n4
  n3 -->|"no"| n5
```

## laneCount

```mermaid
flowchart TD
  n1(["laneCount"])
  n2{"tags[#quot;lanes#quot;] is missing?"}
  n3["#quot;#quot;"]
  n4["const lanes = tags[#quot;lanes#quot;] ?? #quot;#quot;;"]
  n5["const tagged = Number(lanes);"]
  n6{"WHOLE_NUMBER.test(lanes)"}
  n7{"tagged #gt;= 1"}
  n8{"tagged #lt;= MOST_LANES"}
  n9(["return tagged;"])
  n10{"isOneWay(tags)<br/>calls isOneWay"}
  n11(["return 1;"])
  n12(["return 2;"])
  n1 --> n2
  n2 -->|"yes"| n3
  n2 -->|"no"| n4
  n3 --> n4
  n4 --> n5
  n5 --> n6
  n6 -->|"yes"| n7
  n7 -->|"yes"| n8
  n8 -->|"yes"| n9
  n6 -->|"no"| n10
  n7 -->|"no"| n10
  n8 -->|"no"| n10
  n10 -->|"yes"| n11
  n10 -->|"no"| n12
```

## widthFromTag

```mermaid
flowchart TD
  n1(["widthFromTag"])
  n2{"text === undefined"}
  n3(["return undefined;"])
  n4["const number = text.trim().replace(TRAILING_METRES, #quot;#quot;);"]
  n5["const metres = Number(number);"]
  n6{"PLAIN_NUMBER.test(number)"}
  n7{"metres #gt; 0"}
  n8{"metres #lt;= WIDEST_ROAD_M"}
  n9(["return metres;"])
  n10(["return #quot;unreadable#quot;;"])
  n1 --> n2
  n2 -->|"yes"| n3
  n2 -->|"no"| n4
  n4 --> n5
  n5 --> n6
  n6 -->|"yes"| n7
  n7 -->|"yes"| n8
  n8 -->|"yes"| n9
  n6 -->|"no"| n10
  n7 -->|"no"| n10
  n8 -->|"no"| n10
```

## roadWidthMetres

```mermaid
flowchart TD
  n1(["roadWidthMetres"])
  n2["const tagged = widthFromTag(tags[#quot;width#quot;]);<br/>calls widthFromTag"]
  n3{"typeof tagged === #quot;number#quot;"}
  n4(["return { widthM: tagged, notes: [] };"])
  n5["const lanes = laneCount(tags);<br/>calls laneCount"]
  n6["const widthM = lanes * laneWidthM;"]
  n7["const notes: string[] = [];"]
  n8{"tagged === #quot;unreadable#quot;"}
  n9["notes.push(#96;way ${wayId} has a width we could not read (#quot;${…"]
  n10["const lanesTag = tags[#quot;lanes#quot;];"]
  n11{"lanesTag !== undefined"}
  n12{"String(lanes) !== lanesTag"}
  n13["notes.push(#96;way ${wayId} has a lanes tag we could not use (…"]
  n14(["return { widthM, notes };"])
  n1 --> n2
  n2 --> n3
  n3 -->|"yes"| n4
  n3 -->|"no"| n5
  n5 --> n6
  n6 --> n7
  n7 --> n8
  n8 -->|"yes"| n9
  n9 --> n10
  n8 -->|"no"| n10
  n10 --> n11
  n11 -->|"yes"| n12
  n12 -->|"yes"| n13
  n13 --> n14
  n11 -->|"no"| n14
  n12 -->|"no"| n14
```

## roadSize

```mermaid
flowchart TD
  n1(["roadSize"])
  n2{"tags[#quot;highway#quot;] is missing?"}
  n3["#quot;#quot;"]
  n4{"MAJOR_HIGHWAYS.includes(tags[#quot;highway#quot;] ?? #quot;#quot;)"}
  n5["#quot;major#quot;"]
  n6["#quot;minor#quot;"]
  n7(["return MAJOR_HIGHWAYS.includes(tags[#quot;highway#quot;] ?? #quot;#quot;) ? #quot;ma…"])
  n1 --> n2
  n2 -->|"yes"| n3
  n2 -->|"no"| n4
  n3 --> n4
  n4 -->|"yes"| n5
  n4 -->|"no"| n6
  n5 --> n7
  n6 --> n7
```
