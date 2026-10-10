# tools/diagrams/statements.ts

Drawn from the code by `npm run diagrams` (TypeScript compiler, no AI). Do not edit by hand: change the code, then run it again.

## typed

```mermaid
flowchart TD
  n1(["typed"])
  n2(["return (ctx, node, open) =#gt; handler(ctx, node as T, open);<br/>calls handler"])
  n1 --> n2
```

## drawStatements

```mermaid
flowchart TD
  n1(["drawStatements"])
  n2["let current = open;"]
  n3{"for each const statement of statements"}
  n4["current = drawStatement(ctx, statement, current);<br/>calls drawStatement"]
  n5(["return current;"])
  n1 --> n2
  n2 --> n3
  n3 -->|"next item"| n4
  n4 --> n3
  n3 -->|"done"| n5
```

## drawStatement

```mermaid
flowchart TD
  n1(["drawStatement"])
  n2{"HANDLERS.get(node.kind) is missing?"}
  n3["drawSimple"]
  n4["const handler = HANDLERS.get(node.kind) ?? drawSimple;"]
  n5(["return handler(ctx, node, open);<br/>calls handler"])
  n1 --> n2
  n2 -->|"yes"| n3
  n2 -->|"no"| n4
  n3 --> n4
  n4 --> n5
```

## drawSimple

```mermaid
flowchart TD
  n1(["drawSimple"])
  n2["const ready = drawInnerDecisions(ctx, node, open);<br/>calls drawInnerDecisions"]
  n3(["return drawBox(ctx, ready, node);<br/>calls drawBox"])
  n1 --> n2
  n2 --> n3
```

## drawNothing

```mermaid
flowchart TD
  n1(["drawNothing"])
  n2(["return open;"])
  n1 --> n2
```

## drawBlock

```mermaid
flowchart TD
  n1(["drawBlock"])
  n2(["return drawStatements(ctx, block.statements, open);<br/>calls drawStatements"])
  n1 --> n2
```

## drawIf

```mermaid
flowchart TD
  n1(["drawIf"])
  n2["const outcome = lowerCondition(ctx, node.expression, open);<br/>calls lowerCondition"]
  n3["const thenOut = drawStatement(ctx, node.thenStatement, outc…<br/>calls drawStatement"]
  n4{"node.elseStatement === undefined"}
  n5["outcome.no"]
  n6["drawStatement(ctx, node.elseStatement, outcome.no)<br/>calls drawStatement"]
  n7["const elseOut = node.elseStatement === undefined ? outcome.…<br/>calls drawStatement"]
  n8(["return [...thenOut, ...elseOut];"])
  n1 --> n2
  n2 --> n3
  n3 --> n4
  n4 -->|"yes"| n5
  n4 -->|"no"| n6
  n5 --> n7
  n6 --> n7
  n7 --> n8
```

## drawExit

```mermaid
flowchart TD
  n1(["drawExit"])
  n2{"node.expression === undefined"}
  n3["open"]
  n4["drawInnerDecisions(ctx, node.expression, open)<br/>calls drawInnerDecisions"]
  n5["const ready = node.expression === undefined ? open : drawIn…<br/>calls drawInnerDecisions"]
  n6{"ts.isReturnStatement(node)"}
  n7["#quot;return#quot;"]
  n8["#quot;throw#quot;"]
  n9["const shape = ts.isReturnStatement(node) ? #quot;return#quot; : #quot;thro…"]
  n10["const id = addNode(ctx.flow, shape, #96;${codeText(ctx, node)}…<br/>calls addNode, codeText, callsNote"]
  n11["link(ctx.flow, ready, id);<br/>calls link"]
  n12(["return [];"])
  n1 --> n2
  n2 -->|"yes"| n3
  n2 -->|"no"| n4
  n3 --> n5
  n4 --> n5
  n5 --> n6
  n6 -->|"yes"| n7
  n6 -->|"no"| n8
  n7 --> n9
  n8 --> n9
  n9 --> n10
  n10 --> n11
  n11 --> n12
```

## openTarget

```mermaid
flowchart TD
  n1(["openTarget"])
  n2["const target: Target = { labels: ctx.pendingLabels, isLoop,…"]
  n3["ctx.pendingLabels = [];"]
  n4["ctx.targets.push(target);"]
  n5(["return target;"])
  n1 --> n2
  n2 --> n3
  n3 --> n4
  n4 --> n5
```

## findTarget

```mermaid
flowchart TD
  n1(["findTarget"])
  n2["const matching = ctx.targets.filter((target) =#gt; (label === …"]
  n3(["return matching.at(-1);"])
  n1 --> n2
  n2 --> n3
```

## findTarget > inner function 1

```mermaid
flowchart TD
  n1(["findTarget #gt; inner function 1"])
  n2{"label === undefined"}
  n3{"!needsLoop"}
  n4["target.isLoop"]
  n5["target.labels.includes(label.text)"]
  n6(["return (label === undefined ? !needsLoop || target.isLoop : target"])
  n1 --> n2
  n2 -->|"yes"| n3
  n3 -->|"no"| n4
  n2 -->|"no"| n5
  n3 -->|"yes"| n6
  n4 --> n6
  n5 --> n6
```

## drawJump

```mermaid
flowchart TD
  n1(["drawJump"])
  n2{"ts.isBreakStatement(node)"}
  n3["#quot;break#quot;"]
  n4["#quot;continue#quot;"]
  n5["const keyword = ts.isBreakStatement(node) ? #quot;break#quot; : #quot;cont…"]
  n6{"node.label === undefined"}
  n7["keyword"]
  n8["#96;${keyword} ${node.label.text}#96;"]
  n9["const id = addNode(ctx.flow, #quot;box#quot;, node.label === undefine…<br/>calls addNode"]
  n10["link(ctx.flow, open, id);<br/>calls link"]
  n11["const target = findTarget(ctx, node.label, ts.isContinueSta…<br/>calls findTarget"]
  n12{"ts.isBreakStatement(node)"}
  n13["target?.breaks"]
  n14["target?.continues"]
  n15["(ts.isBreakStatement(node) ? target?.breaks : target?.conti…<br/>calls step"]
  n16(["return [];"])
  n1 --> n2
  n2 -->|"yes"| n3
  n2 -->|"no"| n4
  n3 --> n5
  n4 --> n5
  n5 --> n6
  n6 -->|"yes"| n7
  n6 -->|"no"| n8
  n7 --> n9
  n8 --> n9
  n9 --> n10
  n10 --> n11
  n11 --> n12
  n12 -->|"yes"| n13
  n12 -->|"no"| n14
  n13 --> n15
  n14 --> n15
  n15 --> n16
```

## drawLabeled

```mermaid
flowchart TD
  n1(["drawLabeled"])
  n2["ctx.pendingLabels.push(node.label.text);"]
  n3["const out = drawStatement(ctx, node.statement, open);<br/>calls drawStatement"]
  n4["ctx.pendingLabels = [];"]
  n5(["return out;"])
  n1 --> n2
  n2 --> n3
  n3 --> n4
  n4 --> n5
```

## drawLoopBody

```mermaid
flowchart TD
  n1(["drawLoopBody"])
  n2["const target = openTarget(ctx, true);<br/>calls openTarget"]
  n3["const bodyOut = drawStatement(ctx, body, enter);<br/>calls drawStatement"]
  n4["ctx.targets.pop();"]
  n5["const again = head();<br/>calls head"]
  n6{"again !== undefined"}
  n7["link(ctx.flow, [...bodyOut, ...target.continues], again);<br/>calls link"]
  n8(["return target.breaks;"])
  n1 --> n2
  n2 --> n3
  n3 --> n4
  n4 --> n5
  n5 --> n6
  n6 -->|"yes"| n7
  n7 --> n8
  n6 -->|"no"| n8
```

## firstNodeSince

```mermaid
flowchart TD
  n1(["firstNodeSince"])
  n2(["return ctx.flow.nodes[mark]?.id;"])
  n1 --> n2
```

## drawWhile

```mermaid
flowchart TD
  n1(["drawWhile"])
  n2["const mark = ctx.flow.nodes.length;"]
  n3["const outcome = lowerCondition(ctx, node.expression, open);<br/>calls lowerCondition"]
  n4["const exits = drawLoopBody(ctx, node.statement, outcome.yes…<br/>calls drawLoopBody, firstNodeSince"]
  n5(["return [...outcome.no, ...exits];"])
  n1 --> n2
  n2 --> n3
  n3 --> n4
  n4 --> n5
```

## drawDoWhile

```mermaid
flowchart TD
  n1(["drawDoWhile"])
  n2["const mark = ctx.flow.nodes.length;"]
  n3["const target = openTarget(ctx, true);<br/>calls openTarget"]
  n4["const bodyOut = drawStatement(ctx, node.statement, open);<br/>calls drawStatement"]
  n5["ctx.targets.pop();"]
  n6["const outcome = lowerCondition(ctx, node.expression, [...bo…<br/>calls lowerCondition"]
  n7["const start = firstNodeSince(ctx, mark);<br/>calls firstNodeSince"]
  n8{"start !== undefined"}
  n9["link(ctx.flow, outcome.yes, start);<br/>calls link"]
  n10(["return [...outcome.no, ...target.breaks];"])
  n1 --> n2
  n2 --> n3
  n3 --> n4
  n4 --> n5
  n5 --> n6
  n6 --> n7
  n7 --> n8
  n8 -->|"yes"| n9
  n9 --> n10
  n8 -->|"no"| n10
```

## drawForEach

```mermaid
flowchart TD
  n1(["drawForEach"])
  n2{"ts.isForOfStatement(node)"}
  n3["#quot;of#quot;"]
  n4["#quot;in#quot;"]
  n5["const word = ts.isForOfStatement(node) ? #quot;of#quot; : #quot;in#quot;;"]
  n6["const head = addNode(ctx.flow, #quot;decision#quot;, #96;for each ${node…<br/>calls addNode, codeText, callsNote"]
  n7["link(ctx.flow, open, head);<br/>calls link"]
  n8["const exits = drawLoopBody(ctx, node.statement, step(head, …<br/>calls drawLoopBody, step"]
  n9(["return [...step(head, #quot;done#quot;), ...exits];<br/>calls step"])
  n1 --> n2
  n2 -->|"yes"| n3
  n2 -->|"no"| n4
  n3 --> n5
  n4 --> n5
  n5 --> n6
  n6 --> n7
  n7 --> n8
  n8 --> n9
```

## drawForInit

```mermaid
flowchart TD
  n1(["drawForInit"])
  n2{"node.initializer === undefined"}
  n3["open"]
  n4["drawBox(ctx, drawInnerDecisions(ctx, node.initializer, open…<br/>calls drawBox, drawInnerDecisions"]
  n5(["return node.initializer === undefined ? open : drawBox(ctx,…<br/>calls drawBox, drawInnerDecisions"])
  n1 --> n2
  n2 -->|"yes"| n3
  n2 -->|"no"| n4
  n3 --> n5
  n4 --> n5
```

## drawFor

```mermaid
flowchart TD
  n1(["drawFor"])
  n2["const afterInit = drawForInit(ctx, node, open);<br/>calls drawForInit"]
  n3["const mark = ctx.flow.nodes.length;"]
  n4{"node.condition === undefined"}
  n5["{ yes: afterInit, no: [] as Open }"]
  n6["lowerCondition(ctx, node.condition, afterInit)<br/>calls lowerCondition"]
  n7["const test = node.condition === undefined ? { yes: afterIni…<br/>calls lowerCondition"]
  n8["const target = openTarget(ctx, true);<br/>calls openTarget"]
  n9["const bodyOut = drawStatement(ctx, node.statement, test.yes…<br/>calls drawStatement"]
  n10["ctx.targets.pop();"]
  n11{"node.incrementor === undefined"}
  n12["[...bodyOut, ...target.continues]"]
  n13["drawBox(ctx, [...bodyOut, ...target.continues], node.increm…<br/>calls drawBox"]
  n14["const afterBody = node.incrementor === undefined ? [...body…<br/>calls drawBox"]
  n15["const start = firstNodeSince(ctx, mark);<br/>calls firstNodeSince"]
  n16{"start !== undefined"}
  n17["link(ctx.flow, afterBody, start);<br/>calls link"]
  n18(["return [...test.no, ...target.breaks];"])
  n1 --> n2
  n2 --> n3
  n3 --> n4
  n4 -->|"yes"| n5
  n4 -->|"no"| n6
  n5 --> n7
  n6 --> n7
  n7 --> n8
  n8 --> n9
  n9 --> n10
  n10 --> n11
  n11 -->|"yes"| n12
  n11 -->|"no"| n13
  n12 --> n14
  n13 --> n14
  n14 --> n15
  n15 --> n16
  n16 -->|"yes"| n17
  n17 --> n18
  n16 -->|"no"| n18
```

## caseLabel

```mermaid
flowchart TD
  n1(["caseLabel"])
  n2{"ts.isCaseClause(clause)"}
  n3["#96;case ${codeText(ctx, clause.expression)}#96;<br/>calls codeText"]
  n4["#quot;default#quot;"]
  n5(["return ts.isCaseClause(clause) ? #96;case ${codeText(ctx, clau…<br/>calls codeText"])
  n1 --> n2
  n2 -->|"yes"| n3
  n2 -->|"no"| n4
  n3 --> n5
  n4 --> n5
```

## drawSwitch

```mermaid
flowchart TD
  n1(["drawSwitch"])
  n2["const ready = drawInnerDecisions(ctx, node.expression, open…<br/>calls drawInnerDecisions"]
  n3["const head = addNode(ctx.flow, #quot;decision#quot;, #96;switch ${codeTe…<br/>calls addNode, codeText, callsNote"]
  n4["link(ctx.flow, ready, head);<br/>calls link"]
  n5["const target = openTarget(ctx, false);<br/>calls openTarget"]
  n6["let carry: Open = [];"]
  n7{"for each const clause of node.caseBlock.clauses"}
  n8["carry = drawStatements(ctx, clause.statements, [...step(hea…<br/>calls drawStatements, step, caseLabel"]
  n9["ctx.targets.pop();"]
  n10["const hasDefault = node.caseBlock.clauses.some(ts.isDefault…"]
  n11{"hasDefault"}
  n12["[]"]
  n13["step(head, #quot;no case matches#quot;)<br/>calls step"]
  n14(["return [...carry, ...target.breaks, ...(hasDefault ? [] : s…<br/>calls step"])
  n1 --> n2
  n2 --> n3
  n3 --> n4
  n4 --> n5
  n5 --> n6
  n6 --> n7
  n7 -->|"next item"| n8
  n8 --> n7
  n7 -->|"done"| n9
  n9 --> n10
  n10 --> n11
  n11 -->|"yes"| n12
  n11 -->|"no"| n13
  n12 --> n14
  n13 --> n14
```

## drawTry

```mermaid
flowchart TD
  n1(["drawTry"])
  n2["const start = addNode(ctx.flow, #quot;box#quot;, #quot;try#quot;);<br/>calls addNode"]
  n3["link(ctx.flow, open, start);<br/>calls link"]
  n4["const tryOut = drawBlock(ctx, node.tryBlock, step(start));<br/>calls drawBlock, step"]
  n5{"node.catchClause === undefined"}
  n6["[]"]
  n7["drawCatch(ctx, node.catchClause, step(start, #quot;throws#quot;))<br/>calls drawCatch, step"]
  n8["const catchOut = node.catchClause === undefined ? [] : draw…<br/>calls drawCatch, step"]
  n9["const joined = [...tryOut, ...catchOut];"]
  n10{"node.finallyBlock === undefined"}
  n11["joined"]
  n12["drawBlock(ctx, node.finallyBlock, joined)<br/>calls drawBlock"]
  n13(["return node.finallyBlock === undefined ? joined : drawBlock…<br/>calls drawBlock"])
  n1 --> n2
  n2 --> n3
  n3 --> n4
  n4 --> n5
  n5 -->|"yes"| n6
  n5 -->|"no"| n7
  n6 --> n8
  n7 --> n8
  n8 --> n9
  n9 --> n10
  n10 -->|"yes"| n11
  n10 -->|"no"| n12
  n11 --> n13
  n12 --> n13
```

## drawCatch

```mermaid
flowchart TD
  n1(["drawCatch"])
  n2{"clause.variableDeclaration === undefined"}
  n3["#quot;#quot;"]
  n4["#96; (${clause.variableDeclaration.name.getText(ctx.file)})#96;"]
  n5["const variable = clause.variableDeclaration === undefined ?…"]
  n6["const id = addNode(ctx.flow, #quot;box#quot;, #96;catch${variable}#96;);<br/>calls addNode"]
  n7["link(ctx.flow, open, id);<br/>calls link"]
  n8(["return drawBlock(ctx, clause.block, step(id));<br/>calls drawBlock, step"])
  n1 --> n2
  n2 -->|"yes"| n3
  n2 -->|"no"| n4
  n3 --> n5
  n4 --> n5
  n5 --> n6
  n6 --> n7
  n7 --> n8
```
