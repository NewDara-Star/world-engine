# tools/bake/opl.ts

Status: approved. Judged by the delegated approver (docs/reviews/slice-1-approver.md); its fixes F1 to F24 and the orchestrator's decisions on E1 to E3 applied in one pass.

New in scope 005 (item 2). Reads the OpenStreetMap extract the orchestrator
cuts on his computer. The extract is an OPL file (one OSM object per line),
written by `osmium add-locations-to-ways` with `add_metadata=false` and
`locations_on_ways=true` (`cli.md`), so every way line carries its own node
positions and the bake needs no other
lines. Format facts from libosmium's OPL reader
(`include/osmium/io/detail/opl_parser_functions.hpp`, BSL-1.0, technique
only; research/36 section 2). The pictures drawn from the code will be in
`docs/flows/tools/bake/opl.md`.

A way line looks like `w123 Thighway=residential,name=Babatunde%20%Ladega N n1x3.3601y6.6302,n2x3.3605y6.6304`:
an id, then fields that each start with one letter. Only `T` (tags) and `N`
(nodes) are used.

## readOplRoadWays

Why the game needs it: the streets in the game are the streets in the map; if a line in the extract is broken, the bake must say which line, not quietly lose a road. A way with fewer than two nodes, which real OSM data has now and then, cannot be drawn either way, so it is skipped with a note in the bake report instead of stopping the whole map (approver's F19).

```mermaid
flowchart TD
  s(["readOplRoadWays with the text of the extract"])
  a["split into lines, Windows line ends treated the same as plain ones"]
  b["for each line, with its line number"]
  c{"does the line start with w, a way"}
  d["skip it: nodes and relations are not needed, ways carry their own positions"]
  e["read it with parseWayLine"]
  f{"what did parseWayLine give"}
  g["keep the problem, with the line number"]
  n["keep the note for the bake report"]
  h["keep the way"]
  i(["return the ways in the order of the file, the problems, and the notes"])
  s --> a --> b --> c
  c -->|"no"| d --> b
  c -->|"yes"| e --> f
  f -->|"a problem"| g --> b
  f -->|"a skipped way"| n --> b
  f -->|"a way"| h --> b
  b -->|"no lines left"| i
```

## parseWayLine

Why the game needs it: one way is one street (or a piece of one); its id keeps the bake's order the same every time, its tags say what kind of road it is, its nodes say where it runs. Lines that cannot be read (no id, nodes without positions, bad escapes) still stop the bake; a way with fewer than two nodes is skipped with a note (approver's F19).

```mermaid
flowchart TD
  s(["parseWayLine with one line and its number"])
  a["split the line at spaces into fields"]
  b["the id is the first field without its w; read it as a whole number"]
  c{"is the id a whole number"}
  d(["return a problem: line N does not start with a way id"])
  e["find the field starting T and the field starting N; a missing T means no tags"]
  f{"is there an N field with at least two nodes"}
  g(["return a skipped way, with the note: way id has fewer than two nodes; skipped"])
  h["read the tags with parseTags and the nodes with parseWayNodes"]
  t{"did parseTags give a problem"}
  u(["return that problem, with the line number"])
  i{"does every node have a position"}
  j(["return a problem: way id has nodes without positions; make the extract with osmium add-locations-to-ways (README)"])
  k(["return the way: id, tags, node positions in order"])
  s --> a --> b --> c
  c -->|"no"| d
  c -->|"yes"| e --> f
  f -->|"no"| g
  f -->|"yes"| h --> t
  t -->|"yes"| u
  t -->|"no"| i
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
  f{"was any escape broken"}
  g(["return a problem: a broken escape in the tags, with the text around it"])
  e(["return the tags as key to value; a key written twice keeps its last value, as OSM allows only one"])
  s --> a
  a -->|"yes"| b
  a -->|"no"| c --> d --> f
  f -->|"yes"| g
  f -->|"no"| e
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

Why the game needs it: street names with spaces or accents are written with escapes in OPL, and the bake report should show them as people write them. libosmium writes `%` itself as `%25%` and has no `%%` rule (an empty escape is an error), so real text such as `%2c%%20%` (", ") must read as two escapes side by side (approver's F21, checked with pyosmium's OPL writer).

```mermaid
flowchart TD
  s(["unescapeOplText with escaped text"])
  a["one pass, left to right"]
  b{"is the next character a %"}
  c["copy it as it is"]
  d{"is it followed by 1 to 6 hex digits, either case, then a %"}
  e["write the character with that code, and move past the closing %"]
  f(["return a problem: a broken escape; the caller reports it with its line number"])
  g(["return the text, when no characters are left"])
  s --> a --> b
  b -->|"no"| c --> a
  b -->|"yes"| d
  d -->|"yes"| e --> a
  d -->|"no"| f
  a -->|"no characters left"| g
```
