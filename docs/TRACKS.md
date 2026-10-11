# Tracks: who builds what

Decided by Daramola (owner), 2026-10-11. The game is built by several
orchestrator chats at once, one per track. This page is the map. Every
track chat reads it first, then CLAUDE.md and docs/DECISIONS.md.

## The rules every track follows

1. **Research before code, every time.** The first thought for any task is
   "has someone already done this?" Look at open projects, published data,
   papers and game write-ups; read their licences; write what you found in
   `research/` with the source named. Only then design, and only then code.
   This applies to small things too, not just big systems.
2. **The engine knows no place, and no planet.** We are building for the
   whole universe: Lagos and Dublin now, Mars, invented planets, other
   galaxies later. Code never names a place, a country, a planet, a unit or
   a side of the road. Those live in data files (places, planets, vehicles).
   If adding somewhere new needs a code change, the code is wrong.
3. **Read everyone's code, change only your own.** Every track may read every
   folder. A track changes only the folders it owns (below). If you need a
   change in someone else's folder, write the request in
   `docs/requests/<track>.md` (what, why, by when) and that track does it.
4. **Shared files change by adding, never by breaking.** The shared core (the
   place, planet and vehicle file formats in `src/place/`, CLAUDE.md,
   docs/DECISIONS.md) may be extended by any track, as long as every existing
   file still loads and `npm run check` passes. Removing or renaming anything
   in the shared core needs the owner.
5. **Everyone knows what the others are doing.** Before starting work, read
   the other tracks' latest notes in `docs/tracks/<track>.md` (each track
   keeps its own short log: what it did, what it is doing next, what it
   needs from others). Update yours at the end of every session.
6. **Every session ends with something the owner can see or play**, on the
   published link, with one line on what to try.
7. **Heavy checks only where mistakes hurt players**: physics, money,
   cheating and saved progress get designs, blind tests and the approver.
   Everything else is built by one session with ordinary tests.
8. **Licences**: CC0, MIT, Apache, or attribution-only (CC-BY, ODbL), credited
   on the About page. Never GPL code, never leaked or proprietary code, never
   a site whose robots.txt says no.

## The tracks

Each entry says what the track is for, what it owns, what it needs from
others, and what it must not do. "Owns" means the folders it may change.

### 1. World data
**For:** getting real data for every part of the world we can: maps (roads,
paths, rails, water), buildings and their heights, the shape of the ground,
coastlines, land use (fields, forest, sand), names of places, and existing
open 3D models of real places where the licence allows. Then turning that
data into the game's map squares, the same way for any place on Earth.
**Owns:** `tools/bake/`, `places/<place>/` (the baked data), `research/` notes
on data sources.
**Needs:** the place format (shared core) to carry anything new it bakes.
**Must not:** decide how things look (that is World look); use data whose
licence we cannot meet (for example Google's photorealistic 3D tiles may not
be stored or baked, so they are out).

### 2. World look
**For:** how the world looks and feels: the art direction (found by trying
looks side by side), materials, lighting, sky, time of day, how buildings,
roads and ground are drawn, and keeping all of it smooth on a mid-range
phone. Writes the style guide every other track follows for anything visible.
**Owns:** the drawing code (`src/world/` drawing, `src/game/scene.ts` and
anything that draws), shaders, `docs/style-guide.md`.
**Needs:** World data's baked squares; Assets' models.
**Must not:** change what the data says (where a building is), only how it
is drawn.

### 3. Assets
**For:** every 3D model the game uses that is not built from map data:
vehicles' bodies, props (kiosks, signs, bins, trees), landmark pieces,
characters later. Made with Meshy (paid plan, so we own them) or by maths
shapes (Scope 003), cut down to the phone's budget, named, with source and
licence recorded. Follows World look's style guide.
**Owns:** `assets/` (models, their source and licence records), the Meshy
scripts, the asset budget checks.
**Must not:** feed a generator a photo of a real branded car or a real
logo; keep a model without its licence record; ship one over budget.

### 4. Vehicles and movement
**For:** how everything moves, in every medium: on land (cars, danfo, BRT,
bikes, keke, okada), on water (boats: buoyancy and drag in water), in the air
(planes, helicopters: lift and thrust), and in space later (thrust, no air).
Physics comes from published figures and the medium's own numbers (gravity,
air density, water density), read from the place and planet files, never
assumed. Research how real simulators and games do each kind before coding.
Grey boxes are fine while the physics is right; Assets makes them pretty.
**Owns:** `src/vehicle/`, `vehicles/` (vehicle files), the vehicle research.
**Needs:** the medium's numbers in the planet and place files (shared core:
add water density, etc.); Controls from Gameplay.
**Must not:** tune a number to pass a test; every figure has a source or is
the owner's recorded choice.

### 5. Gameplay
**For:** what the player does: delivery jobs (pick up, drop off, timer,
rating), later the riddle hunts and racing; the on-screen display while
playing; controls on every device (touch can do everything); the camera.
**Owns:** `src/game/` (except drawing), `src/controls/`, `src/camera/`, the
HUD.
**Needs:** Server for anything that pays or counts as progress.
**Must not:** decide a payout or progress on the phone; that is the server's.

### 6. Server
**For:** everything the server decides: handing out jobs, checking a
delivery really happened from the live samples timed by the server clock,
payouts and earning caps, accounts, rate limits on pin guesses, the cheat
test. Cloudflare Workers and Durable Objects.
**Owns:** `server/` (new), the network protocol file (shared with Gameplay).
**Must not:** trust any number from the phone.

### 7. Traffic and people
**For:** other road users: cars that follow roads, lanes, traffic lights and
the place's road rules, and later pedestrians, okada and keke weaving, and
the feel of each place's driving culture (from the place file, not code).
**Owns:** `src/traffic/` (new).
**Needs:** World data's road network with lanes and junctions; Vehicles.

### 8. Audio
**For:** engine and road sounds following the vehicle, place sounds (from
open libraries and generated, credited), local sat nav voices set in the place
file, radio later.
**Owns:** `src/audio/` (new), `audio/` (sound files with licence records).

### 9. Screens
**For:** everything outside driving: the start screen, the place and universe
picker, settings, the first-time tutorial, the About page built from every
credit, languages (English, Pidgin, Yoruba later).
**Owns:** `src/screens/` (new).

### 10. Economy
**For:** coins, prices, buying coin packs, ads (never interrupting driving),
payments (decided before this slice starts). Coins only save time, never win.
**Owns:** `src/economy/` and `server/economy/` (new), with Server.
**Needs:** Server running; the owner's decisions on payments.

### 11. Shared world
**For:** seeing and meeting other players in the same streets, one Durable
Object per area, and the safety rules that come with people (reporting,
blocking).
**Owns:** `src/shared/` and `server/shared/` (new).
**Needs:** Server and Gameplay.

### 12. Universe and places
**For:** making the game work anywhere: the place, planet and vehicle file
formats (keeper of the shared core, with every track adding to it), new real
places (Finglas, Yaba, any city), invented places and planets (Mars, made-up
worlds, other galaxies) including what their ground, sky, gravity and
atmosphere are, and the picker that takes you between them. Checks that no
code anywhere names a place or planet.
**Owns:** `src/place/`, `places/*.json`, `planets/`, the place-agnostic checks.
**Must not:** remove or rename anything other tracks rely on without the
owner.

### 13. Platform
**For:** publishing (Cloudflare), installing on a phone (PWA, offline cache),
measuring speed and download size on the reference phone, the checks and
hooks every track uses, and keeping the build fast.
**Owns:** `tools/site/`, `.claude/`, build and deploy config, `tests/hooks/`.

## Which tracks are active

At most four at once, because the owner tests every track on his phone and
makes the product calls.

- **Active now:** 1 World data, 3 Assets, 5 Gameplay, 6 Server.
- **Next:** 2 World look, 4 Vehicles and movement, 7 Traffic and people.
- **Later:** 8 Audio, 9 Screens, 10 Economy, 11 Shared world,
  12 Universe and places, 13 Platform. Until 12 and 13 start, the World data
  chat keeps the shared core and this chat (the first orchestrator) keeps
  the platform.

When a track finishes its current work, the next one in line starts in its
place. The owner decides the order.

## Branches and merging (owner, 2026-10-11)

- Each track works and pushes on its **own branch**, never on `main`:
  `track/world-data`, `track/assets`, `track/gameplay`, `track/server`, and so
  on. A track may push its branch whenever `npm run check` passes.
- When a piece is ready to play, the track brings its branch up to date with
  `main` (fixing any clash on its side), then opens a **pull request** on
  GitHub with a plain-words summary and what to try. The owner merges it.
  `main` is what gets published.
- Nobody pushes to `main` directly, and nobody changes another track's
  branch.

## Starting a track chat

Ready-to-paste first messages for each track: `docs/tracks/STARTERS.md`.

1. Open a new chat in the "real world" project; connect the world-engine repo
   if offered, so it can pull and push itself.
2. Tell it: "You are the orchestrator for track N, <name>. Read docs/TRACKS.md,
   CLAUDE.md, docs/DECISIONS.md and docs/tracks/ first."
3. Its first job is research for its track, written to `research/`, then a
   short plan in `docs/tracks/<track>.md` for the owner to say yes to.
