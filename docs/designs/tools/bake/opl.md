# tools/bake/opl.ts

Status: draft

New in scope 005 (item 2). Reads the OpenStreetMap extract the orchestrator
cuts on his computer. The extract is an OPL file (one OSM object per line),
written by `osmium` with `add_metadata=false` and `locations_on_ways=true`, so
every way line carries its own node positions and the bake needs no other
lines. Format facts from libosmium's OPL reader
(`include/osmium/io/detail/opl_parser_functions.hpp`, BSL-1.0, technique
only; research/36 section 2). The pictures drawn from the code will be in
`docs/flows/tools/bake/opl.md`.

A way line looks like `w123 Thighway=residential,name=Babatunde%20%Ladega N n1x3.3601y6.6302,n2x3.3605y6.6304`:
an id, then fields that each start with one letter. Only `T` (tags) and `N`
(nodes) are used.

## readOplRoadWays

Why the game needs it: the streets in the game are the streets in the map; if a line in the extract is broken, the bake must say which line, not quietly lose a road.

```mermaid
flowchart TD
  s(["readOplRoadWays with the text of the extract"])
  a["split into lines, Windows line ends treated the same as plain ones"]
  b["for each line, with its line number"]
  c{"does the line start with w, a way"}
  d["skip it: nodes and relations are not needed, ways carry their own positions"]
  e["read it with parseWayLine"]
  f{"did parseWayLine give a problem"}
  g["keep the problem, with the line number"]
  h["keep the way"]
  i(["return the ways in the order of the file, and the problems"])
  s --> a --> b --> c
  c -->|"no"| d --> b
  c -->|"yes"| e --> f
  f -->|"yes"| g --> b
  f -->|"no"| h --> b
  b -->|"no lines left"| i
```

## parseWayLine

Why the game needs it: one way is one street (or a piece of one); its id keeps the bake's order the same every time, its tags say what kind of road it is, its nodes say where it runs.

```mermaid
flowchart TD
  s(["parseWayLine with one line and its number"])
  a["split the line at spaces into fields"]
  b["the id is the first field without its w; read it as a whole number"]
  c{"is the id a whole number"}
  d(["return a problem: line N does not start with a way id"])
  e["find the field starting T and the field starting N; a missing T means no tags"]
  f{"is there an N field with at least two nodes"}
  g(["return a problem: way id has fewer than two nodes"])
  h["read the tags with parseTags and the nodes with parseWayNodes"]
  i{"does every node have a position"}
  j(["return a problem: way id has nodes without positions; cut the extract with locations_on_ways=true"])
  k(["return the way: id, tags, node positions in order"])
  s --> a --> b --> c
  c -->|"no"| d
  c -->|"yes"| e --> f
  f -->|"no"| g
  f -->|"yes"| h --> i
  i -->|"no"| j
  i -->|"yes"| k
```

## parseTags

Why the game needs it: the tags say whether a car may use the road, whether it is one-way, and how wide it is.

```mermaid
flowchart TD
  s(["parseTags with the text after T"])
  a{"is the text empty"}
  b(["return no tags"])
  c["split at commas into pairs; split each pair at its first equals sign"]
  d["unescape the key and the value with unescapeOplText"]
  e(["return the tags as key to value; a key written twice keeps its last value, as OSM allows only one"])
  s --> a
  a -->|"yes"| b
  a -->|"no"| c --> d --> e
```

## parseWayNodes

Why the game needs it: the node positions are the road's line on the map.

```mermaid
flowchart TD
  s(["parseWayNodes with the text after N"])
  a["split at commas, one node each"]
  b["for each node, read n then its id, x then its longitude, y then its latitude"]
  c(["return the nodes in order: id, and latitude and longitude, or no position when x or y is missing or not a number"])
  s --> a --> b --> c
```

## unescapeOplText

Why the game needs it: street names with spaces or accents are written with escapes in OPL, and the bake report should show them as people write them.

```mermaid
flowchart TD
  s(["unescapeOplText with escaped text"])
  a["replace every %hex% with the character of that code; %% becomes a single %"]
  b(["return the text"])
  s --> a --> b
```
