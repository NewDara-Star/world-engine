# tools/bake/cli.ts

Status: draft

New in scope 005 (item 2). The command the orchestrator runs on a computer:

    npm run bake -- --place places/omole.json --extract raw-data/omole-roads.opl

The extract is cut beforehand with osmium (osmium-tool, GPL-3.0, run only,
never copied; research/36 section 2), for example
`osmium extract --bbox W,S,E,N nigeria-latest.osm.pbf -o omole.osm.pbf`, then
`osmium tags-filter omole.osm.pbf w/highway -o omole-roads.osm.pbf`, then
`osmium cat omole-roads.osm.pbf -f opl,add_metadata=false,locations_on_ways=true -o omole-roads.opl`.
These steps go in the README. The pictures drawn from the code will be in
`docs/flows/tools/bake/cli.md`.

## readBakeArguments

Why the game needs it: a mistyped command should say what is expected, not crash.

```mermaid
flowchart TD
  s(["readBakeArguments with the command-line words"])
  a{"are --place and --extract each given once, with a value"}
  b(["return a problem: the usage line, and which one is missing or repeated"])
  c(["return the place file path and the extract path"])
  s --> a
  a -->|"no"| b
  a -->|"yes"| c
```

## runBake

Why the game needs it: one command makes the map, prints what it did, and leaves the old map untouched if anything is wrong.

```mermaid
flowchart TD
  s(["runBake with the command-line words"])
  a["read the arguments with readBakeArguments"]
  b{"a problem"}
  c(["print it and end with failure"])
  d["read the place file, every planet file in planets/ checked with validatePlanet, and the extract"]
  e{"could a file not be read"}
  f(["print which file and why, and end with failure"])
  g["bake with bakePlace"]
  h{"problems"}
  i(["print every problem with its file and line, and end with failure; nothing is written"])
  j["write with writeBakeFiles into places/id/chunks"]
  k(["print: how many roads, how many squares, the start, and the report notes; end with success"])
  s --> a --> b
  b -->|"yes"| c
  b -->|"no"| d --> e
  e -->|"yes"| f
  e -->|"no"| g --> h
  h -->|"yes"| i
  h -->|"no"| j --> k
```
