# tools/decisions/log.ts

Drawn from the code by `npm run diagrams` (TypeScript compiler, no AI). Do not edit by hand: change the code, then run it again.

## readDecisionLog

```mermaid
flowchart TD
  n1(["readDecisionLog"])
  n2["const lines = text.replace(/^\uFEFF/, #quot;#quot;).split(/\r?\n/);"]
  n3["const starts = lines.map((line, at) =#gt; ({ line, at })).filt…"]
  n4["const blocks = starts.map((at, which) =#gt; ({ start: at + 1, …"]
  n5{"blocks.length === 0"}
  n6(["return { entries: [], problems: [{ line: 1, message: #quot;the f…"])
  n7["const parsed = blocks.map((block) =#gt; ({ ...block, id: Strin…<br/>calls parseEntry"]
  n8["const entries = parsed.map((block) =#gt; block.result).filter(…"]
  n9["const problems = parsed.map((block) =#gt; block.result).filter…"]
  n10["const linesOfId = new Map(parsed.map((block) =#gt; [block.id, …"]
  n11["parsed.forEach((block) =#gt; linesOfId.get(block.id)?.push(blo…"]
  n12["const repeated = [...linesOfId].filter(([, at]) =#gt; at.lengt…"]
  n13{"repeated.length #gt; 0"}
  n14["problems.push(...repeated.map(([id, at]) =#gt; ({ line: Number…"]
  n15["const position = new Map(parsed.map((block, at) =#gt; [block.i…"]
  n16["const replacing = parsed.flatMap((block, at) =#gt; [block.resu…"]
  n17["const replacesProblems = [ ...replacing.filter((found) =#gt; !…"]
  n18{"replacesProblems.length #gt; 0"}
  n19["problems.push(...replacesProblems);"]
  n20(["return { entries, problems: problems.sort((first, second) =…"])
  n1 --> n2
  n2 --> n3
  n3 --> n4
  n4 --> n5
  n5 -->|"yes"| n6
  n5 -->|"no"| n7
  n7 --> n8
  n8 --> n9
  n9 --> n10
  n10 --> n11
  n11 --> n12
  n12 --> n13
  n13 -->|"yes"| n14
  n14 --> n15
  n13 -->|"no"| n15
  n15 --> n16
  n16 --> n17
  n17 --> n18
  n18 -->|"yes"| n19
  n19 --> n20
  n18 -->|"no"| n20
```

## parseEntry

```mermaid
flowchart TD
  n1(["parseEntry"])
  n2["const problems: LogProblem[] = [];"]
  n3["const heading = String(lines[0]);"]
  n4["const id = heading.trim().slice(3);"]
  n5{"!HEADING.test(heading)"}
  n6["problems.push({ line: start, message: #96;the heading ${headin…"]
  n7["const body = lines.slice(1).map((text, at) =#gt; ({ text, line…"]
  n8["const strays = body.filter((found) =#gt; !FIELD_OR_BLANK.test(…"]
  n9["const fields = body.flatMap((found) =#gt; [...found.text.match…"]
  n10["const firstOf = new Map(fields.toReversed().map((field) =#gt; …"]
  n11["const firstCopies = fields.filter((field) =#gt; firstOf.get(fi…"]
  n12["const fieldProblems = [ ...REQUIRED_FIELDS.filter((name) =#gt;…"]
  n13["problems.push(...strays);"]
  n14{"fieldProblems.length #gt; 0"}
  n15["problems.push(...fieldProblems);"]
  n16["const badDates = firstCopies .filter((field) =#gt; field.name …"]
  n17{"badDates.length #gt; 0"}
  n18["problems.push(...badDates.map((field) =#gt; ({ line: field.lin…"]
  n19["const replaces = firstCopies.filter((field) =#gt; field.name =…"]
  n20["const badReplaces = replaces.filter((field) =#gt; !ENTRY_ID.te…"]
  n21{"badReplaces.length #gt; 0"}
  n22["problems.push(...badReplaces.map((field) =#gt; ({ line: field.…"]
  n23["const unknown = fields.filter((field) =#gt; !KNOWN_FIELDS.incl…"]
  n24{"unknown.length #gt; 0"}
  n25["problems.push( ...unknown.map((field) =#gt; ({ line: field.lin…<br/>calls editDistance"]
  n26["const tagsFields = firstCopies.filter((field) =#gt; field.name…"]
  n27["const tags = tagsFields.flatMap((field) =#gt; field.value.spli…"]
  n28["const emptyTags = tagsFields.filter((field) =#gt; field.value.…"]
  n29{"emptyTags.length #gt; 0"}
  n30["problems.push(...emptyTags.map((field) =#gt; ({ line: field.li…"]
  n31{"problems.length #gt; 0"}
  n32(["return problems;"])
  n33["const value = Object.fromEntries(firstCopies.map((field) =#gt;…"]
  n34(["return { id, date: String(value[#quot;Date#quot;]), decision: String(…"])
  n1 --> n2
  n2 --> n3
  n3 --> n4
  n4 --> n5
  n5 -->|"yes"| n6
  n6 --> n7
  n5 -->|"no"| n7
  n7 --> n8
  n8 --> n9
  n9 --> n10
  n10 --> n11
  n11 --> n12
  n12 --> n13
  n13 --> n14
  n14 -->|"yes"| n15
  n15 --> n16
  n14 -->|"no"| n16
  n16 --> n17
  n17 -->|"yes"| n18
  n18 --> n19
  n17 -->|"no"| n19
  n19 --> n20
  n20 --> n21
  n21 -->|"yes"| n22
  n22 --> n23
  n21 -->|"no"| n23
  n23 --> n24
  n24 -->|"yes"| n25
  n25 --> n26
  n24 -->|"no"| n26
  n26 --> n27
  n27 --> n28
  n28 --> n29
  n29 -->|"yes"| n30
  n30 --> n31
  n29 -->|"no"| n31
  n31 -->|"yes"| n32
  n31 -->|"no"| n33
  n33 --> n34
```

## entriesInForce

```mermaid
flowchart TD
  n1(["entriesInForce"])
  n2["const replaced = new Set(entries.map((entry) =#gt; entry.repla…"]
  n3(["return entries.filter((entry) =#gt; !replaced.has(entry.id));"])
  n1 --> n2
  n2 --> n3
```
