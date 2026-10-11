// Scope 006: buildings, from the OSM extract to the square files the game
// draws and the solids the car stops at. Fast tests on made-up buildings near
// the tiny fixture's centre (tests/bake/tiny.ts), plus a check of the real
// Omole bake on disk. Designs: tools/bake/buildings.md, src/world/buildings.md.
import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { bakePlace } from "../../tools/bake/bake.js";
import { buildingHeightM, readOplBuildings, roofTriangles, twiceSignedArea } from "../../tools/bake/buildings.js";
import { buildingSurfaces, validateBuildingChunk, type BuildingChunk } from "../../src/world/buildings.js";
import { validateChunkIndex } from "../../src/world/chunk.js";
import { knownPlanets } from "../place/planets.js";
import { TINY_CENTRE, metresPerDegree, tinyExtractText, tinyPlaceText, tinyPlaceTextWith } from "./tiny.js";

const repoRoot = resolve(import.meta.dirname, "../..");
const perDegree = metresPerDegree(TINY_CENTRE.lat);

const HEIGHTS = {
  metresPerLevel: 3,
  defaultM: 6,
  byType: [{ type: "church", heightM: 10 }],
  source: { source: "test", url: "https://example.org/", status: "owner-choice" as const },
};

// An OPL node at a point given in metres east and north of the tiny centre.
function node(id: number, eastM: number, northM: number): string {
  const lon = TINY_CENTRE.lon + eastM / perDegree.east;
  const lat = TINY_CENTRE.lat + northM / perDegree.north;
  return `n${id}x${lon.toFixed(7)}y${lat.toFixed(7)}`;
}

// A closed rectangular way, west, south, east, north edges in metres.
function boxWay(wayId: number, tags: string, west: number, south: number, east: number, north: number): string {
  const first = wayId * 10;
  const corners = [node(first, west, south), node(first + 1, east, south), node(first + 2, east, north), node(first + 3, west, north), node(first, west, south)];
  return `w${wayId} v1 dV c0 t2020-01-01T00:00:00Z i0 u T${tags} N${corners.join(",")}`;
}

// w1 a house; w2 a church across the line between squares -1 and 0 (east 0 m);
// w3 and w4 the outer and inner rings of r5, a block with a courtyard; w6 a
// four-storey office; w7 a way that is not a building.
function buildingsExtract(): string {
  return [
    boxWay(1, "building=house", 20, 20, 30, 32),
    boxWay(2, "building=church", -5, 40, 7, 60),
    boxWay(3, "", 40, -60, 80, -20),
    boxWay(4, "", 50, -50, 70, -30),
    "r5 v1 dV c0 t2020-01-01T00:00:00Z i0 u Tbuilding=yes,type=multipolygon Mw3@outer,w4@inner",
    boxWay(6, "building=office,building:levels=4", -60, -60, -50, -50),
    boxWay(7, "landuse=residential", -90, 80, -80, 90),
  ].join("\n");
}

function bakeWithBuildings(extract = buildingsExtract()) {
  const result = bakePlace("tiny.json", tinyPlaceTextWith({ buildingHeights: HEIGHTS }), knownPlanets(), tinyExtractText(), extract);
  if (!result.ok) throw new Error(result.problems.join("\n"));
  return result;
}

function buildingFiles(result: ReturnType<typeof bakeWithBuildings>) {
  return result.files.filter((file) => file.name.startsWith("buildings_"));
}

function chunkOf(result: ReturnType<typeof bakeWithBuildings>, key: string): BuildingChunk {
  const file = buildingFiles(result).find((one) => one.name === `buildings_${key}.json`);
  if (file === undefined) throw new Error(`no buildings file for ${key}`);
  const [east, north] = key.split("_").map(Number);
  const checked = validateBuildingChunk(file.name, file.text, { east: east ?? 0, north: north ?? 0 });
  if (!checked.ok) throw new Error(checked.messages.join("\n"));
  return checked.value;
}

// The roof's area, from its triangles: twice the signed area of each, in cm².
function roofAreaM2(rings: readonly number[][], roof: readonly number[]): number {
  const corners = rings.flat();
  const at = (corner: number) => [corners[corner * 2] as number, corners[corner * 2 + 1] as number];
  let twiceArea = 0;
  for (let first = 0; first < roof.length; first += 3) {
    twiceArea += twiceSignedArea([...at(roof[first] as number), ...at(roof[first + 1] as number), ...at(roof[first + 2] as number)]);
  }
  return twiceArea / 2 / 10_000;
}

describe("buildings: happy path", () => {
  it("reads building ways and a multipolygon with its hole, and leaves out what is not a building", () => {
    const read = readOplBuildings(buildingsExtract());
    expect(read.problems).toEqual([]);
    expect(read.buildings.map((building) => building.source)).toEqual(["w1", "w2", "w6", "r5"]);
    expect(read.buildings[3]?.holes).toHaveLength(1);
  });

  it("puts each building in the square holding the middle of its footprint, in centimetres from that square's south-west corner", () => {
    const house = chunkOf(bakeWithBuildings(), "0_0").buildings[0];
    // The fixture writes degrees to 7 places, about 1 cm, as OSM does.
    const expected = [2000, 2000, 3000, 2000, 3000, 3200, 2000, 3200];
    expect(house?.rings[0]).toHaveLength(expected.length);
    house?.rings[0]?.forEach((value, at) => expect(Math.abs(value - (expected[at] as number))).toBeLessThanOrEqual(2));
  });

  it("draws a building that sits across a square's edge once, in one square only", () => {
    const result = bakeWithBuildings();
    const churches = buildingFiles(result).flatMap((file) => (JSON.parse(file.text) as BuildingChunk).buildings).filter((building) => building.heightCm === 1000);
    expect(churches).toHaveLength(1);
    expect(chunkOf(result, "0_0").buildings.some((building) => building.heightCm === 1000)).toBe(true);
  });

  it("keeps the courtyard as a hole: the outline anticlockwise, the hole clockwise, and no roof over the hole", () => {
    const block = chunkOf(bakeWithBuildings(), "0_-1").buildings[0] as BuildingChunk["buildings"][number];
    expect(twiceSignedArea(block.rings[0] as number[])).toBeGreaterThan(0);
    expect(twiceSignedArea(block.rings[1] as number[])).toBeLessThan(0);
    // 40 x 40 m less the 20 x 20 m courtyard: 1200 m².
    expect(roofAreaM2(block.rings, block.roof)).toBeCloseTo(1200, 0);
  });

  it("lists exactly the squares with buildings in the index, and the index passes the game's checker", () => {
    const result = bakeWithBuildings();
    const index = result.files.find((file) => file.name === "index.json");
    const checked = validateChunkIndex("index.json", index?.text ?? "");
    expect(checked.ok).toBe(true);
    const listed = checked.ok ? checked.value.buildingCells.map((key) => `buildings_${key}.json`) : [];
    expect(listed.toSorted()).toEqual(buildingFiles(result).map((file) => file.name).toSorted());
  });
});

describe("buildings: the height rule", () => {
  it("uses a mapper's height in metres first", () => {
    expect(buildingHeightM("w1", { building: "church", height: "14 m", "building:levels": "2" }, HEIGHTS).heightM).toBe(14);
  });

  it("then levels times the place's storey height", () => {
    expect(buildingHeightM("w1", { building: "church", "building:levels": "4" }, HEIGHTS).heightM).toBe(12);
  });

  it("then the place's height for the building's type, then its default", () => {
    expect(buildingHeightM("w1", { building: "church" }, HEIGHTS).heightM).toBe(10);
    expect(buildingHeightM("w1", { building: "yes" }, HEIGHTS).heightM).toBe(6);
  });

  it("notes a height or levels it cannot read, and does not guess at feet or words", () => {
    const read = buildingHeightM("w9", { building: "yes", height: "20 ft", "building:levels": "two" }, HEIGHTS);
    expect(read.heightM).toBe(6);
    expect(read.notes).toEqual([expect.stringContaining('w9 has a height we could not read ("20 ft")'), expect.stringContaining('levels we could not read ("two")')]);
  });
});

describe("buildings: sad and idiot-proof paths", () => {
  it("refuses a buildings extract for a place file with no building heights, and says what to add", () => {
    const result = bakePlace("tiny.json", tinyPlaceText(), knownPlanets(), tinyExtractText(), buildingsExtract());
    expect(result.ok ? [] : result.problems).toEqual([expect.stringContaining("no `buildingHeights`")]);
  });

  it("bakes roads only, with an empty buildings list, when no buildings extract is given", () => {
    const result = bakePlace("tiny.json", tinyPlaceText(), knownPlanets(), tinyExtractText());
    expect(result.ok && result.files.some((file) => file.name.startsWith("buildings_"))).toBe(false);
    expect(result.ok && JSON.parse(result.files.find((file) => file.name === "index.json")?.text ?? "{}").buildingCells).toEqual([]);
  });

  it("skips a building way that does not close, and a relation whose ring is missing, with a note each", () => {
    const open = "w8 v1 dV c0 t2020-01-01T00:00:00Z i0 u Tbuilding=yes N" + [node(80, 0, 0), node(81, 5, 0), node(82, 5, 5)].join(",");
    const lonely = "r9 v1 dV c0 t2020-01-01T00:00:00Z i0 u Tbuilding=yes,type=multipolygon Mw99@outer";
    const result = bakeWithBuildings([buildingsExtract(), open, lonely].join("\n"));
    expect(result.notes).toEqual(expect.arrayContaining([expect.stringContaining("way 8 does not close"), expect.stringContaining("relation 9 has a ring that is missing")]));
  });

  it("refuses a broken buildings file in the game with its name, and never draws it", () => {
    const cell = { east: 0, north: 0 };
    const cutShort = validateBuildingChunk("buildings_0_0.json", '{"format":1,"cell":{"east":0', cell);
    const badRoof = validateBuildingChunk("buildings_0_0.json", JSON.stringify({ format: 1, cell, buildings: [{ heightCm: 600, shade: 0, rings: [[0, 0, 100, 0, 0, 100]], roof: [0, 1, 7] }] }), cell);
    const heightAsText = validateBuildingChunk("buildings_0_0.json", JSON.stringify({ format: 1, cell, buildings: [{ heightCm: "600", shade: 0, rings: [[0, 0, 100, 0, 0, 100]], roof: [0, 1, 2] }] }), cell);
    for (const checked of [cutShort, badRoof, heightAsText]) expect(checked.ok ? [] : checked.messages).toEqual([expect.stringContaining("buildings_0_0.json")]);
  });
});

describe("buildings: the same bytes every time", () => {
  it("gives byte-identical building files when baked twice, and whatever order the lines are in", () => {
    const first = buildingFiles(bakeWithBuildings());
    const shuffled = buildingsExtract().split("\n").toReversed().join("\n");
    expect(buildingFiles(bakeWithBuildings())).toEqual(first);
    expect(buildingFiles(bakeWithBuildings(shuffled))).toEqual(first);
  });
});

describe("buildings: what the phone draws", () => {
  const box: BuildingChunk = { cell: { east: 0, north: 0 }, buildings: [{ heightCm: 600, shade: 2, rings: [[0, 0, 1000, 0, 1000, 500, 0, 500]], roof: roofTriangles([[0, 0, 1000, 0, 1000, 500, 0, 500]]) }] };

  it("makes four walls 6 m tall and a flat roof of two triangles for a 10 x 5 m box", () => {
    const surfaces = buildingSurfaces(box);
    expect(surfaces.indices.length).toBe(4 * 6 + 2 * 3);
    expect(Math.max(...surfaces.positions.filter((_, at) => at % 3 === 1))).toBe(6);
  });

  it("turns every wall to face outward: the south wall faces south (+z) and the east wall east (+x)", () => {
    const normals = buildingSurfaces(box).normals;
    expect([...normals.slice(0, 3)].map((value) => value + 0)).toEqual([0, 0, 1]);
    expect([...normals.slice(12, 15)].map((value) => value + 0)).toEqual([1, 0, 0]);
  });

  it("faces every roof triangle up, so none is hidden from the sky", () => {
    const surfaces = buildingSurfaces(box);
    const roofStart = 4 * 6;
    const corners = [...surfaces.positions].flatMap((value, at) => (at % 3 === 0 ? [value] : at % 3 === 2 ? [-value] : []));
    const roof = [...surfaces.indices.slice(roofStart)];
    expect(roofAreaM2([corners.map((value) => value * 100)], roof)).toBeCloseTo(50, 3);
    for (let at = 0; at < roof.length; at += 3) {
      expect(roofAreaM2([corners.map((value) => value * 100)], roof.slice(at, at + 3))).toBeGreaterThan(0);
    }
  });
});

describe("the baked Omole buildings on disk", () => {
  it("has a good buildings file for every square the index lists, and no others", () => {
    const folder = resolve(repoRoot, "places/omole/chunks");
    const index = JSON.parse(readFileSync(resolve(folder, "index.json"), "utf8")) as { buildingCells: string[] };
    const files = readdirSync(folder).filter((name) => name.startsWith("buildings_"));
    expect(files.toSorted()).toEqual(index.buildingCells.map((key) => `buildings_${key}.json`).toSorted());
    expect(files.length).toBeGreaterThan(100);
    for (const key of index.buildingCells) {
      const [east, north] = key.split("_").map(Number);
      const checked = validateBuildingChunk(key, readFileSync(resolve(folder, `buildings_${key}.json`), "utf8"), { east: east ?? Number.NaN, north: north ?? Number.NaN });
      expect(checked.ok ? [] : checked.messages, key).toEqual([]);
    }
  });
});
