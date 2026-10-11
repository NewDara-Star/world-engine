# src/place/check-file.ts

Status: approved. Judged by the delegated approver (docs/roles/approver.md, rounds in docs/reviews/002b/), with the owner's decisions of 2026-10-11.

New in scope 002b (items 2d, 2f, 2h, and E1: a field written twice). Checks one file from its name and raw text, the same way for places and vehicles, and turns every problem into a message that starts with the file and the line. The pictures drawn from the code will be in `docs/flows/src/place/check-file.md`.

## validateJsonFile

Why the game needs it: whoever writes a place file gets one report naming every mistake by file and line, whether the file is a place or a vehicle. A field written twice is reported in the same report, first, because it explains which copy the other messages are about.

```mermaid
flowchart TD
  s(["validateJsonFile with the file's name, its text, and the checker for that kind of file"])
  l["list the line starts of the text once"]
  a["readJsonText"]
  b{"could the text be read as JSON"}
  c(["return failure with one message: the file name, lineAtOffset of the syntax error, syntaxProblemInWords"])
  d["run the checker on the values, starting at the top of the file"]
  r["find problemsForRepeatedFields in the whole tree, starting at the top of the file; if that walk runs out of room, the one problem is: nested too deeply, at line 1"]
  e{"is there any problem, from either"}
  f(["return success with the checked place or vehicle"])
  g["make messageForProblem for every problem: the repeated fields first, then the checker's"]
  h{"did any cross-check wait because a field it reads is wrong"}
  i["end the report with: the file name, then Fix these first; some cross-checks run after."]
  j(["return failure with all the messages"])
  s --> l
  l --> a
  a --> b
  b -->|"no"| c
  b -->|"yes"| d
  d --> r
  r --> e
  e -->|"no"| f
  e -->|"yes"| g
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
