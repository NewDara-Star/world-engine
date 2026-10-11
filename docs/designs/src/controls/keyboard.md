# src/controls/keyboard.ts

Status: draft

New in scope 005 (item 6). Keys to actions. Keys are read by `code`, the
physical key, so WASD sits in the same place on an AZERTY keyboard (MDN
`KeyboardEvent.code`, research/36). Keys: ArrowLeft or KeyA steers left,
ArrowRight or KeyD steers right, ArrowUp or KeyW accelerates, ArrowDown, KeyS
or Space brakes and reverses, KeyR puts the car back. The pictures drawn from
the code will be in `docs/flows/src/controls/keyboard.md`.

## keyboardActions

Why the game needs it: the Mac player drives with the arrows or WASD, the same actions as the thumbs on a phone.

```mermaid
flowchart TD
  s(["keyboardActions with the set of keys held down"])
  a["steer = 1 if a right key is held, minus 1 if a left key is held; both held gives 0"]
  b["accelerate = 1 if an up key is held, else 0; brake = 1 if a down key or Space is held, else 0"]
  c(["return those, with putBack when KeyR is held"])
  s --> a --> b --> c
```

## listenToKeyboard

Why the game needs it: keeps the set of held keys right, including when the player switches window with a key still down.

```mermaid
flowchart TD
  s(["listenToKeyboard on the window, with the set of held keys"])
  a["on key down call holdKey; on key up call letGoOfKey"]
  b["when the window loses focus, or the page is hidden, call letGoOfAllKeys"]
  c(["return a function that removes these listeners"])
  s --> a --> b --> c
```

## listenToKeyboard > holdKey

Why the game needs it: the arrows and Space would otherwise scroll the page while driving.

```mermaid
flowchart TD
  s(["holdKey with a key-down event"])
  a{"is it one of the driving keys"}
  b(["ignore it: other keys keep their normal meaning, such as reload"])
  c["stop the browser's own action for it, such as scrolling"]
  d(["add its code to the held keys; a repeat of a held key changes nothing"])
  s --> a
  a -->|"no"| b
  a -->|"yes"| c --> d
```

## listenToKeyboard > letGoOfKey

Why the game needs it: letting go of a key stops that action.

```mermaid
flowchart TD
  s(["letGoOfKey with a key-up event"])
  a(["remove its code from the held keys"])
  s --> a
```

## listenToKeyboard > letGoOfAllKeys

Why the game needs it: a key held while switching to another window never sends its key-up; without this the car would keep accelerating on its own.

```mermaid
flowchart TD
  s(["letGoOfAllKeys"])
  a(["empty the held keys"])
  s --> a
```
