# tools/bake/write.ts

Status: approved. Judged by the delegated approver (docs/reviews/slice-1-approver.md); its fixes F1 to F24 and the orchestrator's decisions on E1 to E3 applied in one pass.

New in scope 005 (item 2). Puts the baked files on disk. Node's `fs`
(`rm`, `mkdir`, `writeFile`) is the only API used. The pictures drawn from
the code will be in `docs/flows/tools/bake/write.md`.

## writeBakeFiles

Why the game needs it: a re-bake must replace the old map completely; a square that no longer has road must not linger from an earlier bake and show a road that is gone.

```mermaid
flowchart TD
  s(["writeBakeFiles with the output folder and the files"])
  a{"is the folder named chunks, inside a folder named like the place id, inside places"}
  b(["stop with a problem: the bake only writes to places/id/chunks, so a typo cannot wipe another folder"])
  c["delete the folder's .json files, then the folder if it is empty; nothing else is touched"]
  d["make the folder"]
  e["write each file, in name order"]
  f(["return how many files were written"])
  s --> a
  a -->|"no"| b
  a -->|"yes"| c --> d --> e --> f
```
