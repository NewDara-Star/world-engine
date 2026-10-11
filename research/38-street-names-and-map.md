# 38. Street names and a small map (Scope 005b)

Date: 2026-10-11. What was looked at before writing the street finder and
the small map, and what was taken. Techniques only; no code copied.

## Which street the car is on

- **Map matching with a hidden Markov model** (Newson and Krumm, "Hidden
  Markov Map Matching Through Noise and Sparseness", ACM SIGSPATIAL 2009;
  used by OSRM, Project-OSRM/osrm-backend, BSD-2-Clause, and Valhalla's
  Meili, MIT). Built for noisy GPS on real roads. **Not taken:** our car's
  position is exact (it is the physics position), so there is no noise to
  explain away. Known from earlier work; not reopened this session.
- **Taken instead:** nearest road centre line within a distance, by vector
  projection of the car's point onto each segment (the sum the bake already
  used for the car's start, now shared in `src/world/grid.ts`), plus two
  guards against flicker at junctions, both our own: keep the shown name
  while its road is within 3 m of the nearest, and change the name only after
  the new answer has held for one second. The numbers are the owner's choice,
  proposed (`docs/designs/src/world/streets.md`).
- OpenStreetMap is the source of the names (ODbL, credited in Omole's
  `dataSources` already). Only 209 of the 1,204 drivable ways around Omole
  have a `name` tag (counted from `raw-data/omole/omole-highways.opl` with the
  bake's own reader), so the street file keeps unnamed roads too, for the map.

## Placing names on the map

- **MapLibre GL JS**, `maplibre/maplibre-gl-js`, `src/symbol/collision_index.ts`,
  BSD-3-Clause (licence file and source opened this session at
  raw.githubusercontent.com). Its `CollisionIndex` places labels in priority
  order and refuses one whose box hits an already placed box
  (`placeCollisionBox`). **Taken:** that greedy idea, much simplified: names
  in file order, each refused if its box overlaps a placed name or the car.
  Not taken: its grid index, curved text along lines, and fading; a 300 m map
  has a handful of names.

## Drawing

- The browser's 2D canvas (MDN, CanvasRenderingContext2D). No map library:
  MapLibre alone is several hundred kB, against our 30 MB budget and a
  mid-range phone; the map needs only lines, a few names and an arrow.

## Not done

- No measurement on the reference Android phone yet (draw time per frame of
  the map). The map redraws ten times a second, not every frame, to leave
  room for the 3D picture; the measuring mode (`?measure`) will show if that
  is enough.
