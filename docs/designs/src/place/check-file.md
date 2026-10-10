# src/place/check-file.ts

Status: draft. Waiting for approval; the approval commit changes this line to `Status: approved`.

New in scope 002b (items 2d, 2f, 2h). Checks one file from its name and raw text, the same way for places and vehicles, and turns every problem into a message that starts with the file and the line. The pictures drawn from the code will be in `docs/flows/src/place/check-file.md`.

## validateJsonFile

Why the game needs it: whoever writes a place file gets one report naming every mistake by file and line, whether the file is a place or a vehicle.

```mermaid
flowchart TD
  s(["validateJsonFile with the file's name, its text, and the checker for that kind of file"])
  a["readJsonText"]
  b{"could the text be read as JSON"}
  c(["return failure with one message: the file name, line of the syntax error, syntaxProblemInWords"])
  d["run the checker on the values, starting at the top of the file"]
  e{"did every check pass"}
  f(["return success with the checked place or vehicle"])
  g["list the line starts once, then make messageForProblem for every problem"]
  h{"did any cross-check wait because a field it reads is wrong"}
  i["end the report with: the file name, then Fix these first; some cross-checks run after."]
  j(["return failure with all the messages"])
  s --> a
  a --> b
  b -->|"no"| c
  b -->|"yes"| d
  d --> e
  e -->|"yes"| f
  e -->|"no"| g
  g --> h
  h -->|"yes"| i
  h -->|"no"| j
  i --> j
```

## messageForProblem

Why the game needs it: every message reads the same way, `yaba.json line 12:` then the sentence, so the place-maker can jump straight to the line.

```mermaid
flowchart TD
  s(["messageForProblem with the file name, the tree, the line starts and one problem"])
  a["find the line with lineOfPath for the problem's field path"]
  b(["return: file name, line, colon, then the problem's sentence"])
  s --> a
  a --> b
```
