// The vehicle file: what a vehicle is, how it is driven and how it moves.
import { type Infer, type Parsed, object, oneOf, refine, shortId, someText } from "./parse.js";
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

const vehicleShape = object({
  id: shortId(),
  name: someText(),
  class: oneOf(VEHICLE_CLASSES),
  controls: object({
    // Where the driver sits. "none" for a bike, "centre" for a plane or a boat's helm.
    wheelPosition: oneOf(WHEEL_POSITIONS),
    steering: oneOf(STEERING_TYPES),
  }),
  dynamics: oneOf(DYNAMICS_TYPES),
});

const vehicleParser = refine(vehicleShape, (vehicle) =>
  dynamicsFor[vehicle.class].includes(vehicle.dynamics)
    ? undefined
    : `a ${vehicle.class} cannot move as "${vehicle.dynamics}" (it can be: ${dynamicsFor[vehicle.class].join(", ")})`,
);

export type Vehicle = Infer<typeof vehicleParser>;

export function validateVehicle(json: unknown): Parsed<Vehicle> {
  return vehicleParser(json, "");
}
