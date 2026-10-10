# Machine Sight: techniques only (scope 001b)

Source: the Machine Sight project, read at `/home/claude/ref/machine-sight/`
(three.js; by Zsolt Kacso / Whitespace). Its licence is "Machine Sight Reuse
License 1.0", which is **not** on our list. So: **no code is copied, nothing is
credited, and we write our own version of each idea.** What follows is what each
technique is and where it lives, in plain words, so we can rebuild it
ourselves later. Nothing here is built yet.

## 1. Cars built in code from side profiles

File `src/world/agents.ts`, functions `bodyShape`, `extrude`, `poly`, `carGeo`
and the `CARS` table.

- A car is described as numbers, not a model file: length, width, height,
  wheel radius, wheel positions, and a short list of (z, y) points tracing the
  top outline seen from the side (z forward, y up).
- `bodyShape` closes that outline underneath with two circular wheel arches
  (`absarc`), giving a flat side silhouette.
- `extrude` pushes the silhouette across the car's width, with a small bevel so
  edges catch light. The glass and roof are separate smaller silhouettes
  extruded the same way. Pillars, bumpers, mirrors, lights and wheels are
  boxes and cylinders (`between`, `wheels`).
- `part` paints every vertex one colour and `mergeGeometries` merges all the
  pieces into one mesh per car, so a car is one draw call. `grouped` keeps
  body and glass as two material groups. A cache keyed on car type plus colour
  means spawning another car of a kind costs nothing.
- Why it matters to us: new vehicle types (a Lagos danfo bus, a keke, a
  Dublin bus) become small data tables, which fits "a new vehicle is a file".

## 2. People animated in the vertex shader

File `src/world/materials.ts` (`WALK_GLSL`, `walker`) and `src/world/agents.ts`
(`pedGeo`, `scaledPed`, `Limb`).

- Each pedestrian is merged into a single mesh. Every vertex carries an extra
  attribute `aLimb` = (limb id, pivot height, pivot depth): 0 body, 1 and 2 legs,
  3 and 4 arms.
- One uniform `uWalk` = (phase, leg swing, arm swing). The vertex shader
  (`limbPose`, `limbRot`) rotates each vertex about its limb's pivot by
  sin(phase) times the swing; arms swing against the same-side leg. Normals are
  rotated the same way (`limbNormal`) so lighting stays right.
- `walker()` patches a standard three.js material with `onBeforeCompile` (and
  the depth material, so shadows move too). All people share one shader program;
  each person only has its own `uWalk` value, set from its walking speed.
- Look variety comes from a seeded random pick of skin, hair, clothes, build and
  height (`pedGeo`, `scaledPed` rescales the figure and its pivots).
- Why it matters: thousands of walking people with no skeleton, no animation
  clips and one draw call per variant: friendly to a mid-range phone.

## 3. The white-clay look

Files `src/world/materials.ts` (`clay`, `buildingClay`), `src/main.ts`
(scene set-up), `src/render/pipeline.ts` (post-processing).

- **Materials.** Everything is the same matte off-white material:
  `MeshStandardMaterial`, roughness about 0.92, metalness 0, colours that are
  all near-white warm greys (`#e6e4dd` ground, `#d9d6cf` road, `#efede8`
  pavement). Only small accents are dark (glass, tyres, signal heads).
  Buildings add faint "etched" window bays by darkening the colour in a
  fragment-shader patch.
- **Light.** Background and fog are the same pale colour (`#e7e4dc`), so
  distance fades into the sky. One warm directional "sun" with shadows,
  a soft hemisphere light, and a very weak image-based environment from three.js's
  `RoomEnvironment` (intensity about 0.16).
- **Ambient occlusion.** The `n8ao` library's post pass (`N8AOPostPass`), with a
  large radius (about 5 m), strong intensity, and a warm dark brown tint rather
  than black. This is what gives the contact shadows in corners that make it
  read as a clay model.
- **Post-processing** (library `postprocessing`): tilt-shift blur (a "miniature"
  feel), bloom, AgX tone mapping, a vignette, light film grain, SMAA
  anti-aliasing. Rendering is in half-float so the tone mapping has room.
- **Licences to check before we use them:** the `n8ao` and `postprocessing`
  libraries are separate projects with their own licences (not read here);
  check them before we depend on either.
- **Phone caution (ours, not theirs):** this is a desktop-class pipeline (4096
  shadow map, AO, many passes). Our reference device is a mid-range Android
  phone, so each pass must be measured there; likely keep clay materials, the
  fog trick and one cheap AO, and drop the rest.

## What we did NOT do

Did not copy or adapt code; did not read anything outside this folder. The
traffic code (`traffic.ts`, IDM car-following) was looked at only enough to
confirm it exists; it is not summarised here because this scope did not ask for it.
