// The bake's street file (scope 005b): every drivable road's name, size and
// centre line, read back by the game's own checker. Designs:
// tools/bake/streets.md, bake.md, write.md, roads.md; src/world/streets.md.
import { describe, expect, it, assert } from "vitest";
import { existsSync, mkdtempSync, mkdirSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { bakePlace } from "../../tools/bake/bake.js";
import { roadSize } from "../../tools/bake/roads.js";
import { decimetreLine, linesInsideSquare } from "../../tools/bake/streets.js";
import { writeStreetsFile } from "../../tools/bake/write.js";
import { nearestStreetName, validateStreetsFile, type StreetMap } from "../../src/world/streets.js";
import { knownPlanets } from "../place/planets.js";
import { metresFromTinyCentre, tinyExtractText, tinyPlaceText, tinyPlaceTextWith } from "./tiny.js";

const repoRoot = resolve(import.meta.dirname, "../..");

function streetsText(extract = tinyExtractText(), place = tinyPlaceText()): string {
  const baked = bakePlace("tiny.json", place, knownPlanets(), extract);
  if (!baked.ok) return assert.fail(baked.problems.join("\n"));
  return baked.streetsText;
}

function checked(text: string): StreetMap {
  const read = validateStreetsFile("streets.json", text);
  if (!read.ok) return assert.fail(read.messages.join("\n"));
  return read.value;
}

describe("street file from the bake: happy path", () => {
  it("is a file the game's checker accepts, for the place's centre", () => {
    expect(checked(streetsText()).centre).toEqual({ lat: 6.63, lon: 3.36 });
  });

  it("keeps the name exactly as OpenStreetMap has it, escapes undone", () => {
    const names = checked(streetsText()).streets.map((street) => street.name);
    expect(names).toContain("Test Street, One");
    expect(names).toContain("Long Trunk Road");
  });

  it("names the street at the place centre", () => {
    expect(nearestStreetName(checked(streetsText()).streets, { eastM: 0, northM: 0 }, undefined)).toBe("Test Street, One");
  });

  it("puts the line where the chunks put the road, to the decimetre", () => {
    const street = checked(streetsText()).streets.find((one) => one.name === "Test Street, One");
    const first = street?.lines[0]?.points[0];
    const expected = metresFromTinyCentre(6.63005, 3.358);
    expect(first?.eastM).toBeCloseTo(expected.eastM, 1);
    expect(first?.northM).toBeCloseTo(expected.northM, 1);
  });

  it("calls tertiary roads and up major, and the rest minor", () => {
    expect(roadSize({ highway: "primary" })).toBe("major");
    expect(roadSize({ highway: "tertiary_link" })).toBe("major");
    expect(roadSize({ highway: "residential" })).toBe("minor");
    expect(roadSize({ highway: "service" })).toBe("minor");
  });

  it("gives the same bytes every time", () => {
    expect(streetsText()).toBe(streetsText());
  });
});

describe("street file from the bake: sad path", () => {
  it("keeps roads with no name, without a name, so the small map still draws them", () => {
    const unnamed = checked(streetsText()).streets.filter((street) => street.name === undefined);
    expect(unnamed.length).toBeGreaterThan(0);
    expect(streetsText()).not.toContain('"name":""');
  });

  it("leaves out ways a car may not use (the footway, the area, access=no)", () => {
    const text = streetsText();
    const all = checked(text).streets.flatMap((street) => street.lines);
    // w12 footway starts at 6.63225 N, 3.36225 E.
    const footway = metresFromTinyCentre(6.63225, 3.36225);
    const nearFootway = all.flatMap((line) => line.points).some((point) => Math.hypot(point.eastM - footway.eastM, point.northM - footway.northM) < 1);
    expect(nearFootway).toBe(false);
  });

  it("refuses to write anywhere but places/<id>/", async () => {
    const scratch = mkdtempSync(join(tmpdir(), "streets-"));
    await expect(writeStreetsFile(join(scratch, "elsewhere", "omole"), "{}\n")).rejects.toThrow("places/<id>");
    await expect(writeStreetsFile(join(scratch, "places", "Bad Name"), "{}\n")).rejects.toThrow("nothing was written");
    expect(existsSync(join(scratch, "elsewhere"))).toBe(false);
  });

  it("writes places/<id>/streets.json and says where", async () => {
    const scratch = mkdtempSync(join(tmpdir(), "streets-"));
    mkdirSync(join(scratch, "places"));
    const path = await writeStreetsFile(join(scratch, "places", "tiny"), streetsText());
    expect(path).toBe(join(scratch, "places", "tiny", "streets.json"));
    expect(readFileSync(path, "utf8")).toBe(streetsText());
  });
});

describe("street file from the bake: idiot-proof path", () => {
  it("does not give a name that is only spaces", () => {
    const extract = `${tinyExtractText()}w90 Thighway=residential,name=%20%%20% Nn90x3.3585y6.6290,n91x3.3590y6.6290\n`;
    expect(checked(streetsText(extract)).streets.every((street) => street.name === undefined || street.name.trim() !== "")).toBe(true);
  });

  it("drops a point that rounds onto the one before it, and turns minus zero into 0", () => {
    expect(decimetreLine([{ eastM: -0.01, northM: 0 }, { eastM: 0.02, northM: 0.01 }, { eastM: 1, northM: 0 }])).toEqual([0, 0, 10, 0]);
  });

  it("gives the same file whatever order the ways are in the extract", () => {
    const lines = tinyExtractText().trimEnd().split("\n");
    const ways = lines.filter((line) => line.startsWith("w")).toReversed();
    const others = lines.filter((line) => !line.startsWith("w"));
    expect(streetsText(`${[...others, ...ways].join("\n")}\n`)).toBe(streetsText());
  });
});

describe("street file from the bake: tragedy path", () => {
  it("cuts a road that runs far past the map, keeping 150 m past the edge", () => {
    const all = checked(streetsText()).streets.flatMap((street) => street.lines.flatMap((line) => line.points));
    // The tiny place's map is 300 m each way; the trunk road w22 runs on for kilometres.
    const farthest = Math.max(...all.map((point) => Math.max(Math.abs(point.eastM), Math.abs(point.northM))));
    expect(farthest).toBeLessThan(2000);
  });

  it("splits a line that leaves the square and comes back into two lines", () => {
    const out = linesInsideSquare(
      [
        { eastM: 0, northM: 0 },
        { eastM: 500, northM: 0 },
        { eastM: 900, northM: 0 },
        { eastM: 500, northM: 10 },
        { eastM: 0, northM: 10 },
      ],
      450,
    );
    expect(out.length).toBe(2);
  });

  it("keeps the street file for a bigger map", () => {
    const big = streetsText(tinyExtractText(), tinyPlaceTextWith({ mapHalfSizeM: 3000 }));
    expect(checked(big).streets.length).toBeGreaterThanOrEqual(checked(streetsText()).streets.length);
  });
});

describe("Omole's baked street file (places/omole/streets.json)", () => {
  const path = resolve(repoRoot, "places/omole/streets.json");
  const text = readFileSync(path, "utf8");
  const omole = checked(text);
  const place = JSON.parse(readFileSync(resolve(repoRoot, "places/omole.json"), "utf8")) as { centre: { lat: number; lon: number } };
  const index = JSON.parse(readFileSync(resolve(repoRoot, "places/omole/chunks/index.json"), "utf8")) as { start: { eastM: number; northM: number } };

  it("was baked for Omole's centre", () => {
    expect(omole.centre).toEqual(place.centre);
  });

  it("says Babatunde Ladega Street where the car starts", () => {
    expect(nearestStreetName(omole.streets, { eastM: index.start.eastM, northM: index.start.northM }, undefined)).toBe("Babatunde Ladega Street");
  });

  it("is small: under 150 kB before the server compresses it", () => {
    expect(Buffer.byteLength(text)).toBeLessThan(150_000);
  });
});
