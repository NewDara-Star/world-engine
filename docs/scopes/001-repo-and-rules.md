# Scope 001: repo and rules

Status: approved by Daramola (owner), 2026-10-10.
Architecture: "Open World Web Game — Architecture V5" (Claude Docs).

## Goal

An empty repo where every working rule is enforced by a file, a hook or a test,
before any game code exists. Nothing is ported from World Drive except its
research notes (already in `research/world-drive/`).

## What this repo is

`world-engine`: a place-agnostic driving engine and game. Real places built
from open data; every place is a data file, not code. First places: Finglas
(Dublin, drives on the left) and Yaba (Lagos, drives on the right). Later:
boats, planes, other countries, possibly other planets. Browser-first (PWA),
three.js + Rapier on the client, Cloudflare Workers + Durable Objects on the
server. Core mode: deliveries in Lagos; the server decides every payout.

## In scope

1. **Tooling:** `package.json` (TypeScript strict, ESM), `tsconfig.json`,
   ESLint, Vitest. Scripts: `typecheck`, `lint`, `test`, `check` (all three).
   Pin exact versions. Node 22.
2. **`CLAUDE.md`**, written in plain words for an owner who is a designer, not
   a coder. Base it on the two references (Spes and World Drive CLAUDE.md, see
   below), keeping what applies. Must cover:
   - Find code before writing code: search GitHub, datasets, write-ups first;
     write findings to `research/` naming the source; techniques only, never
     copy GPL code; licences CC0/CC-BY/MIT/Apache only, credited.
   - Compiler first: after a type change run the typecheck and follow its list;
     grep only for untyped edges (baked files, strings, storage keys, protocol).
   - Diagram before code, diagram from code: each scope has a design diagram the
     owner approved; generated diagrams (Scope 002) must match it.
   - Small functions (readable as a diagram); names say what things are; delete
     dead code; one source of truth; fix every cascade.
   - Place-agnostic: nothing about a specific place in engine code. Driving
     side, rules, gravity, units etc. come from place files.
   - Every game commit has a `Story:` paragraph (what the player does, expects,
     sees). Tests on four paths: happy, sad, idiot-proof, tragedy.
   - References at block level (where an idea came from), and the reviewer
     checks cited sources exist. Never invent a reference.
   - Scope discipline: one scope per session; new ideas go to `PARKING_LOT.md`,
     never into the current scope.
   - Server decides every reward; never trust the client.
   - Never touch leaked or proprietary source (e.g. GTA source on the owner's
     machine).
3. **Hooks** in `.claude/settings.json` + `.claude/hooks/`, adapted from Spes:
   compiler gate (`compiler-gate.sh` + `compiled.sh`), checks before commit,
   checks before stop, Story before commit (for changes under `src/`),
   second-model review before push (prompt rewritten for this game: player's
   story, place-agnostic engine, server authority, scope discipline, small
   functions, dead code, four test paths, references real). Keep them POSIX
   `sh` + `jq`; note in a comment that `stat -c` is GNU (Linux) and give a
   macOS-safe fallback.
4. **Hook tests** (`tests/hooks/*.test.ts`): feed each hook fake JSON on stdin
   in a temp git repo and assert it blocks (exit 2 or a deny decision) when it
   should and passes when it shouldn't block. The review hook test only checks
   it skips non-push commands (don't call a model in tests).
5. **Place and vehicle file format** (`src/place/`): TypeScript types plus a
   validator (pure functions, small). Place: id, name, planet, driving side,
   speed units, road-rule set id, gravity (m/s²), air density (kg/m³), sea level
   and sky position (lat/lon on its planet), allowed vehicle classes, data
   sources with licences. Vehicle: id, class (car, bike, boat, plane, …),
   controls layout (wheel position, steering type), dynamics type. Two example
   places in `places/finglas.json` and `places/yaba.json` with real values and
   cited sources; tests prove both validate and that a broken file is rejected
   with a clear message (four paths).
6. **`PARKING_LOT.md`** seeded with: spacecraft/other planets, live racing,
   weather, radio, real-money prizes, math-shader hero assets.
7. **`docs/scopes/`**: this file, plus `TEMPLATE.md` for future scopes (goal,
   in, out, design diagram link, done-when).
8. **`README.md`**: one screen, plain words.

## Out of scope

Rendering, physics, traffic, networking, any game code. The diagram generator
and diagram gate are Scope 002.

## Done when

- `npm run check` passes (typecheck, lint, tests).
- Every hook demonstrably blocks in its test.
- Both places validate; a broken place is rejected with a readable message.
- Committed in small commits with clear messages. Do not push (the
  orchestrating session pushes after review).

## References (read, adapt, don't blindly copy)

- Spes workflow: `/home/claude/ref/spes/` (CLAUDE.md, .claude/settings.json,
  .claude/hooks/*.sh).
- World Drive rules: `/home/claude/ref/world-drive-CLAUDE.md`.
- World Drive research: `research/world-drive/` (28 notes).
