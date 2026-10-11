# src/vehicle/rapier-settings.ts

Status: approved. Judged by the delegated approver (docs/reviews/slice-1-approver.md); its fixes F1 to F24 and the orchestrator's decisions on E1 to E3 applied in one pass.

New in scope 005 (item 5). The vehicle file holds real-world figures in SI
units; Rapier's vehicle controller wants its own numbers. This file is the
only place that knows the difference, so a vehicle file still means something
if we ever change physics engine. Every conversion below comes from reading
Rapier's Rust source (`src/control/ray_cast_vehicle_controller.rs`,
Apache-2.0, research/36 section 3):

- spring and damper are multiplied by the whole car's mass
  (`wheel_suspension_force = force * chassis_mass`), so a real wheel rate is
  divided by the car's mass;
- engine force is newtons per wheel; brake is an impulse cap per step
  (newton-seconds), so a brake force is multiplied by the time step;
- friction slip is the tyre's friction coefficient.

Car axes (Rapier's defaults, `index_up_axis: 1`, `index_forward_axis: 0`):
x forward, y up, z to the car's right; the body's origin is the centre of
mass. The pictures drawn from the code will be in
`docs/flows/src/vehicle/rapier-settings.md`.

Standard formulas used, named here so the approver can check them: natural
frequency ω = 2πf; wheel rate k = ω² × corner mass; critical damping
c = 2ζ√(k m) = 2ζ ω m; static sag = g ÷ ω²; a box's moments of inertia
m(b² + c²) ÷ 12 (a solid box, a stated weakness: a real car's mass sits lower
and nearer the middle); steering angle from the turning circle with the
bicycle model, sin δ = wheelbase ÷ (turning circle ÷ 2 − track ÷ 2), because
the published kerb-to-kerb circle is traced by the outer front wheel, not the
middle of the front axle (approver's F3: 10.6 m against the published 10.2 m,
where the plain half circle gave 12.2 m, measured on Rapier 0.21.0); deceleration from a
brake test a = v² ÷ 2d.

## cornerMassKg

Why the game needs it: the front of a front-engined hatchback is heavier than the back, and each wheel's spring must hold its own share.

```mermaid
flowchart TD
  s(["cornerMassKg for the front or the rear axle"])
  a{"front"}
  b(["return mass times the front axle load share, over 2"])
  c(["return mass times (1 minus the front axle load share), over 2"])
  s --> a
  a -->|"yes"| b
  a -->|"no"| c
```

## suspensionForAxle

Why the game needs it: the car should sit level, bounce once over a bump and settle like a real hatchback, not float or rattle.

```mermaid
flowchart TD
  s(["suspensionForAxle with the vehicle, the axle and the place's gravity"])
  a["omega = 2 pi times ride frequency; corner mass from cornerMassKg"]
  b["real wheel rate k = omega squared times corner mass; real damping c = 2 times damping ratio times omega times corner mass"]
  c["static sag = gravity over omega squared"]
  d["rest length = sag plus half the suspension travel, so the car sits in the middle of its travel; max travel = the rest length"]
  e(["return for Rapier: stiffness k over the car's mass, compression and relaxation both c over the car's mass, the rest length, the max travel, and the max suspension force: twice the spring force at full compression, k times rest length times 2, so it never limits normal driving"])
  s --> a --> b --> c --> d --> e
```

## wheelMountPoints

Why the game needs it: the wheels go where the real car's wheels are: the wheelbase apart, the track apart, placed around the centre of mass by the front-rear weight split.

```mermaid
flowchart TD
  s(["wheelMountPoints for the vehicle"])
  a["distance from the centre of mass to the front axle = wheelbase times (1 minus front share); to the rear axle = wheelbase times front share"]
  b["mount height above the centre of mass = wheel radius plus half the suspension travel minus the centre-of-mass height, so the wheel touches the ground when the spring sits at half travel"]
  c(["return four points: front left, front right, rear left, rear right; x forward or back by the axle distances, z out by half the track, y the mount height; each says whether it steers (front) and whether it is driven, from drivenAxle"])
  s --> a --> b --> c
```

## chassisMassProperties

Why the game needs it: the car's real mass and a low centre of mass make it lean and pitch like a car, not tip like a box.

```mermaid
flowchart TD
  s(["chassisMassProperties for the vehicle"])
  a["the chassis box: the car's length and width; from axle height (wheel radius) up to the roof (height)"]
  b["the box's middle, measured from the centre of mass: up by (radius plus height) over 2 minus the centre-of-mass height"]
  c["moments of inertia of a solid box of the car's mass and size"]
  d(["return the box's half sizes, its offset, the mass, the centre of mass given in the box collider's own frame: minus the box's offset, so it lands at the body's origin (Rapier reads it in the collider's frame; approver's F5, measured on 0.21.0), and the three moments"])
  s --> a --> b --> c --> d
```

## maxSteerAngleRad

Why the game needs it: the car turns as tightly as the real one, worked out from the turning circle the maker publishes. That circle is traced by the outer front wheel, so half the track comes off its radius (approver's F3).

```mermaid
flowchart TD
  s(["maxSteerAngleRad for the vehicle"])
  a(["return the arcsine of wheelbase over (half the turning circle minus half the track); the vehicle checker has already made sure that is longer than the wheelbase"])
  s --> a
```

A test the test-writer adds (F3): at full lock and walking pace, the turning circle is within ±10 % of the published one.

## maxBrakeForceN

Why the game needs it: the car stops in the distance a published brake test measured.

```mermaid
flowchart TD
  s(["maxBrakeForceN for the vehicle"])
  a["deceleration = test speed squared over twice the test stopping distance"]
  b(["return mass times that deceleration, the whole car's braking force"])
  s --> a --> b
```

## tyreSettings

Why the game needs it: grip comes from the real tyre's friction, not Rapier's default of 10.5, which is about ten times real grip.

```mermaid
flowchart TD
  s(["tyreSettings for the vehicle"])
  a(["return friction slip = tyre friction; side friction stiffness = 1, Rapier's default, which applies friction slip unchanged"])
  s --> a
```
