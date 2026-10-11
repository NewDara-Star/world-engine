// Turns the accelerate and brake actions into what the car does: drive
// forward, brake, or reverse. The scope's rule: brake slows the car, and when
// stopped holding brake reverses. Pressing accelerate while rolling backwards
// brakes first, the convention in Bruno Simon's folio-2025
// (sources/Game/Physics/PhysicsVehicle.js, `reverseBrake`; techniques only,
// research/36 section 3). Design: docs/designs/src/vehicle/pedals.md.
import { STOPPED_SPEED_MS } from "../controls/feel.js";

export interface PedalCommand {
  drive: "forward" | "reverse" | "none";
  // How hard the engine pushes, 0 to 1.
  throttle: number;
  // How hard the brakes work, 0 to 1.
  brake: number;
}

// Two buttons do four jobs, without a gear lever, the way phone driving games
// work. forwardSpeedMs is negative when the car goes backwards.
export function pedalCommand(accelerate: number, brake: number, forwardSpeedMs: number): PedalCommand {
  if (accelerate > 0 && brake > 0) return { drive: "none", throttle: 0, brake };
  if (accelerate > 0) {
    if (forwardSpeedMs < -STOPPED_SPEED_MS) return { drive: "none", throttle: 0, brake: accelerate };
    return { drive: "forward", throttle: accelerate, brake: 0 };
  }
  if (brake > 0) {
    if (forwardSpeedMs > STOPPED_SPEED_MS) return { drive: "none", throttle: 0, brake };
    return { drive: "reverse", throttle: brake, brake: 0 };
  }
  return { drive: "none", throttle: 0, brake: 0 };
}
