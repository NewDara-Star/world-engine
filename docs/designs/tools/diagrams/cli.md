# tools/diagrams/cli.ts

Status: approved by Daramola in chat, 2026-10-10 (batch approval of the diagram tool's own designs; written after the code, see Scope 002).

The design for each function, written in plain words. The pictures drawn from the code are in `docs/flows/tools/diagrams/cli.md`.

## optionValue

Reads the value that follows an option such as --out.

```mermaid
flowchart TD
  s(["optionValue"])
  a{"is the option among the arguments"}
  b(["return nothing"])
  c(["return the word after it"])
  s --> a
  a -->|"no"| b
  a -->|"yes"| c
```

## clearOwnedFolders

Empties the folders the generator owns, so pages for deleted source files do not linger.

```mermaid
flowchart TD
  s(["clearOwnedFolders"])
  a["remove the output src folder and tools folder, and modules.md"]
  b(["leave every other file alone"])
  s --> a
  a --> b
```

## writePage

Writes one page, making its folders first.

```mermaid
flowchart TD
  s(["writePage"])
  a["make the folder"]
  b(["write the text to the file"])
  s --> a
  a --> b
```

## main

Draws everything.

```mermaid
flowchart TD
  s(["main"])
  a["take the root and the output folder from the options, or the current folder and docs/flows"]
  b["empty the folders the generator owns"]
  c["write one page for every source file that has functions"]
  d(["write modules.md, the module map"])
  s --> a
  a --> b
  b --> c
  c --> d
```
