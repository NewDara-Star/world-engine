# tools/diagrams/expressions.ts

Drawn from the code by `npm run diagrams` (TypeScript compiler, no AI). Do not edit by hand: change the code, then run it again.

## step

```mermaid
flowchart TD
  n1(["step"])
  n2(["return [{ from: id, label }];"])
  n1 --> n2
```

## drawBox

```mermaid
flowchart TD
  n1(["drawBox"])
  n2["const id = addNode(ctx.flow, #quot;box#quot;, #96;${prefix}${codeText(ct…<br/>calls addNode, codeText, callsNote"]
  n3["link(ctx.flow, open, id);<br/>calls link"]
  n4(["return step(id);<br/>calls step"])
  n1 --> n2
  n2 --> n3
  n3 --> n4
```

## unwrap

```mermaid
flowchart TD
  n1(["unwrap"])
  n2{"ts.isParenthesizedExpression(node)"}
  n3["unwrap(node.expression)<br/>calls unwrap"]
  n4["node"]
  n5(["return ts.isParenthesizedExpression(node) ? unwrap(node.exp…<br/>calls unwrap"])
  n1 --> n2
  n2 -->|"yes"| n3
  n2 -->|"no"| n4
  n3 --> n5
  n4 --> n5
```

## splitGuard

```mermaid
flowchart TD
  n1(["splitGuard"])
  n2["const left = lowerCondition(ctx, guard.left, open);<br/>calls lowerCondition"]
  n3{"guard.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersa…"}
  n4["const right = lowerCondition(ctx, guard.right, left.yes);<br/>calls lowerCondition"]
  n5(["return { yes: right.yes, no: [...left.no, ...right.no] };"])
  n6["const right = lowerCondition(ctx, guard.right, left.no);<br/>calls lowerCondition"]
  n7(["return { yes: [...left.yes, ...right.yes], no: right.no };"])
  n1 --> n2
  n2 --> n3
  n3 -->|"yes"| n4
  n4 --> n5
  n3 -->|"no"| n6
  n6 --> n7
```

## isAndOr

```mermaid
flowchart TD
  n1(["isAndOr"])
  n2{"ts.isBinaryExpression(node)"}
  n3{"node.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersan…"}
  n4["node.operatorToken.kind === ts.SyntaxKind.BarBarToken"]
  n5(["return ( ts.isBinaryExpression(node) && (node.operatorToken…"])
  n1 --> n2
  n2 -->|"yes"| n3
  n3 -->|"no"| n4
  n2 -->|"no"| n5
  n3 -->|"yes"| n5
  n4 --> n5
```

## lowerCondition

```mermaid
flowchart TD
  n1(["lowerCondition"])
  n2["const inner = unwrap(condition);<br/>calls unwrap"]
  n3{"isAndOr(inner)<br/>calls isAndOr"}
  n4(["return splitGuard(ctx, inner, open);<br/>calls splitGuard"])
  n5["const ready = drawInnerDecisions(ctx, inner, open);<br/>calls drawInnerDecisions"]
  n6["const id = addNode(ctx.flow, #quot;decision#quot;, #96;${codeText(ctx, i…<br/>calls addNode, codeText, callsNote"]
  n7["link(ctx.flow, ready, id);<br/>calls link"]
  n8(["return { yes: step(id, #quot;yes#quot;), no: step(id, #quot;no#quot;) };<br/>calls step"])
  n1 --> n2
  n2 --> n3
  n3 -->|"yes"| n4
  n3 -->|"no"| n5
  n5 --> n6
  n6 --> n7
  n7 --> n8
```

## drawBranch

```mermaid
flowchart TD
  n1(["drawBranch"])
  n2{"containsDecision(branch)<br/>calls containsDecision"}
  n3["drawInnerDecisions(ctx, branch, open)<br/>calls drawInnerDecisions"]
  n4["drawBox(ctx, open, branch)<br/>calls drawBox"]
  n5(["return containsDecision(branch) ? drawInnerDecisions(ctx, b…<br/>calls containsDecision, drawInnerDecisions, drawBox"])
  n1 --> n2
  n2 -->|"yes"| n3
  n2 -->|"no"| n4
  n3 --> n5
  n4 --> n5
```

## drawTernary

```mermaid
flowchart TD
  n1(["drawTernary"])
  n2["const outcome = lowerCondition(ctx, ternary.condition, open…<br/>calls lowerCondition"]
  n3(["return [...drawBranch(ctx, ternary.whenTrue, outcome.yes), …<br/>calls drawBranch"])
  n1 --> n2
  n2 --> n3
```

## drawMissingCheck

```mermaid
flowchart TD
  n1(["drawMissingCheck"])
  n2["const ready = drawInnerDecisions(ctx, guard.left, open);<br/>calls drawInnerDecisions"]
  n3["const id = addNode(ctx.flow, #quot;decision#quot;, #96;${codeText(ctx, g…<br/>calls addNode, codeText, callsNote"]
  n4["link(ctx.flow, ready, id);<br/>calls link"]
  n5(["return [...step(id, #quot;no#quot;), ...drawBranch(ctx, guard.right, …<br/>calls step, drawBranch"])
  n1 --> n2
  n2 --> n3
  n3 --> n4
  n4 --> n5
```

## drawAndOr

```mermaid
flowchart TD
  n1(["drawAndOr"])
  n2["const left = lowerCondition(ctx, guard.left, open);<br/>calls lowerCondition"]
  n3["const isAnd = guard.operatorToken.kind === ts.SyntaxKind.Am…"]
  n4{"isAnd"}
  n5["left.no"]
  n6["left.yes"]
  n7["const skipped = isAnd ? left.no : left.yes;"]
  n8{"isAnd"}
  n9["left.yes"]
  n10["left.no"]
  n11(["return [...skipped, ...drawBranch(ctx, guard.right, isAnd ?…<br/>calls drawBranch"])
  n1 --> n2
  n2 --> n3
  n3 --> n4
  n4 -->|"yes"| n5
  n4 -->|"no"| n6
  n5 --> n7
  n6 --> n7
  n7 --> n8
  n8 -->|"yes"| n9
  n8 -->|"no"| n10
  n9 --> n11
  n10 --> n11
```

## drawGuard

```mermaid
flowchart TD
  n1(["drawGuard"])
  n2{"guard.operatorToken.kind === ts.SyntaxKind.QuestionQuestion…"}
  n3["drawMissingCheck(ctx, guard, open)<br/>calls drawMissingCheck"]
  n4["drawAndOr(ctx, guard, open)<br/>calls drawAndOr"]
  n5(["return guard.operatorToken.kind === ts.SyntaxKind.QuestionQ…<br/>calls drawMissingCheck, drawAndOr"])
  n1 --> n2
  n2 -->|"yes"| n3
  n2 -->|"no"| n4
  n3 --> n5
  n4 --> n5
```

## drawInnerDecisions

```mermaid
flowchart TD
  n1(["drawInnerDecisions"])
  n2{"isFunctionNode(node)<br/>calls isFunctionNode"}
  n3{"!containsDecision(node)<br/>calls containsDecision"}
  n4(["return open;"])
  n5{"ts.isParenthesizedExpression(node)"}
  n6(["return drawInnerDecisions(ctx, node.expression, open);<br/>calls drawInnerDecisions"])
  n7{"ts.isConditionalExpression(node)"}
  n8(["return drawTernary(ctx, node, open);<br/>calls drawTernary"])
  n9{"isGuard(node)<br/>calls isGuard"}
  n10(["return drawGuard(ctx, node, open);<br/>calls drawGuard"])
  n11["let current = open;"]
  n12["ts.forEachChild(node, (child) =#gt; { current = drawInnerDecis…"]
  n13(["return current;"])
  n1 --> n2
  n2 -->|"no"| n3
  n2 -->|"yes"| n4
  n3 -->|"yes"| n4
  n3 -->|"no"| n5
  n5 -->|"yes"| n6
  n5 -->|"no"| n7
  n7 -->|"yes"| n8
  n7 -->|"no"| n9
  n9 -->|"yes"| n10
  n9 -->|"no"| n11
  n11 --> n12
  n12 --> n13
```

## drawInnerDecisions > inner function 1

```mermaid
flowchart TD
  n1(["drawInnerDecisions #gt; inner function 1"])
  n2["current = drawInnerDecisions(ctx, child, current);<br/>calls drawInnerDecisions"]
  n3(["end"])
  n1 --> n2
  n2 --> n3
```
