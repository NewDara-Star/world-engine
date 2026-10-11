# tools/site/data-files.ts

Status: draft

New in scope 005 (item 4). The game fetches its data (place, planet, car,
map squares) as files at run time, so they are not baked into the
JavaScript. Vite serves the repo's files in development; for the built game,
`vite.config.ts` copies the files this function picks into the build (Vite
plugin API, `generateBundle` / `emitFile`; Vite docs `guide/build.md` opened,
research/36). The pictures drawn from the code will be in
`docs/flows/tools/site/data-files.md`.

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
