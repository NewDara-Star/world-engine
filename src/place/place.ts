// The place file: everything the engine needs to know about a world, as data.
// The engine never says "Dublin" or "left"; it reads this file.
import { type Infer, type Parsed, listOf, numberBetween, object, oneOf, refine, shortId, someText, textMatching } from "./parse.js";
import { DRIVING_SIDES, LICENCES, SPEED_UNITS, VEHICLE_CLASSES } from "./vocabulary.js";

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

const placeShape = object({
  id: shortId(),
  name: someText(),
  planet: shortId(),
  drivingSide: oneOf(DRIVING_SIDES),
  speedUnits: oneOf(SPEED_UNITS),
  roadRuleSetId: shortId(),
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
});

function repeatedClass(classes: readonly string[]): string | undefined {
  return classes.find((name, index) => classes.indexOf(name) !== index);
}

const placeParser = refine(placeShape, (place) => {
  const repeated = repeatedClass(place.allowedVehicleClasses);
  return repeated === undefined ? undefined : `allowedVehicleClasses lists "${repeated}" twice`;
});

export type Place = Infer<typeof placeParser>;

export function validatePlace(json: unknown): Parsed<Place> {
  return placeParser(json, "");
}
