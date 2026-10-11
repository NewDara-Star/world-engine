# src/measure/measure.ts

Status: approved by the orchestrator in one pass (measure fix after the owner's 0.0 MB report, 2026-10-11).
(2026-10-11): the panel said "0.0 MB in 47 files" although the game had
loaded, because the browser gave size 0 for every file. Earlier version
approved by the delegated approver (docs/reviews/slice-1-approver.md).

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

Why the game needs it: the 30 MB target is about what the player waits for before driving, not what loads later. A browser gives transfer size 0 for a file from its cache, and for a file whose sizes it hides (Safari often does); those files are kept by address so the server can say their size.

```mermaid
flowchart TD
  s(["bytesBeforeDriving with every entry (the page's own and each file's) and the drivable moment"])
  a["keep every entry that finished at or before the drivable moment"]
  u["the files with transfer size 0 are the ones the browser gave no size for"]
  b["add up their transfer sizes, and their decoded sizes"]
  c["count the files with transfer size 0 but a decoded size above 0: they came from the cache"]
  d(["return the bytes transferred, the bytes decoded, the number of files, the number from the cache, and the addresses of the files with no size"])
  s --> a --> u --> b --> c --> d
```

## askedSize

Why the game needs it: the cheapest honest size for a file the browser gave none for: ask the server what it sends, without downloading the file (a HEAD request, its Content-Length; with compression this is the packed size, what the player really downloads).

```mermaid
flowchart TD
  s(["askedSize with the file's address and a way to fetch"])
  a["ask the server for the file's headers only (HEAD), past the browser's cache"]
  b{"did the request fail"}
  c(["return nothing"])
  d{"did the server answer OK with a Content-Length that is a whole number above 0"}
  e(["return that length"])
  s --> a --> b
  b -->|"yes"| c
  b -->|"no"| d
  d -->|"yes"| e
  d -->|"no"| c
```

## countedSize

Why the game needs it: when the server will not say a size, download the file again past the cache and count its bytes. The browser unpacks compressed files, so this is the unpacked size, more than the real download; the report says so.

```mermaid
flowchart TD
  s(["countedSize with the file's address and a way to fetch"])
  a["download the file again, past the browser's cache"]
  b{"did the request fail, or the server not answer OK"}
  c(["return nothing"])
  d(["return the number of bytes in the body"])
  s --> a --> b
  b -->|"yes"| c
  b -->|"no"| d
```

## serverSizeOf

Why the game needs it: ask first, because it downloads nothing; count only when the server will not say; and say which way the size was found.

```mermaid
flowchart TD
  s(["serverSizeOf with the file's address and a way to fetch"])
  a["askedSize"]
  b{"did the server say the size"}
  c(["return the size, found by asking"])
  d["countedSize"]
  e{"could it be counted"}
  f(["return the size, found by counting"])
  g(["return no size found"])
  s --> a --> b
  b -->|"yes"| c
  b -->|"no"| d --> e
  e -->|"yes"| f
  e -->|"no"| g
```

## serverSizes

Why the game needs it: the sizes of every file the browser gave none for, six at a time so a very large city does not send thousands of requests at once, added up by how each was found.

```mermaid
flowchart TD
  s(["serverSizes with the addresses and a way to fetch"])
  a{"are there addresses left"}
  b["serverSizeOf the next six at once, and wait for them"]
  c(["return, by foundBy, for asked and for counted: how many files and how many bytes; and how many had no size found"])
  s --> a
  a -->|"yes"| b --> a
  a -->|"no"| c
```

## foundBy

Why the game needs it: the report gives, for each way a size was found, how many files and how many bytes.

```mermaid
flowchart TD
  s(["foundBy with the sizes found and one way of finding them"])
  a["keep the sizes found that way"]
  b(["return how many there are and their bytes added up"])
  s --> a --> b
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

## megabytes

Why the game needs it: every size on the panel reads the same way, as the 30 MB target is written.

```mermaid
flowchart TD
  s(["megabytes with a number of bytes"])
  b(["return it over 1,000,000, to one decimal, with MB after it"])
  s --> b
```

## downloadLines

Why the game needs it: never a confident number the browser did not give. When every size was given, the browser's figures as before; when some were not, it says how many it gave, then the total with the server's sizes and which way each was found.

```mermaid
flowchart TD
  s(["downloadLines with the bytes and the server's sizes, if they have come"])
  a{"did the browser give a size for every file"}
  b(["return: downloaded before driving, megabytes to one decimal (decoded size beside it), in so many files"])
  c{"have the server's sizes come"}
  d(["return: the browser gave sizes for so many of the files (megabytes); asking the server for the other N"])
  e(["return: downloaded before driving, about the browser's bytes plus the server's, in so many files; the browser gave sizes for so many, the server gave the rest; then serverLines"])
  s --> a
  a -->|"yes"| b
  a -->|"no"| c
  c -->|"no"| d
  c -->|"yes"| e
```

## serverLines

Why the game needs it: one line per way a size was found, and only the ways that were used, so the owner knows how far to trust the total.

```mermaid
flowchart TD
  s(["serverLines with the server's sizes"])
  a{"were any asked"}
  b["line: N files: size asked from the server (HEAD), megabytes"]
  c{"were any counted"}
  d["line: N files: downloaded again and counted, megabytes unpacked, so the real download was likely smaller"]
  e{"were any not found"}
  f["line: N files: no size could be found; the total leaves them out"]
  g(["return the lines"])
  s --> a
  a -->|"yes"| b --> c
  a -->|"no"| c
  c -->|"yes"| d --> e
  c -->|"no"| e
  e -->|"yes"| f --> g
  e -->|"no"| g
```

## measureReportLines

Why the game needs it: the numbers on screen, in words, with the warnings that make them honest.

```mermaid
flowchart TD
  s(["measureReportLines with the bytes, the server's sizes if they have come, and the frame summary"])
  a["lines: downloadLines"]
  b{"did any file come from the cache"}
  c["line: N files came from the browser's cache; clear the cache and reload for a first-visit figure"]
  d["line: frame rate, median and slowest 5 percent, frames below 30 a second, over so many seconds; or: still measuring"]
  e(["return the lines"])
  s --> a --> b
  b -->|"yes"| c --> d
  b -->|"no"| d
  d --> e
```
