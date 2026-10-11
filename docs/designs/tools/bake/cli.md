# tools/bake/cli.ts

Status: approved by the orchestrator in one pass (Scope 006, lighter process, 2026-10-11).

New in scope 005 (item 2). The command the orchestrator runs on a computer:

    npm run bake -- --place places/omole.json --extract raw-data/omole-roads.opl --buildings raw-data/omole/omole-buildings.opl

`--buildings` is optional (scope 006): without it the map has roads only. The
buildings extract is cut the same way with `osmium tags-filter … nwr/building`
before `add-locations-to-ways`, so multipolygon relations and their untagged
ring ways come along.

The extract is cut beforehand with osmium (osmium-tool, GPL-3.0, run only,
never copied; research/36 section 2), for example
`osmium extract --bbox W,S,E,N nigeria-latest.osm.pbf -o omole.osm.pbf`, then
`osmium tags-filter omole.osm.pbf w/highway -o omole-roads.osm.pbf`, then
`osmium add-locations-to-ways omole-roads.osm.pbf -f opl,add_metadata=false,locations_on_ways=true -o omole-roads.opl`.
The third step must be `add-locations-to-ways`, not `osmium cat`: `cat` has
no location index, and the writer option `locations_on_ways` only writes
positions a way already has, so with `cat` the nodes come out as `n1xy`, with
no position (approver's F18, measured with pyosmium, which uses the same
libosmium OPL writer). These steps go in the README. The pictures drawn from the code will be in
`docs/flows/tools/bake/cli.md`.

## readBakeArguments

Why the game needs it: a mistyped command should say what is expected, not crash.

```mermaid
flowchart TD
  s(["readBakeArguments with the command-line words"])
  a["read the words in pairs: an option, then its value"]
  q{"an odd count of words, an unknown option, an option given twice, or a value that is another option"}
  r{"are --place and --extract both there"}
  b(["return a problem: the usage line, and that --place and --extract are needed once each and --buildings at most once"])
  c(["return the place file path, the extract path and the buildings extract path if given"])
  s --> a --> q
  q -->|"yes"| b
  q -->|"no"| r
  r -->|"no"| b
  r -->|"yes"| c
```

## runBake

Why the game needs it: one command makes the map, prints what it did, and leaves the old map untouched if anything is wrong.

```mermaid
flowchart TD
  s(["runBake with the command-line words"])
  a["read the arguments with readBakeArguments"]
  b{"a problem"}
  c(["print it and end with failure"])
  d["read every file with readBakeInputs; check each planet with validatePlanet"]
  e{"could a file not be read"}
  f(["print which file and why, and end with failure"])
  g["bake with bakePlace"]
  h{"problems"}
  i(["print every problem with its file and line, and end with failure; nothing is written"])
  j["write with writeBakeFiles into places/id/chunks, and the street file with writeStreetsFile into places/id"]
  k(["print: how many roads and buildings, how many files, where the street file went and its size in bytes, the start, and the report notes; end with success"])
  s --> a --> b
  b -->|"yes"| c
  b -->|"no"| d --> e
  e -->|"yes"| f
  e -->|"no"| g --> h
  h -->|"yes"| i
  h -->|"no"| j --> k
```

## readBakeInputs

Why the game needs it: every file the bake reads, read before anything is baked, so a missing file stops the bake with its name.

```mermaid
flowchart TD
  s(["readBakeInputs with the arguments"])
  a["read the place file, the extract, the buildings extract if given, and every planet file in planets/ in name order"]
  b{"could a file not be read"}
  c(["return which file and why"])
  d(["return the texts"])
  s --> a --> b
  b -->|"yes"| c
  b -->|"no"| d
```
