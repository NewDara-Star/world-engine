# src/controls/touch.ts

Status: draft

New in scope 005 (item 6). Thumbs to actions. Layout: the left half of the
screen is the stick area: the stick appears where the left thumb lands and
only its sideways movement steers (nipplejs `dynamic` mode, technique;
research/36). On the right, a large accelerate button at the bottom right,
the brake/reverse button beside it to its left, and a smaller "put the car
back" button above them. Nothing needs two fingers on one side (scope item 6).
Every finger is followed by its own `pointerId` (MDN Pointer Events), so the
stick and a pedal work at the same time; the controls have
`touch-action: none` so the browser does not scroll or zoom under the thumbs.

The decisions are in pure functions over a small **touch state** (which
finger holds the stick and where it started and is now; which finger holds
which button), so the blind tests can run them without a browser; the DOM
part only turns pointer events into those calls. The pictures drawn from the
code will be in `docs/flows/src/controls/touch.md`.

## touchStateAfter

Why the game needs it: every finger down, moved, lifted or cancelled by the phone (a call coming in, a swipe from the edge) updates one state, so a lost finger never leaves the car accelerating.

```mermaid
flowchart TD
  s(["touchStateAfter with the state and one pointer event: down, move, up or cancel, its pointer id, where, and what it landed on"])
  a{"which kind"}
  b(["return fingerDown of the state and the event"])
  c(["return fingerMoved of the state and the event"])
  d(["return fingerLifted of the state and the pointer id; cancel is treated the same as up"])
  s --> a
  a -->|"down"| b
  a -->|"move"| c
  a -->|"up or cancel"| d
```

## fingerDown

Why the game needs it: a thumb on the left starts the stick where it lands; a thumb on a button presses it; a second thumb on the stick area does not steal the stick.

```mermaid
flowchart TD
  s(["fingerDown with the state and the event"])
  a{"did it land on the stick area"}
  b{"is a finger already on the stick"}
  c(["return the state unchanged"])
  d(["return the state with the stick held by this finger, started and now at this point"])
  e{"did it land on a button"}
  f(["return the state with this finger on that button"])
  g(["return the state unchanged: it landed on nothing"])
  s --> a
  a -->|"yes"| b
  b -->|"yes"| c
  b -->|"no"| d
  a -->|"no"| e
  e -->|"yes"| f
  e -->|"no"| g
```

## fingerMoved

Why the game needs it: the stick follows the thumb; a finger sliding off a button keeps the button held until it lifts, as on a real pedal, because the browser keeps sending its moves to the button (pointer capture).

```mermaid
flowchart TD
  s(["fingerMoved with the state and the event"])
  a{"is this the stick's finger"}
  b(["return the state with the stick's now-point at this point"])
  c(["return the state unchanged"])
  s --> a
  a -->|"yes"| b
  a -->|"no"| c
```

## fingerLifted

Why the game needs it: lifting a thumb lets go of exactly what that thumb held.

```mermaid
flowchart TD
  s(["fingerLifted with the state and a pointer id"])
  a{"is it the stick's finger"}
  b["the stick is let go; steering goes back to the middle"]
  c["remove that finger from the buttons, if it held one"]
  d(["return the new state"])
  s --> a
  a -->|"yes"| b --> d
  a -->|"no"| c --> d
```

## stickSteer

Why the game needs it: how far the thumb has moved sideways from where it landed is how far the wheel turns, with a small dead zone so a resting thumb does not steer.

```mermaid
flowchart TD
  s(["stickSteer with the start and now points, the stick radius and the dead zone"])
  a["sideways movement = now x minus start x, divided by the radius, kept from -1 to 1"]
  b(["return withDeadZone of that"])
  s --> a --> b
```

## touchActions

Why the game needs it: the thumbs give the same four actions as keys and pads.

```mermaid
flowchart TD
  s(["touchActions with the touch state"])
  a{"is a finger on the stick"}
  b["steer = stickSteer"]
  c["steer = 0"]
  d(["return steer; accelerate 1 if any finger holds accelerate, else 0; brake 1 if any finger holds brake, else 0; putBack if any finger holds put-back"])
  s --> a
  a -->|"yes"| b --> d
  a -->|"no"| c --> d
```

## shouldShowTouchControls

Why the game needs it: the phone shows the thumb controls; the Mac with a mouse does not have them covering the road, until someone touches a touch screen.

```mermaid
flowchart TD
  s(["shouldShowTouchControls with whether the main pointer is coarse and whether a touch has been seen"])
  a(["return yes if either is true"])
  s --> a
```

## listenToTouches

Why the game needs it: joins the phone's pointer events to the touch state.

```mermaid
flowchart TD
  s(["listenToTouches on the controls layer, with a place to keep the state"])
  a["on pointer down, move, up and cancel, call passPointerEvent"]
  b(["return a function that removes these listeners"])
  s --> a --> b
```

## listenToTouches > passPointerEvent

Why the game needs it: each event becomes one call to touchStateAfter, with what it landed on read from the element's role (stick area or which button).

```mermaid
flowchart TD
  s(["passPointerEvent with a pointer event"])
  a{"is it a down event"}
  b["capture the pointer on the element it landed on, so its moves and its lift come back here even off the element"]
  c["stop the browser's own handling of it"]
  d(["keep touchStateAfter of the kept state and this event, with the target's role"])
  s --> a
  a -->|"yes"| b --> c
  a -->|"no"| c
  c --> d
```
