# tools/diagrams/flow-model.ts

Drawn from the code by `npm run diagrams` (TypeScript compiler, no AI). Do not edit by hand: change the code, then run it again.

## newFlow

```mermaid
flowchart TD
  n1(["newFlow"])
  n2(["return { nodes: [], edges: [] };"])
  n1 --> n2
```

## addNode

```mermaid
flowchart TD
  n1(["addNode"])
  n2["const id = #96;n${flow.nodes.length + 1}#96;;"]
  n3["flow.nodes.push({ id, shape, text });"]
  n4(["return id;"])
  n1 --> n2
  n2 --> n3
  n3 --> n4
```

## link

```mermaid
flowchart TD
  n1(["link"])
  n2{"for each const end of open"}
  n3["const known = flow.edges.some((edge) =#gt; edge.from === end.f…"]
  n4{"!known"}
  n5["flow.edges.push({ from: end.from, to, label: end.label });"]
  n6(["end"])
  n1 --> n2
  n2 -->|"next item"| n3
  n3 --> n4
  n4 -->|"yes"| n5
  n5 --> n2
  n4 -->|"no"| n2
  n2 -->|"done"| n6
```

## link > inner function 1

```mermaid
flowchart TD
  n1(["link #gt; inner function 1"])
  n2{"edge.from === end.from"}
  n3{"edge.to === to"}
  n4["edge.label === end.label"]
  n5(["return edge.from === end.from && edge.to === to && edge.label === "])
  n1 --> n2
  n2 -->|"yes"| n3
  n3 -->|"yes"| n4
  n2 -->|"no"| n5
  n3 -->|"no"| n5
  n4 --> n5
```

## shorten

```mermaid
flowchart TD
  n1(["shorten"])
  n2["const oneLine = text.replace(/\s+/g, #quot; #quot;).trim();"]
  n3{"oneLine.length #gt; MAX_TEXT"}
  n4["#96;${oneLine.slice(0, MAX_TEXT - 1)}…#96;"]
  n5["oneLine"]
  n6(["return oneLine.length #gt; MAX_TEXT ? #96;${oneLine.slice(0, MAX_…"])
  n1 --> n2
  n2 --> n3
  n3 -->|"yes"| n4
  n3 -->|"no"| n5
  n4 --> n6
  n5 --> n6
```

## escapeLabel

```mermaid
flowchart TD
  n1(["escapeLabel"])
  n2(["return text .replaceAll(#quot;#35;#quot;, #quot;#35;35;#quot;) .replaceAll('#quot;', #quot;#35;quo…"])
  n1 --> n2
```

## renderNode

```mermaid
flowchart TD
  n1(["renderNode"])
  n2["const [open, close] = BRACKETS[node.shape];"]
  n3(["return #96; ${node.id}${open}#quot;${escapeLabel(node.text)}#quot;${clos…<br/>calls escapeLabel"])
  n1 --> n2
  n2 --> n3
```

## renderEdge

```mermaid
flowchart TD
  n1(["renderEdge"])
  n2{"edge.label === #quot;#quot;"}
  n3["#quot;--#gt;#quot;"]
  n4["#96;--#gt;|#quot;${escapeLabel(edge.label)}#quot;|#96;<br/>calls escapeLabel"]
  n5["const arrow = edge.label === #quot;#quot; ? #quot;--#gt;#quot; : #96;--#gt;|#quot;${escapeLab…<br/>calls escapeLabel"]
  n6(["return #96; ${edge.from} ${arrow} ${edge.to}#96;;"])
  n1 --> n2
  n2 -->|"yes"| n3
  n2 -->|"no"| n4
  n3 --> n5
  n4 --> n5
  n5 --> n6
```

## renderMermaid

```mermaid
flowchart TD
  n1(["renderMermaid"])
  n2(["return [#quot;flowchart TD#quot;, ...flow.nodes.map(renderNode), ...f…"])
  n1 --> n2
```
