// The data files slice 1 ships: start.json, places/omole.json,
// vehicles/hatchback.json and the baked Omole map. Scope 005 items 2, 3 and 5;
// designs src/place/start.md, place.md, vehicle.md, src/world/chunk.md.
import { describe, expect, it } from "vitest";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { validatePlace, validateVehicle } from "../../src/place/index.js";
import { validateStartChoice } from "../../src/place/start.js";
import { indexProblemsForPlace, validateChunk, validateChunkIndex } from "../../src/world/chunk.js";
import { knownPlanets } from "./planets.js";

const repoRoot = resolve(import.meta.dirname, "../..");

function repoText(path: string): string {
  expect(existsSync(resolve(repoRoot, path)), `${path} exists`).toBe(true);
  return readFileSync(resolve(repoRoot, path), "utf8");
}

function omole() {
  const checked = validatePlace("omole.json", repoText("places/omole.json"), knownPlanets());
  expect(checked.ok ? [] : checked.messages).toEqual([]);
  if (!checked.ok) throw new Error("places/omole.json is not a good place file");
  return checked.value;
}

function omoleIndex() {
  const checked = validateChunkIndex("index.json", repoText("places/omole/chunks/index.json"));
  expect(checked.ok ? [] : checked.messages).toEqual([]);
  if (!checked.ok) throw new Error("places/omole/chunks/index.json is not a good index");
  return checked.value;
}

describe("start.json", () => {
  it("opens Omole with the hatchback", () => {
    const checked = validateStartChoice("start.json", repoText("start.json"));
    expect(checked).toMatchObject({ ok: true, value: { place: "omole", vehicle: "hatchback" } });
  });

  it("names a place and a vehicle whose files exist", () => {
    const choice = JSON.parse(repoText("start.json")) as { place: string; vehicle: string };
    expect(existsSync(resolve(repoRoot, "places", `${choice.place}.json`))).toBe(true);
    expect(existsSync(resolve(repoRoot, "vehicles", `${choice.vehicle}.json`))).toBe(true);
  });
});

describe("places/omole.json", () => {
  it("is Omole on Earth, driving on the right, in km/h", () => {
    expect(omole()).toMatchObject({ id: "omole", planet: "earth", drivingSide: "right", speedUnits: "kmh" });
  });

  it("uses Yaba's gravity and air density, as the research found Omole the same", () => {
    expect(omole()).toMatchObject({ gravityMs2: 9.781, airDensityKgM3: 1.167 });
  });

  it("has its centre in Omole Phase 1, a few kilometres north of Ikeja", () => {
    const centre = omole().centre;
    expect(centre.lat).toBeGreaterThan(6.6);
    expect(centre.lat).toBeLessThan(6.66);
    expect(centre.lon).toBeGreaterThan(3.34);
    expect(centre.lon).toBeLessThan(3.38);
  });

  it("reaches 1.5 km in every direction, recorded as the owner's choice", () => {
    expect(omole().mapHalfSizeM).toBe(1500);
    expect(omole().mapHalfSizeSource.status).toBe("owner-choice");
  });

  it("credits OpenStreetMap under ODbL", () => {
    const osm = omole().dataSources.find((source) => source.attribution.includes("OpenStreetMap"));
    expect(osm?.licence).toBe("ODbL-1.0");
  });
});

describe("vehicles/hatchback.json", () => {
  it("is a good vehicle file that Omole allows", () => {
    const checked = validateVehicle("hatchback.json", repoText("vehicles/hatchback.json"));
    expect(checked.ok ? [] : checked.messages).toEqual([]);
    if (checked.ok) expect(omole().allowedVehicleClasses).toContain(checked.value.class);
  });
});

describe("the baked Omole map in places/omole/chunks", () => {
  it("has an index baked for Omole's centre with 100 m squares, reaching 1.5 km each way", () => {
    const index = omoleIndex();
    expect(indexProblemsForPlace(index, omole(), 100)).toEqual([]);
    expect(index.extent).toEqual({ westM: -1500, southM: -1500, eastM: 1500, northM: 1500 });
  });

  it("has a good chunk file for every square the index lists, and no others", () => {
    const index = omoleIndex();
    const folder = resolve(repoRoot, "places/omole/chunks");
    const files = readdirSync(folder).filter((name) => name !== "index.json");
    expect(files.toSorted()).toEqual(index.cells.map((key: string) => `${key}.json`).toSorted());
    for (const key of index.cells) {
      const [east, north] = key.split("_").map(Number);
      const checked = validateChunk(`${key}.json`, readFileSync(resolve(folder, `${key}.json`), "utf8"), { east: east ?? Number.NaN, north: north ?? Number.NaN });
      expect(checked.ok ? [] : checked.messages, key).toEqual([]);
    }
  });
});
