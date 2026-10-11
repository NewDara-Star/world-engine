# Starting the track chats

Copy one block as the first message of a new chat in the "real world"
project, with the world-engine repo connected.

**Order (owner, 2026-10-11): the world and the car first, the game on top.**
Before any gameplay, two things must be true: Omole looks like Omole (your
street recognisable, buildings, ground shape, landmarks) and the car drives
like a real car (and looks like one, not a box). So the active tracks are:

1. **World data**: start a fresh chat (the first one could not push or use
   newly allowed domains). Starter below.
2. **Vehicles and movement**: start now. Car feel first; boats, planes and
   space later, not before the game.
3. **Assets**: start now. The car's body first, then street props.
4. **World look**: start when the buildings and terrain are in.

**Gameplay** and **Server** start when the two conditions above are met. Their
starters are below, ready for then. At most four tracks run at once. Before
starting any chat, make sure GitHub is up to date (`git push`).

One-time set-up so the chats can push their own branches: install the Claude
GitHub App on the repo (github.com/apps/claude, Configure, NewDara-Star,
Repository access: world-engine), then connect the repo when starting each
chat.

## World data (track 1)

```
You are the orchestrator for track 1, World data, of world-engine.
Read docs/TRACKS.md, CLAUDE.md, docs/DECISIONS.md and docs/tracks/ first,
especially docs/tracks/world-data.md (what the first chat did and found).
Work on the branch track/world-data; push it when npm run check passes;
open a pull request into main when something is ready to see.

Goal: Omole looks like Omole. OpenStreetMap has almost no buildings near
Babatunde Ladega Street, so:
1. Fill in buildings from Overture Maps (it includes Google Open Buildings;
   take only the Omole box, about 3 km, with DuckDB over Overture's open S3
   bucket; ODbL), merged with the OpenStreetMap ones without duplicates, and
   use any real heights it has.
2. The real ground shape from Copernicus GLO-30 (tile N06 E003), with roads
   and buildings sitting on it.
3. Landmarks I will point to on the small map: Fasta International School,
   St. Jude's Church, Foursquare Church.
Research first, then build in one session. Tell me if any download address
is blocked, and which domain to allow. End with screenshots and something
I can drive on my link.
```

## Vehicles and movement (track 4)

```
You are the orchestrator for track 4, Vehicles and movement, of world-engine.
Read docs/TRACKS.md, CLAUDE.md, docs/DECISIONS.md and docs/tracks/ first.
Work on the branch track/vehicles; push it when npm run check passes;
open a pull request into main when something is ready to drive.

First job: make the car feel like a real small hatchback on my phone and Mac.
Research first: how good driving games and simulators model cars (tyres and
grip, weight transfer, steering feel, suspension, arcade versus sim
trade-offs), and what open projects and papers exist (licences checked).
Write it to research/. Then drive the current car (src/vehicle, vehicles/
hatchback.json) and list what feels wrong, a short plan in
docs/tracks/vehicles.md for me to approve, then fix it. Physics changes use
the full process (designs, blind tests, approver). Every number has a source
or is my recorded choice; never tune a number just to pass a test.
Boats, planes and space come later; keep the design ready for them (the
medium's numbers come from the place and planet files) but do not build them yet.
End with something I can drive on my link and one line on what to try.
```

## Gameplay (track 5) — after the world and the car are ready

```
You are the orchestrator for track 5, Gameplay, of world-engine.
Read docs/TRACKS.md, CLAUDE.md, docs/DECISIONS.md and docs/tracks/ first.
Work on the branch track/gameplay; push it when npm run check passes;
open a pull request into main when something is ready to play.

First job: a practice delivery run in Omole, no coins yet (the server pays later).
A job appears ("pick up at A, drop at B"), a marker shows on the road and on the
small map, a timer runs, you drive there, and you finish with your time and a rating.
Research first: how other driving games do delivery and taxi jobs, markers,
timers and ratings. Write it to research/, then a short plan in
docs/tracks/gameplay.md for me to approve, then build it in one session.
End with something I can play on my link and one line on what to try.
```

Gameplay owns the controls completely: how they work (stick, buttons, keys,
gamepad, where they sit) and how they connect to the game. Vehicles decides
what the vehicle does with them; Screens owns buttons outside driving.

## Assets (track 3)

```
You are the orchestrator for track 3, Assets, of world-engine.
Read docs/TRACKS.md, CLAUDE.md, docs/DECISIONS.md and docs/tracks/ first.
Work on the branch track/assets; push it when npm run check passes;
open a pull request into main when something is ready to see.

First jobs:
1. Research how open-world and browser games handle 3D model budgets on
   phones (triangle counts, texture sizes, file formats like glTF with
   Draco/meshopt), and how to keep AI-made models in one consistent style.
   Write it to research/.
2. Set up the Meshy API pipeline (I have a paid plan): brief, generate,
   download straight away (Meshy deletes API results after 3 days), cut to
   budget, record source and licence for every model in assets/.
   Never feed Meshy a photo of a real branded car or a real logo.
3. Make a first small set for Lagos streets as a test: a roadside kiosk,
   a yellow danfo body in our own livery, a keke, and a street sign.
Tell me which API key and allowed domains you need. Don't ask me to paste
the key into the chat.
```

Allowed domains the World data chat needs (add them in the cloud
environment's settings before starting it): `copernicus-dem-30m.s3.amazonaws.com`,
`overturemaps-us-west-2.s3.amazonaws.com`, `storage.googleapis.com`.

Notes: the Meshy key goes in the cloud environment's settings as a secret
(Pro and Max plans call this a "network secret"), never in the chat. Meshy's
API addresses go on that environment's allowed-domains list; the chat names
them.

## Server (track 6) — after Gameplay has a delivery run

```
You are the orchestrator for track 6, Server, of world-engine.
Read docs/TRACKS.md, CLAUDE.md, docs/DECISIONS.md and docs/tracks/ first.
Work on the branch track/server; pull requests into main.

First job: the server hands out delivery jobs and confirms a delivery really
happened, from position samples streamed live and timed by the server clock,
on Cloudflare Workers and Durable Objects. Read docs/tracks/gameplay.md and
agree the message format with Gameplay through docs/requests/. This is
money and cheating, so use the full process: designs, blind tests, the
approver. Research first: how other games stop delivery and position cheating.
```

## Any other track

```
You are the orchestrator for track N, <name>, of world-engine.
Read docs/TRACKS.md, CLAUDE.md, docs/DECISIONS.md and docs/tracks/ first.
Work on the branch track/<name>; push it when npm run check passes;
open a pull request into main when something is ready.
First job: research for your track, written to research/, then a short plan
in docs/tracks/<name>.md for me to approve.
```
