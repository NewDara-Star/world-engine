# Starting the track chats

Copy one block as the first message of a new chat in the "real world"
project, with the world-engine repo connected. Order (owner, 2026-10-11):

1. **Gameplay** first: the delivery run is the biggest step to a real game.
2. **Assets** second: Meshy is being set up.
3. **Server** after Gameplay has a delivery run to check and pay for.

The first orchestrator chat stays on **World data**. At most four tracks run
at once. Before starting any chat, make sure GitHub is up to date
(`git push` in the world-engine folder).

One-time set-up so the chats can push their own branches: install the Claude
GitHub App on the repo (github.com/apps/claude, Configure, NewDara-Star,
Repository access: world-engine), then connect the repo when starting each
chat.

## Gameplay (track 5)

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

Notes: the Meshy key goes in the cloud environment's settings as a secret
(Pro and Max plans call this a "network secret"), never in the chat. Meshy's
API addresses go on that environment's allowed-domains list; the chat names
them.

## Server (track 6)

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
