// The vehicle file: what a vehicle is, how it is driven and how it moves.
import { type FileCheck, validateJsonFile } from "./check-file.js";
import { type Fields, type Problem, addCrossFieldRules, problemAt, requireOneOf, requireRecord, requireShortId, requireText } from "./parse.js";
import { DYNAMICS_TYPES, STEERING_TYPES, VEHICLE_CLASSES, WHEEL_POSITIONS, type DynamicsType, type VehicleClass } from "./vocabulary.js";

// Which ways of moving make sense for each class of vehicle.
const dynamicsFor: Record<VehicleClass, readonly DynamicsType[]> = {
  car: ["wheeled"],
  bus: ["wheeled"],
  truck: ["wheeled"],
  bike: ["two-wheeler"],
  boat: ["hull"],
  plane: ["aerodynamic"],
};

const vehicleShape = {
  id: requireShortId(),
  name: requireText(),
  class: requireOneOf(VEHICLE_CLASSES),
  controls: requireRecord({
    // Where the driver sits. "none" for a bike, "centre" for a plane or a boat's helm.
    wheelPosition: requireOneOf(WHEEL_POSITIONS),
    steering: requireOneOf(STEERING_TYPES),
  }),
  dynamics: requireOneOf(DYNAMICS_TYPES),
};

type VehicleFields = Fields<typeof vehicleShape>;

// A class can only move in the ways that suit it, so a bus that floats like a
// boat is refused; the problem points at the `dynamics` line.
function movementProblemInVehicle(vehicle: Pick<VehicleFields, "class" | "dynamics">): Problem[] {
  const allowed = dynamicsFor[vehicle.class];
  if (allowed.includes(vehicle.dynamics)) return [];
  const ways = allowed.map((way) => `\`${way}\``).join(", ");
  return [problemAt(["dynamics"], `a ${vehicle.class} cannot move as "${vehicle.dynamics}"; it can move as ${ways}.`)];
}

const vehicleChecker = addCrossFieldRules(vehicleShape, [{ reads: ["class", "dynamics"], problems: movementProblemInVehicle }]);

export type Vehicle = VehicleFields;

// Checked the same way as a place, by file name and line (scope 002b, 2h).
export function validateVehicle(fileName: string, text: string): FileCheck<Vehicle> {
  return validateJsonFile(fileName, text, vehicleChecker);
}
