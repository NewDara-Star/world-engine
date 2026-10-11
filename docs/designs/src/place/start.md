# src/place/start.ts

Status: draft

New in scope 005 (item 4). `start.json`, at the top of the repo, says which
place and which vehicle the game opens with, such as
`{"place": "omole", "vehicle": "hatchback"}`. It is data, so the engine
never names a place (CLAUDE.md, "The engine knows no place"); a link can ask
for others with `?place=` and `?vehicle=`. The pictures drawn from the code
will be in `docs/flows/src/place/start.md`.

## validateStartChoice

Why the game needs it: the first file the game reads; if it is wrong, the player is told which line, like any other file.

```mermaid
flowchart TD
  s(["validateStartChoice with the file's name and its text"])
  a(["return validateJsonFile with the name, the text and the start checker: place a short id, vehicle a short id"])
  s --> a
```

## startChoiceFromLink

Why the game needs it: the owner can send a link that opens another place or car without changing any file, and a misspelt link is caught by the file checks that follow, not here.

```mermaid
flowchart TD
  s(["startChoiceFromLink with the checked start file and the link's query text"])
  a["for place, then for vehicle: read its value from the query text"]
  b{"is a link value given, and is it a short id (lower-case letters, digits, dashes)"}
  c["use the link's value for it"]
  d["use start.json's value for it; a link value that is not a short id is ignored and a note is kept to show the player"]
  e(["return the place id, the vehicle id and any notes"])
  s --> a --> b
  b -->|"yes"| c --> a
  b -->|"no"| d --> a
  a -->|"both done"| e
```
