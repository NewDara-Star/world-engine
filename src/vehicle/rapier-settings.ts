// Real-world car figures (the vehicle file, SI units) turned into the numbers
// Rapier's vehicle controller wants. This file is the only place that knows
// the difference, so a vehicle file still means something if we change
// physics engine. Every conversion comes from Rapier's Rust source,
// dimforge/rapier src/control/ray_cast_vehicle_controller.rs (Apache-2.0,
// read for research/36 section 3 and checked by the approver):
//   - spring and damper are multiplied by the whole car's mass
//     (`wheel_suspension_force = force * chassis_mass`);
//   - engine force is newtons per wheel; brake is an impulse cap per step;
//   - friction slip is the tyre's friction coefficient.
// Car axes are Rapier's defaults: x forward, y up, z to the car's right; the
// body's origin is the centre of mass.
// Design: docs/designs/src/vehicle/rapier-settings.md.
import type { Vehicle } from "../place/vehicle.js";

export type Axle = "front" | "rear";

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface SuspensionSettings {
  suspensionStiffness: number;
  suspensionCompression: number;
  suspensionRelaxation: number;
  suspensionRestLength: number;
  maxSuspensionTravel: number;
  maxSuspensionForce: number;
}

export interface WheelMount {
  axle: Axle;
  // Where the suspension is fixed to the body, from the centre of mass.
  position: Vec3;
  steers: boolean;
  driven: boolean;
}

export interface ChassisMass {
  halfExtents: Vec3;
  // The box's middle, from the centre of mass.
  offset: Vec3;
  massKg: number;
  // The centre of mass in the box collider's own frame.
  centreOfMass: Vec3;
  principalInertia: Vec3;
}

// The front of a front-engined hatchback is heavier than the back; each
// wheel's spring holds its own share.
export function cornerMassKg(vehicle: Vehicle, axle: Axle): number {
  if (axle === "front") return (vehicle.body.massKg * vehicle.body.frontAxleLoadShare) / 2;
  return (vehicle.body.massKg * (1 - vehicle.body.frontAxleLoadShare)) / 2;
}

// Standard formulas: ω = 2πf; wheel rate k = ω² m; critical damping
// c = 2ζωm; static sag = g ÷ ω². The car sits in the middle of its travel.
export function suspensionForAxle(vehicle: Vehicle, axle: Axle, gravityMs2: number): SuspensionSettings {
  const omega = 2 * Math.PI * vehicle.wheels.rideFrequencyHz;
  const corner = cornerMassKg(vehicle, axle);
  const wheelRate = omega ** 2 * corner;
  const damping = 2 * vehicle.wheels.dampingRatio * omega * corner;
  const restLength = gravityMs2 / omega ** 2 + vehicle.wheels.suspensionTravelM / 2;
  return {
    suspensionStiffness: wheelRate / vehicle.body.massKg,
    suspensionCompression: damping / vehicle.body.massKg,
    suspensionRelaxation: damping / vehicle.body.massKg,
    suspensionRestLength: restLength,
    maxSuspensionTravel: restLength,
    // Twice the spring force at full compression, so it never limits normal driving.
    maxSuspensionForce: wheelRate * restLength * 2,
  };
}

// The wheels go where the real car's are: the wheelbase apart, the track
// apart, around the centre of mass by the front-rear weight split; mounted so
// a wheel touches the ground when its spring sits at half travel.
export function wheelMountPoints(vehicle: Vehicle): WheelMount[] {
  const { body, wheels, drivenAxle } = vehicle;
  const toFront = body.wheelbaseM * (1 - body.frontAxleLoadShare);
  const toRear = body.wheelbaseM * body.frontAxleLoadShare;
  const height = wheels.radiusM + wheels.suspensionTravelM / 2 - body.centreOfMassHeightM;
  const halfTrack = body.trackM / 2;
  const frontDriven = drivenAxle !== "rear";
  const rearDriven = drivenAxle !== "front";
  return [
    { axle: "front", position: { x: toFront, y: height, z: -halfTrack }, steers: true, driven: frontDriven },
    { axle: "front", position: { x: toFront, y: height, z: halfTrack }, steers: true, driven: frontDriven },
    { axle: "rear", position: { x: -toRear, y: height, z: -halfTrack }, steers: false, driven: rearDriven },
    { axle: "rear", position: { x: -toRear, y: height, z: halfTrack }, steers: false, driven: rearDriven },
  ];
}

// The chassis is a solid box from axle height to the roof (a stated weakness:
// a real car's mass sits lower and nearer the middle). A solid box's moments
// are m(b² + c²) ÷ 12. Rapier reads the centre of mass in the collider's own
// frame (approver's F5, measured on 0.21.0), so it is minus the box's offset.
export function chassisMassProperties(vehicle: Vehicle): ChassisMass {
  const { body, wheels } = vehicle;
  const length = body.lengthM;
  const height = body.heightM - wheels.radiusM;
  const width = body.widthM;
  const offsetUp = (wheels.radiusM + body.heightM) / 2 - body.centreOfMassHeightM;
  const mass = body.massKg;
  return {
    halfExtents: { x: length / 2, y: height / 2, z: width / 2 },
    offset: { x: 0, y: offsetUp, z: 0 },
    massKg: mass,
    centreOfMass: { x: 0, y: -offsetUp, z: 0 },
    principalInertia: {
      x: (mass * (height ** 2 + width ** 2)) / 12,
      y: (mass * (length ** 2 + width ** 2)) / 12,
      z: (mass * (length ** 2 + height ** 2)) / 12,
    },
  };
}

// The bicycle model: sin δ = wheelbase ÷ (turning circle ÷ 2 − track ÷ 2),
// because the published kerb-to-kerb circle is traced by the outer front
// wheel (approver's F3). The vehicle checker has made sure the sine is below 1.
export function maxSteerAngleRad(vehicle: Vehicle): number {
  return Math.asin(vehicle.body.wheelbaseM / (vehicle.wheels.turningCircleM / 2 - vehicle.body.trackM / 2));
}

// The whole car's braking force from a published brake test: a = v² ÷ 2d.
export function maxBrakeForceN(vehicle: Vehicle): number {
  const deceleration = vehicle.brakes.testFromSpeedMs ** 2 / (2 * vehicle.brakes.testStoppingDistanceM);
  return vehicle.body.massKg * deceleration;
}

// Grip from the real tyre, not Rapier's default friction slip of 10.5; side
// friction stiffness 1 is Rapier's default, which applies it unchanged.
export function tyreSettings(vehicle: Vehicle): { frictionSlip: number; sideFrictionStiffness: number } {
  return { frictionSlip: vehicle.wheels.tyreFriction, sideFrictionStiffness: 1 };
}
