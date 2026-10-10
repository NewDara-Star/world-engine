# tools/diagrams/context.ts

Drawn from the code by `npm run diagrams` (TypeScript compiler, no AI). Do not edit by hand: change the code, then run it again.

## codeText

```mermaid
flowchart TD
  n1(["codeText"])
  n2(["return shorten(node.getText(ctx.file));<br/>calls shorten"])
  n1 --> n2
```

## declaredInOurFiles

```mermaid
flowchart TD
  n1(["declaredInOurFiles"])
  n2{"symbol.flags & ts.SymbolFlags.Alias"}
  n3["ctx.checker.getAliasedSymbol(symbol)"]
  n4["symbol"]
  n5["const resolved = symbol.flags & ts.SymbolFlags.Alias ? ctx.…"]
  n6{"resolved.declarations is missing?"}
  n7["[]"]
  n8(["return (resolved.declarations ?? []).some((declaration) =#gt; …"])
  n1 --> n2
  n2 -->|"yes"| n3
  n2 -->|"no"| n4
  n3 --> n5
  n4 --> n5
  n5 --> n6
  n6 -->|"yes"| n7
  n6 -->|"no"| n8
  n7 --> n8
```

## calleeSymbol

```mermaid
flowchart TD
  n1(["calleeSymbol"])
  n2{"ts.isPropertyAccessExpression(call.expression)"}
  n3["call.expression.name"]
  n4["call.expression"]
  n5["const callee = ts.isPropertyAccessExpression(call.expressio…"]
  n6(["return ctx.checker.getSymbolAtLocation(callee);"])
  n1 --> n2
  n2 -->|"yes"| n3
  n2 -->|"no"| n4
  n3 --> n5
  n4 --> n5
  n5 --> n6
```

## collectCalls

```mermaid
flowchart TD
  n1(["collectCalls"])
  n2{"ts.isCallExpression(node)"}
  n3{"ts.isNewExpression(node)"}
  n4["const symbol = calleeSymbol(ctx, node);<br/>calls calleeSymbol"]
  n5{"symbol !== undefined"}
  n6{"declaredInOurFiles(ctx, symbol)<br/>calls declaredInOurFiles"}
  n7["found.push(symbol.name);"]
  n8["ts.forEachChild(node, (child) =#gt; (isFunctionNode(child) && …"]
  n9(["end"])
  n1 --> n2
  n2 -->|"no"| n3
  n2 -->|"yes"| n4
  n3 -->|"yes"| n4
  n4 --> n5
  n5 -->|"yes"| n6
  n6 -->|"yes"| n7
  n7 --> n8
  n5 -->|"no"| n8
  n6 -->|"no"| n8
  n3 -->|"no"| n8
  n8 --> n9
```

## collectCalls > inner function 1

```mermaid
flowchart TD
  n1(["collectCalls #gt; inner function 1"])
  n2{"isFunctionNode(child)<br/>calls isFunctionNode"}
  n3{"hasOwnFlow(child)<br/>calls hasOwnFlow"}
  n4["undefined"]
  n5["collectCalls(ctx, child, found)<br/>calls collectCalls"]
  n6(["return (isFunctionNode(child) && hasOwnFlow(child) ? undefined : c"])
  n1 --> n2
  n2 -->|"yes"| n3
  n3 -->|"yes"| n4
  n2 -->|"no"| n5
  n3 -->|"no"| n5
  n4 --> n6
  n5 --> n6
```

## callsNote

```mermaid
flowchart TD
  n1(["callsNote"])
  n2["const found: string[] = [];"]
  n3["collectCalls(ctx, node, found);<br/>calls collectCalls"]
  n4["const names = [...new Set(found)];"]
  n5{"names.length === 0"}
  n6["#quot;#quot;"]
  n7["#96;\ncalls ${names.join(#quot;, #quot;)}#96;"]
  n8(["return names.length === 0 ? #quot;#quot; : #96;\ncalls ${names.join(#quot;, #quot;…"])
  n1 --> n2
  n2 --> n3
  n3 --> n4
  n4 --> n5
  n5 -->|"yes"| n6
  n5 -->|"no"| n7
  n6 --> n8
  n7 --> n8
```
