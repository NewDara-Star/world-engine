# tools/bake/roads.ts

Status: approved by the orchestrator in one pass (Scope 005b, the owner's lighter process for non-physics work, 2026-10-11).

New in scope 005 (item 2). Decides which OSM ways are roads a car may use and
how wide each one is. Sources: osm2lanes (Apache-2.0, `locale.rs` lane widths
by country, `counts.rs` lane counts), SUMO's use of the `width` tag (our
research/world-drive/28), and the OSM `highway` values (OSM wiki Key:highway,
search only; research/36 section 2 lists what the owner should confirm). The
pictures drawn from the code will be in `docs/flows/tools/bake/roads.md`.

Two sanity limits are our own choice, not measured, and are named constants
with that said beside them: a width tag above 50 m and a lanes tag above 12
are treated as typing mistakes (the widest roads near Omole are far below
both; a mistake would otherwise paint a grey blob across the map). The bake
report lists every way where a limit was used, so a real exception is seen:
an unreadable `width` tag and an unusable `lanes` tag both get a note
(approver's F22).

The road kinds a car may use are one fixed list in this file:
`motorway`, `trunk`, `primary`, `secondary`, `tertiary`, the same five with
`_link`, `unclassified`, `residential`, `living_street`, `service`, `road`.

## isDrivableRoad

Why the game needs it: the player should be able to drive every street a car can use in real life, and should not find footpaths and farm tracks drawn as roads. Access follows OSM's order, from the most specific tag to the most general: `motorcar`, then `motor_vehicle`, then `vehicle`, then `access`; the most specific one present decides (OSM wiki Key:access, the transport-mode hierarchy; approver's F22). So `vehicle=no` drops a way, and `access=no` with `motorcar=yes` keeps it.

```mermaid
flowchart TD
  s(["isDrivableRoad with a way's tags"])
  a{"is highway one of the road kinds a car may use"}
  b(["return no"])
  c{"is area yes: a square or plaza drawn as a road outline"}
  d{"is the most specific of motorcar, motor_vehicle, vehicle and access that is present set to no"}
  e(["return yes; private and destination roads are kept, because estate streets are often tagged private"])
  s --> a
  a -->|"no"| b
  a -->|"yes"| c
  c -->|"yes"| b
  c -->|"no"| d
  d -->|"yes"| b
  d -->|"no"| e
```

## roadWidthMetres

Why the game needs it: a wide road looks and drives wide and a lane looks like a lane; a mapper's measured width wins over our estimate.

```mermaid
flowchart TD
  s(["roadWidthMetres with a way's tags and the place's lane width"])
  a["read the width tag with widthFromTag"]
  b{"is there a usable width in metres"}
  c(["return that width"])
  d["count the lanes with laneCount"]
  e{"was there a width tag that could not be read"}
  f["add a note for the bake report: way id has a width we could not read, the text, and the width used instead"]
  l{"was there a lanes tag that is not a whole number from 1 to 12"}
  m["add a note for the bake report: way id has a lanes tag we could not use, the text, and the lanes counted instead"]
  g(["return lanes times the lane width, and the notes"])
  s --> a --> b
  b -->|"yes"| c
  b -->|"no"| d --> e
  e -->|"yes"| f --> l
  e -->|"no"| l
  l -->|"yes"| m --> g
  l -->|"no"| g
```

## widthFromTag

Why the game needs it: mappers write widths in several ways; only metres are safe to use without guessing.

```mermaid
flowchart TD
  s(["widthFromTag with the width tag's text, if any"])
  a{"is there a width tag"}
  b(["return nothing"])
  c["trim it; take off a trailing m with or without a space before it"]
  d{"is what is left a plain number above 0 and at most 50"}
  e(["return that many metres"])
  f(["return unreadable, keeping the text for the report: feet, ranges, words and absurd numbers are not guessed at"])
  s --> a
  a -->|"no"| b
  a -->|"yes"| c --> d
  d -->|"yes"| e
  d -->|"no"| f
```

## isOneWay

New in scope 005 (approver's F22). Why the game needs it: a roundabout is one-way even when nobody tagged it so, as in osm2lanes (`transform/tags_to_lanes/oneway.rs`, Apache-2.0, technique, checked by the approver); otherwise every untagged roundabout is drawn twice as wide. One rule, used by both the lane count and the car's start (`start.md`), so the two can never disagree.

```mermaid
flowchart TD
  s(["isOneWay with a way's tags"])
  a{"is there a oneway tag"}
  b(["return yes if it is yes, true, 1 or -1, otherwise no"])
  c(["return yes if junction is roundabout, otherwise no"])
  s --> a
  a -->|"yes"| b
  a -->|"no"| c
```

## laneCount

Why the game needs it: most streets have no lanes tag, so the bake needs the usual guess that mapping tools use: one lane on a one-way street, one each way otherwise.

```mermaid
flowchart TD
  s(["laneCount with a way's tags"])
  a{"is lanes a whole number from 1 to 12"}
  b(["return that number"])
  c{"isOneWay"}
  d(["return 1"])
  e(["return 2"])
  s --> a
  a -->|"yes"| b
  a -->|"no"| c
  c -->|"yes"| d
  c -->|"no"| e
```

## roadSize

New in Scope 005b. Why the game needs it: the small map draws the bigger roads wider and writes their names (the scope's "road names on the bigger roads"). Major is a tertiary road and up, with their link roads: tertiary is the smallest kind that links towns or districts rather than serving houses (OSM wiki, Key:highway). Every other drivable road is minor.

```mermaid
flowchart TD
  s(["roadSize from a way's tags"])
  a{"is highway motorway, trunk, primary, secondary or tertiary, or one of their links"}
  b(["return major"])
  c(["return minor"])
  s --> a
  a -->|"yes"| b
  a -->|"no"| c
```
