import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { LICENCES, validatePlace, type Place } from "../../src/place/index.js";

const placesDir = resolve(import.meta.dirname, "../../places");

function readPlace(file: string): unknown {
  return JSON.parse(readFileSync(resolve(placesDir, file), "utf8"));
}

function good(file: string): Place {
  const parsed = validatePlace(readPlace(file));
  if (!parsed.ok) throw new Error(parsed.errors.join("\n"));
  return parsed.value;
}

// A valid place with some fields changed; `undefined` removes a field.
function withChanges(changes: Record<string, unknown>): unknown {
  const place = { ...(readPlace("yaba.json") as object), ...changes };
  return Object.fromEntries(Object.entries(place).filter(([, value]) => value !== undefined));
}

function errorsOf(json: unknown): string[] {
  const parsed = validatePlace(json);
  return parsed.ok ? [] : parsed.errors;
}

describe("place file: happy path", () => {
  it("accepts Finglas, which drives on the left", () => {
    expect(good("finglas.json")).toMatchObject({ id: "finglas", drivingSide: "left", planet: "earth" });
  });

  it("accepts Yaba, which drives on the right", () => {
    expect(good("yaba.json")).toMatchObject({ id: "yaba", drivingSide: "right", planet: "earth" });
  });

  it("accepts every file in places/, so a new place is checked the day it is added", () => {
    const files = readdirSync(placesDir).filter((name) => name.endsWith(".json"));
    expect(files.length).toBeGreaterThanOrEqual(2);
    for (const file of files) expect(errorsOf(readPlace(file)), file).toEqual([]);
  });

  it("names each place file after the place inside it", () => {
    for (const file of readdirSync(placesDir)) expect(good(file).id).toBe(file.replace(".json", ""));
  });
});

describe("place file: sad path (a broken file says what is wrong)", () => {
  it("names the field and the allowed words when the driving side is wrong", () => {
    expect(errorsOf(withChanges({ drivingSide: "up" }))).toEqual([
      'drivingSide: must be one of "left", "right", got "up"',
    ]);
  });

  it("names a missing field", () => {
    expect(errorsOf(withChanges({ gravityMs2: undefined }))).toEqual([
      "gravityMs2: must be a number from 0 to 100 m/s², got nothing",
    ]);
  });

  it("reports every problem at once, not only the first", () => {
    const errors = errorsOf(withChanges({ drivingSide: "up", speedUnits: "knots", name: "" }));
    expect(errors).toHaveLength(3);
  });

  it("points into nested things: which source, which field", () => {
    const sources = [{ name: "Map", url: "http://x.test", licence: "CC0-1.0", attribution: "a" }];
    expect(errorsOf(withChanges({ dataSources: sources }))).toEqual([
      "dataSources[0].url: must be a link starting with https://, got \"http://x.test\"",
    ]);
  });

  it("refuses something that is not a place at all", () => {
    for (const nonsense of [null, "yaba", 42, [], undefined]) {
      expect(errorsOf(nonsense)[0], String(nonsense)).toMatch(/^the file: must be an object/);
    }
  });
});

describe("place file: idiot-proof path", () => {
  it("names a misspelt field instead of silently ignoring it", () => {
    const errors = errorsOf(withChanges({ gravty: 9.8 }));
    expect(errors.some((e) => e.startsWith("gravty: is not a field here"))).toBe(true);
  });

  it("refuses a number written as text, and numbers that are not numbers", () => {
    expect(errorsOf(withChanges({ gravityMs2: "9.8" }))).toHaveLength(1);
    expect(errorsOf(withChanges({ gravityMs2: Number.NaN }))).toHaveLength(1);
    expect(errorsOf(withChanges({ airDensityKgM3: Number.POSITIVE_INFINITY }))).toHaveLength(1);
  });

  it("refuses a latitude off the planet", () => {
    expect(errorsOf(withChanges({ skyPosition: { lat: 91, lon: 0 } }))).toEqual([
      "skyPosition.lat: must be a number from -90 to 90 degrees, got 91",
    ]);
  });

  it("refuses a licence outside the working rule, such as GPL", () => {
    const sources = [{ name: "Map", url: "https://x.test", licence: "GPL-3.0", attribution: "a" }];
    expect(errorsOf(withChanges({ dataSources: sources }))[0]).toContain('dataSources[0].licence: must be one of');
    expect(LICENCES).not.toContain("GPL-3.0");
  });

  it("refuses a place with no data sources, since every place must credit its data", () => {
    expect(errorsOf(withChanges({ dataSources: [] }))).toHaveLength(1);
  });

  it("refuses the same vehicle class listed twice, and none at all", () => {
    expect(errorsOf(withChanges({ allowedVehicleClasses: ["car", "car"] }))).toEqual([
      'the file: allowedVehicleClasses lists "car" twice',
    ]);
    expect(errorsOf(withChanges({ allowedVehicleClasses: [] }))).toHaveLength(1);
  });

  it("refuses ids that could not be used as a file name", () => {
    for (const id of ["Yaba", "yaba lagos", "../yaba", "1yaba", ""]) {
      expect(errorsOf(withChanges({ id })), id).toHaveLength(1);
    }
  });
});

describe("place file: tragedy path (limits, scale, old files)", () => {
  it("accepts the edges of the planet and a world with no gravity or air (space)", () => {
    const edges = { skyPosition: { lat: -90, lon: 180 }, gravityMs2: 0, airDensityKgM3: 0 };
    expect(errorsOf(withChanges(edges))).toEqual([]);
  });

  it("refuses negative gravity and negative air", () => {
    expect(errorsOf(withChanges({ gravityMs2: -9.8, airDensityKgM3: -1 }))).toHaveLength(2);
  });

  it("checks a place with thousands of sources, and reports every bad one", () => {
    const fine = { name: "Map", url: "https://x.test", licence: "CC0-1.0", attribution: "a" };
    const many = Array.from({ length: 5000 }, (_, index) => (index % 5 === 0 ? { ...fine, licence: "?" } : fine));
    expect(errorsOf(withChanges({ dataSources: many }))).toHaveLength(1000);
  });

  it("keeps an enormous wrong value out of the message", () => {
    const [error] = errorsOf(withChanges({ drivingSide: "x".repeat(100_000) }));
    expect(error?.length).toBeLessThan(200);
  });

  it("tells an old file, written before a field existed, exactly which field it lacks", () => {
    const oldFile = withChanges({ constantsNote: undefined, constantsSources: undefined, seaLevelDatum: undefined });
    expect(errorsOf(oldFile).map((e) => e.split(":")[0])).toEqual(["seaLevelDatum", "constantsNote", "constantsSources"]);
  });
});

// Reference: WGS84 normal gravity by Somigliana's formula, NIMA TR8350.2 (2000);
// constants as tabulated at https://ahrs.readthedocs.io/en/latest/constants.html
// (equatorial gravity, Somigliana constant, first eccentricity squared).
function wgs84NormalGravity(latitudeDegrees: number): number {
  const equatorial = 9.7803253359;
  const somigliana = 1.931852652458e-3;
  const eccentricitySquared = 6.69437999014e-3;
  const sinSquared = Math.sin((latitudeDegrees * Math.PI) / 180) ** 2;
  return (equatorial * (1 + somigliana * sinSquared)) / Math.sqrt(1 - eccentricitySquared * sinSquared);
}

// Reference: ISO 2533 standard atmosphere, troposphere (the standard's defining
// constants; the standard text itself was not opened) and the ideal gas law for
// dry air, R = 287.05 J/(kg·K). Worked through in research/30-place-constants.md.
function isoPressureAt(heightM: number): number {
  const lapse = 0.0065;
  const seaLevelK = 288.15;
  const exponent = (9.80665 * 0.0289644) / (8.31446 * lapse);
  return 101325 * (1 - (lapse * heightM) / seaLevelK) ** exponent;
}

function dryAirDensity(celsius: number, pascals: number): number {
  return pascals / (287.05 * (celsius + 273.15));
}

describe("place file: gravity and air density carry their sources (scope 001b)", () => {
  const files = readdirSync(placesDir).filter((name) => name.endsWith(".json"));

  it.each(files)("%s: stored gravity matches the Somigliana formula at the place's latitude", (file) => {
    const place = good(file);
    expect(place.gravityMs2).toBeCloseTo(wgs84NormalGravity(place.skyPosition.lat), 3);
  });

  it.each(files)("%s: cites a source for gravity and for air density", (file) => {
    const quantities = good(file).constantsSources.map((source) => source.quantity);
    expect(quantities).toEqual(expect.arrayContaining(["gravity", "airDensity"]));
  });

  it("Finglas cites Met Éireann 1991–2020 for air density", () => {
    const air = good("finglas.json").constantsSources.find((source) => source.quantity === "airDensity");
    expect(air).toMatchObject({ period: "1991–2020", status: "derived" });
    expect(air?.source).toContain("Met Éireann");
  });

  it("Yaba's air density is derived from Lagos/Ikeja 1991–2020, and says it is not an official NiMet figure", () => {
    const air = good("yaba.json").constantsSources.find((source) => source.quantity === "airDensity");
    expect(air).toMatchObject({ period: "1991–2020", status: "derived" });
    expect(air?.source).toContain("NOT an official NiMet figure");
    expect(air?.source).toContain("gaps");
  });

  it("Yaba's stored air density is the ideal-gas value for 27.8 °C at 40 m in the standard atmosphere", () => {
    expect(good("yaba.json").airDensityKgM3).toBeCloseTo(dryAirDensity(27.8, isoPressureAt(40)), 3);
    expect(good("yaba.json").airDensityKgM3).toBe(1.167);
  });

  it("every constant says whether it is official, derived, or the owner's choice", () => {
    for (const file of files) {
      for (const source of good(file).constantsSources) expect(["official", "derived", "owner-choice"]).toContain(source.status);
    }
  });

  it("refuses the old status words, so a file from before scope 002 says exactly what to change", () => {
    const [first, ...rest] = good("yaba.json").constantsSources;
    const old = [{ ...first, status: "partly-verified" }, ...rest];
    const [error] = errorsOf(withChanges({ constantsSources: old }));
    expect(error).toContain('one of "official", "derived", "owner-choice"');
  });

  it("refuses a place that gives gravity a source but air density none", () => {
    const only = (good("yaba.json").constantsSources.filter((source) => source.quantity === "gravity"));
    expect(errorsOf(withChanges({ constantsSources: only }))).toEqual([
      'the file: constantsSources has no source for "airDensity"',
    ]);
  });

  it("refuses a made-up verification state and a source without a link", () => {
    const [first, ...rest] = good("yaba.json").constantsSources;
    const broken = [{ ...first, status: "trust-me", url: "ncei" }, ...rest];
    expect(errorsOf(withChanges({ constantsSources: broken }))).toHaveLength(2);
  });

  it("refuses an empty list of sources and sources sent as text", () => {
    expect(errorsOf(withChanges({ constantsSources: [] }))).toHaveLength(1);
    expect(errorsOf(withChanges({ constantsSources: "Met Eireann" }))).toHaveLength(1);
  });

  it("checks gravity at the poles and equator without drifting", () => {
    expect(wgs84NormalGravity(0)).toBeCloseTo(9.7803253359, 9);
    expect(wgs84NormalGravity(90)).toBeCloseTo(9.8321849379, 6);
  });
});
