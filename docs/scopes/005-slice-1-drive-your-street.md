# Scope 005: slice 1, drive your street

Status: approved by Daramola (owner) in chat, 2026-10-11 ("approve Scope 004,
then build slice 1, driving street in Omole"; "we can start working").
Architecture: V5, slice order: street first.

## Goal

Open a web page on a phone and drive a simple car on the real roads around
Babatunde Ladiga Street, Omole Phase 1, Lagos: about 1.5 km in every
direction, roads drawn in grey from OpenStreetMap, on-screen thumb controls
on a phone and keys on a computer.

## The player's story

Daramola opens the link on his Android phone. Within a few seconds he sees a
grey road map of his own neighbourhood from behind a small car, parked on his
street. A thumb stick on the left steers; buttons on the right accelerate and
brake (reverse when stopped). He drives to the junction he knows, turns, and
the roads match the real ones. On his Mac, the arrow keys or WASD do the same.
Nothing else is in the world yet: no buildings, no traffic, no jobs. If the
page cannot load the map, he is told so in plain words, not left with a blank
screen.

## In scope

1. **Find code first** (`research/36-slice-1.md`): the best two or three open
   projects for each part, licences read, techniques only unless MIT/Apache
   (CC0) code is used as a package:
   - turning OSM roads into flat road ribbons (widths by road type, lanes
     where tagged, junctions that do not flicker);
   - a drivable car in Rapier (its raycast vehicle controller), tuned to feel
     like a small hatchback, not a toy;
   - touch controls in the browser (a virtual stick plus buttons);
   - floating origin for a 3 km world (positions near the car stay precise).
   Name every source and licence.
2. **Bake script** (`tools/bake/`, run on a computer, not in the game): from
   an OSM extract, keep the drivable roads (`highway` values a car may use),
   project them to metres around the place centre, and write them as 100 m
   grid chunks under `places/omole/chunks/` (one file per cell with road
   ribbons ready to draw and the same as colliders). Deterministic: same
   input, byte-identical output. The baked data is ODbL and published with
   the script (CLAUDE.md). The orchestrator supplies the cut extract
   (`raw-data/` stays out of git) and its centre.
3. **Place file** `places/omole.json`: Omole Phase 1, Lagos, on Earth, drives
   on the right, km/h, its centre (the street, from the map data), OSM credit,
   the same constants as Yaba unless the research says Omole differs (it is
   a few km north; say what was checked).
4. **The game page** (`src/`, three.js and Rapier, Vite to build, versions
   pinned exactly): loads the place file and its planet, then the chunks
   around the car (all chunks within a view distance; unload far ones), draws
   ground and grey roads with simple lighting, and puts the car on the
   street. A chase camera. A plain-words message if loading fails.
5. **The car**: a vehicle file (`vehicles/hatchback.json`, an invented small
   hatchback, our own name) read through the existing vehicle checker. Mass,
   size, engine force, brakes and steering from published figures for a
   typical small hatchback (data rule: say where each number comes from), not
   guessed. Rapier physics with the place's gravity.
6. **Controls**, one model for every device (CLAUDE.md, touch rule): actions
   (steer, accelerate, brake/reverse, reset car) mapped from keyboard and
   touch now, gamepad if simple. On touch: a stick on the left thumb, buttons
   on the right; nothing needs two hands on one side.
7. **Measure on the reference phone**: download size before driving (target
   under 30 MB; report the real number) and frame rate while driving. If no
   phone is available to the session, measure in a desktop browser with the
   phone profile and say so plainly; the owner tries it on his phone.
8. **How the owner runs it**: one command on his Mac (`npm run dev`) that
   prints a link his phone can open on the same Wi-Fi. Written in README.

## Out of scope

Buildings, terrain height (the ground is flat at 0 m for now; park it),
traffic, lights, deliveries, the server, sound, sat nav, the decision-log
search tool (parked from Scope 004), any other place.

## How it is built

The Scope 004 pipeline, its first real use: designs (Opus, draft) → the
delegated approver → blind tests (`WE_ROLE=test-writer`, never sees `src/`) →
code (`WE_ROLE=coder`, cannot change the tests) → the orchestrator's own check
(`tests-lock.sh verify`, `npm run check`) → the owner drives it.

## Done when

- `npm run dev` on the Mac gives a link; on the phone the street appears and
  the car drives with thumb controls; on the Mac with keys.
- The roads match the real map at three junctions the owner names.
- The bake is deterministic (tested), the chunks load and unload as the car
  moves (tested), the controls map to the same actions on every device
  (tested), loading failures show a plain message (tested).
- Download size and frame rate are reported with how they were measured.
- `npm run check` passes; designs approved; small commits with `Story:`.
  Do not push.
