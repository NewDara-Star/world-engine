# src/world/streets.ts

Status: approved by the orchestrator in one pass (Scope 005b, the owner's lighter process for non-physics work, 2026-10-11).

New in scope 005b (items 1 and 2). The street file the bake writes and the
game reads, its checker, and the rule for which street the car is on. It sits
beside `chunk.ts` and `grid.ts` because both the bake and the game use it, so
they can never disagree. The pictures drawn from the code will be in
`docs/flows/src/world/streets.md`.

The file, `places/<id>/streets.json`:

    {"format":1,"centre":{"lat","lon"},"streets":[
    {"name":"Babatunde Ladega Street","size":"minor","lines":[[e0,n0,e1,n1,…],…]},
    {"size":"minor","lines":[…]},
    …]}

Every road a car may use, grouped by name and size. Only 209 of Omole's 1,204
drivable roads have a name in OpenStreetMap, so a map drawn from named roads
alone would be mostly empty; roads with no name are kept, with no `name`, so
the small map draws them. Points are whole decimetres east and north of the
place centre, the same projection as the chunks. `size` is `major` (tertiary
and up) or `minor` (`tools/bake/roads.md`, `roadSize`).

The rule's numbers: within **15 m** (the scope's "about 15 m", owner); the
name changes only after the new answer has held for **1 second**; the name on
screen is kept while its road is no more than **3 m** farther than the
nearest (about one lane). The second and the 3 m are the owner's choice,
proposed by the coder on 2026-10-11, awaiting his yes.

## validateStreetsFile

Why the game needs it: a damaged or half-downloaded street file must not crash the game; the game drives on without names and says why.

```mermaid
flowchart TD
  s(["validateStreetsFile with the file's name and text"])
  a{"is the text readable JSON"}
  b(["return one problem: the file is not readable JSON; it may be cut short"])
  c["problems from streetsFileProblems"]
  d{"any"}
  e(["return each problem, starting with the file's name"])
  f(["return the centre, and every street turned into metres by streetInMetres"])
  s --> a
  a -->|"no"| b
  a -->|"yes"| c --> d
  d -->|"yes"| e
  d -->|"no"| f
```

## streetsFileProblems

Why the game needs it: each check catches one way the file goes wrong, in words that say what to do.

```mermaid
flowchart TD
  s(["streetsFileProblems of a JSON value"])
  a["look into it as a record, whatever it is, so null or a number cannot crash it"]
  b{"is format not 1"}
  b1["problem: made by a different bake version; bake again"]
  c{"is the centre's lat or lon not a number"}
  c1["problem: centre must have a lat and a lon, each a number"]
  d{"is streets not a list"}
  d1(["return the problems so far, and: streets must be a list"])
  e["find the first street with a streetProblem"]
  f{"is there one"}
  f1["problem: street number, counting from 1, and what is wrong with it"]
  g(["return the problems"])
  s --> a --> b
  b -->|"yes"| b1 --> c
  b -->|"no"| c
  c -->|"yes"| c1 --> d
  c -->|"no"| d
  d -->|"yes"| d1
  d -->|"no"| e --> f
  f -->|"yes"| f1 --> g
  f -->|"no"| g
```

## streetProblem

Why the game needs it: one broken street usually means a broken bake; the first one is named so the place-maker knows where to look.

```mermaid
flowchart TD
  s(["streetProblem of one street"])
  a{"is there a name that is not text, or is only spaces"}
  a1(["return: name must be text with letters in it, or left out for a road with no name"])
  b{"is size not major or minor"}
  b1(["return: size must be major or minor"])
  c{"is lines not a list of at least one line"}
  c1(["return: lines must be a list of at least one line"])
  d{"is any line not good, by lineIsGood"}
  d1(["return: a line is broken, and what a good line is"])
  e(["return nothing: the street is good"])
  s --> a
  a -->|"yes"| a1
  a -->|"no"| b
  b -->|"yes"| b1
  b -->|"no"| c
  c -->|"yes"| c1
  c -->|"no"| d
  d -->|"yes"| d1
  d -->|"no"| e
```

## lineIsGood

Why the game needs it: a long road is checked in time that grows evenly with its length, and a number sent as text or a point a world away is caught.

```mermaid
flowchart TD
  s(["lineIsGood of one line"])
  a{"is it a list of an even count of numbers, at least four"}
  n(["return no"])
  b["for each number"]
  c{"is it not a whole number, or farther than 500,000 decimetres (50 km, the farthest a map may reach) from the centre"}
  y(["return yes"])
  s --> a
  a -->|"no"| n
  a -->|"yes"| b --> c
  c -->|"yes"| n
  c -->|"no, next number"| b
  b -->|"all numbers done"| y
```

## streetInMetres

Why the game needs it: the game works in metres, and a far line should be skipped without measuring every segment, so each line's box is worked out once, on load.

```mermaid
flowchart TD
  s(["streetInMetres of one street as written"])
  a["each line: points from pointsFromDecimetres, and its box from boxAround"]
  b(["return the name, the size and the lines"])
  s --> a --> b
```

## pointsFromDecimetres

Why the game needs it: the file is east, north, east, north… in whole decimetres.

```mermaid
flowchart TD
  s(["pointsFromDecimetres of a list of numbers"])
  a["for each pair: east divided by 10, north divided by 10"]
  b(["return the points in metres"])
  s --> a --> b
```

## boxAround

Why the game needs it: the box lets the street finder and the small map skip far lines at once.

```mermaid
flowchart TD
  s(["boxAround the points"])
  a(["return the smallest and largest east, and the smallest and largest north"])
  s --> a
```

## streetsProblemsForPlace

Why the game needs it: if the place's centre moved after the bake, every name would be found in the wrong place; the player is told to bake again instead. Compared exactly, as the index is (`chunk.md`, `indexProblemsForPlace`).

```mermaid
flowchart TD
  s(["streetsProblemsForPlace with the street file and the place"])
  a{"is the file's centre exactly the place's centre"}
  b(["return no problems"])
  c(["return one problem: the street names were made for a different centre than the place file's; bake again"])
  s --> a
  a -->|"yes"| b
  a -->|"no"| c
```

## distanceToStreet

Why the game needs it: how far the car is from a street is the distance to the nearest point of any of its lines.

```mermaid
flowchart TD
  s(["distanceToStreet with the street, the point and a limit"])
  a["nearest = infinity"]
  b["for each line"]
  c{"is the line's box farther than the limit, by distanceToBox"}
  d["for each segment: nearest = the smaller of nearest and nearestPointOnSegment's distance"]
  e(["return nearest"])
  s --> a --> b --> c
  c -->|"yes, skip it"| b
  c -->|"no"| d --> b
  b -->|"all lines done"| e
```

## distanceToBox

Why the game needs it: a quick lower bound; a line whose box is farther than 15 m cannot be within 15 m.

```mermaid
flowchart TD
  s(["distanceToBox from a point"])
  a["how far the point is outside the box east-west, 0 if between; the same north-south"]
  b(["return the straight-line distance from those two; 0 when inside"])
  s --> a --> b
```

## nearestStreetName

Why the game needs it: the line at the top of the screen names the street the car is on, or nothing off every named road; standing at a junction does not swap names.

```mermaid
flowchart TD
  s(["nearestStreetName with the streets, the car's point and the name on screen"])
  a["near = namedStreetsWithin 15 m, nearest first"]
  b{"is near empty"}
  c(["return no name"])
  d["shown distance = the nearest distance among near with the name on screen; infinity if it is not near"]
  e{"is the shown distance no more than 3 m more than the nearest's"}
  f(["return the name on screen"])
  g(["return the nearest's name"])
  s --> a --> b
  b -->|"yes"| c
  b -->|"no"| d --> e
  e -->|"yes"| f
  e -->|"no"| g
```

## namedStreetsWithin

Why the game needs it: a road with no name hides nothing, so names are only looked for among named roads; on an exact tie the street first in the file wins, so the answer never changes between runs.

```mermaid
flowchart TD
  s(["namedStreetsWithin with the streets, the point and the limit"])
  a["for each street"]
  b{"does it have a name"}
  c["distance = distanceToStreet with the limit"]
  d{"is the distance within the limit"}
  e["keep the name and the distance"]
  f(["return what was kept, nearest first; equal distances stay in file order"])
  s --> a --> b
  b -->|"no, skip it"| a
  b -->|"yes"| c --> d
  d -->|"yes"| e --> a
  d -->|"no"| a
  a -->|"all streets done"| f
```

## streetNameAfter

Why the game needs it: the name changes only when the car has been on the new road for a moment, so it does not flicker at junctions (scope item 2); leaving every road clears the name the same way.

```mermaid
flowchart TD
  s(["streetNameAfter with the hold, the name found now (or none) and the time now"])
  a{"is the found name the one on screen"}
  b(["return: the same name on screen, nothing waiting"])
  c{"is nothing waiting, or is a different name waiting"}
  d(["return: the same name on screen, the found name waiting since now"])
  e{"has the waiting name waited a second or more"}
  f(["return: the found name on screen, nothing waiting"])
  g(["return the hold unchanged"])
  s --> a
  a -->|"yes"| b
  a -->|"no"| c
  c -->|"yes"| d
  c -->|"no"| e
  e -->|"yes"| f
  e -->|"no"| g
```
