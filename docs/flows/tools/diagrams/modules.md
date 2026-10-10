# tools/diagrams/modules.ts

Drawn from the code by `npm run diagrams` (TypeScript compiler, no AI). Do not edit by hand: change the code, then run it again.

## foldersThatExist

```mermaid
flowchart TD
  n1(["foldersThatExist"])
  n2(["return SOURCE_FOLDERS.filter((folder) =#gt; existsSync(join(ro…"])
  n1 --> n2
```

## wrap

```mermaid
flowchart TD
  n1(["wrap"])
  n2(["return #96;#35; Module map\n\n${NOTE}\n\n\#96;\#96;\#96;mermaid\n${picture…"])
  n1 --> n2
```

## generateModuleMap

```mermaid
flowchart TD
  n1(["generateModuleMap"])
  n2["const folders = foldersThatExist(root);<br/>calls foldersThatExist"]
  n3{"folders.length === 0"}
  n4(["return wrap(#quot;flowchart LR#quot;);<br/>calls wrap"])
  n5["const depcruise = join(toolRoot, #quot;node_modules#quot;, #quot;.bin#quot;, #quot;d…"]
  n6["const config = join(toolRoot, #quot;.dependency-cruiser.js#quot;);"]
  n7["const picture = execFileSync(depcruise, [#quot;--config#quot;, config…"]
  n8(["return wrap(picture);<br/>calls wrap"])
  n1 --> n2
  n2 --> n3
  n3 -->|"yes"| n4
  n3 -->|"no"| n5
  n5 --> n6
  n6 --> n7
  n7 --> n8
```
