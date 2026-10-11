// How far the front wheels turn. Real steering takes time to turn, so the
// wheels move toward what the player asks at a limited rate, faster when
// coming back to the middle (rates from the F1 game in our
// research/world-drive/12, item 3). At speed the lock shrinks, as in
// Sketchbook (swift502/Sketchbook, src/ts/vehicles/Car.ts:241-254, MIT,
// technique only). The numbers are the owner's choice, in src/controls/feel.ts.
// Design: docs/designs/src/vehicle/steering.md.
import {
  STEER_RATE_ACROSS_MIDDLE,
  STEER_RATE_BACK_TO_MIDDLE,
  STEER_RATE_TOWARD_LOCK,
  STEER_SHRINK_PER_MS,
} from "../controls/feel.js";
import type { Vehicle } from "../place/vehicle.js";
import { maxSteerAngleRad } from "./rapier-settings.js";

// A full key press at 60 km/h turns the car into the next street, not into a
// spin. Below about 3 m/s nothing shrinks.
export function steeringLimitRad(vehicle: Vehicle, speedMs: number): number {
  return maxSteerAngleRad(vehicle) / Math.max(1, STEER_SHRINK_PER_MS * Math.abs(speedMs));
}

// Fractions of full lock: negative is left, positive is right.
export function steerRateFor(currentFraction: number, wantedFraction: number): number {
  if (currentFraction * wantedFraction < 0) return STEER_RATE_ACROSS_MIDDLE;
  if (Math.abs(wantedFraction) < Math.abs(currentFraction)) return STEER_RATE_BACK_TO_MIDDLE;
  return STEER_RATE_TOWARD_LOCK;
}

// One small step of the wheels' turn every physics step, the same on a 60 Hz
// phone and a 120 Hz Mac.
export function steeringAfter(currentFraction: number, steer: number, stepS: number): number {
  const most = steerRateFor(currentFraction, steer) * stepS;
  // Landing exactly on the steer action, not a rounding hair past it.
  if (Math.abs(steer - currentFraction) <= most) return steer;
  return currentFraction + Math.sign(steer - currentFraction) * most;
}
