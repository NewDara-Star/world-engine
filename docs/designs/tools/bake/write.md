# tools/bake/write.ts

Status: approved by the orchestrator in one pass (Scope 005b, the owner's lighter process for non-physics work, 2026-10-11).

New in scope 005 (item 2). Puts the baked files on disk. Node's `fs`
(`rm`, `mkdir`, `writeFile`) is the only API used. The pictures drawn from
the code will be in `docs/flows/tools/bake/write.md`.

## writeBakeFiles

Why the game needs it: a re-bake must replace the old map completely; a square that no longer has road must not linger from an earlier bake and show a road that is gone.

```mermaid
flowchart TD
  s(["writeBakeFiles with the output folder and the files"])
  a{"is the folder named chunks, inside a place folder, by isPlaceFolder"}
  b(["stop with a problem: the bake only writes to places/id/chunks, so a typo cannot wipe another folder"])
  c["delete the folder's .json files, then the folder if it is empty; nothing else is touched"]
  d["make the folder"]
  e["write each file, in name order"]
  f(["return how many files were written"])
  s --> a
  a -->|"no"| b
  a -->|"yes"| c --> d --> e --> f
```

## writeStreetsFile

New in Scope 005b. Why the game needs it: the street file sits beside the chunks, at `places/<id>/streets.json`, and is replaced whole on every bake; the same guard means a typo cannot write anywhere else.

```mermaid
flowchart TD
  s(["writeStreetsFile with the place folder and the text"])
  a{"is it a place folder, by isPlaceFolder"}
  b(["stop with a problem: the bake only writes streets.json into places/id; nothing was written"])
  c["make the folder if it is missing; write streets.json"]
  d(["return the file's path"])
  s --> a
  a -->|"no"| b
  a -->|"yes"| c --> d
```

## isPlaceFolder

New in Scope 005b, the check `writeBakeFiles` already made, now shared. Why the game needs it: one rule for where the bake may write.

```mermaid
flowchart TD
  s(["isPlaceFolder of a folder"])
  a(["return yes when its name is a place id and it is inside a folder named places"])
  s --> a
```
