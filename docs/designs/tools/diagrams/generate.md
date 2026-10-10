# tools/diagrams/generate.ts

Status: approved by Daramola in chat, 2026-10-10 (batch approval of the diagram tool's own designs; written after the code, see Scope 002).

The design for each function, written in plain words. The pictures drawn from the code are in `docs/flows/tools/diagrams/generate.md`.

## toSlashes

Writes a path with forward slashes whatever the machine.

```mermaid
flowchart TD
  s(["toSlashes"])
  a(["return the path with slashes"])
  s --> a
```

## typescriptFilesIn

Lists the TypeScript files under a folder.

```mermaid
flowchart TD
  s(["typescriptFilesIn"])
  a["read the folder and everything below it"]
  b{"could it not be read"}
  c(["return an empty list"])
  d["keep names ending .ts but not .d.ts"]
  e(["return the ones that are real files"])
  s --> a
  a --> b
  b -->|"yes"| c
  b -->|"no"| d
  d --> e
```

## typescriptFilesIn > inner function 1

Keeps one name.

```mermaid
flowchart TD
  s(["name"])
  a(["true if it ends .ts and does not end .d.ts"])
  s --> a
```

## sourceFiles

Every source file of ours, relative to the root, sorted.

```mermaid
flowchart TD
  s(["sourceFiles"])
  a["list the files in src and tools"]
  b(["return their paths with slashes, sorted"])
  s --> a
  a --> b
```

## pageFor

The page for one source file.

```mermaid
flowchart TD
  s(["pageFor"])
  a["list the functions in the file"]
  b{"are there none"}
  c(["return nothing, no page"])
  d["draw one picture for each function under its heading"]
  e(["return the title, the note and the pictures"])
  s --> a
  a --> b
  b -->|"yes"| c
  b -->|"no"| d
  d --> e
```

## pageFor > inner function 1

One function's section.

```mermaid
flowchart TD
  s(["function"])
  a["build and render its picture"]
  b(["return its heading and the picture in a mermaid block"])
  s --> a
  a --> b
```

## generateFlowPages

Draws every page of the project.

```mermaid
flowchart TD
  s(["generateFlowPages"])
  a["find the source files"]
  b["let the compiler read them all together"]
  c["for each file, make its page"]
  d(["return the pages by path, in order"])
  s --> a
  a --> b
  b --> c
  c --> d
```

## generateFlowPages > inner function 1

One file.

```mermaid
flowchart TD
  s(["file"])
  a["find the file in the compiler program"]
  b{"is it missing or has no functions"}
  c["no page"]
  d["store the page under the path ending .md"]
  s --> a
  a --> b
  b -->|"yes"| c
  b -->|"no"| d
```
