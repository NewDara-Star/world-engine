# tools/diagrams/modules.ts

Status: approved by Daramola in chat, 2026-10-10 (batch approval of the diagram tool's own designs; written after the code, see Scope 002).

The design for each function, written in plain words. The pictures drawn from the code are in `docs/flows/tools/diagrams/modules.md`.

## foldersThatExist

Keeps the source folders that are really there.

```mermaid
flowchart TD
  s(["foldersThatExist"])
  a(["return src and tools if each exists"])
  s --> a
```

## wrap

Puts the module map picture into a Markdown page.

```mermaid
flowchart TD
  s(["wrap"])
  a(["return the title, the note and the picture in a mermaid block"])
  s --> a
```

## generateModuleMap

Draws which file uses which.

```mermaid
flowchart TD
  s(["generateModuleMap"])
  a["find the folders that exist"]
  b{"is there no source file at all"}
  c(["return a page with an empty picture"])
  d["run dependency-cruiser on those folders with our rules, asking for mermaid"]
  e(["return the page with its picture"])
  s --> a
  a --> b
  b -->|"yes"| c
  b -->|"no"| d
  d --> e
```
