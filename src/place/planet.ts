// The planet file: for each physical constant a place states, the range any
// place on that planet's surface must sit inside, and where the range came
// from (scope 002c, items 1 and 2). It is data, the same way a place is: the
// engine names no planet; whoever loads the files reads planets/ and hands
// the checked planets in. Design: docs/designs/src/place/planet.md.
import { type FileCheck, validateJsonFile } from "./check-file.js";
import {
  type Infer,
  type Parser,
  type Problem,
  addCrossFieldRules,
  httpsLink,
  problemAt,
  requireNumberAtLeast,
  requireOneOf,
  requireRecord,
  requireShortId,
  requireText,
} from "./parse.js";
import { CONSTANT_QUANTITIES, CONSTANT_STATUSES, CONSTANT_UNITS, type ConstantQuantity } from "./vocabulary.js";

// One constant's range on one planet, as checked. The unit is always the
// vocabulary's unit for that constant.
export interface PlanetRange {
  min: number;
  max: number;
  unit: string;
  source: string;
  url: string;
  status: (typeof CONSTANT_STATUSES)[number];
}

// A range is the referee's rulebook for every town on the planet, so it is
// checked itself: numbers, in the one unit, with a source and the data rule's
// status (CLAUDE.md, "Where a number comes from"). A floor of 0, not more: an
// airless world's air density is about 0.
function requirePlanetRange(unit: string): Parser<PlanetRange> {
  const rangeShape = {
    min: requireNumberAtLeast(0, unit),
    max: requireNumberAtLeast(0, unit),
    unit: requireOneOf([unit]),
    source: requireText(),
    url: httpsLink,
    status: requireOneOf(CONSTANT_STATUSES),
  };
  return addCrossFieldRules(rangeShape, [{ reads: ["min", "max"], problems: minAboveMaxProblems }]);
}

// A range written back to front would refuse every town on the planet, and the
// place-maker would be told their good gravity is wrong, so the range itself is
// pointed at. One value (min equal to max) is allowed.
function minAboveMaxProblems(range: Pick<PlanetRange, "min" | "max">): Problem[] {
  if (range.min > range.max) {
    return [problemAt(["min"], `\`min\` is ${range.min}, above \`max\` (${range.max}); \`min\` must not be above \`max\`.`)];
  }
  return [];
}

// Exactly one range per constant in the vocabulary, each in that constant's unit.
// Safe cast: Object.fromEntries loses the key names, and the entries are made
// from CONSTANT_QUANTITIES itself, one each.
const rangesShape = Object.fromEntries(
  CONSTANT_QUANTITIES.map((quantity) => [quantity, requirePlanetRange(CONSTANT_UNITS[quantity])]),
) as Record<ConstantQuantity, Parser<PlanetRange>>;

const planetChecker = requireRecord({
  id: requireShortId(),
  name: requireText(),
  ranges: requireRecord(rangesShape),
});

export type Planet = Infer<typeof planetChecker>;

// Adding a planet is adding a file, like adding a town; this is the referee
// that checks it, by file name and line.
export function validatePlanet(fileName: string, text: string): FileCheck<Planet> {
  return validateJsonFile(fileName, text, planetChecker);
}
