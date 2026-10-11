# tools/bake/streets.ts

Drawn from the code by `npm run diagrams` (TypeScript compiler, no AI). Do not edit by hand: change the code, then run it again.

## streetsFileText

```mermaid
flowchart TD
  n1(["streetsFileText"])
  n2["const reachM = mapHalfSizeM + KEPT_PAST_EDGE_M;"]
  n3["const groups = new Map#lt;string, StreetGroup#gt;();"]
  n4{"for each const road of roads"}
  n5{"road.tags[#quot;name#quot;]?.trim()"}
  n6["undefined"]
  n7["const name = road.tags[#quot;name#quot;]?.trim() || undefined;"]
  n8["const size = roadSize(road.tags);<br/>calls roadSize"]
  n9["const lines = linesInsideSquare(road.points, reachM).map(de…<br/>calls linesInsideSquare"]
  n10{"lines.length === 0"}
  n11["continue"]
  n12{"name is missing?"}
  n13["#quot;#quot;"]
  n14["const key = #96;${name ?? #quot;#quot;}\u0000${size}#96;;"]
  n15{"groups.get(key) is missing?"}
  n16["{ name, size, lines: [] }"]
  n17["const group = groups.get(key) ?? { name, size, lines: [] };"]
  n18["group.lines.push(...lines);"]
  n19["groups.set(key, group);"]
  n20["const sorted = [...groups.values()].toSorted(compareStreets…"]
  n21["const streetLines = sorted.map(streetLineText);"]
  n22(["return #96;{#quot;format#quot;:${STREETS_FORMAT},#quot;centre#quot;:${JSON.stringi…"])
  n1 --> n2
  n2 --> n3
  n3 --> n4
  n4 -->|"next item"| n5
  n5 -->|"no"| n6
  n5 -->|"yes"| n7
  n6 --> n7
  n7 --> n8
  n8 --> n9
  n9 --> n10
  n10 -->|"yes"| n11
  n10 -->|"no"| n12
  n12 -->|"yes"| n13
  n12 -->|"no"| n14
  n13 --> n14
  n14 --> n15
  n15 -->|"yes"| n16
  n15 -->|"no"| n17
  n16 --> n17
  n17 --> n18
  n18 --> n19
  n19 --> n4
  n11 --> n4
  n4 -->|"done"| n20
  n20 --> n21
  n21 --> n22
```

## streetLineText

```mermaid
flowchart TD
  n1(["streetLineText"])
  n2{"group.name === undefined"}
  n3(["return JSON.stringify({ size: group.size, lines: group.line…"])
  n4(["return JSON.stringify({ name: group.name, size: group.size,…"])
  n1 --> n2
  n2 -->|"yes"| n3
  n2 -->|"no"| n4
```

## compareStreets

```mermaid
flowchart TD
  n1(["compareStreets"])
  n2{"(a.name === undefined) !== (b.name === undefined)"}
  n3{"a.name === undefined"}
  n4["1"]
  n5["-1"]
  n6(["return a.name === undefined ? 1 : -1;"])
  n7{"a.name is missing?"}
  n8["#quot;#quot;"]
  n9{"b.name is missing?"}
  n10["#quot;#quot;"]
  n11{"a.name is missing?"}
  n12["#quot;#quot;"]
  n13{"b.name is missing?"}
  n14["#quot;#quot;"]
  n15["const byName = Number((a.name ?? #quot;#quot;) #gt; (b.name ?? #quot;#quot;)) - Nu…"]
  n16{"byName !== 0"}
  n17(["return byName;"])
  n18(["return Number(a.size === #quot;minor#quot;) - Number(b.size === #quot;mino…"])
  n1 --> n2
  n2 -->|"yes"| n3
  n3 -->|"yes"| n4
  n3 -->|"no"| n5
  n4 --> n6
  n5 --> n6
  n2 -->|"no"| n7
  n7 -->|"yes"| n8
  n7 -->|"no"| n9
  n8 --> n9
  n9 -->|"yes"| n10
  n9 -->|"no"| n11
  n10 --> n11
  n11 -->|"yes"| n12
  n11 -->|"no"| n13
  n12 --> n13
  n13 -->|"yes"| n14
  n13 -->|"no"| n15
  n14 --> n15
  n15 --> n16
  n16 -->|"yes"| n17
  n16 -->|"no"| n18
```

## linesInsideSquare

```mermaid
flowchart TD
  n1(["linesInsideSquare"])
  n2["const lines: MapPoint[][] = [];"]
  n3["let current: MapPoint[] = [];"]
  n4["let at = 1"]
  n5{"at #lt; points.length"}
  n6["const from = points[at - 1] as MapPoint;"]
  n7["const to = points[at] as MapPoint;"]
  n8{"!segmentReachesSquare(from, to, reachM)<br/>calls segmentReachesSquare"}
  n9{"current.length #gt; 0"}
  n10["lines.push(current);"]
  n11["current = [];"]
  n12["continue"]
  n13{"current.length === 0"}
  n14["current.push(from);"]
  n15["current.push(to);"]
  n16["at += 1"]
  n17{"current.length #gt; 0"}
  n18["lines.push(current);"]
  n19(["return lines;"])
  n1 --> n2
  n2 --> n3
  n3 --> n4
  n4 --> n5
  n5 -->|"yes"| n6
  n6 --> n7
  n7 --> n8
  n8 -->|"yes"| n9
  n9 -->|"yes"| n10
  n10 --> n11
  n9 -->|"no"| n11
  n11 --> n12
  n8 -->|"no"| n13
  n13 -->|"yes"| n14
  n14 --> n15
  n13 -->|"no"| n15
  n15 --> n16
  n12 --> n16
  n16 --> n5
  n5 -->|"no"| n17
  n17 -->|"yes"| n18
  n18 --> n19
  n17 -->|"no"| n19
```

## segmentReachesSquare

```mermaid
flowchart TD
  n1(["segmentReachesSquare"])
  n2{"Math.min(from.eastM, to.eastM) #lt;= reachM"}
  n3["Math.max(from.eastM, to.eastM) #gt;= -reachM"]
  n4["const reachesEast = Math.min(from.eastM, to.eastM) #lt;= reach…"]
  n5{"Math.min(from.northM, to.northM) #lt;= reachM"}
  n6["Math.max(from.northM, to.northM) #gt;= -reachM"]
  n7["const reachesNorth = Math.min(from.northM, to.northM) #lt;= re…"]
  n8{"reachesEast"}
  n9["reachesNorth"]
  n10(["return reachesEast && reachesNorth;"])
  n1 --> n2
  n2 -->|"yes"| n3
  n2 -->|"no"| n4
  n3 --> n4
  n4 --> n5
  n5 -->|"yes"| n6
  n5 -->|"no"| n7
  n6 --> n7
  n7 --> n8
  n8 -->|"yes"| n9
  n8 -->|"no"| n10
  n9 --> n10
```

## decimetreLine

```mermaid
flowchart TD
  n1(["decimetreLine"])
  n2["const numbers: number[] = [];"]
  n3{"for each const point of points"}
  n4["const east = Math.round(point.eastM * DECIMETRES_PER_METRE)…"]
  n5["const north = Math.round(point.northM * DECIMETRES_PER_METR…"]
  n6{"numbers.at(-2) === east"}
  n7{"numbers.at(-1) === north"}
  n8["continue"]
  n9["numbers.push(east, north);"]
  n10(["return numbers;"])
  n1 --> n2
  n2 --> n3
  n3 -->|"next item"| n4
  n4 --> n5
  n5 --> n6
  n6 -->|"yes"| n7
  n7 -->|"yes"| n8
  n6 -->|"no"| n9
  n7 -->|"no"| n9
  n9 --> n3
  n8 --> n3
  n3 -->|"done"| n10
```
