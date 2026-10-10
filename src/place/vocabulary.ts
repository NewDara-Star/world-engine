// The fixed words a place or vehicle file may use. One list each, so the types
// and the validator can never disagree about what is allowed.

export const DRIVING_SIDES = ["left", "right"] as const;
export const SPEED_UNITS = ["kmh", "mph"] as const;

export const VEHICLE_CLASSES = ["car", "bike", "bus", "truck", "boat", "plane"] as const;

export const WHEEL_POSITIONS = ["left", "right", "centre", "none"] as const;
export const STEERING_TYPES = ["steering-wheel", "handlebars", "tiller", "yoke", "stick"] as const;

// How the vehicle moves: on wheels, on two wheels, on water, or through air.
export const DYNAMICS_TYPES = ["wheeled", "two-wheeler", "hull", "aerodynamic"] as const;

// Licences a data source may carry (CLAUDE.md): CC0, MIT and Apache, and the
// attribution-only ones (CC-BY, ODbL), credited on the About page. ODbL is also
// the licence of OpenStreetMap and so of every map built from it.
export const LICENCES = ["CC0-1.0", "CC-BY-4.0", "MIT", "Apache-2.0", "ODbL-1.0"] as const;

// The physical constants a place file states, and how far each has been checked
// against a source that someone actually opened (never guess: say "unverified").
export const CONSTANT_QUANTITIES = ["gravity", "airDensity"] as const;
export const VERIFICATION_STATES = ["verified", "partly-verified", "unverified"] as const;

export type VehicleClass = (typeof VEHICLE_CLASSES)[number];
export type DynamicsType = (typeof DYNAMICS_TYPES)[number];
