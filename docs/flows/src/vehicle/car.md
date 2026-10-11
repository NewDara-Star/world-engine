# src/vehicle/car.ts

Drawn from the code by `npm run diagrams` (TypeScript compiler, no AI). Do not edit by hand: change the code, then run it again.

## carStartPose

```mermaid
flowchart TD
  n1(["carStartPose"])
  n2["const heading = (start.headingDeg * Math.PI) / 180;"]
  n3["let east = start.eastM;"]
  n4["let north = start.northM;"]
  n5{"!start.oneWay"}
  n6{"place.drivingSide === #quot;right#quot;"}
  n7["1"]
  n8["-1"]
  n9["const side = place.drivingSide === #quot;right#quot; ? 1 : -1;"]
  n10["east += side * (start.roadWidthM / 4) * Math.cos(heading);"]
  n11["north += side * (start.roadWidthM / 4) * -Math.sin(heading);"]
  n12["const turn = new Quaternion().setFromAxisAngle(UP, Math.PI …"]
  n13(["return { position: { x: east, y: vehicle.body.centreOfMassH…"])
  n1 --> n2
  n2 --> n3
  n3 --> n4
  n4 --> n5
  n5 -->|"yes"| n6
  n6 -->|"yes"| n7
  n6 -->|"no"| n8
  n7 --> n9
  n8 --> n9
  n9 --> n10
  n10 --> n11
  n11 --> n12
  n5 -->|"no"| n12
  n12 --> n13
```

## createCar

```mermaid
flowchart TD
  n1(["createCar"])
  n2["const body = world.createRigidBody(RAPIER.RigidBodyDesc.dyn…"]
  n3["const chassis = chassisMassProperties(vehicle);<br/>calls chassisMassProperties"]
  n4["const box = RAPIER.ColliderDesc.cuboid(chassis.halfExtents.…"]
  n5["world.createCollider(box, body);"]
  n6["const controller = world.createVehicleController(body);"]
  n7["const tyres = tyreSettings(vehicle);<br/>calls tyreSettings"]
  n8["const mounts = wheelMountPoints(vehicle);<br/>calls wheelMountPoints"]
  n9{"for each const [index, mount] of mounts.entries()"}
  n10["const suspension = suspensionForAxle(vehicle, mount.axle, p…<br/>calls suspensionForAxle"]
  n11["controller.addWheel(mount.position, { x: 0, y: -1, z: 0 }, …"]
  n12["controller.setWheelSuspensionStiffness(index, suspension.su…"]
  n13["controller.setWheelSuspensionCompression(index, suspension.…"]
  n14["controller.setWheelSuspensionRelaxation(index, suspension.s…"]
  n15["controller.setWheelMaxSuspensionTravel(index, suspension.ma…"]
  n16["controller.setWheelMaxSuspensionForce(index, suspension.max…"]
  n17["controller.setWheelFrictionSlip(index, tyres.frictionSlip);"]
  n18["controller.setWheelSideFrictionStiffness(index, tyres.sideF…"]
  n19(["return { body, controller, vehicle, steering: 0, gearbox: {…"])
  n1 --> n2
  n2 --> n3
  n3 --> n4
  n4 --> n5
  n5 --> n6
  n6 --> n7
  n7 --> n8
  n8 --> n9
  n9 -->|"next item"| n10
  n10 --> n11
  n11 --> n12
  n12 --> n13
  n13 --> n14
  n14 --> n15
  n15 --> n16
  n16 --> n17
  n17 --> n18
  n18 --> n9
  n9 -->|"done"| n19
```

## wheelCommands

```mermaid
flowchart TD
  n1(["wheelCommands"])
  n2["const mounts = wheelMountPoints(vehicle);<br/>calls wheelMountPoints"]
  n3["const rolling = rollingResistanceN(vehicle, place.gravityMs…<br/>calls rollingResistanceN"]
  n4["let driveN = 0;"]
  n5{"pedal.drive === #quot;forward#quot;"}
  n6["driveN = forwardDriveForceN(vehicle, gearbox, forwardSpeedM…<br/>calls forwardDriveForceN"]
  n7{"pedal.drive === #quot;reverse#quot;"}
  n8["driveN = -reverseDriveForceN(vehicle, -forwardSpeedMs, peda…<br/>calls reverseDriveForceN"]
  n9{"driveN === 0"}
  n10["const brakeN = pedal.brake * maxBrakeForceN(vehicle);<br/>calls maxBrakeForceN"]
  n11["const perWheelNs = { front: ((brakeN * vehicle.brakes.front…"]
  n12(["return mounts.map((mount) =#gt; ({ pushN: 0, brakeImpulseNs: p…"])
  n13["const drivenCount = mounts.filter((mount) =#gt; mount.driven).…"]
  n14["const pushN = (Math.sign(driveN) * Math.max(0, Math.abs(dri…"]
  n15(["return mounts.map((mount) =#gt; ({ pushN: Number(mount.driven)…"])
  n1 --> n2
  n2 --> n3
  n3 --> n4
  n4 --> n5
  n5 -->|"yes"| n6
  n6 --> n7
  n5 -->|"no"| n7
  n7 -->|"yes"| n8
  n8 --> n9
  n7 -->|"no"| n9
  n9 -->|"yes"| n10
  n10 --> n11
  n11 --> n12
  n9 -->|"no"| n13
  n13 --> n14
  n14 --> n15
```

## driveCar

```mermaid
flowchart TD
  n1(["driveCar"])
  n2["const turn = car.body.rotation();"]
  n3["const forward = new Vector3(1, 0, 0).applyQuaternion(new Qu…"]
  n4["const velocity = car.body.linvel();"]
  n5["const forwardSpeedMs = velocity.x * forward.x + velocity.y …"]
  n6["const pedal = pedalCommand(actions.accelerate, actions.brak…<br/>calls pedalCommand"]
  n7["car.gearbox = gearboxAfter(car.vehicle, car.gearbox, forwar…<br/>calls gearboxAfter"]
  n8["car.steering = steeringAfter(car.steering, actions.steer, s…<br/>calls steeringAfter"]
  n9["const wheelAngle = -car.steering * steeringLimitRad(car.veh…<br/>calls steeringLimitRad"]
  n10["const mounts = wheelMountPoints(car.vehicle);<br/>calls wheelMountPoints"]
  n11["const wheels = wheelCommands(car.vehicle, pedal, car.gearbo…<br/>calls wheelCommands"]
  n12{"for each const [index, wheel] of wheels.entries()"}
  n13["car.controller.setWheelSteering(index, Number(mounts[index]…"]
  n14["car.controller.setWheelEngineForce(index, wheel.pushN);"]
  n15["car.controller.setWheelBrake(index, wheel.brakeImpulseNs);"]
  n16["const speed = Math.hypot(velocity.x, velocity.y, velocity.z…"]
  n17{"speed === 0"}
  n18["0"]
  n19["airDragN(car.vehicle, speed, place.airDensityKgM3) / speed<br/>calls airDragN"]
  n20["const drag = speed === 0 ? 0 : airDragN(car.vehicle, speed,…<br/>calls airDragN"]
  n21["car.body.resetForces(true);"]
  n22["car.body.addForce({ x: velocity.x * drag, y: velocity.y * d…"]
  n23["car.controller.updateVehicle(stepS);"]
  n24(["end"])
  n1 --> n2
  n2 --> n3
  n3 --> n4
  n4 --> n5
  n5 --> n6
  n6 --> n7
  n7 --> n8
  n8 --> n9
  n9 --> n10
  n10 --> n11
  n11 --> n12
  n12 -->|"next item"| n13
  n13 --> n14
  n14 --> n15
  n15 --> n12
  n12 -->|"done"| n16
  n16 --> n17
  n17 -->|"yes"| n18
  n17 -->|"no"| n19
  n18 --> n20
  n19 --> n20
  n20 --> n21
  n21 --> n22
  n22 --> n23
  n23 --> n24
```

## flatHeading

```mermaid
flowchart TD
  n1(["flatHeading"])
  n2["const turn = new Quaternion(rotation.x, rotation.y, rotatio…"]
  n3["const forward = new Vector3(1, 0, 0).applyQuaternion(turn);"]
  n4["let flat = { x: forward.x, z: forward.z };"]
  n5{"Math.hypot(flat.x, flat.z) #lt; 0.1"}
  n6["const right = new Vector3(0, 0, 1).applyQuaternion(turn);"]
  n7["flat = { x: right.z, z: -right.x };"]
  n8["const length = Math.hypot(flat.x, flat.z);"]
  n9(["return { x: flat.x / length, z: flat.z / length };"])
  n1 --> n2
  n2 --> n3
  n3 --> n4
  n4 --> n5
  n5 -->|"yes"| n6
  n6 --> n7
  n7 --> n8
  n5 -->|"no"| n8
  n8 --> n9
```

## canFlipUpright

```mermaid
flowchart TD
  n1(["canFlipUpright"])
  n2{"Math.abs(speedMs) #lt; FLIP_UPRIGHT_BELOW_MS"}
  n3(["return true;"])
  n4["const up = UP.clone().applyQuaternion(new Quaternion(rotati…"]
  n5(["return up.y #lt; Math.cos((FLIP_UPRIGHT_TIPPED_DEG * Math.PI) …"])
  n1 --> n2
  n2 -->|"yes"| n3
  n2 -->|"no"| n4
  n4 --> n5
```

## flipCarUpright

```mermaid
flowchart TD
  n1(["flipCarUpright"])
  n2["const heading = flatHeading(car.body.rotation());<br/>calls flatHeading"]
  n3["const here = car.body.translation();"]
  n4["const east = Math.min(Math.max(here.x, extent.westM + KEEP_…"]
  n5["const north = Math.min(Math.max(-here.z, extent.southM + KE…"]
  n6["const turn = new Quaternion().setFromAxisAngle(UP, Math.ata…"]
  n7["const pose = { position: { x: east, y: car.startPose.positi…"]
  n8["car.body.setTranslation(pose.position, true);"]
  n9["car.body.setRotation(pose.rotation, true);"]
  n10["car.body.setLinvel({ x: 0, y: 0, z: 0 }, true);"]
  n11["car.body.setAngvel({ x: 0, y: 0, z: 0 }, true);"]
  n12["car.steering = 0;"]
  n13["car.gearbox = { ...FIRST_GEAR };"]
  n14(["return pose;"])
  n1 --> n2
  n2 --> n3
  n3 --> n4
  n4 --> n5
  n5 --> n6
  n6 --> n7
  n7 --> n8
  n8 --> n9
  n9 --> n10
  n10 --> n11
  n11 --> n12
  n12 --> n13
  n13 --> n14
```

## returnCarToStart

```mermaid
flowchart TD
  n1(["returnCarToStart"])
  n2["const pose = car.startPose;"]
  n3["car.body.setTranslation(pose.position, true);"]
  n4["car.body.setRotation(pose.rotation, true);"]
  n5["car.body.setLinvel({ x: 0, y: 0, z: 0 }, true);"]
  n6["car.body.setAngvel({ x: 0, y: 0, z: 0 }, true);"]
  n7["car.steering = 0;"]
  n8["car.gearbox = { ...FIRST_GEAR };"]
  n9(["return pose;"])
  n1 --> n2
  n2 --> n3
  n3 --> n4
  n4 --> n5
  n5 --> n6
  n6 --> n7
  n7 --> n8
  n8 --> n9
```

## carRescueNeeded

```mermaid
flowchart TD
  n1(["carRescueNeeded"])
  n2{"position.y #lt; -RESCUE_AFTER_M"}
  n3(["return #quot;fell-through-ground#quot;;"])
  n4["const north = -position.z;"]
  n5["const outside = [extent.westM - position.x, position.x - ex…"]
  n6{"Math.max(...outside) #gt; RESCUE_AFTER_M"}
  n7(["return #quot;left-map#quot;;"])
  n8(["return #quot;none#quot;;"])
  n1 --> n2
  n2 -->|"yes"| n3
  n2 -->|"no"| n4
  n4 --> n5
  n5 --> n6
  n6 -->|"yes"| n7
  n6 -->|"no"| n8
```
