# src/game/hud.ts

Status: approved by the orchestrator in one pass (Scope 005b, the owner's lighter process for non-physics work, 2026-10-11).

New in scope 005b (items 2 and 3). The street-name line and the small map on
the page: filled when the street file arrives, placed clear of the thumb
controls, redrawn ten times a second, made bigger or smaller with a tap. The
rules live in `src/world/streets.md` (which street), `hud-layout.md` (where)
and `minimap.md` (what is drawn); this joins them to the page. Browser
plumbing (MDN): `getBoundingClientRect`, canvas `getContext("2d")`,
`setTransform`, the `click` event, `devicePixelRatio`. The pictures drawn
from the code will be in `docs/flows/src/game/hud.md`.

Ten times a second (every 100 ms) is the owner's choice, proposed by the
coder on 2026-10-11, to be confirmed by the frame-rate measurement on the
phone. The canvas is drawn at most two pixels per CSS pixel, as the 3D
picture is (`scene.md`).

On the page (`index.html`): the name line is at the top middle, white on
dark, one line, cut with … if too long, and ignores touches so a thumb on it
still steers. The notice and the portrait hint move into the left half,
under the name (the notice 52 px down, the hint 150 px), so they never cover
the map on the right; found driving upright, where the centred hint hid the
car arrow. Both still ignore touches.

## streetsArrived

Why the game needs it: the names follow without holding up the drive; if they cannot load, the game drives on without them and the player is told why, once.

```mermaid
flowchart TD
  s(["streetsArrived with the game and what loading the streets gave"])
  a{"did it load"}
  b["keep the streets in the game"]
  c(["placeHud, so the map appears"])
  d["mark the streets failed in the game"]
  e(["placeHud, so the map stays hidden; showNotice with streetsFailureNotice"])
  s --> a
  a -->|"yes"| b --> c
  a -->|"no"| d --> e
```

## streetsFailureNotice

Why the game needs it: one line in words a non-coder understands; an old bake, which has no street file, gets the fix.

```mermaid
flowchart TD
  s(["streetsFailureNotice for a failure"])
  a{"was the file missing"}
  b(["return: No street names or small map: this map was made before they existed. Bake it again to get them."])
  c{"was it made for something else"}
  d["reason = its first problem"]
  e["reason = the first line of failureMessage"]
  f(["return: No street names or small map: and the reason"])
  s --> a
  a -->|"yes"| b
  a -->|"no"| c
  c -->|"yes"| d --> f
  c -->|"no"| e --> f
```

## placeHud

Why the game needs it: the map is placed again whenever the screen turns, the controls appear, the player taps it or the streets arrive, so it never covers a control.

```mermaid
flowchart TD
  s(["placeHud for the game"])
  a["the controls' boxes from the page: none if the controls are hidden, else the steering half and every button"]
  b["box = miniMapBox for the screen, those boxes, and the big or small size; none if the streets have not loaded"]
  c["keep the box; ask for a fresh drawing"]
  d{"is there a box"}
  e(["hide the map"])
  f(["show it there, its canvas sharp for the screen (at most 2 pixels per CSS pixel)"])
  s --> a --> b --> c --> d
  d -->|"no"| e
  d -->|"yes"| f
```

## listenToMiniMapTaps

Why the game needs it: a tap makes the map bigger or smaller (scope item 3).

```mermaid
flowchart TD
  s(["listenToMiniMapTaps for the game"])
  a(["on a tap on the map, run the inner function"])
  s --> a
```

## listenToMiniMapTaps > inner function 1

Why the game needs it: the same tap swaps both ways.

```mermaid
flowchart TD
  s(["on a tap"])
  a["swap between big and small"]
  b(["placeHud"])
  s --> a --> b
```

## updateHud

Why the game needs it: the name says which street the car is on, held for a moment before it changes, and the map follows the car.

```mermaid
flowchart TD
  s(["updateHud with the game, the car's point and the time now"])
  a{"have the streets loaded"}
  z(["return"])
  b{"was it drawn less than 100 ms ago"}
  c["note the time"]
  d["the name hold = streetNameAfter with nearestStreetName for the car's point"]
  e["write the name on screen; hide the line when there is none"]
  f{"is the map shown, and can it be drawn on"}
  g(["drawMiniMap around the car, with its heading from headingFromFlat of flatHeading"])
  s --> a
  a -->|"no"| z
  a -->|"yes"| b
  b -->|"yes"| z
  b -->|"no"| c --> d --> e --> f
  f -->|"no"| z
  f -->|"yes"| g
```
