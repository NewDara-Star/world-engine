# src/place/check-file.ts

Drawn from the code by `npm run diagrams` (TypeScript compiler, no AI). Do not edit by hand: change the code, then run it again.

## validateJsonFile

```mermaid
flowchart TD
  n1(["validateJsonFile"])
  n2["const starts = lineStartOffsets(text);<br/>calls lineStartOffsets"]
  n3["const json = readJsonText(text);<br/>calls readJsonText"]
  n4{"!json.read"}
  n5(["return { ok: false, messages: [#96;${fileName} line ${lineAtOf…<br/>calls lineAtOffset, syntaxProblemInWords"])
  n6["const checked = checker(json.values, []);<br/>calls checker"]
  n7["let repeated: Problem[] = [];"]
  n8["let tooDeep: string[] = [];"]
  n9["try"]
  n10["repeated = problemsForRepeatedFields(json.tree, [], starts);<br/>calls problemsForRepeatedFields"]
  n11["catch (error)"]
  n12{"!(error instanceof RangeError)"}
  n13{{"throw error;"}}
  n14["tooDeep = [#96;${fileName} line 1: ${syntaxProblemInWords(NEST…<br/>calls syntaxProblemInWords"]
  n15{"checked.ok"}
  n16{"repeated.length + tooDeep.length === 0"}
  n17(["return { ok: true, value: checked.value };"])
  n18{"checked.ok"}
  n19["[]"]
  n20["checked.problems"]
  n21["const problems = [...repeated, ...(checked.ok ? [] : checke…"]
  n22["const messages = [...tooDeep, ...problems.map((problem) =#gt; …<br/>calls messageForProblem"]
  n23{"checked.crossCheckWaited"}
  n24["messages.push(#96;${fileName}: Fix these first; some cross-che…"]
  n25(["return { ok: false, messages };"])
  n1 --> n2
  n2 --> n3
  n3 --> n4
  n4 -->|"yes"| n5
  n4 -->|"no"| n6
  n6 --> n7
  n7 --> n8
  n8 --> n9
  n9 --> n10
  n9 -->|"throws"| n11
  n11 --> n12
  n12 -->|"yes"| n13
  n12 -->|"no"| n14
  n10 --> n15
  n14 --> n15
  n15 -->|"yes"| n16
  n16 -->|"yes"| n17
  n15 -->|"no"| n18
  n16 -->|"no"| n18
  n18 -->|"yes"| n19
  n18 -->|"no"| n20
  n19 --> n21
  n20 --> n21
  n21 --> n22
  n22 --> n23
  n23 -->|"yes"| n24
  n24 --> n25
  n23 -->|"no"| n25
```

## messageForProblem

```mermaid
flowchart TD
  n1(["messageForProblem"])
  n2(["return #96;${fileName} line ${lineOfPath(tree, starts, problem…<br/>calls lineOfPath"])
  n1 --> n2
```
