# src/vehicle/car.ts

Status: approved. Judged by the delegated approver (docs/reviews/slice-1-approver.md); its fixes F1 to F24 and the orchestrator's decisions on E1 to E3 applied in one pass.

New in scope 005 (items 4 and 5). The car in the physics world: a Rapier
rigid body with a `DynamicRayCastVehicleController` (Rapier 0.21.0 API, read
from its type files: `addWheel`, `setWheel…`, `updateVehicle`,
`currentVehicleSpeed`; `ColliderDesc.setMassProperties`; research/36
section 3). All numbers come from `rapier-settings.ts`, `drive-force.ts`,
`pedals.ts` and `steering.ts`. The pictures drawn from the code will be in
`docs/flows/src/vehicle/car.md`.

Turning map words into game axes: game x is east, y up, z south. A compass
heading h (degrees clockwise from north) points along (sin h, 0, −cos h);
the car's forward axis is its local +x, so the car's turn about y is
90° − h.

## carStartPose

Why the game needs it: the car is parked on the correct side of the street for the place (right in Lagos, left in Dublin), read from the place file, never from code.

```mermaid
flowchart TD
  s(["carStartPose with the map index's start, the place and the vehicle"])
  o{"is the start's road one-way"}
  a["the car's right-hand direction for the heading: east cos h, north minus sin h"]
  b{"does the place drive on the right"}
  c["move the start a quarter of the road's width to the right"]
  d["move the start a quarter of the road's width to the left"]
  e["height: the centre of mass's height above the ground, plus 5 cm so the wheels settle onto the road instead of starting inside it"]
  f(["return position in game axes and the turn about y, 90 degrees minus the heading"])
  s --> o
  o -->|"yes: do not move it; the car sits in the middle of the road"| e
  o -->|"no"| a --> b
  b -->|"yes"| c --> e
  b -->|"no"| d --> e
  e --> f
```

Changed after the approver's F7: the start in the map index records the road's width and whether it is one-way (`tools/bake/start.md`), so on a two-way road the car sits in the middle of its own half, and on a one-way road in the middle of the road. The game no longer reads lane width; only the bake does.

## createCar

Why the game needs it: one car, with the real car's mass, size, wheels and springs, standing on the street.

```mermaid
flowchart TD
  s(["createCar in the physics world, with the vehicle, the start pose and the place"])
  a["make a moving rigid body at the start pose"]
  b["attach the chassis box from chassisMassProperties, with its mass, centre of mass and moments set"]
  c["make the vehicle controller for that body"]
  d["for each of wheelMountPoints: add a wheel pointing down, axle across the car, with the wheel radius and the rest length from suspensionForAxle; then set its stiffness, damping, travel, max force and tyre settings"]
  e(["return the car: body, controller, the vehicle, the steering fraction 0, the gearbox in first gear with no change under way, and the start pose kept for returning it to the start"])
  s --> a --> b --> c --> d --> e
```

## wheelCommands

Why the game needs it: from the pedals to a push and a brake on each wheel, as a plain calculation the tests can check without a physics world.

```mermaid
flowchart TD
  s(["wheelCommands with the vehicle, the pedal command, the gearbox, the forward speed, the place and the step's length"])
  a{"what does the pedal command say"}
  b["drive force = forwardDriveForceN in the gearbox's gear"]
  c["drive force = minus reverseDriveForceN"]
  d["drive force = 0"]
  e{"is the drive force 0"}
  f["each wheel brakes: (pedal brake times maxBrakeForceN, shared front and rear by the brake share, then halved per side) plus a quarter of rollingResistanceN, times the step's length, because Rapier's brake is an impulse"]
  g["each driven wheel pushes: the drive force made smaller by rolling resistance, never below 0 and never turned round, shared equally by the driven wheels; no brake, because Rapier ignores the brake while a wheel is driven (its Rust source: the brake is read only when engine force is 0)"]
  h(["return, for each wheel, its push in newtons and its brake impulse"])
  s --> a
  a -->|"forward"| b --> e
  a -->|"reverse"| c --> e
  a -->|"none"| d --> e
  e -->|"yes"| f --> h
  e -->|"no"| g --> h
```

## driveCar

Why the game needs it: one physics step of driving: wheels turned, pushed or braked, air resistance on the body, then Rapier works out the rest.

```mermaid
flowchart TD
  s(["driveCar with the car, the actions, the place and the step's length"])
  a["forward speed = the body's velocity along the car's forward axis"]
  b["the pedal command from pedalCommand"]
  g2["the gearbox = gearboxAfter for the forward speed and the step's length"]
  c["new steering fraction from steeringAfter; front wheel angle = minus fraction times steeringLimitRad at this speed (Rapier turns the car left for a positive angle; measured on 0.21.0)"]
  d["set each wheel's steering, push and brake from wheelCommands"]
  e["set the body's force to airDragN against its velocity"]
  f["update the controller for the step's length"]
  g(["return; the world step that follows moves the body"])
  s --> a --> b --> g2 --> c --> d --> e --> f --> g
```

Changed after the approver's F2 and F6, and the orchestrator's decision E1 (a). Forward speed is read from the body, not from `currentVehicleSpeed()`, which is the whole speed with a sign, so a car sliding sideways would read as fast forward or backward. Steering `+1` means right, and Rapier turns left for a positive angle, hence the minus; `updateCarModel` reads the angle back from the controller, so the wheels are drawn the right way with no other change. The gearbox (`drive-force.md`) is kept in the car between steps.

## flatHeading

New in scope 005 (approver's F8 and F12). Why the game needs it: putting the car upright and pointing the camera both need the way the car faces along the ground, and a car standing on its nose or tail has no such direction; without a fallback the result is not a number and the screen goes blank.

```mermaid
flowchart TD
  s(["flatHeading with the car's turn"])
  a["the car's forward axis flattened onto the ground (its up part dropped)"]
  b{"is that shorter than 0.1, the car on its nose or tail"}
  c["use the car's right axis, flattened, turned a quarter towards the front instead"]
  d(["return it made one long, as a direction along the ground"])
  s --> a --> b
  b -->|"yes"| c --> d
  b -->|"no"| d
```

## canFlipUpright

New in scope 005 (orchestrator's decision E2 (b), 2026-10-11). Why the game needs it: Flip upright is for a car that is stuck, not a free emergency stop; pressed at 60 km/h by a thumb that slipped off the pedals it would stop the car dead. So it works only when the car has nearly stopped or has tipped over. The two limits are owner-choice (decision E2 (b)): under 1.4 m/s (about 5 km/h) and tipped more than 45 degrees, kept in `src/controls/feel.ts` with the other game-feel numbers.

```mermaid
flowchart TD
  s(["canFlipUpright with the car's speed and its turn"])
  a{"is the speed under 1.4 m/s"}
  b(["return yes"])
  c{"is the car's up axis more than 45 degrees from straight up"}
  d(["return no"])
  s --> a
  a -->|"yes"| b
  a -->|"no"| c
  c -->|"yes"| b
  c -->|"no"| d
```

## flipCarUpright

Why the game needs it: a car on its roof or stuck on its side is put back on its wheels where it is, facing the way it was facing, so the player can carry on. Split from the old `putCarBack` (approver's F8), so each name says what it does and there is no mode flag.

```mermaid
flowchart TD
  s(["flipCarUpright with the car and the map's extent"])
  a["heading from flatHeading of the car's turn"]
  b["position: where the car is now, kept at least 3 m inside the map's edge so the car is never put inside a wall; height: as at the start"]
  c["turn: only that heading, so the car lands upright"]
  d["set the body there, stop all its movement, wake it up; steering fraction back to 0; the gearbox back to first gear"]
  e(["return the new pose, so the game sets both the pose before and the pose now to it (loop.md)"])
  s --> a --> b --> c --> d --> e
```

## returnCarToStart

Why the game needs it: a car that fell through the ground or left the map is put back where the game began, the one safe place known to be on a road. Split from the old `putCarBack` (approver's F8).

```mermaid
flowchart TD
  s(["returnCarToStart with the car"])
  a["position and turn: the start pose"]
  b["set the body there, stop all its movement, wake it up; steering fraction back to 0; the gearbox back to first gear"]
  c(["return the new pose, so the game sets both the pose before and the pose now to it (loop.md)"])
  s --> a --> b --> c
```

## carRescueNeeded

Why the game needs it: if the physics ever lets the car fall through the ground or past the map edge, the game notices and puts it back at the start, and says so, instead of leaving the player falling forever.

```mermaid
flowchart TD
  s(["carRescueNeeded with the car's position and the map's extent"])
  a{"is the car more than 10 m below the ground"}
  b(["return: fell through the ground"])
  c{"is the car more than 10 m outside the extent"}
  d(["return: left the map"])
  e(["return: no rescue"])
  s --> a
  a -->|"yes"| b
  a -->|"no"| c
  c -->|"yes"| d
  c -->|"no"| e
```
