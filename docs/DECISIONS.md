# Decisions

Every decision the owner has made, one entry each, newest last. Read this
before acting; never contradict an entry without the owner (CLAUDE.md, "How
a change is built"). Entries are added only by the orchestrator, from the
note-taker's candidates in `docs/decisions-inbox.md` (docs/roles/note-taker.md).

Each entry has the same fields, in this order, so a script can read them:
`Date`, `Decision` (one line), `Why`, `Decided by` (owner, or orchestrator for
common sense), `Tags`, and `Replaces` when it overrides an older entry.

D-0001 to D-0028 were backfilled on 2026-10-11 from the orchestrator's handover
(Scope 004 item 3). Where the handover gave no reason, `Why` says so
rather than guess one.

## D-0001

- Date: 2026-10-10
- Decision: The engine is place-agnostic: every place, vehicle and planet is a data file, and nothing place-specific is in engine code.
- Why: Lagos and Dublin first, other countries and planets later, without rewriting the engine.
- Decided by: owner
- Tags: engine, places, vehicles

## D-0002

- Date: 2026-10-10
- Decision: Browser-first PWA: three.js and Rapier on the client, Cloudflare Workers and Durable Objects on the server.
- Why: No install, and it works on phones.
- Decided by: owner
- Tags: platform, server

## D-0003

- Date: 2026-10-10
- Decision: The first real place is the owner's home street, Babatunde Ladega Street, Omole Phase 1, Lagos, 1 to 2 km around it.
- Why: A place the owner knows street by street.
- Decided by: owner
- Tags: places, roadmap

## D-0004

- Date: 2026-10-10
- Decision: The core loop is deliveries in Lagos, paid only by the server.
- Why: Trust: no cheating from the phone.
- Decided by: owner
- Tags: gameplay, money, server

## D-0005

- Date: 2026-10-10
- Decision: Server authority: samples stream live and are timed by the server clock; the server assigns jobs; earnings have caps; pin guesses are rate-limited per device and per IP.
- Why: The phone cannot be trusted with anything that pays.
- Decided by: owner
- Tags: server, money, cheating

## D-0006

- Date: 2026-10-10
- Decision: The reference device is a mid-range Android phone; under about 30 MB downloads before you can drive; a steering wheel is a desktop bonus.
- Why: Not recorded in the handover.
- Decided by: owner
- Tags: device, performance, controls

## D-0007

- Date: 2026-10-10
- Decision: Slice order: street, then a server-paid grey-box delivery with a cheat test, traffic and lights, buildings, shared world, economy, first hunt.
- Why: Not recorded in the handover.
- Decided by: owner
- Tags: roadmap

## D-0008

- Date: 2026-10-10
- Decision: The world streams in plain 100 m grid chunks (a visual piece and a collider per cell), not 3D Tiles.
- Why: Simpler, and enough for 1 to 2 km.
- Decided by: owner
- Tags: streaming, engine

## D-0009

- Date: 2026-10-10
- Decision: Physics constants are fixed per place from real data (gravity from WGS84, air density from climate normals); live weather is visual only.
- Why: Not recorded in the handover.
- Decided by: owner
- Tags: physics, places, data

## D-0010

- Date: 2026-10-10
- Decision: The data rule: an official figure; else one derived from real measurements, with source and weaknesses named; else the owner's creative call, recorded as his. Never a silent guess.
- Why: Never invent numbers; every number can be traced.
- Decided by: owner
- Tags: data, process

## D-0011

- Date: 2026-10-10
- Decision: Licences: CC0, MIT, Apache, or attribution-only (CC-BY, ODbL, Copernicus), with every credit on the game's About page only; Google Open Buildings under ODbL; techniques only from anything else, never GPL code.
- Why: Not recorded in the handover.
- Decided by: owner
- Tags: licences, legal, data

## D-0012

- Date: 2026-10-10
- Decision: Never use the leaked GTA source on the owner's Mac, for anything.
- Why: Not recorded in the handover.
- Decided by: owner
- Tags: legal

## D-0013

- Date: 2026-10-10
- Decision: Diagram first: every function has an approved design before code; the diagram gate blocks everywhere, no exceptions.
- Why: Not recorded in the handover.
- Decided by: owner
- Tags: process, design

## D-0014

- Date: 2026-10-10
- Decision: Lint judges a function by complexity (8) and nesting depth (3), not by length.
- Why: Not recorded in the handover.
- Decided by: owner
- Tags: process, lint

## D-0015

- Date: 2026-10-10
- Decision: Push review: three Sonnet lenses (story, rules, tests) plus a design-match lens; one Opus review for a big or risky push (over 400 lines, money or trust, the rules, Scope-complete).
- Why: Not recorded in the handover.
- Decided by: owner
- Tags: process, review

## D-0016

- Date: 2026-10-10
- Decision: TypeScript stays at 6.0.3; a weekly scheduled task watches for TS7 lint support.
- Why: Lint support for TypeScript 7 is not there yet; the weekly task watches for it.
- Decided by: owner
- Tags: tooling

## D-0017

- Date: 2026-10-10
- Decision: Cars are invented makes and models; danfo, BRT and double-decker forms in our own liveries.
- Why: Not recorded in the handover.
- Decided by: owner
- Tags: vehicles, legal

## D-0018

- Date: 2026-10-10
- Decision: Economy: coins can be bought (packs from about £2.99) but never cashed out; money only saves time, never wins; in-game prizes only for now.
- Why: Not recorded in the handover.
- Decided by: owner
- Tags: economy, money

## D-0019

- Date: 2026-10-10
- Decision: Ads later: billboards, sponsored or charter runs, optional rewarded ads; nothing interrupts driving. Radio later, after a legal check. Payments decided before the economy slice.
- Why: Not recorded in the handover.
- Decided by: owner
- Tags: economy, ads, roadmap

## D-0020

- Date: 2026-10-10
- Decision: Landmarks near home to include: Fasta International School, St. Jude's Church, Foursquare Church.
- Why: Not recorded in the handover.
- Decided by: owner
- Tags: places, landmarks

## D-0021

- Date: 2026-10-10
- Decision: A site whose robots.txt disallows us is never fetched by any route; the owner is given the link instead.
- Why: Not recorded in the handover.
- Decided by: owner
- Tags: research, legal

## D-0022

- Date: 2026-10-10
- Decision: Only the owner pushes; sessions never push.
- Why: The owner keeps control of what reaches GitHub; the cloud sessions also have no push access.
- Decided by: owner
- Tags: process

## D-0023

- Date: 2026-10-10
- Decision: The art style is found by trying looks side by side (clay diorama, painted real, toy realism) before the buildings slice.
- Why: Not recorded in the handover.
- Decided by: owner
- Tags: art, roadmap

## D-0024

- Date: 2026-10-11
- Decision: Design approvals are delegated to a fresh approver session (docs/roles/approver.md); it decides common sense itself and brings the owner only real product trade-offs, with pros and cons.
- Why: Replaces the earlier rule, from before this log, that the owner approves every design. Further reason not recorded in the handover.
- Decided by: owner
- Tags: process, design, approvals

## D-0025

- Date: 2026-10-11
- Decision: The place checker reports every mistake in one pass, with file and line, "did you mean", units, and found versus needed; exactly one source per physics constant; a field written twice is reported.
- Why: Place files will be written by non-coders (the owner, later partners or players), so the checker must say exactly where and what to fix, in one round.
- Decided by: owner
- Tags: places, tooling

## D-0026

- Date: 2026-10-11
- Decision: Anything doable on a wheel, a gamepad or a keyboard is doable on a touchscreen, simplified where two thumbs need it.
- Why: The phone is the reference device, so no action may need a wheel, gamepad or keyboard.
- Decided by: owner
- Tags: controls, device

## D-0027

- Date: 2026-10-11
- Decision: Physics ranges are set per planet, in planet files (Scope 002c).
- Why: A wide fixed range (0 to 100 m/s²) let a slipped digit like 98 through; real per-planet ranges catch it without blocking Mars later.
- Decided by: owner
- Tags: physics, places

## D-0028

- Date: 2026-10-11
- Decision: Tests are written blind by a separate session and fail first; an Opus coder cannot change them; decisions live in docs/DECISIONS.md (Scope 004).
- Why: See Scope 004, "Why the game needs it": the session that writes code should not mark its own homework, and decisions spread across chats get lost.
- Decided by: owner
- Tags: process, tests, decisions

## D-0029

- Date: 2026-10-11
- Decision: Common-sense recommendations (one clearly right answer) are decided by the approver or orchestrator and listed; only real product trade-offs, with pros and cons, go to the owner.
- Why: The owner's time goes to product decisions, not to fixes nobody would argue with.
- Decided by: owner
- Tags: process, approvals

## D-0030

- Date: 2026-10-11
- Decision: 3D models are made with Meshy on a paid plan (owned, private, commercial use), props and landmarks first; Hunyuan3D-2 is not used; Tripo is not needed as well.
- Why: Hunyuan3D-2's licence excludes the EU and UK, where the owner lives and ships; Meshy's free-plan models need a CC-BY credit, the paid plan's do not; cars wait for Scope 003's answer.
- Decided by: owner (on the orchestrator's recommendation)
- Tags: art, assets, licences

## D-0031

- Date: 2026-10-11
- Decision: Never feed a 3D generator a photo of a real car; inputs are our own sketches or invented designs.
- Why: Generators copy brand shapes and badges, which breaks D-0017 (invented makes and models).
- Decided by: orchestrator
- Tags: art, assets, vehicles

## D-0032

- Date: 2026-10-11
- Decision: Sat nav voices are local to each place and set in the place file (Dublin voice in Finglas, Lagos voice in Omole, mission-control radio on Mars); generated voices are fine with a commercial licence; the owner judges the accent; never a copy of a real person's voice.
- Why: The place should sound like itself; the engine stays place-agnostic.
- Decided by: owner
- Tags: audio, places

## D-0033

- Date: 2026-10-11
- Decision: Game sounds come from open libraries (CC0 or CC-BY, credited on the About page) and generated effects; no field recording in Lagos is needed.
- Why: The owner is in Dublin with nobody recording in Lagos.
- Decided by: owner
- Tags: audio, licences

## D-0034

- Date: 2026-10-11
- Decision: If maths shapes win (Scope 003), the mesh-to-maths tool is trained on every kind of asset, each family practised on its own, marked on the shape drawn.
- Why: Buildings, props and landmarks benefit as much as cars.
- Decided by: owner
- Tags: art, assets, research

## D-0035

- Date: 2026-10-11
- Decision: Speed tests compare how time grows with size, not a fixed wall-clock limit, plus a generous cap.
- Why: The 1-second test failed on unchanged code when the build machine slowed; it measured the machine, not the code.
- Decided by: orchestrator
- Tags: tests
