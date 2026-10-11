# tools/site/data-files.ts

Status: approved. Judged by the delegated approver (docs/reviews/slice-1-approver.md); its fixes F1 to F24 and the orchestrator's decisions on E1 to E3 applied in one pass.

New in scope 005 (item 4). The game fetches its data (place, planet, car,
map squares) as files at run time, so they are not baked into the
JavaScript. Vite serves the repo's files in development; for the built game,
`vite.config.ts` copies the files this function picks into the build (Vite
plugin API, `generateBundle` / `emitFile`; Vite docs `guide/build.md` opened,
research/36). The pictures drawn from the code will be in
`docs/flows/tools/site/data-files.md`.

The dev server (approver's F24). `npm run dev` serves on the Wi-Fi
(`--host`) so the phone can open it, and Vite 8.3.4 then serves every file in
the repo to anyone on the same network: the approver measured status 200 for
`/raw-data/…`, `/research/…`, `/CLAUDE.md` and `/.claude/settings.json`; only
`/.git/` gave 403. So the dev server refuses `raw-data/`, `research/`,
`docs/`, `tests/`, `.claude/` and `CLAUDE.md` (`server.fs.deny` in
`vite.config.ts`, added to Vite's own default deny list; Vite docs, `server.fs.deny`),
and serves the same data files the build ships (this function) plus `src/`.
The README says to run the dev server only on a home network.

## isShippedDataFile

Why the game needs it: the built game must carry every file the player needs and nothing private: never `raw-data/`, never research or source.

```mermaid
flowchart TD
  s(["isShippedDataFile with a path relative to the repo, forward slashes"])
  a{"is it start.json"}
  y(["return yes"])
  b{"is it planets/name.json, vehicles/name.json or places/name.json"}
  c{"is it places/name/chunks/name.json"}
  n(["return no"])
  s --> a
  a -->|"yes"| y
  a -->|"no"| b
  b -->|"yes"| y
  b -->|"no"| c
  c -->|"yes"| y
  c -->|"no"| n
```
