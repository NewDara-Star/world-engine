# tools/decisions/cli.ts

Drawn from the code by `npm run diagrams` (TypeScript compiler, no AI). Do not edit by hand: change the code, then run it again.

## parseCheckArguments

```mermaid
flowchart TD
  n1(["parseCheckArguments"])
  n2{"words[0] !== #quot;check#quot;"}
  n3(["return { problem: USAGE };"])
  n4["const joined = words.slice(1).join(#quot;\0#quot;).replace(/(^|\0)--t…"]
  n5["const texts = joined.filter((word) =#gt; word !== #quot;#quot;).filter((…"]
  n6["const tagOptions = joined.filter((word) =#gt; TAGS_OPTION.test…"]
  n7{"texts.length !== 1"}
  n8{"String(texts[0]).trim() === #quot;#quot;"}
  n9(["return { problem: #96;${TEXT_PROBLEM[#96;${texts.length #gt; 1}#96; as …"])
  n10["const optionProblems = [ ...joined.filter((word) =#gt; OTHER_O…"]
  n11{"optionProblems.length #gt; 0"}
  n12(["return { problem: #96;${optionProblems.join(#quot;\n#quot;)}\n${USAGE}#96; …"])
  n13["const tags = tagOptions.flatMap((word) =#gt; word.replace(TAGS…"]
  n14(["return { text: String(texts[0]), tags };"])
  n1 --> n2
  n2 -->|"yes"| n3
  n2 -->|"no"| n4
  n4 --> n5
  n5 --> n6
  n6 --> n7
  n7 -->|"no"| n8
  n7 -->|"yes"| n9
  n8 -->|"yes"| n9
  n8 -->|"no"| n10
  n10 --> n11
  n11 -->|"yes"| n12
  n11 -->|"no"| n13
  n13 --> n14
```

## unknownTags

```mermaid
flowchart TD
  n1(["unknownTags"])
  n2["const inUse = [...new Set(entries.flatMap((entry) =#gt; entry.…"]
  n3(["return queryTags .filter((tag) =#gt; !inUse.includes(tag)) .ma…<br/>calls editDistance"])
  n1 --> n2
  n2 --> n3
```

## describeMatch

```mermaid
flowchart TD
  n1(["describeMatch"])
  n2["const { entry } = match;"]
  n3["const lines = [#96;${entry.id} (${entry.date}, decided by ${en…"]
  n4{"entry.replaces !== undefined"}
  n5["lines.push(#96; Replaces ${entry.replaces}.#96;);"]
  n6["const matched = [...match.sharedTags.map((tag) =#gt; #96;tag ${ta…"]
  n7["lines.push(#96; Matched on: ${matched.join(#quot;, #quot;)}#96;);"]
  n8(["return lines;"])
  n1 --> n2
  n2 --> n3
  n3 --> n4
  n4 -->|"yes"| n5
  n5 --> n6
  n4 -->|"no"| n6
  n6 --> n7
  n7 --> n8
```

## main

```mermaid
flowchart TD
  n1(["main"])
  n2["const parsed = parseCheckArguments(words);<br/>calls parseCheckArguments"]
  n3{"#quot;problem#quot; in parsed"}
  n4["console.error(parsed.problem);"]
  n5(["return 1;"])
  n6["let logText: string;"]
  n7["try"]
  n8["logText = readFileSync(LOG_PATH, #quot;utf8#quot;);"]
  n9["catch"]
  n10["console.error(#96;the decision log was not found at ${LOG_PATH…"]
  n11(["return 1;"])
  n12["const log = readDecisionLog(logText);<br/>calls readDecisionLog"]
  n13{"log.problems.length #gt; 0"}
  n14["console.error([...log.problems.map((problem) =#gt; #96;${LOG_PATH…"]
  n15(["return 1;"])
  n16["unknownTags(parsed.tags, log.entries).forEach((unknown) =#gt; …<br/>calls unknownTags"]
  n17["const found = findClashes(entriesInForce(log.entries), pars…<br/>calls findClashes, entriesInForce"]
  n18{"found === undefined"}
  n19["console.error(#quot;The text has no words to compare (they are a…"]
  n20(["return 1;"])
  n21{"found.length === 0"}
  n22["console.log(#quot;No decision in force shares these tags or clos…"]
  n23(["return 0;"])
  n24["console.log(#96;Decisions in force to check against: ${found.l…"]
  n25["console.log(found.map((match) =#gt; describeMatch(match).join(…<br/>calls describeMatch"]
  n26(["return 0;"])
  n1 --> n2
  n2 --> n3
  n3 -->|"yes"| n4
  n4 --> n5
  n3 -->|"no"| n6
  n6 --> n7
  n7 --> n8
  n7 -->|"throws"| n9
  n9 --> n10
  n10 --> n11
  n8 --> n12
  n12 --> n13
  n13 -->|"yes"| n14
  n14 --> n15
  n13 -->|"no"| n16
  n16 --> n17
  n17 --> n18
  n18 -->|"yes"| n19
  n19 --> n20
  n18 -->|"no"| n21
  n21 -->|"yes"| n22
  n22 --> n23
  n21 -->|"no"| n24
  n24 --> n25
  n25 --> n26
```
