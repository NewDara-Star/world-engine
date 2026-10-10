# tools/diagrams/functions.ts

Drawn from the code by `npm run diagrams` (TypeScript compiler, no AI). Do not edit by hand: change the code, then run it again.

## isFunctionNode

```mermaid
flowchart TD
  n1(["isFunctionNode"])
  n2{"ts.isFunctionDeclaration(node)"}
  n3{"ts.isFunctionExpression(node)"}
  n4{"ts.isArrowFunction(node)"}
  n5{"ts.isMethodDeclaration(node)"}
  n6{"ts.isConstructorDeclaration(node)"}
  n7{"ts.isGetAccessorDeclaration(node)"}
  n8["ts.isSetAccessorDeclaration(node)"]
  n9(["return ( ts.isFunctionDeclaration(node) || ts.isFunctionExp…"])
  n1 --> n2
  n2 -->|"no"| n3
  n3 -->|"no"| n4
  n4 -->|"no"| n5
  n5 -->|"no"| n6
  n6 -->|"no"| n7
  n7 -->|"no"| n8
  n2 -->|"yes"| n9
  n3 -->|"yes"| n9
  n4 -->|"yes"| n9
  n5 -->|"yes"| n9
  n6 -->|"yes"| n9
  n7 -->|"yes"| n9
  n8 --> n9
```

## propertyText

```mermaid
flowchart TD
  n1(["propertyText"])
  n2(["return name.getText();"])
  n1 --> n2
```

## ownerName

```mermaid
flowchart TD
  n1(["ownerName"])
  n2{"ts.isVariableDeclaration(parent)"}
  n3{"ts.isIdentifier(parent.name)"}
  n4(["return parent.name.text;"])
  n5{"ts.isPropertyAssignment(parent)"}
  n6{"ts.isPropertyDeclaration(parent)"}
  n7(["return propertyText(parent.name);<br/>calls propertyText"])
  n8(["return undefined;"])
  n1 --> n2
  n2 -->|"yes"| n3
  n3 -->|"yes"| n4
  n2 -->|"no"| n5
  n3 -->|"no"| n5
  n5 -->|"no"| n6
  n5 -->|"yes"| n7
  n6 -->|"yes"| n7
  n6 -->|"no"| n8
```

## classPrefix

```mermaid
flowchart TD
  n1(["classPrefix"])
  n2["const owner = node.parent;"]
  n3{"ts.isClassDeclaration(owner)"}
  n4{"ts.isClassExpression(owner)"}
  n5{"owner.name !== undefined"}
  n6(["return #96;${owner.name.text}.#96;;"])
  n7(["return #quot;#quot;;"])
  n1 --> n2
  n2 --> n3
  n3 -->|"no"| n4
  n3 -->|"yes"| n5
  n4 -->|"yes"| n5
  n5 -->|"yes"| n6
  n4 -->|"no"| n7
  n5 -->|"no"| n7
```

## memberName

```mermaid
flowchart TD
  n1(["memberName"])
  n2(["return #96;${classPrefix(node)}${propertyText(node.name)}#96;;<br/>calls classPrefix, propertyText"])
  n1 --> n2
```

## expressionName

```mermaid
flowchart TD
  n1(["expressionName"])
  n2{"node.name?.text is missing?"}
  n3["ownerName(node.parent)<br/>calls ownerName"]
  n4(["return node.name?.text ?? ownerName(node.parent);<br/>calls ownerName"])
  n1 --> n2
  n2 -->|"yes"| n3
  n2 -->|"no"| n4
  n3 --> n4
```

## declaredName

```mermaid
flowchart TD
  n1(["declaredName"])
  n2{"ts.isConstructorDeclaration(node)"}
  n3(["return #96;${classPrefix(node)}constructor#96;;<br/>calls classPrefix"])
  n4{"ts.isFunctionDeclaration(node)"}
  n5{"node.name?.text is missing?"}
  n6["#quot;default#quot;"]
  n7(["return node.name?.text ?? #quot;default#quot;;"])
  n8{"ts.isFunctionExpression(node)"}
  n9{"ts.isArrowFunction(node)"}
  n10(["return expressionName(node);<br/>calls expressionName"])
  n11(["return memberName(node);<br/>calls memberName"])
  n1 --> n2
  n2 -->|"yes"| n3
  n2 -->|"no"| n4
  n4 -->|"yes"| n5
  n5 -->|"yes"| n6
  n5 -->|"no"| n7
  n6 --> n7
  n4 -->|"no"| n8
  n8 -->|"no"| n9
  n8 -->|"yes"| n10
  n9 -->|"yes"| n10
  n9 -->|"no"| n11
```

## anyInside

```mermaid
flowchart TD
  n1(["anyInside"])
  n2{"test(node)<br/>calls test"}
  n3(["return true;"])
  n4["const found = ts.forEachChild(node, (child) =#gt; (!isFunction…"]
  n5(["return found === true;"])
  n1 --> n2
  n2 -->|"yes"| n3
  n2 -->|"no"| n4
  n4 --> n5
```

## anyInside > inner function 1

```mermaid
flowchart TD
  n1(["anyInside #gt; inner function 1"])
  n2{"!isFunctionNode(child)<br/>calls isFunctionNode"}
  n3{"anyInside(child, test)<br/>calls anyInside"}
  n4["true"]
  n5["undefined"]
  n6(["return (!isFunctionNode(child) && anyInside(child, test) ? true : "])
  n1 --> n2
  n2 -->|"yes"| n3
  n3 -->|"yes"| n4
  n2 -->|"no"| n5
  n3 -->|"no"| n5
  n4 --> n6
  n5 --> n6
```

## containsDecision

```mermaid
flowchart TD
  n1(["containsDecision"])
  n2(["return anyInside(node, isDecision);<br/>calls anyInside"])
  n1 --> n2
```

## isGuard

```mermaid
flowchart TD
  n1(["isGuard"])
  n2{"ts.isBinaryExpression(node)"}
  n3["GUARDS.has(node.operatorToken.kind)"]
  n4(["return ts.isBinaryExpression(node) && GUARDS.has(node.opera…"])
  n1 --> n2
  n2 -->|"yes"| n3
  n2 -->|"no"| n4
  n3 --> n4
```

## isDecision

```mermaid
flowchart TD
  n1(["isDecision"])
  n2{"ts.isIfStatement(node)"}
  n3{"ts.isConditionalExpression(node)"}
  n4{"ts.isSwitchStatement(node)"}
  n5{"ts.isIterationStatement(node, false)"}
  n6{"ts.isTryStatement(node)"}
  n7["isGuard(node)<br/>calls isGuard"]
  n8(["return ( ts.isIfStatement(node) || ts.isConditionalExpressi…<br/>calls isGuard"])
  n1 --> n2
  n2 -->|"no"| n3
  n3 -->|"no"| n4
  n4 -->|"no"| n5
  n5 -->|"no"| n6
  n6 -->|"no"| n7
  n2 -->|"yes"| n8
  n3 -->|"yes"| n8
  n4 -->|"yes"| n8
  n5 -->|"yes"| n8
  n6 -->|"yes"| n8
  n7 --> n8
```

## hasOwnFlow

```mermaid
flowchart TD
  n1(["hasOwnFlow"])
  n2{"node.body === undefined"}
  n3(["return false;"])
  n4{"declaredName(node) !== undefined<br/>calls declaredName"}
  n5(["return true;"])
  n6{"ts.isBlock(node.body)"}
  n7["containsDecision(node.body)<br/>calls containsDecision"]
  n8(["return ts.isBlock(node.body) || containsDecision(node.body);<br/>calls containsDecision"])
  n1 --> n2
  n2 -->|"yes"| n3
  n2 -->|"no"| n4
  n4 -->|"yes"| n5
  n4 -->|"no"| n6
  n6 -->|"no"| n7
  n6 -->|"yes"| n8
  n7 --> n8
```

## uniqueName

```mermaid
flowchart TD
  n1(["uniqueName"])
  n2{"walk.used.get(wanted) is missing?"}
  n3["0"]
  n4["const seen = (walk.used.get(wanted) ?? 0) + 1;"]
  n5["walk.used.set(wanted, seen);"]
  n6{"seen === 1"}
  n7["wanted"]
  n8["#96;${wanted} (${seen})#96;"]
  n9(["return seen === 1 ? wanted : #96;${wanted} (${seen})#96;;"])
  n1 --> n2
  n2 -->|"yes"| n3
  n2 -->|"no"| n4
  n3 --> n4
  n4 --> n5
  n5 --> n6
  n6 -->|"yes"| n7
  n6 -->|"no"| n8
  n7 --> n9
  n8 --> n9
```

## entryName

```mermaid
flowchart TD
  n1(["entryName"])
  n2["const declared = declaredName(node);<br/>calls declaredName"]
  n3{"declared !== undefined"}
  n4{"parentName === #quot;#quot;"}
  n5["declared"]
  n6["#96;${parentName}${SEPARATOR}${declared}#96;"]
  n7(["return uniqueName(walk, parentName === #quot;#quot; ? declared : #96;${p…<br/>calls uniqueName"])
  n8{"walk.anonymous.get(parentName) is missing?"}
  n9["0"]
  n10["const count = (walk.anonymous.get(parentName) ?? 0) + 1;"]
  n11["walk.anonymous.set(parentName, count);"]
  n12{"parentName === #quot;#quot;"}
  n13["#quot;module#quot;"]
  n14["parentName"]
  n15["const base = parentName === #quot;#quot; ? #quot;module#quot; : parentName;"]
  n16(["return uniqueName(walk, #96;${base}${SEPARATOR}inner function …<br/>calls uniqueName"])
  n1 --> n2
  n2 --> n3
  n3 -->|"yes"| n4
  n4 -->|"yes"| n5
  n4 -->|"no"| n6
  n5 --> n7
  n6 --> n7
  n3 -->|"no"| n8
  n8 -->|"yes"| n9
  n8 -->|"no"| n10
  n9 --> n10
  n10 --> n11
  n11 --> n12
  n12 -->|"yes"| n13
  n12 -->|"no"| n14
  n13 --> n15
  n14 --> n15
  n15 --> n16
```

## visit

```mermaid
flowchart TD
  n1(["visit"])
  n2{"isFunctionNode(node)<br/>calls isFunctionNode"}
  n3{"hasOwnFlow(node)<br/>calls hasOwnFlow"}
  n4{"node.body !== undefined"}
  n5["const name = entryName(walk, node, parentName);<br/>calls entryName"]
  n6["walk.entries.push({ name, node, body: node.body });"]
  n7["ts.forEachChild(node, (child) =#gt; visit(walk, child, name));<br/>calls visit"]
  n8(["return;"])
  n9["ts.forEachChild(node, (child) =#gt; visit(walk, child, parentN…<br/>calls visit"]
  n10(["end"])
  n1 --> n2
  n2 -->|"yes"| n3
  n3 -->|"yes"| n4
  n4 -->|"yes"| n5
  n5 --> n6
  n6 --> n7
  n7 --> n8
  n2 -->|"no"| n9
  n3 -->|"no"| n9
  n4 -->|"no"| n9
  n9 --> n10
```

## listFunctions

```mermaid
flowchart TD
  n1(["listFunctions"])
  n2["const walk: Walk = { entries: [], used: new Map(), anonymou…"]
  n3["visit(walk, file, #quot;#quot;);<br/>calls visit"]
  n4(["return walk.entries;"])
  n1 --> n2
  n2 --> n3
  n3 --> n4
```
