// The place file: everything the engine needs to know about a world, as data.
// The engine never says "Dublin" or "left"; it reads this file.
import { type FileCheck, validateJsonFile } from "./check-file.js";
import {
  type CrossFieldRule,
  type Fields,
  type Problem,
  addCrossFieldRules,
  httpsLink,
  labelForPath,
  problemAt,
  requireKnownId,
  requireListOf,
  requireNumberAtLeast,
  requireNumberBetween,
  requireOneOf,
  requireRecord,
  requireShortId,
  requireText,
} from "./parse.js";
import type { Planet } from "./planet.js";
import {
  CONSTANT_QUANTITIES,
  CONSTANT_STATUSES,
  CONSTANT_UNITS,
  DRIVING_SIDES,
  LICENCES,
  SPEED_UNITS,
  VEHICLE_CLASSES,
  type ConstantQuantity,
} from "./vocabulary.js";

// A point on the place's planet. Latitude and longitude are in degrees.
const position = requireRecord({
  lat: requireNumberBetween(-90, 90, "degrees"),
  lon: requireNumberBetween(-180, 180, "degrees"),
});

// Where a piece of the world's data came from, and under what licence.
const dataSource = requireRecord({
  name: requireText(),
  url: httpsLink,
  licence: requireOneOf(LICENCES),
  attribution: requireText(),
});

// Where a physical constant came from, the years it covers, and whether it is
// official, derived from measurements, or the owner's choice. The weaknesses
// of the source are written in `source`, in the file.
const constantSource = requireRecord({
  quantity: requireOneOf(CONSTANT_QUANTITIES),
  source: requireText(),
  url: httpsLink,
  period: requireText(),
  status: requireOneOf(CONSTANT_STATUSES),
});

// The shape every place has. `planet` is written as an id here; placeCheckerFor
// puts in its place the check against the planets handed in, keeping the
// field's position, so messages come in the file's order.
const placeShape = {
  id: requireShortId(),
  name: requireText(),
  planet: requireShortId(),
  drivingSide: requireOneOf(DRIVING_SIDES),
  speedUnits: requireOneOf(SPEED_UNITS),
  roadRuleSetId: requireShortId(),
  // Physics reads gravity and air density from here and only from here. Live
  // weather (rain, wind, today's air) is for looks and never changes physics.
  // On their own these only need a floor; their real range is the planet's,
  // checked by planetRangeRule (scope 002c).
  gravityMs2: requireNumberAtLeast(0, CONSTANT_UNITS.gravity),
  airDensityKgM3: requireNumberAtLeast(0, CONSTANT_UNITS.airDensity),
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

// The place field that holds each constant.
const PLACE_FIELD_FOR_CONSTANT = {
  gravity: "gravityMs2",
  airDensity: "airDensityKgM3",
} as const satisfies Record<ConstantQuantity, keyof PlaceFields>;

type ConstantField = (typeof PLACE_FIELD_FOR_CONSTANT)[ConstantQuantity];

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

// 98 for gravity is 9.8 with the point one place off, and 980 is 9.8 with it
// two places off (scope 002c, item 3). The hint is given only when exactly one
// of the two moves lands inside the planet's range: none or both fitting means
// we cannot tell what was meant, and a wrong hint is worse than none (approver,
// F1). The point is moved in the number's own text, not by dividing in binary:
// 1.1 / 10 prints as 0.11000000000000001, while "1.1e-1" reads as exactly 0.11
// (ECMA-262, StringToNumber; run in Node 22).
function decimalPointSlipHint(value: number, min: number, max: number): string | undefined {
  const oneLeft = Number(`${value}e-1`);
  const twoLeft = Number(`${value}e-2`);
  const oneLeftFits = oneLeft >= min && oneLeft <= max;
  const twoLeftFits = twoLeft >= min && twoLeft <= max;
  if (oneLeftFits !== twoLeftFits) return String(oneLeftFits ? oneLeft : twoLeft);
  return undefined;
}

// One rule per constant, so a broken air density never holds back the gravity
// check, and each message points at its own line (scope 002c, item 3).
function planetRangeRule(planets: readonly Planet[], quantity: ConstantQuantity): CrossFieldRule<PlaceFields, "planet" | ConstantField> {
  const field = PLACE_FIELD_FOR_CONSTANT[quantity];
  // The rule is handed only `planet` and this one field, once both are good.
  function rangeProblemsOnPlanet(place: Pick<PlaceFields, "planet" | ConstantField>): Problem[] {
    const planet = planets.find((known) => known.id === place.planet);
    if (planet === undefined) {
      throw new Error(`planetRangeRule: \`${place.planet}\` passed the planet check but is not among the planets handed in.`);
    }
    const range = planet.ranges[quantity];
    const value = place[field];
    if (value >= range.min && value <= range.max) return [];
    let sentence = `${labelForPath([field])} must be from ${range.min} to ${range.max} ${CONSTANT_UNITS[quantity]} on ${planet.id}; found ${value}.`;
    const hint = decimalPointSlipHint(value, range.min, range.max);
    if (hint !== undefined) sentence += ` Did you mean ${hint}?`;
    return [problemAt([field], sentence)];
  }
  return { reads: ["planet", field], problems: rangeProblemsOnPlanet };
}

// The place checker depends on which planets exist, which only the loader
// knows. Every rule runs as soon as the fields it reads are good, so none waits
// for another (scope 002b, 2f; orchestrator decision 2026-10-11).
function placeCheckerFor(planets: readonly Planet[]) {
  const shape = {
    ...placeShape,
    planet: requireKnownId({ one: "planet", many: "planets" }, planets.map((planet) => planet.id)),
  };
  const rules: CrossFieldRule<PlaceFields>[] = [
    { reads: ["allowedVehicleClasses"], problems: repeatedClassProblemsInPlace },
    { reads: ["constantsSources"], problems: sourceProblemsForConstants },
    ...CONSTANT_QUANTITIES.map((quantity) => planetRangeRule(planets, quantity)),
  ];
  return addCrossFieldRules(shape, rules);
}

export type Place = PlaceFields;

// Adding a town is adding a file; this is the referee that checks it, by file
// name and line, against the planet it is on. The planets are handed in,
// already checked by validatePlanet, so the engine names no planet.
export function validatePlace(fileName: string, text: string, planets: readonly Planet[]): FileCheck<Place> {
  return validateJsonFile(fileName, text, placeCheckerFor(planets));
}
