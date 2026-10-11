# src/vehicle/drive-force.ts

Status: draft

New in scope 005 (item 5). How hard the engine pushes and how hard the air and
road hold the car back, from the vehicle file's figures and the place's air
density and gravity (D-0009: physics constants come from the place). There is
no gearbox simulation in slice 1: going forward, the force is the smaller of
what first gear can give and what the engine's power can give at this speed,
which is the envelope a real gearbox follows; reverse has one gear and stops
pulling at its rev limit. Top speed and 0–100 then come out of the physics
and are tested against the published figures (research/36 section 3). The
pictures drawn from the code will be in `docs/flows/src/vehicle/drive-force.md`.

Standard formulas: wheel force = torque × gear ratio × final drive ×
efficiency ÷ wheel radius; power-limited force = power × efficiency ÷ speed;
road speed at the rev limit = redline (rev/min) × 2π × radius ÷ (60 × gear
ratio × final drive); air drag = ½ ρ Cd A v²; rolling resistance = Crr × m × g.

## forwardDriveForceN

Why the game needs it: the car pulls hard from a standstill and keeps pulling less as speed rises, until the air holds it at its real top speed.

```mermaid
flowchart TD
  s(["forwardDriveForceN for the vehicle at a forward speed, with the throttle from 0 to 1"])
  a["first-gear force from peak torque, first gear, final drive, efficiency and wheel radius"]
  b{"is the speed above 1 m/s"}
  c["power force = peak power times efficiency over the speed"]
  d["power force = first-gear force: near standstill power over speed divides by almost zero, and for any real car first gear is the smaller there anyway"]
  e(["return throttle times the smaller of the two"])
  s --> a --> b
  b -->|"yes"| c --> e
  b -->|"no"| d --> e
```

## reverseDriveForceN

Why the game needs it: reverse is slow and strong like a real reverse gear, and stops pushing at its top speed rather than reversing at motorway speed.

```mermaid
flowchart TD
  s(["reverseDriveForceN for the vehicle at a backward speed, with the throttle from 0 to 1"])
  a["reverse rev-limit speed from redline, wheel radius, reverse gear and final drive"]
  b{"is the backward speed at or above that"}
  c(["return 0"])
  d(["return throttle times the force from peak torque, reverse gear, final drive, efficiency and wheel radius"])
  s --> a --> b
  b -->|"yes"| c
  b -->|"no"| d
```

## airDragN

Why the game needs it: air holds the car back more the faster it goes, and thinner air (a high place, later Mars) holds it back less; the density comes from the place file.

```mermaid
flowchart TD
  s(["airDragN for the vehicle at a speed, in the place's air density"])
  a(["return one half times air density times drag coefficient times frontal area times speed squared, pointing against the motion"])
  s --> a
```

## rollingResistanceN

Why the game needs it: a car left rolling slows down and stops by itself, as on a real road.

```mermaid
flowchart TD
  s(["rollingResistanceN for the vehicle in the place's gravity"])
  a(["return rolling resistance coefficient times mass times gravity"])
  s --> a
```
