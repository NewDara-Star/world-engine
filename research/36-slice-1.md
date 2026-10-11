# 36: Slice 1, drive your street: what others built, what we take

Written 2026-10-11 for Scope 005, item 1, by the design session (step 2 of the
pipeline). Research only; nothing installed into the repo.

**What this session could reach.** The npm registry (metadata, and `npm pack`
tarballs unpacked in the session's scratch folder), and
`raw.githubusercontent.com` (single files from public GitHub repos, by path).
Everything else was refused by the network proxy: github.com pages and
tarballs, `gh api`, wikipedia.org, wiki.openstreetmap.org, osmcode.org,
rapier.rs, threejs.org, vite.dev, w3.org, fmw.gov.ng, eea.europa.eu. So:

- **Opened** means the file itself was read in this session; it is cited by
  repo and path, or by package and version.
- **Search only** means a web search returned the title and a summary, and
  nothing here relies on it beyond saying "the owner should open this".
- Our own earlier notes (`research/world-drive/*.md`, `research/30`) were
  opened and are cited as ours.

## 1. Packages we would depend on (checked on the npm registry today)

| Package | Version to pin | Released | Licence (registry, and the LICENSE file in the tarball) | Why |
|---|---|---|---|---|
| `three` | **0.186.1** | 2026-09-24 | MIT (tarball `LICENSE`: "The MIT License, Copyright © 2010-2026 three.js authors") | Drawing. No dependencies. |
| `@dimforge/rapier3d-compat` | **0.21.0** | 2026-09-25 | Apache-2.0 (tarball `LICENSE`, Apache 2.0 text) | Physics, with the vehicle controller. No dependencies. |
| `vite` | **8.3.4** | 2026-10-08 | MIT | Dev server and build. **Already in our lockfile** at exactly 8.3.4 as Vitest 5.0.3's dependency (`package-lock.json`, `node_modules/vite`), so pinning the same version adds no second copy. Needs Node `^20.19.0 \|\| >=22.12.0`; we run 22.22.0. |
| `@types/three` | **0.186.0** | 2026-09-11 | MIT | Types for three (dev only). **Note:** it depends on `@dimforge/rapier3d-compat ~0.12.0` (for three's add-on examples), so `npm install` will put an old Rapier 0.12 under `node_modules/@types/three/…` as well. It is never imported by our code, so it is never shipped; the coder must import Rapier only from our pinned 0.21.0. |

Looked at and **not** chosen:

| Package | Version | Licence | Why not |
|---|---|---|---|
| `@dimforge/rapier3d` (non-compat) | 0.21.0 | Apache-2.0 | Ships the WebAssembly as a separate 3.08 MB `.wasm` (1.17 MB gzipped, measured on the tarball) instead of base64 inside the JS (`rapier.mjs` 4.34 MB, **1.65 MB gzipped**). Saves about 0.5 MB but needs a Vite WebAssembly plugin. Not worth it while we are far under 30 MB; revisit if the budget tightens. The scope names the compat build. |
| `nipplejs` | 1.0.4 (2026-05-26) | MIT (tarball `package.json` and repo `LICENSE`, "Copyright (c) 2025 Yoann Moinet") | Allowed, and small (21 KB unminified), but its README says multitouch is off in its `static` and `semi` modes, and we need one thumb on the stick while the other holds a pedal. Our stick is three small functions over Pointer Events; we take its techniques (dead zone "threshold", the stick re-centring on release) instead of its API. |
| `fast-xml-parser` | 5.11.2 | MIT, six MIT dependencies, one released yesterday (`strnum` 2.5.1, 2026-10-10) | Only needed if the bake read OSM XML. We read OPL instead (section 2), which needs no parser package. |
| `saxes` | 6.0.0 | ISC | ISC is not on our licence list (CLAUDE.md), and not needed. |
| `osm-pbf-parser` | 2.3.0 | "MIT and LGPL" | LGPL part; last release 2015. |
| `earcut` | 3.2.4 | ISC | Not needed: every piece we triangulate is convex (section 2). ISC not on our list. |
| `proj4` | 2.22.0 | MIT | Not needed for 3 km: a local flat projection is exact to a few centimetres (section 2). |

The game itself adds only `three` and `@dimforge/rapier3d-compat` as runtime
dependencies. Approximate weight before driving: Rapier compat 1.65 MB
gzipped, three's `build/three.module.js` + `three.core.js` about 2.1 MB
unminified before tree-shaking (measure the real built size; section 6).

## 2. OSM roads into flat road ribbons

### Opened

- **osm2streets** (a-b-street/osm2streets, **Apache-2.0**, `LICENSE` opened).
  `osm2streets/src/geometry/general_case.rs` (`trim_to_corners`): for every
  pair of neighbouring roads at a junction, intersect their edge lines, project
  the hit back to each centre line, trim the road there, and make the junction
  polygon from those corners. `osm2streets/src/road.rs`: a road keeps its OSM
  `highway` value and lane specs. This is the right way to get clean junction
  shapes with kerbs and markings; it is more than slice 1 needs (below).
- **osm2lanes** (a-b-street/osm2lanes, **Apache-2.0**, `LICENSE` opened).
  `osm2lanes/src/locale.rs` `travel_width`: a motor lane is 3.5 m by default,
  3.0 m in the UK, 3.35 m in the Netherlands, so lane width is a fact about
  the country, which for us means the place file.
  `osm2lanes/src/transform/tags_to_lanes/counts.rs`: with no `lanes` tag a
  one-way road has one lane and a two-way road one lane each way; a tagged
  total is split evenly between the directions.
- Our own `research/world-drive/28-lane-widths.md` (opened): SUMO reads
  `width` (whole carriageway, excluding footways) and divides by the lane
  count; with no `width`, everyone falls back to lanes × a lane width.
- **osmium-tool** (osmcode/osmium-tool, **GPL-3.0**, `LICENSE.txt` opened).
  We only *run* it on the Mac to cut the extract; we never copy or ship its
  code, so GPL does not reach us. `man/osmium-file-formats.md`: it writes
  OPL, with the options `add_metadata=false` and `locations_on_ways=true`
  ("Add node locations to way nodes").
  `man/osmium-extract.md`: `--bbox LEFT,BOTTOM,RIGHT,TOP`, default strategy
  `complete_ways`.
- **libosmium** (osmcode/libosmium, **BSL-1.0**, `LICENSE` opened),
  `include/osmium/io/detail/opl_parser_functions.hpp`: the OPL reader. A way
  line is `w<id> … T<tags> N<nodes>`; with locations on ways each node is
  `n<id>x<lon>y<lat>`, comma separated; text in tags escapes a character as
  `%<hex code>%` (`opl_parse_escaped`). Technique only.
- **OSM2World** (tordanik/OSM2World, **MIT**, `LICENSE.txt` opened) and
  **Streets GL** (StrandedKitty/streets-gl, **MIT**, `LICENSE` opened):
  licences checked so their road techniques (kerbs, junction meshes) are open
  to us later; no code read this session.

### Search only

- OSM wiki `Key:highway` (wiki.openstreetmap.org, refused here). The search
  summary: `residential` is "roads that serve as an access to housing",
  `unclassified` "the lowest-ranked through roads", `service` "access roads
  to, or within an industrial estate, camp site, business park, car park,
  alleys", `track` "mostly agricultural or forestry uses". **The owner (or
  the orchestrator from his machine) should open
  https://wiki.openstreetmap.org/wiki/Key:highway and confirm the list in
  section 2's "What we take".**
- Federal Ministry of Works, *Highway Manual Part 1: Design, Volume I,
  Geometric Design* (2013): https://fmw.gov.ng/themes/front_end_themes_01/images/uploads_images/1569359724.pdf
  (refused here). This is where an official Nigerian lane width would be.
  **Owner: please open it and look for the lane width table for urban or
  residential streets.**

### What we take (slice 1)

1. **Which roads.** Keep a way when its `highway` is one a car may use:
   `motorway`, `trunk`, `primary`, `secondary`, `tertiary` and their `_link`
   forms, `unclassified`, `residential`, `living_street`, `service`, `road`.
   Drop `track` (farm use), every path type, `construction`, `proposed`,
   `busway`, and areas (`area=yes`). Drop a way tagged `access=no`,
   `motor_vehicle=no` or `motorcar=no`. **Keep `access=private` and
   `access=destination`:** Omole Phase 1 is a gated estate, and its own streets
   may well be tagged private; dropping them could delete the owner's street.
   (Owner question in the report.)
2. **How wide.** A `width` tag in metres wins (`7`, `7 m`, `7.5`; anything
   else, such as feet, is ignored with a note in the bake report). Otherwise
   lanes × the place's lane width, lanes from the `lanes` tag, else 1 for a
   one-way road and 2 for a two-way road (osm2lanes counts).
3. **Shapes.** Each road becomes simple convex pieces: one rectangle per
   segment (between two nodes), and one disc (an octagon) at every node, all
   the road's width. The discs fill the joins on bends, round the ends of
   dead ends, and fill junctions where several roads overlap. Every road is
   the same grey in slice 1, so overlaps cannot be seen. This is our own
   simplification; osm2streets' junction polygons (above) replace it when
   markings or different surfaces arrive (parked).
4. **Junctions that do not flicker.** Flicker is two surfaces at the same
   height fighting in the depth buffer. With the ground flat at 0 m (scope),
   the ground and the roads are drawn first and **do not write depth**, roads
   after ground (three.js `Material.depthWrite = false` and
   `Object3D.renderOrder`); the car is drawn after them as normal. Nothing in
   slice 1 is under the ground, so nothing can show through. No fighting is
   possible at any distance. This stops being enough when terrain or bridges
   arrive (parked with terrain).
5. **Projection.** Metres east and north of the place centre, using the WGS84
   ellipsoid radii of curvature at the centre's latitude (meridian radius M,
   prime-vertical radius N; a = 6378137 m, f = 1/298.257223563, the WGS84
   defining values already used for gravity in `research/30`). At 6.63° N:
   one degree of latitude is 110,589 m and one of longitude 110,580 m (our
   computation, Python, today; 6.63° N is a rough latitude for Omole, to be
  replaced by the real centre). Over ±1.5 km the error from using the
   centre's radii everywhere is about 4 cm at the far corners
   (tan φ · Δφ · distance). The Wikipedia page on Earth radius that gives M
   and N could not be opened here; the formulas are standard geodesy and the
   approver should check them against a source the orchestrator can open.
   Game axes: x east, y up, z **south** (three.js and Rapier are right-handed
   and y-up, so north is −z).
6. **Chunks.** 100 m cells (D-0008). Each convex piece is clipped to each cell
   it touches (Sutherland–Hodgman polygon clipping: clip against each of the
   cell's four edges in turn; a convex piece clipped by a square stays
   convex), then fanned into triangles. Coordinates inside a chunk are
   **centimetres from the cell's south-west corner, as integers** (small
   numbers, short files, and byte-identical output on every machine). One
   JSON file per cell that has road, plus `index.json` listing those cells,
   the centre they were baked for, and where the car starts.
7. **Colliders.** The scope says the ribbons are also the colliders. With the
   ground flat at 0 m and roads flat at 0 m that adds nothing: the car must
   also drive on the verge, so the ground needs a collider anyway, and a road
   collider on top of it is the same plane twice. **We give each cell one flat
   ground collider** (D-0008: "a visual piece and a collider per cell") and
   keep the road triangles for drawing only. Road colliders come back with
   terrain and kerbs. (Reported as a scope correction.)

## 3. A drivable car in Rapier

### Opened

- **Rapier's vehicle controller.** JS wrapper
  `dimforge/rapier.js` `src.ts/control/ray_cast_vehicle_controller.ts` and the
  0.21.0 type file `dist/control/ray_cast_vehicle_controller.d.ts`; the Rust
  source `dimforge/rapier` `src/control/ray_cast_vehicle_controller.rs`
  (Apache-2.0, "ported and modified from Bullet's `btRaycastVehicle`"). What
  its numbers mean, read from the Rust code, which matters for turning real
  car figures into Rapier settings:
  - **Spring and damper are per kilogram of the whole car.** In
    `update_suspension`, force = (stiffness × compression − damping × speed)
    and then `wheel_suspension_force = force * chassis_mass`. So Rapier
    stiffness = real wheel rate ÷ car mass, and the same for damping.
  - **Engine force is newtons per wheel** (`rolling_friction = engine_force * dt`).
  - **Brake is an impulse cap per step** (newton-seconds), not a force:
    `max_impulse = wheel.brake`. So brake = brake force on that wheel × time
    step. Bruno Simon's folio multiplies its brake by the frame time for the
    same reason (`PhysicsVehicle.js:482`).
  - **Friction slip is the tyre's friction coefficient:** the grip limit is
    `wheel_suspension_force * dt * friction_slip`, so friction slip = μ. Its
    default of 10.5 is ten times real grip. Note the forward impulse is
    compared at half weight (`fwd_factor = 0.5`), so driving and braking can
    use up to about twice μ before sliding while cornering is held to μ; we
    say so in the code and check stopping distance against the published one.
  - Defaults (`WheelTuning::default`): stiffness 5.88, compression 0.83,
    relaxation 0.88, travel 5.0 m, side friction stiffness 1.0, friction slip
    10.5, max suspension force 6000 N.
  - API quirk in 0.21.0's types: the forward-axis setter is spelt
    `setIndexForwardAxis` as a property setter; use the default axes
    (up = y) and build the car facing the axis Rapier expects rather than
    relying on that setter.
  - The mass and centre of mass are set with
    `ColliderDesc.setMassProperties(mass, centreOfMass, principalInertia, frame)`
    (0.21.0 `dist/geometry/collider.d.ts`), so the car's real mass and a low
    centre of mass go in directly.
- **Rapier changelog** (`dimforge/rapier.js` `CHANGELOG.md`): the controller
  arrived in 0.12, `sideFrictionStiffness` was added later; the 0.19 entries
  rename inertia methods. The repo's changelog stops at 0.19.3 while npm has
  0.20.0 and 0.21.0, so read the 0.21.0 type files, not the changelog, for
  the API.
- **folio-2025** (brunosimon/folio-2025). Licence unclear: no `LICENSE` or
  `LICENSE.md` at the repo root (both 404), `package.json` says `"ISC"`. So
  **techniques only**, which is all we take. `sources/Game/Physics/PhysicsVehicle.js`:
  Rapier controller with friction slip 0.9, side friction stiffness 3,
  pressing the opposite pedal brakes before it reverses (`reverseBrake`), a
  small brake when no pedal is pressed (`idleBrake`), brake × frame time.
- **Sketchbook** (swift502/Sketchbook, **MIT**, `LICENSE` opened).
  `src/ts/vehicles/Car.ts:241-254`: steering lock shrinks with speed
  (`0.8 / max(1, 0.3 × speed)`), keyboard steering goes through a spring
  simulator. `src/ts/world/World.ts:134-136, 217`: fixed 60 Hz physics with
  cannon's accumulator `step(1/60, frameTime)`; `isOutOfBounds` and
  `outOfBoundsRespawn` (lines 233-259) put a fallen car back at a spawn point
  with zero speed.
- Our `research/world-drive/08-vehicle-physics.md` and
  `12-web-driving-games.md` (opened): what a realistic small hatchback should
  do (0–100 km/h about 10 s, 100–0 km/h in about 37 m) and the "feel" layer
  (filtered camera, fixed time step, input shaping).

### What we take

- Rapier's `DynamicRayCastVehicleController`, four wheels, front-wheel drive
  and steering, as the scope says (not World Drive's own tyre model; that can
  come back later if the stock one is not good enough).
- **Every number in the vehicle file is a real-world figure in SI units**
  (mass, sizes, power, gear ratios, turning circle, stopping distance, drag,
  ride frequency). One small, tested function turns them into Rapier's
  settings using the facts above. The vehicle file never holds a Rapier
  number, so a vehicle file still means something if we change physics
  engines.
- Drive force without a gearbox simulation: the force the engine can give is
  the smaller of first-gear force (peak torque × first gear × final drive ×
  drivetrain efficiency ÷ wheel radius) and power-limited force (peak power ×
  efficiency ÷ speed). Air drag (½ ρ Cd A v², ρ **from the place file**) and
  rolling resistance (Crr × m × g, g from the place) are applied to the
  chassis. Top speed and 0–100 km/h then come out of the physics, and are
  checked against the published figures in a test.
- Pedals: brake while moving forward; when (almost) stopped, holding brake
  reverses; pressing accelerate while rolling backwards brakes first (folio).
- Fixed time step 1/60 s with an accumulator, at most 5 steps a frame, the
  rest of a long pause dropped (Sketchbook, and research 12 item 2).
- If the car falls below the ground or leaves the map, it is put back
  (Sketchbook's out-of-bounds respawn), and the player is told why.

## 4. Touch controls

### Opened

- MDN content (mdn/content on GitHub, CC-BY-SA text, read for facts):
  `web/api/pointer_events/index.md` (each finger has its own `pointerId`;
  `pointercancel`; implicit pointer capture on touch),
  `web/api/element/setpointercapture/index.md`,
  `web/css/reference/properties/touch-action/index.md` (`touch-action: none`
  stops the browser panning and zooming under the thumbs),
  `web/api/keyboardevent/code/index.md` (`code` is the physical key, so
  WASD works on AZERTY keyboards by position),
  `web/api/gamepad_api/using_the_gamepad_api/index.md` (poll
  `navigator.getGamepads()` every frame; buttons have analogue `value` 0–1;
  `mapping === "standard"`),
  `web/api/document/visibilitychange_event/index.md`.
- W3C Gamepad spec source (w3c/gamepad, `gh-pages/index.html`), the standard
  layout table: button 6 bottom-left front (left trigger), 7 bottom-right
  front (right trigger), 3 top of right cluster, axis 0 left stick
  horizontal (negative left).
- nipplejs 1.0.4 README (opened, MIT): options `threshold`, `mode`
  (`dynamic`: the stick appears where the thumb lands), `restJoystick`; the
  multitouch limits quoted in section 1.
- folio-2025 `sources/Game/Inputs/Nipple.js` (techniques only, as above):
  the stick is active only for a single touch that starts on it.

### What we take

- One list of **actions** for every device: steer (−1 to 1), accelerate
  (0 to 1), brake (0 to 1), and "put the car back" (a press). Keyboard,
  touch and gamepad each produce the same actions; they are combined by
  taking the strongest of each (CLAUDE.md touch rule, D-0026).
- Touch: the left half of the screen is the stick zone; the stick appears
  where the left thumb lands (nipplejs `dynamic` mode) and only its sideways
  movement steers. Right side: a large accelerate button at the bottom right,
  brake/reverse beside it, a smaller "put the car back" button above. Each
  finger is tracked by its own `pointerId`, so both thumbs work at once.
  `touch-action: none` on the controls.
- Keyboard: arrows or WASD (by `code`), Space also brakes, R puts the car
  back. When the window loses focus, all keys are let go (a key held during
  alt-tab would otherwise stick).
- Gamepad (the "if simple" part; it is): standard mapping only; left stick
  steers, right trigger accelerates, left trigger brakes, top right-cluster
  button puts the car back.
- Note: the phone opens the dev link over plain `http://` on the Wi-Fi.
  Touch, WebGL and WebAssembly work there; some newer web features need
  `https` (the gamepad among them in some browsers), but the gamepad is a
  desktop bonus used on the Mac's `localhost`, which counts as secure.

## 5. Floating origin for a 3 km world

### Opened and measured

- three.js 0.186.1 `src/renderers/WebGLRenderer.js:2160`:
  `object.modelViewMatrix.multiplyMatrices(camera.matrixWorldInverse, object.matrixWorld)`.
  The camera-relative matrix is made on the CPU in 64-bit JavaScript numbers
  before it goes to the GPU, so drawing does not lose precision far from the
  origin; only the vertex numbers themselves are 32-bit.
- 32-bit float spacing (numpy `spacing`, run today): at 100 m, 0.008 mm; at
  1,500 m, 0.12 mm; at 2,121 m (the corner of a 3 × 3 km square), 0.24 mm.
  Rapier's JS build is 32-bit, so a car near the corner is placed to a
  quarter of a millimetre.

### What we take

**No floating origin in slice 1.** With the origin at the place centre, the
farthest point is about 2.1 km away and precision there is 0.24 mm, far below
anything a player can see or feel. What we do instead costs nothing: the
world's origin is the place centre (not a corner, not 0°,0°), and chunk
geometry is stored relative to its own cell corner, so the GPU never sees a
large number. A tragedy-path test drives the car at the far corner and checks
its position is still precise. A floating origin is needed when a place grows
past about 10 km; that goes to the parking lot, not this slice. (Search-only
lead for that day: the "floating origin" technique, Chris Thorne, 2005.)

## 6. How download size and frame rate are measured

- **Download before driving.** The page has a measuring mode
  (`?measure` in the link). It adds up `transferSize` for the page and every
  file it fetched (Resource Timing, `PerformanceResourceTiming.transferSize`,
  MDN opened) from opening the link to the first frame the car can be driven,
  and shows it on screen with the decoded size beside it. Measured on the
  **built** game (`npm run build`, then `npm run preview -- --host`), never
  the dev server, which sends unbundled, unminified files. First visit only
  (cache cleared): MDN notes `transferSize` is 0 for a cached file, so a
  repeat visit would undercount. The preview server may not compress files,
  while Cloudflare will; the report says which it was, and gives the
  uncompressed figure as the honest upper bound.
- **Frame rate.** In measuring mode the page records the time between frames
  for 60 seconds of driving after the first drivable frame, and shows: median
  frames per second, the slowest 5 % (as frames per second), and how many
  frames took longer than 33 ms (below 30 fps). A designer can read it off the
  phone screen and send a photo.
- **Where.** The owner's phone is the reference. If the session has no phone,
  it measures in desktop Chrome with device emulation (a mid-range Android
  profile) and CPU throttling (Chrome's "mid-tier mobile" setting), and says
  plainly that this is not a phone.

## 7. Where the hatchback's numbers come from (data rule)

The vehicle file stores real figures, each with one source and a status, the
same way a place stores its constants. Plan, quantity by quantity:

| Quantity | Status planned | Source planned |
|---|---|---|
| Mass (kerb), wheelbase, track, peak power | **official** | EU type-approval data as reported under Regulation (EU) 2019/631 in the EEA "Monitoring of CO2 emissions from passenger cars" dataset (fields include masses, wheelbase, track width, engine power; search only, licence to be read). Median of three to five petrol B-segment hatchbacks sold new in the EU and common in Lagos. |
| Length, width, height, wheel radius (from the tyre size), peak torque, gear ratios (first, final, reverse), redline, turning circle, 0–100 km/h, top speed | **official** | The same cars' manufacturer specification sheets or press kits, median. |
| Stopping distance 100–0 km/h | **derived** | Published magazine or testing-body brake tests of the same cars; deceleration = v² ÷ 2d. Weakness: test surfaces and tyres differ. |
| Drag coefficient, frontal area | **official** where the maker publishes Cd; frontal area **derived** as about 0.85 × width × height (weakness: an approximation; source to be found) |
| Tyre friction μ (dry asphalt), rolling resistance coefficient | **derived** | Vehicle-dynamics literature (source to be opened before use; World Drive used μ ≈ 1.0, research 08, without a cited source, so it does not count yet). |
| Ride frequency, damping ratio, suspension travel, centre-of-mass height, front axle load share | **derived** if a published figure is found (front/rear axle loads are on some type-approval documents), otherwise **owner-choice**, recorded as his. |
| Drivetrain efficiency | **derived** from literature, or owner-choice. |

The source cars are named only in the research file and the vehicle file's
sources, never in the game (D-0017). The figures are gathered before the
test-writer starts (the tests check the car against the published 0–100 km/h
and stopping distance), by a session that can open the sources, or by the
owner from his machine where this one cannot.

Check targets the test-writer can use: 0–100 km/h within ±15 % of the
published median; 100–0 km/h stopping distance within ±15 %; top speed within
±10 %; the car at rest on flat ground does not creep.

## 8. Omole's constants (scope item 3)

- **Gravity.** WGS84 normal gravity (Somigliana), the same formula and
  constants as Yaba (`research/30`): 9.78099 m/s² at 6.51° N, 9.78101 at
  6.62–6.63° N, 9.78102 at 6.65° N (computed today). Rounded to Yaba's three
  decimals, **9.781 m/s²** either way: Omole is the same as Yaba.
- **Air density.** Yaba's figure comes from the Lagos/Ikeja station
  (WMO 65201) at Ikeja airport. Omole Phase 1 is a few kilometres north of the
  airport, much closer to it than Yaba is (the exact distance is checked once
  the orchestrator gives the centre; not measured here), so the same
  temperature normal and the same 1.167 kg/m³ apply
  with the same weaknesses (not a NiMet figure; ISO pressure, not measured).
  The station height (40 m) and Omole's ground height differ by a few tens
  of metres at most; at 0.012 % per metre, that is under 0.5 %, below the
  figure's own uncertainty. Not re-measured; the place file says so.
- **Lane width.** Not in Yaba's file today. Needs a source: the FMW Highway
  Manual (section 2, search only). Until someone opens it, this is a
  real gap; see the report.

## Search-only links (not relied on)

- https://wiki.openstreetmap.org/wiki/Key:highway
- https://fmw.gov.ng/themes/front_end_themes_01/images/uploads_images/1569359724.pdf
- https://www.eea.europa.eu/data-and-maps/data/co2-cars-emission-22/folder_contents
- https://sdi.eea.europa.eu/catalogue/api/records/b4044b06-2e6b-4f8e-a6e6-66e0e98bb0dd/attachments/CO2%20from%20cars%20and%20vans_Stastical%20metadata_2025P.pdf
- https://en.wikipedia.org/wiki/Earth_radius (meridian and prime-vertical radii)
