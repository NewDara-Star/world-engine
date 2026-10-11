// How hard the engine pushes, through a gearbox that changes by itself, and how
// hard the air and the road hold the car back, from the vehicle file's
// figures and the place's air density and gravity (D-0009). The gears are the
// maker's (orchestrator's decision E1 (a), 2026-10-11); each change takes
// gearChangeS with no drive. The engine's pull is the smaller of peak torque
// and peak power over the engine's turning speed (the envelope of the two
// published figures; weakness: a real engine has less torque low down and
// near the redline). Standard formulas: wheel force = torque × gear × final
// drive × efficiency ÷ wheel radius; engine rev/min = road speed × gear ×
// final drive × 60 ÷ (2π × radius); air drag = ½ ρ Cd A v²; rolling
// resistance = Crr × m × g. Design: docs/designs/src/vehicle/drive-force.md.
import type { Vehicle } from "../place/vehicle.js";

// The gear the car is in (1 is first) and how long the change under way has
// left (0 when none). Kept in the car between steps.
export interface Gearbox {
  gear: number;
  changeLeftS: number;
}

export function engineRpm(vehicle: Vehicle, forwardSpeedMs: number, gearRatio: number): number {
  return (forwardSpeedMs * gearRatio * vehicle.engine.finalDriveRatio * 60) / (2 * Math.PI * vehicle.wheels.radiusM);
}

// Peak torque low down, peak power higher up, nothing past the redline (the
// rev limiter). At a standstill the clutch slips, so the engine gives its peak
// torque and nothing divides by zero.
export function engineTorqueNm(vehicle: Vehicle, rpm: number): number {
  const { peakTorqueNm, peakPowerKw, redlineRpm } = vehicle.engine;
  if (rpm > redlineRpm) return 0;
  if (rpm > 0) return Math.min(peakTorqueNm, (peakPowerKw * 1000) / ((rpm * 2 * Math.PI) / 60));
  return peakTorqueNm;
}

// Changes up at the redline, as a driver flooring it would; changes down when
// the gear below would turn the engine no faster than this gear turns it
// straight after a change up into it, so it never hunts between two gears.
export function gearboxAfter(vehicle: Vehicle, gearbox: Gearbox, forwardSpeedMs: number, stepS: number): Gearbox {
  if (gearbox.changeLeftS > 0) return { gear: gearbox.gear, changeLeftS: Math.max(0, gearbox.changeLeftS - stepS) };
  const { forwardGearRatios: ratios, redlineRpm, gearChangeS } = vehicle.engine;
  const ratio = ratios[gearbox.gear - 1] ?? Number.NaN;
  const ratioAbove = ratios[gearbox.gear];
  const ratioBelow = ratios[gearbox.gear - 2];
  if (ratioAbove !== undefined && engineRpm(vehicle, forwardSpeedMs, ratio) >= redlineRpm) {
    return { gear: gearbox.gear + 1, changeLeftS: gearChangeS };
  }
  if (ratioBelow !== undefined && engineRpm(vehicle, forwardSpeedMs, ratioBelow) <= (redlineRpm * ratio) / ratioBelow) {
    return { gear: gearbox.gear - 1, changeLeftS: gearChangeS };
  }
  return gearbox;
}

// No drive while the gear changes; otherwise the engine's pull at this speed
// in this gear, by the throttle, eased by the parts that spin up with the car.
export function forwardDriveForceN(vehicle: Vehicle, gearbox: Gearbox, forwardSpeedMs: number, throttle: number): number {
  if (gearbox.changeLeftS > 0) return 0;
  const { finalDriveRatio, drivetrainEfficiency } = vehicle.engine;
  const ratio = vehicle.engine.forwardGearRatios[gearbox.gear - 1] ?? Number.NaN;
  const torque = engineTorqueNm(vehicle, engineRpm(vehicle, forwardSpeedMs, ratio));
  const wheelForceN = (throttle * torque * ratio * finalDriveRatio * drivetrainEfficiency) / vehicle.wheels.radiusM;
  return wheelForceN / rotatingMassFactor(ratio * finalDriveRatio);
}

// The engine, gearbox and wheels must be spun up too, so the car accelerates
// as if heavier, most in the low gears. T. D. Gillespie, Fundamentals of
// Vehicle Dynamics (SAE, 1992), section 2, mass factor approximation
// 1 + 0.04 + 0.0025 × (overall ratio)². Added by the orchestrator, 2026-10-11.
export function rotatingMassFactor(overallRatio: number): number {
  return 1.04 + 0.0025 * overallRatio * overallRatio;
}

// Reverse is slow and strong, and stops pushing at its rev limit.
export function reverseDriveForceN(vehicle: Vehicle, backwardSpeedMs: number, throttle: number): number {
  const { peakTorqueNm, reverseGearRatio, finalDriveRatio, drivetrainEfficiency, redlineRpm } = vehicle.engine;
  const limitMs = (redlineRpm * 2 * Math.PI * vehicle.wheels.radiusM) / (60 * reverseGearRatio * finalDriveRatio);
  if (backwardSpeedMs >= limitMs) return 0;
  return (throttle * peakTorqueNm * reverseGearRatio * finalDriveRatio * drivetrainEfficiency) / vehicle.wheels.radiusM;
}

// Against the motion; the density comes from the place file, so thinner air
// (a high place, later Mars) holds the car back less.
export function airDragN(vehicle: Vehicle, speedMs: number, airDensityKgM3: number): number {
  return -0.5 * airDensityKgM3 * vehicle.air.dragCoefficient * vehicle.air.frontalAreaM2 * speedMs * Math.abs(speedMs);
}

export function rollingResistanceN(vehicle: Vehicle, gravityMs2: number): number {
  return vehicle.wheels.rollingResistance * vehicle.body.massKg * gravityMs2;
}
