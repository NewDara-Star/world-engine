// The car in the physics world: a Rapier rigid body with a
// DynamicRayCastVehicleController (Rapier 0.21.0 API, from its type files:
// `createVehicleController`, `addWheel`, `setWheel…`, `updateVehicle`;
// `ColliderDesc.setMassProperties`; research/36 section 3). Vectors and turns
// use three.js 0.186.1 `Vector3.applyQuaternion` and `Quaternion`. Every
// number comes from rapier-settings.ts, drive-force.ts, pedals.ts and
// steering.ts. Game axes: x east, y up, z south; a compass heading h points
// along (sin h, 0, −cos h); the car's forward axis is its local +x, so its
// turn about y is 90° − h. Design: docs/designs/src/vehicle/car.md.
import RAPIER from "@dimforge/rapier3d-compat";
import { Quaternion, Vector3 } from "three";
import type { Actions } from "../controls/actions.js";
import { FLIP_UPRIGHT_BELOW_MS, FLIP_UPRIGHT_TIPPED_DEG } from "../controls/feel.js";
import type { Place } from "../place/place.js";
import type { Vehicle } from "../place/vehicle.js";
import { type Gearbox, airDragN, forwardDriveForceN, gearboxAfter, reverseDriveForceN, rollingResistanceN } from "./drive-force.js";
import { type PedalCommand, pedalCommand } from "./pedals.js";
import { type Vec3, chassisMassProperties, maxBrakeForceN, suspensionForAxle, tyreSettings, wheelMountPoints } from "./rapier-settings.js";
import { steeringAfter, steeringLimitRad } from "./steering.js";

export interface Quat {
  x: number;
  y: number;
  z: number;
  w: number;
}

export interface Pose {
  position: Vec3;
  rotation: Quat;
}

// Where the map index says the car starts (src/world/chunk.ts).
export interface StartOnRoad {
  eastM: number;
  northM: number;
  headingDeg: number;
  roadWidthM: number;
  oneWay: boolean;
}

export interface MapExtent {
  westM: number;
  southM: number;
  eastM: number;
  northM: number;
}

export interface Car {
  body: RAPIER.RigidBody;
  controller: RAPIER.DynamicRayCastVehicleController;
  vehicle: Vehicle;
  // How far the front wheels are turned, as a fraction of full lock.
  steering: number;
  gearbox: Gearbox;
  startPose: Pose;
}

export interface WheelCommand {
  pushN: number;
  brakeImpulseNs: number;
}

export type Rescue = "none" | "fell-through-ground" | "left-map";

const FIRST_GEAR: Gearbox = { gear: 1, changeLeftS: 0 };
const UP = new Vector3(0, 1, 0);
// The wheels start 5 cm above where they sit, so they settle onto the road
// instead of starting inside it.
const SETTLE_M = 0.05;
// A flipped car is put at least this far inside the map's edge, never inside a wall.
const KEEP_FROM_EDGE_M = 3;
// How far below the ground or outside the map the car must be before it is rescued.
const RESCUE_AFTER_M = 10;

// Parked on the place's driving side, read from the place file, never from
// code: a quarter of the road's width on a two-way road; in the middle of a
// one-way road (approver's F7).
export function carStartPose(start: StartOnRoad, place: Pick<Place, "drivingSide">, vehicle: Vehicle): Pose {
  const heading = (start.headingDeg * Math.PI) / 180;
  let east = start.eastM;
  let north = start.northM;
  if (!start.oneWay) {
    const side = place.drivingSide === "right" ? 1 : -1;
    east += side * (start.roadWidthM / 4) * Math.cos(heading);
    north += side * (start.roadWidthM / 4) * -Math.sin(heading);
  }
  const turn = new Quaternion().setFromAxisAngle(UP, Math.PI / 2 - heading);
  return {
    position: { x: east, y: vehicle.body.centreOfMassHeightM + SETTLE_M, z: -north },
    rotation: { x: turn.x, y: turn.y, z: turn.z, w: turn.w },
  };
}

// One car with the real car's mass, size, wheels and springs, on the street.
export function createCar(world: RAPIER.World, vehicle: Vehicle, pose: Pose, place: Pick<Place, "gravityMs2">): Car {
  const body = world.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(pose.position.x, pose.position.y, pose.position.z).setRotation(pose.rotation));
  const chassis = chassisMassProperties(vehicle);
  const box = RAPIER.ColliderDesc.cuboid(chassis.halfExtents.x, chassis.halfExtents.y, chassis.halfExtents.z)
    .setTranslation(chassis.offset.x, chassis.offset.y, chassis.offset.z)
    .setMassProperties(chassis.massKg, chassis.centreOfMass, chassis.principalInertia, { x: 0, y: 0, z: 0, w: 1 });
  world.createCollider(box, body);
  const controller = world.createVehicleController(body);
  const tyres = tyreSettings(vehicle);
  const mounts = wheelMountPoints(vehicle);
  for (const [index, mount] of mounts.entries()) {
    const suspension = suspensionForAxle(vehicle, mount.axle, place.gravityMs2);
    controller.addWheel(mount.position, { x: 0, y: -1, z: 0 }, { x: 0, y: 0, z: 1 }, suspension.suspensionRestLength, vehicle.wheels.radiusM);
    controller.setWheelSuspensionStiffness(index, suspension.suspensionStiffness);
    controller.setWheelSuspensionCompression(index, suspension.suspensionCompression);
    controller.setWheelSuspensionRelaxation(index, suspension.suspensionRelaxation);
    controller.setWheelMaxSuspensionTravel(index, suspension.maxSuspensionTravel);
    controller.setWheelMaxSuspensionForce(index, suspension.maxSuspensionForce);
    controller.setWheelFrictionSlip(index, tyres.frictionSlip);
    controller.setWheelSideFrictionStiffness(index, tyres.sideFrictionStiffness);
  }
  return { body, controller, vehicle, steering: 0, gearbox: { ...FIRST_GEAR }, startPose: pose };
}

// From the pedals to a push and a brake on each wheel, front left, front
// right, rear left, rear right. Rapier's brake is an impulse cap per step, and
// Rapier ignores it while a wheel is driven (its Rust source reads the brake
// only when engine force is 0), so a driving car's rolling resistance comes
// off the push instead.
export function wheelCommands(
  vehicle: Vehicle,
  pedal: PedalCommand,
  gearbox: Gearbox,
  forwardSpeedMs: number,
  place: Pick<Place, "gravityMs2">,
  stepS: number,
): WheelCommand[] {
  const mounts = wheelMountPoints(vehicle);
  const rolling = rollingResistanceN(vehicle, place.gravityMs2);
  let driveN = 0;
  if (pedal.drive === "forward") driveN = forwardDriveForceN(vehicle, gearbox, forwardSpeedMs, pedal.throttle);
  if (pedal.drive === "reverse") driveN = -reverseDriveForceN(vehicle, -forwardSpeedMs, pedal.throttle);
  if (driveN === 0) {
    const brakeN = pedal.brake * maxBrakeForceN(vehicle);
    const perWheelNs = {
      front: ((brakeN * vehicle.brakes.frontShare) / 2 + rolling / 4) * stepS,
      rear: ((brakeN * (1 - vehicle.brakes.frontShare)) / 2 + rolling / 4) * stepS,
    };
    return mounts.map((mount) => ({ pushN: 0, brakeImpulseNs: perWheelNs[mount.axle] }));
  }
  const drivenCount = mounts.filter((mount) => mount.driven).length;
  const pushN = (Math.sign(driveN) * Math.max(0, Math.abs(driveN) - rolling)) / drivenCount;
  return mounts.map((mount) => ({ pushN: Number(mount.driven) * pushN, brakeImpulseNs: 0 }));
}

// One physics step of driving: wheels turned, pushed or braked, air on the
// body; the world step that follows moves it. Forward speed is read from the
// body along the car's forward axis, not currentVehicleSpeed(), which is the
// whole speed with a sign (approver's F6). Steering +1 is right, and Rapier
// turns left for a positive angle (approver's F2), hence the minus.
export function driveCar(car: Car, actions: Actions, place: Pick<Place, "gravityMs2" | "airDensityKgM3">, stepS: number): void {
  const turn = car.body.rotation();
  const forward = new Vector3(1, 0, 0).applyQuaternion(new Quaternion(turn.x, turn.y, turn.z, turn.w));
  const velocity = car.body.linvel();
  const forwardSpeedMs = velocity.x * forward.x + velocity.y * forward.y + velocity.z * forward.z;
  const pedal = pedalCommand(actions.accelerate, actions.brake, forwardSpeedMs);
  car.gearbox = gearboxAfter(car.vehicle, car.gearbox, forwardSpeedMs, stepS);
  car.steering = steeringAfter(car.steering, actions.steer, stepS);
  const wheelAngle = -car.steering * steeringLimitRad(car.vehicle, forwardSpeedMs);
  const mounts = wheelMountPoints(car.vehicle);
  const wheels = wheelCommands(car.vehicle, pedal, car.gearbox, forwardSpeedMs, place, stepS);
  for (const [index, wheel] of wheels.entries()) {
    car.controller.setWheelSteering(index, Number(mounts[index]?.steers) * wheelAngle);
    car.controller.setWheelEngineForce(index, wheel.pushN);
    car.controller.setWheelBrake(index, wheel.brakeImpulseNs);
  }
  const speed = Math.hypot(velocity.x, velocity.y, velocity.z);
  const drag = speed === 0 ? 0 : airDragN(car.vehicle, speed, place.airDensityKgM3) / speed;
  car.body.resetForces(true);
  car.body.addForce({ x: velocity.x * drag, y: velocity.y * drag, z: velocity.z * drag }, true);
  car.controller.updateVehicle(stepS);
}

// The way the car faces along the ground. A car on its nose or tail has no
// flat forward direction, so its right axis, turned a quarter towards the
// front, is used instead (approver's F8 and F12); never "not a number".
export function flatHeading(rotation: Quat): { x: number; z: number } {
  const turn = new Quaternion(rotation.x, rotation.y, rotation.z, rotation.w);
  const forward = new Vector3(1, 0, 0).applyQuaternion(turn);
  let flat = { x: forward.x, z: forward.z };
  if (Math.hypot(flat.x, flat.z) < 0.1) {
    const right = new Vector3(0, 0, 1).applyQuaternion(turn);
    flat = { x: right.z, z: -right.x };
  }
  const length = Math.hypot(flat.x, flat.z);
  return { x: flat.x / length, z: flat.z / length };
}

// Flip upright is for a stuck car, not a free emergency stop (orchestrator's
// decision E2 (b)): only nearly stopped, or tipped over.
export function canFlipUpright(speedMs: number, rotation: Quat): boolean {
  if (Math.abs(speedMs) < FLIP_UPRIGHT_BELOW_MS) return true;
  const up = UP.clone().applyQuaternion(new Quaternion(rotation.x, rotation.y, rotation.z, rotation.w));
  return up.y < Math.cos((FLIP_UPRIGHT_TIPPED_DEG * Math.PI) / 180);
}

// Back on its wheels where it is, facing the way it was facing, kept at least
// 3 m inside the map's edge (approver's F8).
export function flipCarUpright(car: Car, extent: MapExtent): Pose {
  const heading = flatHeading(car.body.rotation());
  const here = car.body.translation();
  const east = Math.min(Math.max(here.x, extent.westM + KEEP_FROM_EDGE_M), extent.eastM - KEEP_FROM_EDGE_M);
  const north = Math.min(Math.max(-here.z, extent.southM + KEEP_FROM_EDGE_M), extent.northM - KEEP_FROM_EDGE_M);
  const turn = new Quaternion().setFromAxisAngle(UP, Math.atan2(-heading.z, heading.x));
  const pose = {
    position: { x: east, y: car.startPose.position.y, z: -north },
    rotation: { x: turn.x, y: turn.y, z: turn.z, w: turn.w },
  };
  car.body.setTranslation(pose.position, true);
  car.body.setRotation(pose.rotation, true);
  car.body.setLinvel({ x: 0, y: 0, z: 0 }, true);
  car.body.setAngvel({ x: 0, y: 0, z: 0 }, true);
  car.steering = 0;
  car.gearbox = { ...FIRST_GEAR };
  return pose;
}

// Where the game began, the one safe place known to be on a road (approver's F8).
export function returnCarToStart(car: Car): Pose {
  const pose = car.startPose;
  car.body.setTranslation(pose.position, true);
  car.body.setRotation(pose.rotation, true);
  car.body.setLinvel({ x: 0, y: 0, z: 0 }, true);
  car.body.setAngvel({ x: 0, y: 0, z: 0 }, true);
  car.steering = 0;
  car.gearbox = { ...FIRST_GEAR };
  return pose;
}

// A car that fell through the ground or left the map is noticed, so the game
// can put it back and say so.
export function carRescueNeeded(position: Vec3, extent: MapExtent): Rescue {
  if (position.y < -RESCUE_AFTER_M) return "fell-through-ground";
  const north = -position.z;
  const outside = [extent.westM - position.x, position.x - extent.eastM, extent.southM - north, north - extent.northM];
  if (Math.max(...outside) > RESCUE_AFTER_M) return "left-map";
  return "none";
}
