# tools/diagrams/cli.ts

Drawn from the code by `npm run diagrams` (TypeScript compiler, no AI). Do not edit by hand: change the code, then run it again.

## optionValue

```mermaid
flowchart TD
  n1(["optionValue"])
  n2["const at = args.indexOf(name);"]
  n3{"at === -1"}
  n4["undefined"]
  n5["args[at + 1]"]
  n6(["return at === -1 ? undefined : args[at + 1];"])
  n1 --> n2
  n2 --> n3
  n3 -->|"yes"| n4
  n3 -->|"no"| n5
  n4 --> n6
  n5 --> n6
```

## clearOwnedFolders

```mermaid
flowchart TD
  n1(["clearOwnedFolders"])
  n2{"for each const folder of SOURCE_FOLDERS"}
  n3["rmSync(join(out, folder), { recursive: true, force: true });"]
  n4["rmSync(join(out, #quot;modules.md#quot;), { force: true });"]
  n5(["end"])
  n1 --> n2
  n2 -->|"next item"| n3
  n3 --> n2
  n2 -->|"done"| n4
  n4 --> n5
```

## writePage

```mermaid
flowchart TD
  n1(["writePage"])
  n2["const full = join(out, path);"]
  n3["mkdirSync(dirname(full), { recursive: true });"]
  n4["writeFileSync(full, text);"]
  n5(["end"])
  n1 --> n2
  n2 --> n3
  n3 --> n4
  n4 --> n5
```

## main

```mermaid
flowchart TD
  n1(["main"])
  n2{"optionValue(args, #quot;--root#quot;) is missing?<br/>calls optionValue"}
  n3["process.cwd()"]
  n4["const root = resolve(optionValue(args, #quot;--root#quot;) ?? process…<br/>calls optionValue"]
  n5{"optionValue(args, #quot;--out#quot;) is missing?<br/>calls optionValue"}
  n6["join(root, #quot;docs#quot;, #quot;flows#quot;)"]
  n7["const out = resolve(optionValue(args, #quot;--out#quot;) ?? join(root…<br/>calls optionValue"]
  n8["clearOwnedFolders(out);<br/>calls clearOwnedFolders"]
  n9{"for each const [path, text] of generateFlowPages(root)<br/>calls generateFlowPages"}
  n10["writePage(out, path, text);<br/>calls writePage"]
  n11["writePage(out, #quot;modules.md#quot;, generateModuleMap(root, toolRo…<br/>calls writePage, generateModuleMap"]
  n12(["end"])
  n1 --> n2
  n2 -->|"yes"| n3
  n2 -->|"no"| n4
  n3 --> n4
  n4 --> n5
  n5 -->|"yes"| n6
  n5 -->|"no"| n7
  n6 --> n7
  n7 --> n8
  n8 --> n9
  n9 -->|"next item"| n10
  n10 --> n9
  n9 -->|"done"| n11
  n11 --> n12
```
