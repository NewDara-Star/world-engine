# src/vehicle/steering.ts

Status: approved. Judged by the delegated approver (docs/reviews/slice-1-approver.md); its fixes F1 to F24 and the orchestrator's decisions on E1 to E3 applied in one pass.

New in scope 005 (items 5 and 6). How far the front wheels turn. A key is
either on or off, and a thumb jumps; real steering wheels take time to turn,
so the wheels move toward what the player asks at a limited rate, faster when
coming back to the middle (rates from the F1 game in our
research/world-drive/12, item 3). At speed, full lock would spin the car on a
key press, so the lock shrinks as speed rises (Sketchbook `Car.ts:241-254`,
MIT, technique). The rates and the shrink factor are game-feel numbers, the
owner's choice, proposed in `src/controls/feel.ts`: toward lock 2.6 per
second, back to the middle 5 per second, across the middle 7 per second (as a
fraction of full lock), shrink factor 0.3 per m/s as in Sketchbook. The
pictures drawn from the code will be in `docs/flows/src/vehicle/steering.md`.

## steeringLimitRad

Why the game needs it: a full key press at 60 km/h turns the car into the next street, not into a spin.

```mermaid
flowchart TD
  s(["steeringLimitRad for the vehicle at a speed"])
  a["the car's full lock, from maxSteerAngleRad"]
  b(["return full lock divided by the larger of 1 and the shrink factor times the speed, so nothing shrinks below about 3 m/s"])
  s --> a --> b
```

## steerRateFor

Why the game needs it: letting go straightens the car quickly, and flicking from left to right feels sharp, while turning in stays smooth.

```mermaid
flowchart TD
  s(["steerRateFor going from the current fraction of lock to the wanted fraction"])
  a{"is the wanted fraction on the other side of the middle from the current one"}
  b(["return the across-the-middle rate"])
  c{"is the wanted fraction nearer the middle than the current one"}
  d(["return the back-to-the-middle rate"])
  e(["return the toward-lock rate"])
  s --> a
  a -->|"yes"| b
  a -->|"no"| c
  c -->|"yes"| d
  c -->|"no"| e
```

## steeringAfter

Why the game needs it: one small step of the wheels' turn every physics step, the same on a 60 Hz phone and a 120 Hz Mac.

```mermaid
flowchart TD
  s(["steeringAfter with the current fraction of lock, the steer action, and the step's length in seconds"])
  a["the rate from steerRateFor"]
  b["the most it may move this step = rate times the step's length"]
  c(["return the current fraction moved toward the steer action by at most that much, never past it"])
  s --> a --> b --> c
```
