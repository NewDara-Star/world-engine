# src/controls/gamepad.ts

Status: draft

New in scope 005 (item 6, "gamepad if simple": it is). Only pads the browser
reports with `mapping` "standard" are used, so the buttons are where the W3C
Gamepad spec's standard layout puts them (w3c/gamepad `index.html`, opened;
research/36): axis 0 left stick sideways, button 7 right trigger, button 6
left trigger, button 3 top of the right-hand cluster. The page asks the
browser for the pads every frame (MDN, "Using the Gamepad API"). The pictures
drawn from the code will be in `docs/flows/src/controls/gamepad.md`.

## withDeadZone

Why the game needs it: a worn stick never rests exactly at zero, and the car must not drift to one side when the player lets go.

```mermaid
flowchart TD
  s(["withDeadZone with a stick value and the dead zone"])
  a{"is the value's size at most the dead zone"}
  b(["return 0"])
  c(["return the value rescaled so the edge of the dead zone is 0 and full travel is still 1, keeping its sign"])
  s --> a
  a -->|"yes"| b
  a -->|"no"| c
```

## gamepadActions

Why the game needs it: a player with a controller on the Mac drives with the stick and triggers, the same actions as keys and thumbs.

```mermaid
flowchart TD
  s(["gamepadActions with the list of pads the browser gives"])
  a["find the first pad that is connected and has the standard mapping"]
  b{"is there one"}
  c(["return noActions"])
  d(["return steer = withDeadZone of axis 0; accelerate = button 7's value; brake = button 6's value; putBack = button 3 pressed; a missing axis or button reads as 0"])
  s --> a --> b
  b -->|"no"| c
  b -->|"yes"| d
```
