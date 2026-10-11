# Decisions to backfill into docs/DECISIONS.md

Supplied by the orchestrator (Scope 004 item 3), from its handover. Each was
decided by the owner unless marked. Delete this file once DECISIONS.md holds
them.

2026-10-10
- Engine is place-agnostic: every place, vehicle and planet is a data file; nothing place-specific in engine code. Why: Lagos and Dublin first, other countries and planets later.
- Browser-first PWA: three.js + Rapier client; Cloudflare Workers + Durable Objects server. Why: no install, works on phones.
- First real place: the owner's home street, Babatunde Ladiga Street, Omole Phase 1, Lagos, 1–2 km radius. Why: a place he knows street by street.
- Core loop: deliveries in Lagos, paid only by the server. Why: trust; no cheating from the phone.
- Server authority: samples streamed live and timed by the server clock; server assigns jobs; earning caps; pin guesses rate-limited per device and IP.
- Reference device: a mid-range Android phone; under about 30 MB before you can drive; a steering wheel is a desktop bonus.
- Slice order: street → server-paid grey-box delivery with a cheat test → traffic and lights → buildings → shared world → economy → first hunt.
- Streaming: plain 100 m grid chunks (visual piece + collider), not 3D Tiles. Why: simpler, enough for 1–2 km.
- Physics constants fixed per place from real data (gravity WGS84; air density from climate normals). Live weather is visual only.
- Data rule: official figure, else derived from real measurements with source and weaknesses named, else the owner's creative call recorded as his. Never a silent guess.
- Licences: CC0, MIT, Apache, or attribution-only (CC-BY, ODbL, Copernicus); all credits on the game's About page only. Google Open Buildings under ODbL. Techniques only from anything else; never GPL code.
- Never use the leaked GTA source on the owner's Mac, for anything.
- Diagram first: every function has a design approved before code; the diagram gate blocks everywhere, no exceptions.
- Lint judges functions by complexity (8) and nesting depth (3), not length.
- Push review: three Sonnet lenses plus a design-match lens; one Opus review for big or risky pushes (over 400 lines, money or trust, the rules, Scope-complete).
- TypeScript stays at 6.0.3; a weekly scheduled task watches for TS7 linting support.
- Cars are invented makes and models; danfo, BRT and double-decker forms in our own liveries.
- Economy: coins can be bought (packs from about £2.99), never cashed out; money only saves time, never wins; in-game prizes only for now.
- Ads later: billboards, sponsored or charter runs, optional rewarded ads; nothing interrupts driving. Radio later, after a legal check. Payments decided before the economy slice.
- Landmarks near home to include: Fasta International School, St. Jude's Church, Foursquare Church.
- Robots-disallowed sites are never fetched by any route; the owner is given the link instead.
- Only the owner pushes; sessions never push.
- Art style found by trying looks side by side (clay diorama, painted real, toy realism) before the buildings slice.

2026-10-11
- Design approvals are delegated to a fresh approver session; it decides common sense itself and brings the owner only real product trade-offs, with pros and cons. Replaces "the owner approves every design".
- Place checker: every mistake in one pass, with file and line, "did you mean", units, found vs needed; exactly one source per physics constant; a field written twice is reported.
- Controls: anything doable on a wheel, gamepad or keyboard is doable on a touchscreen, simplified where two thumbs need it.

2026-10-12
- Physics ranges are set per planet in planet files (Scope 002c).
- Tests are written blind by a separate session and fail first; an Opus coder cannot change them; decisions live in docs/DECISIONS.md (Scope 004).
