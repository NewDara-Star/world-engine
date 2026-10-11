# tools/bake/opl.ts

Drawn from the code by `npm run diagrams` (TypeScript compiler, no AI). Do not edit by hand: change the code, then run it again.

## readOplRoadWays

```mermaid
flowchart TD
  n1(["readOplRoadWays"])
  n2["const ways: OsmWay[] = [];"]
  n3["const problems: string[] = [];"]
  n4["const notes: string[] = [];"]
  n5["const lines = text.split(/\r?\n/);"]
  n6["let at = 0"]
  n7{"at #lt; lines.length"}
  n8["const line = lines[at] as string;"]
  n9{"!line.startsWith(#quot;w#quot;)"}
  n10["continue"]
  n11["const read = parseWayLine(line, at + 1);<br/>calls parseWayLine"]
  n12{"read.kind === #quot;problem#quot;"}
  n13["problems.push(read.problem);"]
  n14{"read.kind === #quot;skipped#quot;"}
  n15["notes.push(read.note);"]
  n16{"read.kind === #quot;way#quot;"}
  n17["ways.push(read.way);"]
  n18["at += 1"]
  n19(["return { ways, problems, notes };"])
  n1 --> n2
  n2 --> n3
  n3 --> n4
  n4 --> n5
  n5 --> n6
  n6 --> n7
  n7 -->|"yes"| n8
  n8 --> n9
  n9 -->|"yes"| n10
  n9 -->|"no"| n11
  n11 --> n12
  n12 -->|"yes"| n13
  n13 --> n14
  n12 -->|"no"| n14
  n14 -->|"yes"| n15
  n15 --> n16
  n14 -->|"no"| n16
  n16 -->|"yes"| n17
  n17 --> n18
  n16 -->|"no"| n18
  n10 --> n18
  n18 --> n7
  n7 -->|"no"| n19
```

## parseWayLine

```mermaid
flowchart TD
  n1(["parseWayLine"])
  n2["const fields = line.split(#quot; #quot;);"]
  n3{"fields[0] is missing?"}
  n4["#quot;#quot;"]
  n5["const id = WAY_ID.exec(fields[0] ?? #quot;#quot;);"]
  n6{"id === null"}
  n7(["return { kind: #quot;problem#quot;, problem: #96;line ${lineNumber}: doe…"])
  n8["const wayId = Number(id[1]);"]
  n9{"fields.find((field) =#gt; field.startsWith(#quot;T#quot;)) is missing?"}
  n10["#quot;T#quot;"]
  n11["const tagsField = fields.find((field) =#gt; field.startsWith(#quot;…"]
  n12{"fields.find((field) =#gt; field.startsWith(#quot;N#quot;)) is missing?"}
  n13["#quot;N#quot;"]
  n14["const nodesField = fields.find((field) =#gt; field.startsWith(…"]
  n15{"nodesField.split(#quot;,#quot;).length #lt; 2"}
  n16(["return { kind: #quot;skipped#quot;, note: #96;way ${wayId} has fewer tha…"])
  n17["const tags = parseTags(tagsField.slice(1));<br/>calls parseTags"]
  n18["const nodes = parseWayNodes(nodesField.slice(1));<br/>calls parseWayNodes"]
  n19{"typeof tags === #quot;string#quot;"}
  n20(["return { kind: #quot;problem#quot;, problem: #96;line ${lineNumber}: ${t…"])
  n21["const placed = nodes.filter((node): node is WayNode =#gt; node…"]
  n22{"placed.length #lt; nodes.length"}
  n23(["return { kind: #quot;problem#quot;, problem: #96;line ${lineNumber}: way…"])
  n24(["return { kind: #quot;way#quot;, way: { id: wayId, tags, nodes: placed…"])
  n1 --> n2
  n2 --> n3
  n3 -->|"yes"| n4
  n3 -->|"no"| n5
  n4 --> n5
  n5 --> n6
  n6 -->|"yes"| n7
  n6 -->|"no"| n8
  n8 --> n9
  n9 -->|"yes"| n10
  n9 -->|"no"| n11
  n10 --> n11
  n11 --> n12
  n12 -->|"yes"| n13
  n12 -->|"no"| n14
  n13 --> n14
  n14 --> n15
  n15 -->|"yes"| n16
  n15 -->|"no"| n17
  n17 --> n18
  n18 --> n19
  n19 -->|"yes"| n20
  n19 -->|"no"| n21
  n21 --> n22
  n22 -->|"yes"| n23
  n22 -->|"no"| n24
```

## parseTags

```mermaid
flowchart TD
  n1(["parseTags"])
  n2["const tags: Record#lt;string, string#gt; = {};"]
  n3{"text === #quot;#quot;"}
  n4(["return tags;"])
  n5{"for each const pair of text.split(#quot;,#quot;)"}
  n6["const equals = pair.indexOf(#quot;=#quot;);"]
  n7{"equals #lt; 0"}
  n8["pair"]
  n9["pair.slice(0, equals)"]
  n10["const key = unescapeOplText(equals #lt; 0 ? pair : pair.slice(…<br/>calls unescapeOplText"]
  n11{"equals #lt; 0"}
  n12["#quot;#quot;"]
  n13["pair.slice(equals + 1)"]
  n14["const value = unescapeOplText(equals #lt; 0 ? #quot;#quot; : pair.slice(…<br/>calls unescapeOplText"]
  n15{"key === undefined"}
  n16{"value === undefined"}
  n17(["return #96;a broken escape in the tags, near #quot;${pair}#quot;.#96;;"])
  n18["tags[key] = value;"]
  n19(["return tags;"])
  n1 --> n2
  n2 --> n3
  n3 -->|"yes"| n4
  n3 -->|"no"| n5
  n5 -->|"next item"| n6
  n6 --> n7
  n7 -->|"yes"| n8
  n7 -->|"no"| n9
  n8 --> n10
  n9 --> n10
  n10 --> n11
  n11 -->|"yes"| n12
  n11 -->|"no"| n13
  n12 --> n14
  n13 --> n14
  n14 --> n15
  n15 -->|"no"| n16
  n15 -->|"yes"| n17
  n16 -->|"yes"| n17
  n16 -->|"no"| n18
  n18 --> n5
  n5 -->|"done"| n19
```

## parseWayNodes

```mermaid
flowchart TD
  n1(["parseWayNodes"])
  n2["const nodes: ReadNode[] = [];"]
  n3{"for each const node of text.split(#quot;,#quot;)"}
  n4["const placed = NODE_WITH_POSITION.exec(node);"]
  n5{"placed === null"}
  n6{"NODE_ID.exec(node)?.[1] is missing?"}
  n7["Number.NaN"]
  n8["nodes.push({ id: Number(NODE_ID.exec(node)?.[1] ?? Number.N…"]
  n9["nodes.push({ id: Number(placed[1]), lat: Number(placed[3]),…"]
  n10(["return nodes;"])
  n1 --> n2
  n2 --> n3
  n3 -->|"next item"| n4
  n4 --> n5
  n5 -->|"yes"| n6
  n6 -->|"yes"| n7
  n6 -->|"no"| n8
  n7 --> n8
  n5 -->|"no"| n9
  n8 --> n3
  n9 --> n3
  n3 -->|"done"| n10
```

## unescapeOplText

```mermaid
flowchart TD
  n1(["unescapeOplText"])
  n2{"!text.includes(#quot;%#quot;)"}
  n3(["return text;"])
  n4["let written = #quot;#quot;;"]
  n5["let at = 0;"]
  n6{"at #lt; text.length"}
  n7["const character = text[at] as string;"]
  n8{"character !== #quot;%#quot;"}
  n9["written += character;"]
  n10["at += 1;"]
  n11["continue"]
  n12["ESCAPE.lastIndex = at;"]
  n13["const escape = ESCAPE.exec(text);"]
  n14{"escape?.[1] is missing?"}
  n15["#quot;#quot;"]
  n16["const code = Number.parseInt(escape?.[1] ?? #quot;#quot;, 16);"]
  n17{"escape === null"}
  n18{"code #gt; LARGEST_CODE_POINT"}
  n19(["return undefined;"])
  n20["written += String.fromCodePoint(code);"]
  n21["at = ESCAPE.lastIndex;"]
  n22(["return written;"])
  n1 --> n2
  n2 -->|"yes"| n3
  n2 -->|"no"| n4
  n4 --> n5
  n5 --> n6
  n6 -->|"yes"| n7
  n7 --> n8
  n8 -->|"yes"| n9
  n9 --> n10
  n10 --> n11
  n8 -->|"no"| n12
  n12 --> n13
  n13 --> n14
  n14 -->|"yes"| n15
  n14 -->|"no"| n16
  n15 --> n16
  n16 --> n17
  n17 -->|"no"| n18
  n17 -->|"yes"| n19
  n18 -->|"yes"| n19
  n18 -->|"no"| n20
  n20 --> n21
  n21 --> n6
  n11 --> n6
  n6 -->|"no"| n22
```
