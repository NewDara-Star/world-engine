# tools/bake/start.ts

Status: draft

New in scope 005 (items 2 and 3). Finds where the car is parked when the game
opens: on the road nearest the place centre (the place file's centre is on the
owner's street, taken from the map), facing along it. The game then moves it
to the place's driving side (`src/vehicle/car.ts`). The pictures drawn from
the code will be in `docs/flows/tools/bake/start.md`.

## carStartOnRoad

Why the game needs it: the player opens the game and is on his own street, on the road, facing a way he could actually drive, not in a field or a wall.

```mermaid
flowchart TD
  s(["carStartOnRoad with the drivable roads in metres, in bake order"])
  a["for every segment of every road, find the point nearest the centre (0, 0) with nearestPointOnSegment"]
  b["keep the nearest one; on a tie, keep the first in bake order, so the answer never changes"]
  c["heading = compassHeading from the segment's first point to its second"]
  d{"is the road one-way against its drawing direction, oneway is -1"}
  e["turn the heading round by 180 degrees, so the car faces the legal way"]
  f(["return the start: metres east, metres north, compass heading"])
  s --> a --> b --> c --> d
  d -->|"yes"| e --> f
  d -->|"no"| f
```

## nearestPointOnSegment

Why the game needs it: the place centre is rarely exactly on a road line.

```mermaid
flowchart TD
  s(["nearestPointOnSegment from a point to the segment A to B"])
  a{"are A and B the same point"}
  b(["return A and its distance"])
  c["how far along the segment the point's shadow falls, as a fraction, kept between 0 and 1"]
  d(["return the point at that fraction, and its distance from the given point"])
  s --> a
  a -->|"yes"| b
  a -->|"no"| c --> d
```

## compassHeading

Why the game needs it: the index file uses map words, degrees clockwise from north, which a person can check against a map.

```mermaid
flowchart TD
  s(["compassHeading from A to B"])
  a["angle = arctangent of (east difference, north difference), in degrees"]
  b(["return it moved into 0 up to but not including 360"])
  s --> a --> b
```
