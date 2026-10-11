# src/vehicle/car.ts

Status: draft

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
  a["the car's right-hand direction for the heading: east cos h, north minus sin h"]
  b{"does the place drive on the right"}
  c["move the start half a lane width to the right"]
  d["move the start half a lane width to the left"]
  e["height: the centre of mass's height above the ground, plus 5 cm so the wheels settle onto the road instead of starting inside it"]
  f(["return position in game axes and the turn about y, 90 degrees minus the heading"])
  s --> a --> b
  b -->|"yes"| c --> e
  b -->|"no"| d --> e
  e --> f
```

## createCar

Why the game needs it: one car, with the real car's mass, size, wheels and springs, standing on the street.

```mermaid
flowchart TD
  s(["createCar in the physics world, with the vehicle, the start pose and the place"])
  a["make a moving rigid body at the start pose"]
  b["attach the chassis box from chassisMassProperties, with its mass, centre of mass and moments set"]
  c["make the vehicle controller for that body"]
  d["for each of wheelMountPoints: add a wheel pointing down, axle across the car, with the wheel radius and the rest length from suspensionForAxle; then set its stiffness, damping, travel, max force and tyre settings"]
  e(["return the car: body, controller, the vehicle, the steering fraction 0, and the start pose kept for putting it back"])
  s --> a --> b --> c --> d --> e
```

## wheelCommands

Why the game needs it: from the pedals to a push and a brake on each wheel, as a plain calculation the tests can check without a physics world.

```mermaid
flowchart TD
  s(["wheelCommands with the vehicle, the pedal command, the forward speed, the place and the step's length"])
  a{"what does the pedal command say"}
  b["drive force = forwardDriveForceN"]
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
  a["forward speed from the controller"]
  b["the pedal command from pedalCommand"]
  c["new steering fraction from steeringAfter; front wheel angle = fraction times steeringLimitRad at this speed"]
  d["set each wheel's steering, push and brake from wheelCommands"]
  e["set the body's force to airDragN against its velocity"]
  f["update the controller for the step's length"]
  g(["return; the world step that follows moves the body"])
  s --> a --> b --> c --> d --> e --> f --> g
```

## putCarBack

Why the game needs it: a car on its roof or stuck against the map edge is put back on its wheels where it is, facing the way it was facing, so the player can carry on.

```mermaid
flowchart TD
  s(["putCarBack with the car and where to put it: here, or the start"])
  a{"here"}
  b["position: where the car is now; height: as at the start; turn: only the car's present heading, so it lands upright"]
  c["position and turn: the start pose"]
  d["set the body there, stop all its movement, wake it up; steering fraction back to 0"]
  e(["return what was done, so the game can tell the player"])
  s --> a
  a -->|"yes"| b --> d
  a -->|"no"| c --> d
  d --> e
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
