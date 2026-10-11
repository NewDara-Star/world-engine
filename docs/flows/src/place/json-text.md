# src/place/json-text.ts

Drawn from the code by `npm run diagrams` (TypeScript compiler, no AI). Do not edit by hand: change the code, then run it again.

## readJsonText

```mermaid
flowchart TD
  n1(["readJsonText"])
  n2["const readable = text.replace(/^\uFEFF/, #quot; #quot;);"]
  n3{"/^[ \t\r\n]*$/.test(readable)"}
  n4(["return { read: false, kind: #quot;empty#quot;, offset: 0 };"])
  n5["const errors: ParseError[] = [];"]
  n6["try"]
  n7["const tree = parseTree(readable, errors, STRICT);"]
  n8{"errors[0] is missing?"}
  n9["NO_TREE"]
  n10["const first = errors[0] ?? NO_TREE;"]
  n11{"errors.length #gt; 0"}
  n12{"tree === undefined"}
  n13(["return { read: false, kind: printParseErrorCode(first.error…"])
  n14(["return { read: true, tree, values: getNodeValue(tree) };"])
  n15["catch (error)"]
  n16{"error instanceof RangeError"}
  n17(["return { read: false, kind: NESTED_TOO_DEEPLY, offset: 0 };"])
  n18{{"throw error;"}}
  n1 --> n2
  n2 --> n3
  n3 -->|"yes"| n4
  n3 -->|"no"| n5
  n5 --> n6
  n6 --> n7
  n7 --> n8
  n8 -->|"yes"| n9
  n8 -->|"no"| n10
  n9 --> n10
  n10 --> n11
  n11 -->|"no"| n12
  n11 -->|"yes"| n13
  n12 -->|"yes"| n13
  n12 -->|"no"| n14
  n6 -->|"throws"| n15
  n15 --> n16
  n16 -->|"yes"| n17
  n16 -->|"no"| n18
```

## lineStartOffsets

```mermaid
flowchart TD
  n1(["lineStartOffsets"])
  n2["const starts = [0];"]
  n3["let at = 0"]
  n4{"at #lt; text.length"}
  n5["const character = text[at];"]
  n6{"character === #quot;\r#quot;"}
  n7{"text[at + 1] === #quot;\n#quot;"}
  n8["at++;"]
  n9["starts.push(at + 1);"]
  n10{"character === #quot;\n#quot;"}
  n11["starts.push(at + 1);"]
  n12["at++"]
  n13(["return starts;"])
  n1 --> n2
  n2 --> n3
  n3 --> n4
  n4 -->|"yes"| n5
  n5 --> n6
  n6 -->|"yes"| n7
  n7 -->|"yes"| n8
  n8 --> n9
  n7 -->|"no"| n9
  n6 -->|"no"| n10
  n10 -->|"yes"| n11
  n9 --> n12
  n11 --> n12
  n10 -->|"no"| n12
  n12 --> n4
  n4 -->|"no"| n13
```

## lineAtOffset

```mermaid
flowchart TD
  n1(["lineAtOffset"])
  n2["let low = 0;"]
  n3["let high = starts.length - 1;"]
  n4{"low #lt; high"}
  n5["const middle = Math.ceil((low + high) / 2);"]
  n6{"Number(starts[middle]) #lt;= offset"}
  n7["low = middle;"]
  n8["high = middle - 1;"]
  n9(["return low + 1;"])
  n1 --> n2
  n2 --> n3
  n3 --> n4
  n4 -->|"yes"| n5
  n5 --> n6
  n6 -->|"yes"| n7
  n6 -->|"no"| n8
  n7 --> n4
  n8 --> n4
  n4 -->|"no"| n9
```

## lineOfPath

```mermaid
flowchart TD
  n1(["lineOfPath"])
  n2["const node = usedNodeAtPath(tree, path);<br/>calls usedNodeAtPath"]
  n3["let offset: number;"]
  n4{"node === undefined"}
  n5["offset = 0;"]
  n6{"node.parent?.type === #quot;property#quot;"}
  n7["offset = node.parent.offset;"]
  n8["offset = node.offset;"]
  n9(["return lineAtOffset(starts, offset);<br/>calls lineAtOffset"])
  n1 --> n2
  n2 --> n3
  n3 --> n4
  n4 -->|"yes"| n5
  n4 -->|"no"| n6
  n6 -->|"yes"| n7
  n6 -->|"no"| n8
  n5 --> n9
  n7 --> n9
  n8 --> n9
```

## usedNodeAtPath

```mermaid
flowchart TD
  n1(["usedNodeAtPath"])
  n2["let node: Node | undefined = tree;"]
  n3{"for each const step of path"}
  n4{"node === undefined"}
  n5(["return undefined;"])
  n6{"node.children is missing?"}
  n7["[]"]
  n8["const children: Node[] = node.children ?? [];"]
  n9{"node.type === #quot;object#quot;"}
  n10{"typeof step === #quot;string#quot;"}
  n11["node = children .filter((property) =#gt; property.children?.[0…"]
  n12{"node.type === #quot;array#quot;"}
  n13{"typeof step === #quot;number#quot;"}
  n14["node = children[step];"]
  n15(["return undefined;"])
  n16(["return node;"])
  n1 --> n2
  n2 --> n3
  n3 -->|"next item"| n4
  n4 -->|"yes"| n5
  n4 -->|"no"| n6
  n6 -->|"yes"| n7
  n6 -->|"no"| n8
  n7 --> n8
  n8 --> n9
  n9 -->|"yes"| n10
  n10 -->|"yes"| n11
  n9 -->|"no"| n12
  n10 -->|"no"| n12
  n12 -->|"yes"| n13
  n13 -->|"yes"| n14
  n12 -->|"no"| n15
  n13 -->|"no"| n15
  n11 --> n3
  n14 --> n3
  n3 -->|"done"| n16
```

## problemsForRepeatedFields

```mermaid
flowchart TD
  n1(["problemsForRepeatedFields"])
  n2{"node.children is missing?"}
  n3["[]"]
  n4["const children = node.children ?? [];"]
  n5{"node.type === #quot;object#quot;"}
  n6["const named = children.map((property) =#gt; ({ name: String(pr…"]
  n7["const copiesByName = new Map#lt;string, Node[]#gt;(named.map((ent…"]
  n8{"for each const entry of named"}
  n9["copiesByName.get(entry.name)?.push(entry.property);"]
  n10["const groups = [...copiesByName];"]
  n11["const problems = groups .filter(([, copies]) =#gt; copies.leng…<br/>calls problemForRepeatedField"]
  n12["const usedValues = groups .map(([name, copies]) =#gt; ({ name,…"]
  n13{"for each const used of usedValues"}
  n14["problems.push(...problemsForRepeatedFields(used.value, path…<br/>calls problemsForRepeatedFields, pathToField"]
  n15(["return problems;"])
  n16{"node.type === #quot;array#quot;"}
  n17["const problems: Problem[] = [];"]
  n18{"for each const [index, item] of children.entries()"}
  n19["problems.push(...problemsForRepeatedFields(item, pathToFiel…<br/>calls problemsForRepeatedFields, pathToField"]
  n20(["return problems;"])
  n21(["return [];"])
  n1 --> n2
  n2 -->|"yes"| n3
  n2 -->|"no"| n4
  n3 --> n4
  n4 --> n5
  n5 -->|"yes"| n6
  n6 --> n7
  n7 --> n8
  n8 -->|"next item"| n9
  n9 --> n8
  n8 -->|"done"| n10
  n10 --> n11
  n11 --> n12
  n12 --> n13
  n13 -->|"next item"| n14
  n14 --> n13
  n13 -->|"done"| n15
  n5 -->|"no"| n16
  n16 -->|"yes"| n17
  n17 --> n18
  n18 -->|"next item"| n19
  n19 --> n18
  n18 -->|"done"| n20
  n16 -->|"no"| n21
```

## problemForRepeatedField

```mermaid
flowchart TD
  n1(["problemForRepeatedField"])
  n2["const lines = [...new Set(copies.map((copy) =#gt; lineAtOffset…<br/>calls lineAtOffset"]
  n3["let count: string;"]
  n4{"copies.length === 2"}
  n5["count = #quot;twice#quot;;"]
  n6["count = #96;${copies.length} times#96;;"]
  n7["const fieldPath = pathToField(objectPath, name);<br/>calls pathToField"]
  n8["let sentence: string;"]
  n9{"lines.length === 1"}
  n10["sentence = #96;${labelForPath(fieldPath)} is written ${count},…<br/>calls labelForPath"]
  n11["sentence = #96;${labelForPath(fieldPath)} is written ${count},…<br/>calls labelForPath"]
  n12(["return problemAt(fieldPath, sentence);<br/>calls problemAt"])
  n1 --> n2
  n2 --> n3
  n3 --> n4
  n4 -->|"yes"| n5
  n4 -->|"no"| n6
  n5 --> n7
  n6 --> n7
  n7 --> n8
  n8 --> n9
  n9 -->|"yes"| n10
  n9 -->|"no"| n11
  n10 --> n12
  n11 --> n12
```

## syntaxProblemInWords

```mermaid
flowchart TD
  n1(["syntaxProblemInWords"])
  n2["const subject = labelForPath([]);<br/>calls labelForPath"]
  n3["const words = SENTENCES.get(kind);"]
  n4{"words !== undefined"}
  n5(["return #96;${subject} ${words}#96;;"])
  n6(["return #96;${subject} is not valid JSON here.#96;;"])
  n1 --> n2
  n2 --> n3
  n3 --> n4
  n4 -->|"yes"| n5
  n4 -->|"no"| n6
```
