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
    const oldFile = withChanges({ constantsNote: undefined, seaLevelDatum: undefined });
    expect(errorsOf(oldFile).map((e) => e.split(":")[0])).toEqual(["seaLevelDatum", "constantsNote"]);
  });
});
