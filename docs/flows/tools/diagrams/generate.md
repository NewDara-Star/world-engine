# tools/diagrams/generate.ts

Drawn from the code by `npm run diagrams` (TypeScript compiler, no AI). Do not edit by hand: change the code, then run it again.

## toSlashes

```mermaid
flowchart TD
  n1(["toSlashes"])
  n2(["return path.split(sep).join(#quot;/#quot;);"])
  n1 --> n2
```

## typescriptFilesIn

```mermaid
flowchart TD
  n1(["typescriptFilesIn"])
  n2["let entries: string[];"]
  n3["try"]
  n4["entries = readdirSync(folder, { recursive: true, encoding: …"]
  n5["catch"]
  n6(["return [];"])
  n7(["return entries .filter((entry) =#gt; entry.endsWith(#quot;.ts#quot;) && …"])
  n1 --> n2
  n2 --> n3
  n3 --> n4
  n3 -->|"throws"| n5
  n5 --> n6
  n4 --> n7
```

## typescriptFilesIn > inner function 1

```mermaid
flowchart TD
  n1(["typescriptFilesIn #gt; inner function 1"])
  n2{"entry.endsWith(#quot;.ts#quot;)"}
  n3["!entry.endsWith(#quot;.d.ts#quot;)"]
  n4(["return entry.endsWith(#quot;.ts#quot;) && !entry.endsWith(#quot;.d.ts#quot;)"])
  n1 --> n2
  n2 -->|"yes"| n3
  n2 -->|"no"| n4
  n3 --> n4
```

## sourceFiles

```mermaid
flowchart TD
  n1(["sourceFiles"])
  n2["const found = SOURCE_FOLDERS.flatMap((folder) =#gt; typescript…<br/>calls typescriptFilesIn"]
  n3(["return found.map((path) =#gt; toSlashes(relative(root, path)))…<br/>calls toSlashes"])
  n1 --> n2
  n2 --> n3
```

## pageFor

```mermaid
flowchart TD
  n1(["pageFor"])
  n2["const entries = listFunctions(file);<br/>calls listFunctions"]
  n3{"entries.length === 0"}
  n4(["return undefined;"])
  n5["const sections = entries.map((entry) =#gt; { const picture = r…"]
  n6(["return #96;#35; ${relativePath}\n\n${NOTE}\n\n${sections.join(#quot;\n…"])
  n1 --> n2
  n2 --> n3
  n3 -->|"yes"| n4
  n3 -->|"no"| n5
  n5 --> n6
```

## pageFor > inner function 1

```mermaid
flowchart TD
  n1(["pageFor #gt; inner function 1"])
  n2["const picture = renderMermaid(buildFlow(project, file, entr…<br/>calls renderMermaid, buildFlow"]
  n3(["return #96;#35;#35; ${entry.name}\n\n\#96;\#96;\#96;mermaid\n${picture}\n\#96;\#96;…"])
  n1 --> n2
  n2 --> n3
```

## generateFlowPages

```mermaid
flowchart TD
  n1(["generateFlowPages"])
  n2["const relativePaths = sourceFiles(root);<br/>calls sourceFiles"]
  n3["const absolute = relativePaths.map((path) =#gt; toSlashes(reso…<br/>calls toSlashes"]
  n4["const program = ts.createProgram(absolute, COMPILER_OPTIONS…"]
  n5["const project: Project = { checker: program.getTypeChecker(…"]
  n6["const pages = new Map#lt;string, string#gt;();"]
  n7["relativePaths.forEach((relativePath, index) =#gt; { const file…"]
  n8(["return pages;"])
  n1 --> n2
  n2 --> n3
  n3 --> n4
  n4 --> n5
  n5 --> n6
  n6 --> n7
  n7 --> n8
```

## generateFlowPages > inner function 1

```mermaid
flowchart TD
  n1(["generateFlowPages #gt; inner function 1"])
  n2{"absolute[index] is missing?"}
  n3["#quot;#quot;"]
  n4["const file = program.getSourceFile(absolute[index] ?? #quot;#quot;);"]
  n5{"file === undefined"}
  n6["undefined"]
  n7["pageFor(project, file, relativePath)<br/>calls pageFor"]
  n8["const page = file === undefined ? undefined : pageFor(proje…<br/>calls pageFor"]
  n9{"page !== undefined"}
  n10["pages.set(relativePath.replace(/\.ts$/, #quot;.md#quot;), page);"]
  n11(["end"])
  n1 --> n2
  n2 -->|"yes"| n3
  n2 -->|"no"| n4
  n3 --> n4
  n4 --> n5
  n5 -->|"yes"| n6
  n5 -->|"no"| n7
  n6 --> n8
  n7 --> n8
  n8 --> n9
  n9 -->|"yes"| n10
  n10 --> n11
  n9 -->|"no"| n11
```
