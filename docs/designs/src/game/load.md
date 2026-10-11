# src/game/load.ts

Status: approved by the orchestrator in one pass (Scope 005b, the owner's lighter process for non-physics work, 2026-10-11).

New in scope 005 (item 4). Loads the files the game needs before the player
can drive, and checks each with the checker that already exists for it. Any
failure stops loading and comes back as a **failure** (what went wrong, and
which file) for `failure.ts` to put into plain words; nothing here touches
the screen. Uses the browser's `fetch`. The pictures drawn from the code will
be in `docs/flows/src/game/load.md`.

Order: `start.json` → the place → its planet → the place checked against
the planet → the vehicle → the map index. Paths: `places/<id>.json`,
`planets/<id>.json`, `vehicles/<id>.json`, `places/<id>/chunks/index.json`.

## fetchText

Why the game needs it: every way a download can fail is told apart, because "no connection" and "file missing" need different advice for the player. A download that never ends is a failure too: on weak Lagos mobile data a stalled request would otherwise leave "Loading the map" on screen forever, the blank-screen story the scope rules out (approver's F14).

```mermaid
flowchart TD
  s(["fetchText of a path"])
  a["ask the browser for the file, giving up after 30 s (a named constant, owner-choice, proposed)"]
  t{"was there no answer within 30 s"}
  u(["return failure: too slow, with the path"])
  b{"did the request itself fail, with no answer"}
  c(["return failure: no connection, with the path"])
  d{"was the answer 404"}
  e(["return failure: file missing, with the path"])
  f{"was the answer anything else but OK"}
  g(["return failure: server error, with the path and the status number"])
  h(["return the text"])
  s --> a --> t
  t -->|"yes"| u
  t -->|"no"| b
  b -->|"yes"| c
  b -->|"no"| d
  d -->|"yes"| e
  d -->|"no"| f
  f -->|"yes"| g
  f -->|"no"| h
```

## fetchChecked

Why the game needs it: a file that downloads but has mistakes is reported with the checker's own messages (file, line, what to fix).

```mermaid
flowchart TD
  s(["fetchChecked of a path, with the checker for that kind of file"])
  a["fetchText of the path"]
  b{"a failure"}
  c(["return it"])
  d["check the text with the checker, using the file's name"]
  e{"problems"}
  f(["return failure: file has mistakes, with the path and the checker's messages"])
  g(["return the checked value"])
  s --> a --> b
  b -->|"yes"| c
  b -->|"no"| d --> e
  e -->|"yes"| f
  e -->|"no"| g
```

## planetIdWrittenIn

Why the game needs it: the place checker needs the planet the place is on, and the only way to know which planet file to fetch is to look at what the place file says before it is checked.

```mermaid
flowchart TD
  s(["planetIdWrittenIn the place file's text"])
  a{"is the text JSON with a planet field that is a short id"}
  b(["return that id"])
  c(["return nothing; the place check that follows will report the planet field properly"])
  s --> a
  a -->|"yes"| b
  a -->|"no"| c
```

## loadPlaceOnItsPlanet

Why the game needs it: the place and its planet, checked together, so a place on a planet with no file, or with gravity outside its planet's range, is caught with the usual message.

```mermaid
flowchart TD
  s(["loadPlaceOnItsPlanet with the place id"])
  a["fetchText of the place file"]
  b{"a failure"}
  c(["return it"])
  d["the planet id from planetIdWrittenIn"]
  e{"is there one"}
  f["fetchChecked the planet file with validatePlanet"]
  g{"a failure"}
  h["check the place with validatePlace and the planets list: the one planet, or empty when there was no id"]
  i{"problems"}
  j(["return failure: file has mistakes, the place file and its messages"])
  k(["return the place and its planet"])
  s --> a --> b
  b -->|"yes"| c
  b -->|"no"| d --> e
  e -->|"yes"| f --> g
  g -->|"yes"| c
  g -->|"no"| h
  e -->|"no"| h
  h --> i
  i -->|"yes"| j
  i -->|"no"| k
```

## loadVehicleForPlace

Why the game needs it: the car must exist, be a good file, and be a kind of vehicle the place allows.

```mermaid
flowchart TD
  s(["loadVehicleForPlace with the vehicle id and the place"])
  a["fetchChecked the vehicle file with validateVehicle"]
  b{"a failure"}
  c(["return it"])
  d{"is the vehicle's class in the place's allowed vehicle classes"}
  e(["return failure: vehicle not allowed here, with the vehicle's name, its class and the classes the place allows"])
  f(["return the vehicle"])
  s --> a --> b
  b -->|"yes"| c
  b -->|"no"| d
  d -->|"no"| e
  d -->|"yes"| f
```

## loadMapIndexForPlace

Why the game needs it: the map index must exist (the bake has been run) and must match this place (same centre, same square size).

```mermaid
flowchart TD
  s(["loadMapIndexForPlace with the place"])
  a["fetchChecked places/id/chunks/index.json with validateChunkIndex"]
  b{"a failure"}
  c{"was the failure file missing"}
  d(["return failure: map not baked, with the place id"])
  e(["return the failure"])
  f["problems from indexProblemsForPlace with the game's square size"]
  g{"any"}
  h(["return failure: map baked for something else, with the problems"])
  i(["return the index"])
  s --> a --> b
  b -->|"yes"| c
  c -->|"yes"| d
  c -->|"no"| e
  b -->|"no"| f --> g
  g -->|"yes"| h
  g -->|"no"| i
```

## loadGameData

Why the game needs it: everything needed to start driving, in one call, ending at the first thing that is wrong.

```mermaid
flowchart TD
  s(["loadGameData with the link's query text"])
  a["fetchChecked start.json with validateStartChoice; then startChoiceFromLink"]
  b{"a failure"}
  z(["return the failure"])
  c["loadPlaceOnItsPlanet with the place id"]
  d{"a failure"}
  e["loadVehicleForPlace with the vehicle id"]
  f{"a failure"}
  g["loadMapIndexForPlace"]
  h{"a failure"}
  i(["return the place, planet, vehicle, map index and any notes about the link"])
  s --> a --> b
  b -->|"yes"| z
  b -->|"no"| c --> d
  d -->|"yes"| z
  d -->|"no"| e --> f
  f -->|"yes"| z
  f -->|"no"| g --> h
  h -->|"yes"| z
  h -->|"no"| i
```

## loadStreetsForPlace

New in Scope 005b. Why the game needs it: the street names and the small map's roads are not needed to drive, so they load after the game has started (`main.md`) and a failure only takes them away, with the reason (`hud.md`, `streetsFailureNotice`).

```mermaid
flowchart TD
  s(["loadStreetsForPlace with the place"])
  a["fetchChecked places/id/streets.json with validateStreetsFile"]
  b{"a failure"}
  c(["return it"])
  d["problems from streetsProblemsForPlace"]
  e{"any"}
  f(["return failure: map baked for something else, with the problems"])
  g(["return the streets"])
  s --> a --> b
  b -->|"yes"| c
  b -->|"no"| d --> e
  e -->|"yes"| f
  e -->|"no"| g
```
