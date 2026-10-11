# Scope 006: buildings (the world starts to look like Omole)

Status: asked for by Daramola (owner), 2026-10-11: "the place doesn't look
familiar because we have not done anything about modelling the world".
Built the lighter way: one session, designs written with the code, the
orchestrator approves in one pass. Heights and terrain come in Scope 007
once the data sites are reachable.

## Goal

Every building OpenStreetMap has in Omole stands in its real place and real
shape, as a simple block, so the streets look like the real streets.

## The player's story

Daramola drives off his street and there are houses on both sides, walls of
buildings along Isheri Road, compounds and gaps where they really are. He can
tell a junction by the shape of the buildings at its corners. The blocks are
plain (one colour family, slightly varied, flat roofs) and never hide the road.
The game still loads fast on his phone.

## In scope

1. Bake: read `raw-data/omole/omole-buildings.opl` (OSM ways and multipolygon
   relations tagged building, locations added by osmium; 3,856 ways and 8
   relations), project them like the roads, and write them into the existing
   100 m squares (or a sibling file per square) as extruded blocks ready to
   draw, plus one simple collider per building so the car cannot drive through.
   Height: `height` or `building:levels` x 3 m when tagged; otherwise a default
   by building type (house, apartments, commercial, church, school...) recorded
   as owner-choice in the place file. Deterministic.
2. Draw them: merged per square for speed, simple shading so edges read, a few
   colour shades so it does not look like one mass. Load and unload with the
   squares.
3. Pavement strips along the roads (optional if cheap): a slightly lighter
   band at the road edge.
4. Tests (fast): footprint parsing incl. relations with holes, projection,
   height rule, determinism, per-square split, that a building on a square
   edge is drawn once.
5. Measure: bytes added to the download, frame rate in the build.
6. Credit: buildings © OpenStreetMap contributors (ODbL), already in dataSources.

## Out of scope

Real heights from Open Buildings and terrain (Scope 007, needs data access),
textures, windows, trees, landmarks.

## Done when

`npm run check` passes; on the built site at phone size, buildings line the
streets around the start; screenshots; download still small. Do not commit
(orchestrator commits).
