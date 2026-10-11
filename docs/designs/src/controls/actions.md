# src/controls/actions.ts

Status: draft

New in scope 005 (item 6). One control model for every device (CLAUDE.md
touch rule; D-0026): every device produces the same four actions, and the car
only ever sees actions, never keys or thumbs. The actions: `steer` from −1
(full left) to 1 (full right), `accelerate` from 0 to 1, `brake` from 0 to 1
(brake, or reverse when stopped; `pedals.ts`), and `putBack`, pressed or not
(put the car back on its wheels). The pictures drawn from the code will be in
`docs/flows/src/controls/actions.md`.

The game-feel numbers for all controls live together in `src/controls/feel.ts`
(constants only, each marked "owner-choice, proposed 2026-10-11"): stick dead
zone 0.1 (nipplejs's default `threshold`, research/36), gamepad dead zone 0.1,
stick radius 60 CSS pixels, the stopped speed, the steering rates.

## noActions

Why the game needs it: when nothing is touched, the car is not driven.

```mermaid
flowchart TD
  s(["noActions"])
  a(["return steer 0, accelerate 0, brake 0, putBack no"])
  s --> a
```

## cleanActions

Why the game needs it: a broken reading from a device (a gamepad sending a number out of range, or not a number) must never reach the physics.

```mermaid
flowchart TD
  s(["cleanActions with actions from one device"])
  a["any value that is not a finite number becomes 0"]
  b(["return steer kept from -1 to 1, accelerate and brake kept from 0 to 1, putBack as given"])
  s --> a --> b
```

## strongestActions

Why the game needs it: the player can use keys, a gamepad and the screen at the same time, and the car does what the strongest of them asks, so nothing fights.

```mermaid
flowchart TD
  s(["strongestActions with the actions from every device, each cleaned"])
  a{"is the list empty"}
  b(["return noActions"])
  c["steer: the value furthest from 0; on a tie, the first device's"]
  d["accelerate and brake: the largest of each"]
  e["putBack: pressed if any device presses it"]
  f(["return the combined actions"])
  s --> a
  a -->|"yes"| b
  a -->|"no"| c --> d --> e --> f
```

## pressedJustNow

Why the game needs it: holding the put-back button puts the car back once, not sixty times a second.

```mermaid
flowchart TD
  s(["pressedJustNow with putBack last frame and this frame"])
  a(["return yes only when it is pressed now and was not last frame"])
  s --> a
```
