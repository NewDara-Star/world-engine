# tools/diagrams/flow.ts

Drawn from the code by `npm run diagrams` (TypeScript compiler, no AI). Do not edit by hand: change the code, then run it again.

## drawConciseBody

```mermaid
flowchart TD
  n1(["drawConciseBody"])
  n2["const ready = drawInnerDecisions(ctx, body, open);<br/>calls drawInnerDecisions"]
  n3["const id = addNode(ctx.flow, #quot;return#quot;, #96;return ${body.getTe…<br/>calls addNode"]
  n4["link(ctx.flow, ready, id);<br/>calls link"]
  n5(["return [];"])
  n1 --> n2
  n2 --> n3
  n3 --> n4
  n4 --> n5
```

## drawBody

```mermaid
flowchart TD
  n1(["drawBody"])
  n2{"ts.isBlock(body)"}
  n3["drawStatements(ctx, body.statements, open)<br/>calls drawStatements"]
  n4["drawConciseBody(ctx, body, open)<br/>calls drawConciseBody"]
  n5(["return ts.isBlock(body) ? drawStatements(ctx, body.statemen…<br/>calls drawStatements, drawConciseBody"])
  n1 --> n2
  n2 -->|"yes"| n3
  n2 -->|"no"| n4
  n3 --> n5
  n4 --> n5
```

## buildFlow

```mermaid
flowchart TD
  n1(["buildFlow"])
  n2["const ctx: Context = { flow: newFlow(), file, checker: proj…<br/>calls newFlow"]
  n3["const start = addNode(ctx.flow, #quot;start#quot;, entry.name);<br/>calls addNode"]
  n4["const leftOver = drawBody(ctx, entry.body, step(start));<br/>calls drawBody, step"]
  n5{"leftOver.length #gt; 0"}
  n6["link(ctx.flow, leftOver, addNode(ctx.flow, #quot;return#quot;, #quot;end#quot;)…<br/>calls link, addNode"]
  n7(["return ctx.flow;"])
  n1 --> n2
  n2 --> n3
  n3 --> n4
  n4 --> n5
  n5 -->|"yes"| n6
  n6 --> n7
  n5 -->|"no"| n7
```
