# src/world/streets.ts

Drawn from the code by `npm run diagrams` (TypeScript compiler, no AI). Do not edit by hand: change the code, then run it again.

## validateStreetsFile

```mermaid
flowchart TD
  n1(["validateStreetsFile"])
  n2["let value: unknown;"]
  n3["try"]
  n4["value = JSON.parse(text);"]
  n5["catch"]
  n6(["return { ok: false, messages: [#96;${fileName}: the file is no…"])
  n7["const problems = streetsFileProblems(value);<br/>calls streetsFileProblems"]
  n8{"problems.length #gt; 0"}
  n9(["return { ok: false, messages: problems.map((problem) =#gt; #96;${…"])
  n10["const file = value as { centre: { lat: number; lon: number …"]
  n11(["return { ok: true, value: { centre: { lat: file.centre.lat,…"])
  n1 --> n2
  n2 --> n3
  n3 --> n4
  n3 -->|"throws"| n5
  n5 --> n6
  n4 --> n7
  n7 --> n8
  n8 -->|"yes"| n9
  n8 -->|"no"| n10
  n10 --> n11
```

## streetsFileProblems

```mermaid
flowchart TD
  n1(["streetsFileProblems"])
  n2["const file = Object(value) as Record#lt;string, unknown#gt;;"]
  n3["const centre = Object(file[#quot;centre#quot;]) as Record#lt;string, unk…"]
  n4["const problems: string[] = [];"]
  n5{"file[#quot;format#quot;] !== FORMAT"}
  n6["problems.push(#96;made by a different bake version (format ${J…"]
  n7{"typeof centre[#quot;lat#quot;] !== #quot;number#quot;"}
  n8{"typeof centre[#quot;lon#quot;] !== #quot;number#quot;"}
  n9["problems.push(#quot;#96;centre#96; must have a #96;lat#96; and a #96;lon#96;, each…"]
  n10{"!Array.isArray(file[#quot;streets#quot;])"}
  n11(["return [...problems, #quot;#96;streets#96; must be a list.#quot;];"])
  n12["const broken = file[#quot;streets#quot;].map(streetProblem).findIndex…"]
  n13{"broken #gt;= 0"}
  n14["problems.push(#96;street ${broken + 1}: ${String(streetProblem…<br/>calls streetProblem"]
  n15(["return problems;"])
  n1 --> n2
  n2 --> n3
  n3 --> n4
  n4 --> n5
  n5 -->|"yes"| n6
  n6 --> n7
  n5 -->|"no"| n7
  n7 -->|"no"| n8
  n7 -->|"yes"| n9
  n8 -->|"yes"| n9
  n9 --> n10
  n8 -->|"no"| n10
  n10 -->|"yes"| n11
  n10 -->|"no"| n12
  n12 --> n13
  n13 -->|"yes"| n14
  n14 --> n15
  n13 -->|"no"| n15
```

## streetProblem

```mermaid
flowchart TD
  n1(["streetProblem"])
  n2["const street = Object(value) as Record#lt;string, unknown#gt;;"]
  n3["const name = street[#quot;name#quot;];"]
  n4{"name !== undefined"}
  n5{"typeof name !== #quot;string#quot;"}
  n6{"name.trim() === #quot;#quot;"}
  n7(["return #quot;#96;name#96; must be text with letters in it, or left out…"])
  n8{"!SIZES.includes(String(street[#quot;size#quot;]))"}
  n9(["return '#96;size#96; must be #quot;major#quot; or #quot;minor#quot;.';"])
  n10["const lines = street[#quot;lines#quot;];"]
  n11{"!Array.isArray(lines)"}
  n12{"lines.length === 0"}
  n13(["return #quot;#96;lines#96; must be a list of at least one line.#quot;;"])
  n14{"!lines.every(lineIsGood)"}
  n15(["return #96;a line is broken: each must be an even count of who…"])
  n16(["return undefined;"])
  n1 --> n2
  n2 --> n3
  n3 --> n4
  n4 -->|"yes"| n5
  n5 -->|"no"| n6
  n5 -->|"yes"| n7
  n6 -->|"yes"| n7
  n4 -->|"no"| n8
  n6 -->|"no"| n8
  n8 -->|"yes"| n9
  n8 -->|"no"| n10
  n10 --> n11
  n11 -->|"no"| n12
  n11 -->|"yes"| n13
  n12 -->|"yes"| n13
  n12 -->|"no"| n14
  n14 -->|"yes"| n15
  n14 -->|"no"| n16
```

## lineIsGood

```mermaid
flowchart TD
  n1(["lineIsGood"])
  n2{"!Array.isArray(line)"}
  n3{"line.length #lt; 4"}
  n4{"line.length % 2 !== 0"}
  n5(["return false;"])
  n6{"for each const number of line"}
  n7{"!Number.isInteger(number)"}
  n8{"Math.abs(number as number) #gt; FARTHEST_DM"}
  n9(["return false;"])
  n10(["return true;"])
  n1 --> n2
  n2 -->|"no"| n3
  n3 -->|"no"| n4
  n2 -->|"yes"| n5
  n3 -->|"yes"| n5
  n4 -->|"yes"| n5
  n4 -->|"no"| n6
  n6 -->|"next item"| n7
  n7 -->|"no"| n8
  n7 -->|"yes"| n9
  n8 -->|"yes"| n9
  n8 -->|"no"| n6
  n6 -->|"done"| n10
```

## streetInMetres

```mermaid
flowchart TD
  n1(["streetInMetres"])
  n2["const lines = street.lines.map(pointsFromDecimetres).map((p…<br/>calls boxAround"]
  n3(["return { name: street.name, size: street.size, lines };"])
  n1 --> n2
  n2 --> n3
```

## pointsFromDecimetres

```mermaid
flowchart TD
  n1(["pointsFromDecimetres"])
  n2["const points: MapPoint[] = [];"]
  n3["let at = 0"]
  n4{"at + 1 #lt; numbers.length"}
  n5["points.push({ eastM: (numbers[at] as number) / DECIMETRES_P…"]
  n6["at += 2"]
  n7(["return points;"])
  n1 --> n2
  n2 --> n3
  n3 --> n4
  n4 -->|"yes"| n5
  n5 --> n6
  n6 --> n4
  n4 -->|"no"| n7
```

## boxAround

```mermaid
flowchart TD
  n1(["boxAround"])
  n2["const easts = points.map((point) =#gt; point.eastM);"]
  n3["const norths = points.map((point) =#gt; point.northM);"]
  n4(["return { westM: Math.min(...easts), southM: Math.min(...nor…"])
  n1 --> n2
  n2 --> n3
  n3 --> n4
```

## streetsProblemsForPlace

```mermaid
flowchart TD
  n1(["streetsProblemsForPlace"])
  n2{"map.centre.lat === place.centre.lat"}
  n3{"map.centre.lon === place.centre.lon"}
  n4(["return [];"])
  n5(["return [#quot;The street names were made for a different centre …"])
  n1 --> n2
  n2 -->|"yes"| n3
  n3 -->|"yes"| n4
  n2 -->|"no"| n5
  n3 -->|"no"| n5
```

## distanceToStreet

```mermaid
flowchart TD
  n1(["distanceToStreet"])
  n2["let nearestM = Number.POSITIVE_INFINITY;"]
  n3{"for each const line of street.lines"}
  n4{"distanceToBox(point, line.box) #gt; limitM<br/>calls distanceToBox"}
  n5["continue"]
  n6["let at = 1"]
  n7{"at #lt; line.points.length"}
  n8["nearestM = Math.min(nearestM, nearestPointOnSegment(point, …<br/>calls nearestPointOnSegment"]
  n9["at += 1"]
  n10(["return nearestM;"])
  n1 --> n2
  n2 --> n3
  n3 -->|"next item"| n4
  n4 -->|"yes"| n5
  n4 -->|"no"| n6
  n6 --> n7
  n7 -->|"yes"| n8
  n8 --> n9
  n9 --> n7
  n7 -->|"no"| n3
  n5 --> n3
  n3 -->|"done"| n10
```

## distanceToBox

```mermaid
flowchart TD
  n1(["distanceToBox"])
  n2["const outsideEast = Math.max(box.westM - point.eastM, 0, po…"]
  n3["const outsideNorth = Math.max(box.southM - point.northM, 0,…"]
  n4(["return Math.hypot(outsideEast, outsideNorth);"])
  n1 --> n2
  n2 --> n3
  n3 --> n4
```

## nearestStreetName

```mermaid
flowchart TD
  n1(["nearestStreetName"])
  n2["const near = namedStreetsWithin(streets, point, STREET_NAME…<br/>calls namedStreetsWithin"]
  n3["const nearest = near[0];"]
  n4{"nearest === undefined"}
  n5(["return undefined;"])
  n6["const shownDistanceM = Math.min(...near.filter((one) =#gt; one…"]
  n7{"shownDistanceM - nearest.distanceM #lt;= KEEP_SHOWN_STREET_MAR…"}
  n8(["return shown;"])
  n9(["return nearest.name;"])
  n1 --> n2
  n2 --> n3
  n3 --> n4
  n4 -->|"yes"| n5
  n4 -->|"no"| n6
  n6 --> n7
  n7 -->|"yes"| n8
  n7 -->|"no"| n9
```

## namedStreetsWithin

```mermaid
flowchart TD
  n1(["namedStreetsWithin"])
  n2["const near: { name: string; distanceM: number }[] = [];"]
  n3{"for each const street of streets"}
  n4{"street.name === undefined"}
  n5["continue"]
  n6["const distanceM = distanceToStreet(street, point, limitM);<br/>calls distanceToStreet"]
  n7{"distanceM #lt;= limitM"}
  n8["near.push({ name: street.name, distanceM });"]
  n9(["return near.toSorted((a, b) =#gt; a.distanceM - b.distanceM);"])
  n1 --> n2
  n2 --> n3
  n3 -->|"next item"| n4
  n4 -->|"yes"| n5
  n4 -->|"no"| n6
  n6 --> n7
  n7 -->|"yes"| n8
  n8 --> n3
  n7 -->|"no"| n3
  n5 --> n3
  n3 -->|"done"| n9
```

## streetNameAfter

```mermaid
flowchart TD
  n1(["streetNameAfter"])
  n2{"found === hold.shown"}
  n3(["return { shown: hold.shown, waiting: undefined };"])
  n4{"hold.waiting === undefined"}
  n5{"hold.waiting.name !== found"}
  n6(["return { shown: hold.shown, waiting: { name: found, sinceMs…"])
  n7{"nowMs - hold.waiting.sinceMs #gt;= STREET_NAME_HOLD_MS"}
  n8(["return { shown: found, waiting: undefined };"])
  n9(["return hold;"])
  n1 --> n2
  n2 -->|"yes"| n3
  n2 -->|"no"| n4
  n4 -->|"no"| n5
  n4 -->|"yes"| n6
  n5 -->|"yes"| n6
  n5 -->|"no"| n7
  n7 -->|"yes"| n8
  n7 -->|"no"| n9
```
