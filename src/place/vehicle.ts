// The vehicle file: what a vehicle is, how it is driven and how it moves, and
// for a wheeled vehicle the real-world figures its physics reads, each with
// exactly one source (the data rule, scope 005 item 5). Every figure is in SI
// units, so the file never holds a physics engine's own number and never a
// display unit such as km/h. Design: docs/designs/src/place/vehicle.md.
import { type FileCheck, validateJsonFile } from "./check-file.js";
import {
  type Fields,
  type Parser,
  type Problem,
  addCrossFieldRules,
  httpsLink,
  labelForPath,
  problemAt,
  requireListOf,
  requireNumberAbove,
  requireNumberBetween,
  requireOneOf,
  requireRecord,
  requireShortId,
  requireText,
  sourceCountProblem,
} from "./parse.js";
import {
  CONSTANT_STATUSES,
  DRIVEN_AXLES,
  DYNAMICS_TYPES,
  STEERING_TYPES,
  VEHICLE_CLASSES,
  WHEEL_POSITIONS,
  type DynamicsType,
  type VehicleClass,
} from "./vocabulary.js";

// Which ways of moving make sense for each class of vehicle.
const dynamicsFor: Record<VehicleClass, readonly DynamicsType[]> = {
  car: ["wheeled"],
  bus: ["wheeled"],
  truck: ["wheeled"],
  bike: ["two-wheeler"],
  boat: ["hull"],
  plane: ["aerodynamic"],
};

// A share or an efficiency: a part of a whole.
const share = requireNumberBetween(0, 1);

// The driving figures, by group, in the order they are written. Each is a real
// figure (research/36 section 7 says where each kind comes from); the physics
// turns them into its own settings (src/vehicle/rapier-settings.ts).
const FIGURE_GROUPS = {
  body: {
    massKg: requireNumberAbove(0, "kg"),
    lengthM: requireNumberAbove(0, "m"),
    widthM: requireNumberAbove(0, "m"),
    heightM: requireNumberAbove(0, "m"),
    wheelbaseM: requireNumberAbove(0, "m"),
    trackM: requireNumberAbove(0, "m"),
    centreOfMassHeightM: requireNumberAbove(0, "m"),
    frontAxleLoadShare: share,
  },
  wheels: {
    radiusM: requireNumberAbove(0, "m"),
    // Kerb to kerb, as makers publish it.
    turningCircleM: requireNumberAbove(0, "m"),
    suspensionTravelM: requireNumberAbove(0, "m"),
    rideFrequencyHz: requireNumberAbove(0, "Hz"),
    dampingRatio: requireNumberAbove(0),
    // Peak friction on dry asphalt.
    tyreFriction: requireNumberAbove(0),
    rollingResistance: requireNumberAbove(0),
  },
  engine: {
    peakPowerKw: requireNumberAbove(0, "kW"),
    peakTorqueNm: requireNumberAbove(0, "Nm"),
    // First gear first, as the maker's sheet lists them.
    forwardGearRatios: requireListOf(requireNumberAbove(0), 1),
    reverseGearRatio: requireNumberAbove(0),
    finalDriveRatio: requireNumberAbove(0),
    redlineRpm: requireNumberAbove(0, "rpm"),
    drivetrainEfficiency: share,
    // How long each gear change takes with no drive (decision E1 (a)).
    gearChangeS: requireNumberAbove(0, "s"),
  },
  air: {
    dragCoefficient: requireNumberAbove(0),
    frontalAreaM2: requireNumberAbove(0, "m²"),
  },
  // A published brake test: from this speed, stopped in this distance.
  brakes: {
    frontShare: share,
    testFromSpeedMs: requireNumberAbove(0, "m/s"),
    testStoppingDistanceM: requireNumberAbove(0, "m"),
  },
  // Published performance; the physics never reads these, the tests drive
  // the car and compare.
  published: {
    testToSpeedMs: requireNumberAbove(0, "m/s"),
    testTimeS: requireNumberAbove(0, "s"),
    topSpeedMs: requireNumberAbove(0, "m/s"),
  },
} satisfies Record<string, Record<string, Parser<unknown>>>;

type FigureGroupName = keyof typeof FIGURE_GROUPS;

const FIGURE_GROUP_NAMES = Object.keys(FIGURE_GROUPS) as FigureGroupName[];

// Where one figure came from: `quantity` names it as group.field.
const figureSource = requireRecord({
  quantity: requireText(),
  source: requireText(),
  url: httpsLink,
  status: requireOneOf(CONSTANT_STATUSES),
});

// Fields only a wheeled vehicle has (approver's F4).
const DRIVING_FIELDS = [...FIGURE_GROUP_NAMES, "figureSources"] as const;

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
  drivenAxle: requireOneOf(DRIVEN_AXLES),
  body: requireRecord(FIGURE_GROUPS.body),
  wheels: requireRecord(FIGURE_GROUPS.wheels),
  engine: requireRecord(FIGURE_GROUPS.engine),
  air: requireRecord(FIGURE_GROUPS.air),
  brakes: requireRecord(FIGURE_GROUPS.brakes),
  published: requireRecord(FIGURE_GROUPS.published),
  figureSources: requireListOf(figureSource, 1),
};

type DrivingField = (typeof DRIVING_FIELDS)[number];
type VehicleFields = Fields<typeof vehicleShape, DrivingField>;

// A class can only move in the ways that suit it, so a bus that floats like a
// boat is refused; the problem points at the `dynamics` line.
function movementProblemInVehicle(vehicle: Pick<VehicleFields, "class" | "dynamics">): Problem[] {
  const allowed = dynamicsFor[vehicle.class];
  if (allowed.includes(vehicle.dynamics)) return [];
  const ways = allowed.map((way) => `\`${way}\``).join(", ");
  return [problemAt(["dynamics"], `a ${vehicle.class} cannot move as "${vehicle.dynamics}"; it can move as ${ways}.`)];
}

// Only wheeled physics exists, so only a wheeled vehicle may carry, and must
// carry, the driving figures; any other kind would need invented numbers,
// which breaks the data rule (approver's F4).
function figurePresenceProblemsInVehicle(vehicle: Pick<VehicleFields, "dynamics" | DrivingField>): Problem[] {
  if (vehicle.dynamics === "wheeled") {
    return DRIVING_FIELDS.filter((name) => vehicle[name] === undefined).map((name) =>
      problemAt([], `${labelForPath([name])} is missing; a wheeled vehicle needs its driving figures.`),
    );
  }
  return DRIVING_FIELDS.filter((name) => vehicle[name] !== undefined).map((name) =>
    problemAt(
      [name],
      `${labelForPath([name])} is only for wheeled vehicles; this vehicle moves as "${vehicle.dynamics}", which has no driving physics yet.`,
    ),
  );
}

// The list of figures comes from the one place they are defined, so adding a
// figure can never skip the source check.
function figureNamesInShape(groups: Record<string, Record<string, unknown>>): string[] {
  return Object.entries(groups).flatMap(([group, fields]) => Object.keys(fields).map((field) => `${group}.${field}`));
}

// A slipped digit in a size makes a car whose wheels stick out of its body or
// whose centre of mass is above its roof: the physics would run, and the car
// would feel wrong with no clue why.
function sizeProblemsInVehicle(vehicle: Pick<VehicleFields, "body" | "wheels">): Problem[] {
  const { body, wheels } = vehicle;
  if (body === undefined || wheels === undefined) return [];
  const problems: Problem[] = [];
  if (!(body.wheelbaseM < body.lengthM)) {
    problems.push(problemAt(["body", "wheelbaseM"], `\`body.wheelbaseM\` must be shorter than \`body.lengthM\`; found ${body.wheelbaseM} and ${body.lengthM}.`));
  }
  if (!(body.trackM < body.widthM)) {
    problems.push(problemAt(["body", "trackM"], `\`body.trackM\` must be narrower than \`body.widthM\`; found ${body.trackM} and ${body.widthM}.`));
  }
  if (!(body.centreOfMassHeightM < body.heightM)) {
    problems.push(
      problemAt(
        ["body", "centreOfMassHeightM"],
        `\`body.centreOfMassHeightM\` must be below \`body.heightM\`; found ${body.centreOfMassHeightM} and ${body.heightM}.`,
      ),
    );
  }
  if (!(2 * wheels.radiusM < body.heightM)) {
    problems.push(problemAt(["wheels", "radiusM"], `\`wheels.radiusM\` is ${wheels.radiusM} m: a wheel this big is taller than the car (\`body.heightM\` is ${body.heightM} m).`));
  }
  return problems;
}

// The published kerb-to-kerb circle is traced by the outer front wheel, so
// half the track comes off its radius before the steering angle is worked out
// (approver's F3; the same formula as maxSteerAngleRad in
// src/vehicle/rapier-settings.ts). Too tight a circle has no real angle.
function turningProblemInVehicle(vehicle: Pick<VehicleFields, "body" | "wheels">): Problem[] {
  const { body, wheels } = vehicle;
  if (body === undefined || wheels === undefined) return [];
  if (wheels.turningCircleM / 2 - body.trackM / 2 > body.wheelbaseM) return [];
  return [
    problemAt(
      ["wheels", "turningCircleM"],
      `\`wheels.turningCircleM\`: a turning circle of ${wheels.turningCircleM} m is too tight for a ${body.wheelbaseM} m wheelbase and ${body.trackM} m track; use the kerb-to-kerb diameter the maker publishes, not the radius.`,
    ),
  ];
}

// The gearbox changes up through the gears in order, so each forward gear must
// be taller (a smaller ratio) than the one before (decision E1 (a)).
function gearOrderProblemInVehicle(vehicle: Pick<VehicleFields, "engine">): Problem[] {
  const gears = vehicle.engine?.forwardGearRatios ?? [];
  // Each gear after the first, against the one before it.
  const outOfOrder = gears.slice(1).findIndex((ratio, index) => !(ratio < Number(gears[index]))) + 1;
  if (outOfOrder === 0) return [];
  return [
    problemAt(
      ["engine", "forwardGearRatios"],
      `\`engine.forwardGearRatios\`: gear ${outOfOrder + 1} (ratio ${gears[outOfOrder]}) must be smaller than gear ${outOfOrder} (ratio ${gears[outOfOrder - 1]}); list them first gear first, as the maker's sheet does.`,
    ),
  ];
}

// The data rule, every number traced: each figure has exactly one source.
function figureSourceProblems(vehicle: Pick<VehicleFields, "figureSources">): Problem[] {
  const sources = vehicle.figureSources;
  if (sources === undefined) return [];
  return figureNamesInShape(FIGURE_GROUPS).flatMap((name) => sourceCountProblem(name, sources, "figureSources", "figure"));
}

const vehicleChecker = addCrossFieldRules(
  vehicleShape,
  [
    { reads: ["class", "dynamics"], problems: movementProblemInVehicle },
    { reads: ["dynamics", ...DRIVING_FIELDS], problems: figurePresenceProblemsInVehicle },
    { reads: ["body", "wheels"], problems: sizeProblemsInVehicle },
    { reads: ["body", "wheels"], problems: turningProblemInVehicle },
    { reads: ["engine"], problems: gearOrderProblemInVehicle },
    { reads: ["figureSources"], problems: figureSourceProblems },
  ],
  DRIVING_FIELDS,
);

// A checked vehicle, with its driving figures. Only wheeled physics exists,
// and the checker makes sure every wheeled vehicle has every figure; a
// vehicle that moves another way has none, and the game refuses to drive it
// before any physics reads them (src/game/load.ts). So the figures are typed
// as present, which is what every reader of a drivable vehicle needs.
export type Vehicle = Fields<typeof vehicleShape>;

// Checked the same way as a place, by file name and line (scope 002b, 2h).
// Safe cast: see Vehicle above.
export function validateVehicle(fileName: string, text: string): FileCheck<Vehicle> {
  return validateJsonFile(fileName, text, vehicleChecker as Parser<Vehicle>);
}
