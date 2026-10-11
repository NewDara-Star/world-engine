# src/measure/measure.ts

Status: approved. Judged by the delegated approver (docs/reviews/slice-1-approver.md); its fixes F1 to F24 and the orchestrator's decisions on E1 to E3 applied in one pass.

New in scope 005 (item 7). With `?measure` in the link, the page measures
itself, so the owner can read the numbers off his own phone: the bytes
downloaded before he could drive, and the frame rate over 60 seconds of
driving. Bytes come from the browser's Resource Timing entries
(`transferSize`, `decodedBodySize`, `responseEnd`; MDN, research/36 section
6). Measured on the built game only (`npm run build` then
`npm run preview -- --host`), first visit with the cache cleared. The
pictures drawn from the code will be in `docs/flows/src/measure/measure.md`.

"Drivable" means: the car is on the ground and the road of the square it
starts in has been drawn. The page marks that moment once (`drivableAt`).

## bytesBeforeDriving

Why the game needs it: the 30 MB target is about what the player waits for before driving, not what loads later.

```mermaid
flowchart TD
  s(["bytesBeforeDriving with the page's own entry, the file entries, and the drivable moment"])
  a["keep the page's entry and every file entry that finished at or before the drivable moment"]
  b["add up their transfer sizes, and their decoded sizes"]
  c["count the files with transfer size 0 but a decoded size above 0: they came from the cache"]
  d(["return the bytes transferred, the bytes decoded, the number of files, and the number from the cache"])
  s --> a --> b --> c --> d
```

## percentileOf

Why the game needs it: the slowest frames matter more than the average, because they are the stutters a player feels.

```mermaid
flowchart TD
  s(["percentileOf a sorted list of numbers and a fraction from 0 to 1"])
  a{"is the list empty"}
  b(["return nothing"])
  c(["return the value at the nearest rank: the fraction times the count, rounded up, counting from 1, at least the first"])
  s --> a
  a -->|"yes"| b
  a -->|"no"| c
```

## frameRateSummary

Why the game needs it: three numbers a designer can read: the usual frame rate, the frame rate in the worst moments, and how many frames fell below 30 a second.

```mermaid
flowchart TD
  s(["frameRateSummary with the frame lengths in milliseconds"])
  a{"are there any"}
  b(["return nothing measured"])
  c["sort them"]
  d["median frame rate = 1000 over the middle length; slowest 5 percent = 1000 over the length at percentileOf 0.95"]
  e(["return those two, the count of frames longer than 1000 over 30 ms, and the seconds measured"])
  s --> a
  a -->|"no"| b
  a -->|"yes"| c --> d --> e
```

## recordFrame

Why the game needs it: collects frame lengths for exactly 60 seconds of driving after the drivable moment, then stops, so the report is the same length every time.

```mermaid
flowchart TD
  s(["recordFrame with the recorder and a frame's length"])
  a{"has the drivable moment passed, and is the recorder still collecting"}
  b(["return"])
  c["add the length; add it to the time collected"]
  d{"has it collected 60 seconds"}
  e(["mark it finished, so the report is shown"])
  s --> a
  a -->|"no"| b
  a -->|"yes"| c --> d
  d -->|"no"| b
  d -->|"yes"| e
```

## measureReportLines

Why the game needs it: the numbers on screen, in words, with the warnings that make them honest.

```mermaid
flowchart TD
  s(["measureReportLines with the bytes and the frame summary"])
  a["line: downloaded before driving, megabytes to one decimal (decoded size beside it), in so many files"]
  b{"did any file come from the cache"}
  c["line: N files came from the cache; clear the cache and reload for a first-visit figure"]
  d["line: frame rate, median and slowest 5 percent, frames below 30 a second, over so many seconds; or: still measuring"]
  e(["return the lines"])
  s --> a --> b
  b -->|"yes"| c --> d
  b -->|"no"| d
  d --> e
```
