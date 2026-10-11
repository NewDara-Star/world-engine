// The place file: everything the engine needs to know about a world, as data.
// The engine never says "Dublin" or "left"; it reads this file.
import { type FileCheck, validateJsonFile } from "./check-file.js";
import {
  type Fields,
  type Problem,
  addCrossFieldRules,
  problemAt,
  requireListOf,
  requireNumberBetween,
  requireOneOf,
  requireRecord,
  requireShortId,
  requireText,
  requireTextMatching,
} from "./parse.js";
import { CONSTANT_QUANTITIES, DRIVING_SIDES, LICENCES, SPEED_UNITS, VEHICLE_CLASSES, CONSTANT_STATUSES } from "./vocabulary.js";

const linkPattern = /^https:\/\/\S+$/;

// A point on the place's planet. Latitude and longitude are in degrees.
const position = requireRecord({
  lat: requireNumberBetween(-90, 90, "degrees"),
  lon: requireNumberBetween(-180, 180, "degrees"),
});

// Where a piece of the world's data came from, and under what licence.
const dataSource = requireRecord({
  name: requireText(),
  url: requireTextMatching(linkPattern, "a link starting with https://"),
  licence: requireOneOf(LICENCES),
  attribution: requireText(),
});

// Where a physical constant came from, the years it covers, and whether it is
// official, derived from measurements, or the owner's choice. The weaknesses
// of the source are written in `source`, in the file.
const constantSource = requireRecord({
  quantity: requireOneOf(CONSTANT_QUANTITIES),
  source: requireText(),
  url: requireTextMatching(linkPattern, "a link starting with https://"),
  period: requireText(),
  status: requireOneOf(CONSTANT_STATUSES),
});

const placeShape = {
  id: requireShortId(),
  name: requireText(),
  planet: requireShortId(),
  drivingSide: requireOneOf(DRIVING_SIDES),
  speedUnits: requireOneOf(SPEED_UNITS),
  roadRuleSetId: requireShortId(),
  // Physics reads gravity and air density from here and only from here. Live
  // weather (rain, wind, today's air) is for looks and never changes physics.
  gravityMs2: requireNumberBetween(0, 100, "m/s²"),
  airDensityKgM3: requireNumberBetween(0, 100, "kg/m³"),
  // What "0 m" means for heights in this place (the sea surface, or the planet's datum).
  seaLevelDatum: requireText(),
  // Where the sky is computed from: the sun and stars as seen from here.
  skyPosition: position,
  allowedVehicleClasses: requireListOf(requireOneOf(VEHICLE_CLASSES), 1),
  dataSources: requireListOf(dataSource, 1),
  // How gravity and air density were worked out, so the numbers can be checked.
  constantsNote: requireText(),
  constantsSources: requireListOf(constantSource, 1),
};

type PlaceFields = Fields<typeof placeShape>;

function firstRepeatedVehicleClass(classes: readonly string[]): string | undefined {
  return classes.find((name, index) => classes.indexOf(name) !== index);
}

// The owner's data rule (CLAUDE.md, "Where a number comes from"): each physical
// constant has exactly one source, so nobody has to guess which one the number
// came from (scope 002b, 2f). Paths are inside the place; the rule puts the
// place's path in front.
function sourceProblemForOneConstant(quantity: string, sources: PlaceFields["constantsSources"]): Problem[] {
  const positions = sources
    .map((source, index) => ({ quantity: source.quantity, index }))
    .filter((source) => source.quantity === quantity)
    .map((source) => source.index);
  if (positions.length === 0) return [problemAt(["constantsSources"], `\`constantsSources\` has no source for \`${quantity}\`.`)];
  if (positions.length === 1) return [];
  return [
    problemAt(
      ["constantsSources", ...positions.slice(1, 2)],
      `\`constantsSources\` has ${positions.length} sources for \`${quantity}\`; each constant needs exactly one.`,
    ),
  ];
}

function sourceProblemsForConstants(place: Pick<PlaceFields, "constantsSources">): Problem[] {
  return CONSTANT_QUANTITIES.flatMap((quantity) => sourceProblemForOneConstant(quantity, place.constantsSources));
}

function repeatedClassProblemsInPlace(place: Pick<PlaceFields, "allowedVehicleClasses">): Problem[] {
  const repeated = firstRepeatedVehicleClass(place.allowedVehicleClasses);
  if (repeated !== undefined) return [problemAt(["allowedVehicleClasses"], `\`allowedVehicleClasses\` lists \`${repeated}\` twice.`)];
  return [];
}

// Two rules, each run as soon as its own field is good, so neither waits for
// the other (scope 002b, 2f; orchestrator decision 2026-10-11).
const placeChecker = addCrossFieldRules(placeShape, [
  { reads: ["allowedVehicleClasses"], problems: repeatedClassProblemsInPlace },
  { reads: ["constantsSources"], problems: sourceProblemsForConstants },
]);

export type Place = PlaceFields;

// Adding a town is adding a file; this is the referee that checks it, by file
// name and line.
export function validatePlace(fileName: string, text: string): FileCheck<Place> {
  return validateJsonFile(fileName, text, placeChecker);
}
