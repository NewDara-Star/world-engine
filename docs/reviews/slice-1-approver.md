# Approver report: Scope 005, slice 1 designs (branch slice-1, commit ef0491b)

Delegated design approver, 2026-10-11. I judged the 38 design files changed since `origin/main`.
There is no code yet, so I judged the designs against the scope, research/36, DECISIONS, the
Rapier 0.21.0 and three.js 0.186.1 packages, and small experiments. I edited nothing in the repo.

**Result: 24 fixes (F1–F24), 3 owner questions (E1–E3); every function not named below is
approved.** One finding blocks the pipeline as written (F1: the
hooks will refuse the test cascade). Two would ship visibly wrong behaviour (F2: steering is
reversed, F3: the car turns 19 % wider than the real one).

## Summary table

| Design | Functions | Decision |
|---|---|---|
| OVERVIEW-005 | (overview) | FIX: F1 |
| src/place/place.md | `skyPosition`→`centre`, lane width, `sourceProblemsForConstants` | FIX: F1 |
| src/place/parse.md | `requireNumberAbove`, `checkNumberAbove`, `sourceCountProblem` | APPROVE |
| src/place/vehicle.md | `figureNamesInShape`, `sizeProblemsInVehicle`, `figureSourceProblems`, `validateVehicle` | FIX: F1, F4 |
| src/place/vehicle.md | `turningProblemInVehicle` | FIX: F3 |
| src/place/start.md | `validateStartChoice`, `startChoiceFromLink` | APPROVE |
| src/world/grid.md | all 5 | APPROVE |
| src/world/chunk.md | all 4 | APPROVE |
| src/vehicle/rapier-settings.md | `maxSteerAngleRad` | FIX: F3 |
| src/vehicle/rapier-settings.md | `chassisMassProperties` | FIX: F5 |
| src/vehicle/rapier-settings.md | the other 5 | APPROVE |
| src/vehicle/drive-force.md | `forwardDriveForceN` | **ESCALATE E1** |
| src/vehicle/drive-force.md | the other 3 | APPROVE |
| src/vehicle/pedals.md | `pedalCommand` | APPROVE |
| src/vehicle/steering.md | all 3 | APPROVE |
| src/vehicle/car.md | `driveCar` | FIX: F2, F6 |
| src/vehicle/car.md | `carStartPose` | FIX: F7 |
| src/vehicle/car.md | `putCarBack` | FIX: F8 |
| src/vehicle/car.md | `createCar`, `wheelCommands`, `carRescueNeeded` | APPROVE |
| src/controls/actions.md | `putBack` and the 4 functions | FIX: F8 (name only) |
| src/controls/keyboard.md | `holdKey` | FIX: F9 |
| src/controls/keyboard.md | the other 4 | APPROVE |
| src/controls/gamepad.md | `withDeadZone` | APPROVE |
| src/controls/gamepad.md | `gamepadActions` | FIX: F10 |
| src/controls/touch.md | `fingerMoved`, `fingerDown`, `listenToTouches`, `passPointerEvent` | FIX: F11 |
| src/controls/touch.md | the other 5 | APPROVE; layout **ESCALATE E3** |
| src/camera/chase.md | `chaseCameraGoal` | FIX: F12 |
| src/camera/chase.md | `followFraction`, `moveChaseCamera` | APPROVE |
| src/game/main.md | `listenForResize` | FIX: F13 |
| src/game/main.md | `startGame`, `startGameSafely`, `buildGame` | APPROVE |
| src/game/load.md | `fetchText` | FIX: F14 |
| src/game/load.md | the other 6 | APPROVE |
| src/game/failure.md | `failureMessage`, `showNotice` | FIX: F14, F15 |
| src/game/failure.md | `messageForStartProblem`, `showFailure` | APPROVE |
| src/game/physics.md | all 6 | APPROVE |
| src/game/scene.md | `createScene` | FIX: F13 |
| src/game/scene.md | `roadMeshFromChunk` | FIX: F16 |
| src/game/scene.md | the other 5 | APPROVE |
| src/game/streaming.md | all 6 | APPROVE |
| src/game/loop.md | `runFrame`, `stepCarPhysics`, `rescueCarIfNeeded` | FIX: F17, F8 |
| src/game/loop.md | `frameSeconds`, `readActions`, `warnAtMapEdge`, `measureFrame` | APPROVE; Flip upright **ESCALATE E2** |
| src/measure/measure.md | all 5 | APPROVE |
| tools/bake/cli.md | the README's osmium command, `runBake` | FIX: F18 |
| tools/bake/bake.md | `bakePlace` | FIX: F19, F20 |
| tools/bake/bake.md | `drivableRoadsInMetres` | APPROVE |
| tools/bake/opl.md | `parseWayLine`, `unescapeOplText` | FIX: F19, F21 |
| tools/bake/opl.md | `readOplRoadWays`, `parseTags`, `parseWayNodes` | APPROVE |
| tools/bake/roads.md | `isDrivableRoad`, `laneCount`, `roadWidthMetres` | FIX: F22 |
| tools/bake/roads.md | `widthFromTag` | APPROVE |
| tools/bake/projection.md | all 3 | APPROVE |
| tools/bake/ribbons.md | all 3 | APPROVE |
| tools/bake/clip.md | all 5 | APPROVE |
| tools/bake/chunk-text.md | `chunkFileText`, `indexFileText` | FIX: F7, F20, F23 |
| tools/bake/start.md | `carStartOnRoad` | FIX: F7 |
| tools/bake/start.md | `nearestPointOnSegment`, `compassHeading` | APPROVE |
| tools/bake/write.md | `writeBakeFiles` | APPROVE |
| tools/site/data-files.md | `isShippedDataFile` (and the dev server) | FIX: F24 |

The orchestrator's own decisions are already in the designs: private estate roads are kept
(`isDrivableRoad`), the map edge is an invisible wall with a message (`addMapEdgeWalls`,
`warnAtMapEdge`), and lane width and the car's name are data, not code (`laneWidthM` in the place
file; `name` in `vehicles/hatchback.json`; after F7 the game no longer reads lane width at all).
"Flip upright" is applied by F8.

## What I tested (and what I did not)

All in a scratch folder, not in the repo.

- **Rapier 0.21.0 compat (Node 22):** I built the car exactly as the designs say, using
  illustrative hatchback figures (1100 kg, 61 kW, 115 Nm, 2.55 m wheelbase, 10.2 m turning circle,
  1.3 Hz, ζ 0.3, μ 1.0). These are typical values, not the real sources.
  - It settles level at 0.5545 m against the planned 0.55 m, and creeps 9e-14 m in 10 s. The
    suspension maths and the "rolling resistance as a brake impulse" idea both work.
  - Positive engine force drives along +x. **Positive steering angle turns LEFT** (F2).
  - `currentVehicleSpeed()` is the whole speed with a sign. The Rust source sets it to
    `linvel().length()` and flips the sign if the car moves backwards (F6).
  - Braking from 100 km/h stops in 37.6 m against the 37 m target. The brake-as-impulse
    conversion is right.
  - Turning circle at full lock: about 12.2 m as designed against 10.2 m published. With F3's
    formula it is 10.6 m.
  - 0–100 km/h: 9.95 s with the designed engine model, against about 12.5–13 s published for
    cars with this power-to-weight (E1).
  - `setMassProperties` takes the centre of mass in the **collider's** frame (F5).
- **Rapier Rust source** (`dimforge/rapier` master, `ray_cast_vehicle_controller.rs`): I confirmed
  every claim in research/36 section 3: springs are scaled by chassis mass, engine force is N per
  wheel, the brake is an impulse cap that is ignored while engine force ≠ 0, friction slip = μ,
  and `fwd_factor` is 0.5. Master may differ slightly from the build inside 0.21.0, but the
  experiments above ran on 0.21.0 itself.
- **three.js 0.186.1:** fog uses view depth (`vFogDepth = - mvPosition.z`, smoothstep), not
  distance from the camera (F13). WebGL 1 has been refused since r163, so the WebGL 2 check is right.
- **OPL:** I ran pyosmium, which uses the same libosmium OPL writer as osmium-tool, on a
  hand-made way. Without a location index the nodes come out as `n1xy` (F18). Escapes come out as
  `%20%`, `%2c%` and `%25%`, so the text `%2c%%20%` really occurs (F21). I could not install
  osmium-tool itself, so its `cat` command was not run directly.
- **Vite 8.3.4 dev server (in this clone):** `/raw-data/…`, `/research/…`, `/CLAUDE.md` and
  `/.claude/settings.json` are all served with status 200. Only `/.git/` gives 403 (F24).
- **Projection:** M and N match the standard formulas. 110,589 m and 110,580 m per degree at
  6.63° N reproduce. The 4 cm corner error holds. The Sutherland–Hodgman citation (CACM 17(1),
  1974) is correct.
- **Hooks:** I read `.claude/hooks/tests-lock.sh`. It refuses a test-writer who changes an
  existing test file (F1).
- **Not tested:** anything in a browser. That means touch on a real phone, real frame rate, and
  WebGL context loss. Bake determinism across different machines was not tested either; the design
  rounds to whole centimetres, which hides last-bit differences in trig.

## FIX list (the exact change for each)

**F1. The cascade cannot pass the hooks as written** (OVERVIEW, place.md, vehicle.md).
`tests-lock.sh` refuses a test-writer who changes an old test file. The coder cannot change tests.
So `tests/place/place.test.ts`, which names `skyPosition` 9 times, and `tests/place/vehicle.test.ts`,
whose `hatch` fixture has no figures, would fail with nobody allowed to fix them.
Change: replace "(the test-writer changes those; the coder may not)" in place.md, and the cascade
line in OVERVIEW, with:

> "Before the test-writer starts, the orchestrator removes, in its own commit, the old tests whose
> meaning changes: every test naming `skyPosition`, and every vehicle test whose fixture lacks the
> new figures. The test-writer writes their replacements in new test files, which fail first. The
> coder changes `places/finglas.json` and `places/yaba.json`."

**F2. Steering is reversed** (car.md `driveCar`). Rapier turns left for a positive angle, but
`steer` +1 means right. Change step c to: "front wheel angle = **minus** fraction times
steeringLimitRad (Rapier turns the car left for a positive angle; measured on 0.21.0)". The same
sign applies when the wheels are drawn in `updateCarModel`, which reads the angle back from the
controller, so nothing else changes.

**F3. The turning-circle formula is for the wrong wheel** (rapier-settings.md
`maxSteerAngleRad`, vehicle.md `turningProblemInVehicle`). The published kerb-to-kerb circle is
traced by the outer wheel, not the middle of the front axle.
- rapier-settings.md: change the formula line and the step to "arcsine of wheelbase over (half the
  turning circle minus half the track)".
- vehicle.md: change the check to "is half the turning circle minus half the track longer than the
  wheelbase". Change the message to "…is too tight for a Y m wheelbase and Z m track…".

This takes the car from 12.2 m to 10.6 m against the published 10.2 m. Also add a test: at full
lock and walking pace, the turning circle is within ±10 % of the published one.

**F4. Driving figures are only needed by a car that has driving physics** (vehicle.md). Change
"Every vehicle file needs these figures for now" to: "The figure groups and `figureSources` are
required when `dynamics` is `wheeled`, and refused otherwise. Only wheeled physics exists; a bike,
boat or plane would otherwise need an invented tyre friction or turning circle, which breaks the
data rule." Then `sizeProblemsInVehicle`, `turningProblemInVehicle` and `figureSourceProblems`
run only for wheeled vehicles.

**F5. Centre-of-mass frame** (rapier-settings.md `chassisMassProperties`). Change the return
step to: "return … the centre of mass **given in the box collider's own frame: minus the box's
offset**, so it lands at the body's origin". Rapier reads it in the collider's frame. I measured
`localCom` at y 0.3 instead of 0 when the offset was not subtracted. Getting this wrong puts the
centre of mass mid-box, about 0.9 m up, and the car rolls over easily.

**F6. Forward speed** (car.md `driveCar` step a). Change it to "forward speed = the body's velocity
along the car's forward axis". `currentVehicleSpeed()` is the whole speed with a sign, so a car
sliding sideways reads as fast forward or backward. `pedalCommand` would then refuse to reverse
until the slide stops, and the power limit would use the wrong speed.

**F7. The start is half off a one-way road** (start.md `carStartOnRoad`, chunk-text.md
`indexFileText`, car.md `carStartPose`). The bake moves the car half a lane to the right of the
centre line. On a one-way 3.5 m street that puts the car's middle on the road's edge.
- start.md and `indexFileText`: the start also records `roadWidthM` and `oneWay` (yes or no).
- car.md `carStartPose`: "on a two-way road, move the start a quarter of the road's width to the
  driving side; on a one-way road, do not move it". Lane width is then read only by the bake.
- chunk-text.md: write the start's east and north rounded to whole centimetres, as every other
  baked number is (determinism).
- chunk.md `validateChunkIndex`: `roadWidthM` above 0 and `oneWay` true or false.

**F8. Flip upright, as the orchestrator decided** (actions.md, car.md, loop.md, touch.md).
- Rename the action `putBack` to `flipUpright`. Split `putCarBack` into `flipCarUpright` (here)
  and `returnCarToStart` (rescue), so the names say what each does and there is no mode flag.
- `flipCarUpright` has three more rules:
  - "heading = the car's forward axis flattened onto the ground; if that is shorter than 0.1 (car
    on its nose or tail), use the car's right axis turned a quarter instead";
  - "the position is kept at least 3 m inside the map's edge, so the car is never put inside a wall";
  - "the pose-before kept for drawing is set to the new pose too" (see F17).
- The touch button's label is "Flip upright". The notice is "Flipped upright.", the same word as
  the button.

**F9. Browser shortcuts** (keyboard.md `holdKey`). Change the first check to "is it one of the
driving keys, **with no Ctrl, Cmd or Alt held**". Today Cmd+R / Ctrl+R would be swallowed and flip
the car instead of reloading, even though the design itself promises "reload keeps its meaning".

**F10. A browser without gamepads** (gamepad.md `gamepadActions`). Add: "if the browser has no
`getGamepads`, or it throws, return noActions". Some browsers hide it on plain `http://`, which is
how the phone opens the dev link. Without this, `readActions` throws every frame (see F17).

**F11. Two thumbs at once** (touch.md):
- **Sliding between pedals.** `fingerMoved`: "if a button finger is now over the *other* pedal
  (accelerate ↔ brake), it holds that pedal instead; off every button it keeps what it had; it
  never slides onto Flip upright". `passPointerEvent` finds what is under the finger with
  `document.elementFromPoint`, because pointer capture keeps `target` fixed. As designed, a thumb
  rocked from brake onto accelerate keeps braking, and once stopped the car **reverses** while the
  player's thumb is on "accelerate".
- **Lost fingers.** `listenToTouches` also empties the touch state on `visibilitychange` (hidden)
  and window `blur`, as the keyboard does. `pointercancel` is not guaranteed when a call comes in
  or the app is switched.
- **A thumb that lands near the edge.** `fingerDown`: "the stick's start point is moved inward to
  at least one stick radius from the screen's edges", so full left is always reachable.
- **Long presses.** On the controls layer: `user-select: none`, `-webkit-touch-callout: none`,
  and `contextmenu` prevented. Without these, a held button can select its label text, and the
  selection handles then take the next touch.

**F12. A heading that can vanish** (chase.md `chaseCameraGoal`). Use the same flat-heading
function as F8, with its fallback. A car standing on its nose has no flat forward direction, which
gives a camera at NaN, i.e. a blank screen. Also say the goal uses the **blended** pose (F17),
not the last physics pose.

**F13. Fog pops at the sides of the screen** (scene.md `createScene`, main.md `listenForResize`).
three.js fogs by depth, not distance. On a 20:9 phone held sideways, a square appearing 294 m
away at the screen edge has a depth of only 181 m, so it is just 11 % fogged and pops in.
- `createScene`: "fog is complete at (load radius minus the camera's distance behind) times the
  cosine of half the widest view angle, and starts at half that".
- `listenForResize`: recompute the fog whenever the aspect changes.

The radius stays the owner's performance number. The clear view on a wide phone will be shorter
(about 180 m), which the frame-rate measurement can trade against a bigger radius.

**F14. A download that never ends** (load.md `fetchText`, failure.md `failureMessage`). Add a
branch: "no answer within 30 s (a named constant, owner-choice, proposed) → failure: too slow".
Message: "The game's files are taking too long. The signal may be weak; reload to try again." On
weak Lagos mobile data a stalled request otherwise leaves "Loading the map" on screen forever,
which is the blank-screen story the scope rules out.

**F15. Notices must not eat touches** (failure.md `showNotice`). Add: "the notice strip (and the
measure panel) ignore touches (`pointer-events: none`)". A notice that appears under a thumb
would otherwise swallow the pedal press.

**F16. Roads need normals** (scene.md `roadMeshFromChunk`). Add: "every corner's normal points
straight up". `MeshLambertMaterial` without normals draws the roads black.

**F17. The frame loop** (loop.md):
- `runFrame`: wrap the frame. "If anything throws, showFailure with failureMessage of something
  unexpected, and stop". `startGameSafely` covers only startup; a throw inside a frame stops
  `requestAnimationFrame` and freezes the picture with no message.
- `stepCarPhysics`: "the pose before and the pose now are kept in the game between frames. A frame
  with no step leaves them as they were. A flip or a return to the start sets both to the new pose."
  Otherwise a 120 Hz screen gets no smoothing on its zero-step frames, and a put-back smears
  across the map for one frame.
- `rescueCarIfNeeded` → `runFrame`: after a return to the start, call `updateStreaming` before
  the physics steps, so the start square's ground exists when the car lands there.

**F18. The README's osmium command gives nodes without positions** (cli.md). `osmium cat` has no
location index. The writer option only *writes* locations; it does not add them. Replace the third
step with
`osmium add-locations-to-ways omole-roads.osm.pbf -f opl,add_metadata=false,locations_on_ways=true -o omole-roads.opl`.
In `parseWayLine`, change the message to "…nodes without positions; make the extract with
`osmium add-locations-to-ways` (README)".

**F19. One broken way should not stop the whole map** (opl.md `parseWayLine`, bake.md
`bakePlace`). Real OSM data has the odd one-node way. Change "fewer than two nodes" from a problem
to a **skip with a note in the bake report** ("way id has fewer than two nodes; skipped"). It
cannot be drawn either way, so skipping it creates no false gap. Lines that cannot be read
(no id, nodes without positions, bad escapes) still stop the bake.

**F20. The map's size is not the extract's size** (bake.md, chunk-text.md, place.md).
`osmium extract`'s default `complete_ways` keeps every node of a way that crosses the box. A
trunk road can therefore stretch the extent kilometres past 1.5 km, and the ground and walls
follow it. Change:
- place.md: new field `mapHalfSizeM` (a number from 100 to 50,000 m, with `mapHalfSizeSource`
  using the data-rule status; Omole 1500, owner-choice, from Scope 005's "about 1.5 km in every
  direction"). It stays in the place file, so the engine still knows no place.
- bake.md: road pieces are clipped to the square ±`mapHalfSizeM` around the centre.
- `indexFileText`: the extent is that square, rounded out to whole squares.

**F21. OPL escapes** (opl.md `unescapeOplText`). Delete "%% becomes a single %". libosmium has no
such rule: an empty escape is an error, and `%` itself is written `%25%`. The rule would corrupt
real text such as `%2c%%20%` (", "). Replace it with: "one pass left to right. `%`, then 1 to 6
hex digits (either case), then `%`, is that character. Anything else is a broken line, reported
with its number."

**F22. Which roads, how wide** (roads.md):
- `isDrivableRoad`: "the most specific of `motorcar`, `motor_vehicle`, `vehicle`, `access` that is
  present decides; `no` drops the way". This is OSM's access order. `vehicle=no` was missing, and
  `access=no` + `motorcar=yes` was wrongly dropped.
- `laneCount`: "oneway also when `junction=roundabout` and there is no oneway tag" (osm2lanes
  `transform/tags_to_lanes/oneway.rs`, checked). Otherwise every untagged roundabout is drawn
  twice as wide.
- `roadWidthMetres`: also note in the report a `lanes` tag that was present but unusable. The
  file header promises "every way where a limit was used" is listed, but `laneCount` has no way
  to say so.

**F23. Flipped slivers** (chunk-text.md `chunkFileText`). Change the check to "is any triangle
now flat **or turned over** (its area after rounding is 0 or less)". Rounding can flip a thin
sliver, and the chunk format promises anticlockwise triangles.

**F24. The dev server shows private files on the Wi-Fi** (data-files.md). Add: "the dev server
refuses `raw-data/`, `research/`, `docs/`, `tests/`, `.claude/` and `CLAUDE.md`
(`server.fs.deny` in `vite.config.ts`), and serves the same data files the build ships, plus
`src/`." With `--host`, anyone on the same network can read all of these today (measured: status
200). The README should also say to run it only on a home network.

## ESCALATE (owner)

**E1. How fast should the car pick up speed?** (`forwardDriveForceN`)
*Why the game needs it:* the car should feel like the real small hatchback. The design pulls with
peak power at every speed, as if the car had a perfect gearbox. In reality you change gear, the
engine is not always at its best revs, and each change takes a moment.
*What I measured:* with typical figures it reaches 100 km/h in about 10 s against about 13 s in
the brochure. That is roughly 25 % quicker, so the design's own ±15 % test would fail, and the
coder is not allowed to loosen it. It is like a footballer who sprints at top speed from the first
step.
*Choices:*
- (a) Model the real gears. All the ratios are on the maker's sheet (official); add a short pause
  per gear change (your choice, proposed 0.3 s). This is honest physics, and later the sound can
  follow the gears. It costs a little more code and one more owner number.
- (b) Keep the simple model and add one "usable power" figure, fitted so 0–100 matches the
  brochure (derived, weakness named). It is simple, but the 0–100 test then checks a number we
  tuned to pass it.

*Recommendation: (a).*

**E2. What should Flip upright do when the car is upright and moving?**
*Why the game needs it:* as decided, it rights the car where it is and stops it. Pressed at
60 km/h by a thumb that slipped off the pedals, it stops the car dead. That is a jarring surprise,
and later a free emergency stop in timed deliveries.
*Choices:*
- (a) Always works. Simplest, but it can surprise the player and gives a free stop.
- (b) Works only when the car is nearly stopped (under about 5 km/h) or tipped more than about
  45°. Otherwise it shows "Flip upright works when the car has stopped or tipped over."

*Recommendation: (b).*

**E3. Phone held upright or sideways?**
*Why the game needs it:* the scope does not say. Held upright, the stick area is about 180 px
wide and the view is narrow. Held sideways, it plays like most phone driving games.
*Choices:*
- (a) Works both ways, with a one-line hint in portrait: "Turn your phone sideways for a wider
  view."
- (b) Require sideways, with a "turn your phone" screen. Clearer, but a hard stop for someone who
  just wants a quick look.

*Recommendation: (a).*

## Notes (no change needed)

- **Colliders differ from the scope's wording.** The scope says the road ribbons double as
  colliders; research/36 §2.7 and `addGroundCollider` use one flat ground collider per square.
  On flat ground this is identical for the player, and it follows D-0008's "a collider per cell".
  I accept it as common sense; it is listed so the owner sees it.
- **Things the test-writer should cover**, all from the work above: steering direction; turning
  circle; a car standing on its nose (F8, F12); a 120 Hz frame with zero steps (F17); Cmd+R
  (F9); a thumb sliding from brake to accelerate (F11); an untagged roundabout (F22); and
  `%2c%%20%` (F21).
