// The place file: everything the engine needs to know about a world, as data.
// The engine never says "Dublin" or "left"; it reads this file.
import { type Infer, type Parsed, listOf, numberBetween, object, oneOf, refine, shortId, someText, textMatching } from "./parse.js";
import { CONSTANT_QUANTITIES, DRIVING_SIDES, LICENCES, SPEED_UNITS, VEHICLE_CLASSES, VERIFICATION_STATES } from "./vocabulary.js";

const linkPattern = /^https:\/\/\S+$/;

// A point on the place's planet. Latitude and longitude are in degrees.
const position = object({
  lat: numberBetween(-90, 90, "degrees"),
  lon: numberBetween(-180, 180, "degrees"),
});

// Where a piece of the world's data came from, and under what licence.
const dataSource = object({
  name: someText(),
  url: textMatching(linkPattern, "a link starting with https://"),
  licence: oneOf(LICENCES),
  attribution: someText(),
});

// Where a physical constant came from, the years it covers, and how far we
// could check it. A number we could not check says so here, in the file.
const constantSource = object({
  quantity: oneOf(CONSTANT_QUANTITIES),
  source: someText(),
  url: textMatching(linkPattern, "a link starting with https://"),
  period: someText(),
  status: oneOf(VERIFICATION_STATES),
});

const placeShape = object({
  id: shortId(),
  name: someText(),
  planet: shortId(),
  drivingSide: oneOf(DRIVING_SIDES),
  speedUnits: oneOf(SPEED_UNITS),
  roadRuleSetId: shortId(),
  // Physics reads gravity and air density from here and only from here. Live
  // weather (rain, wind, today's air) is for looks and never changes physics.
  gravityMs2: numberBetween(0, 100, "m/s²"),
  airDensityKgM3: numberBetween(0, 100, "kg/m³"),
  // What "0 m" means for heights in this place (the sea surface, or the planet's datum).
  seaLevelDatum: someText(),
  // Where the sky is computed from: the sun and stars as seen from here.
  skyPosition: position,
  allowedVehicleClasses: listOf(oneOf(VEHICLE_CLASSES), 1),
  dataSources: listOf(dataSource, 1),
  // How gravity and air density were worked out, so the numbers can be checked.
  constantsNote: someText(),
  constantsSources: listOf(constantSource, 1),
});

function repeatedClass(classes: readonly string[]): string | undefined {
  return classes.find((name, index) => classes.indexOf(name) !== index);
}

function missingSource(sources: readonly { quantity: string }[]): string | undefined {
  return CONSTANT_QUANTITIES.find((quantity) => !sources.some((source) => source.quantity === quantity));
}

function placeProblem(place: Infer<typeof placeShape>): string | undefined {
  const repeated = repeatedClass(place.allowedVehicleClasses);
  if (repeated !== undefined) return `allowedVehicleClasses lists "${repeated}" twice`;
  const missing = missingSource(place.constantsSources);
  return missing === undefined ? undefined : `constantsSources has no source for "${missing}"`;
}

const placeParser = refine(placeShape, placeProblem);

export type Place = Infer<typeof placeParser>;

export function validatePlace(json: unknown): Parsed<Place> {
  return placeParser(json, "");
}
