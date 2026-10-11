// The whole bake on the hand-made tiny extract (tests/bake/tiny.ts says what
// each way is for). Designs: tools/bake/bake.md, opl.md, roads.md, write.md,
// cli.md; the files it makes are checked with the game's own checkers
// (src/world/chunk.md), so the bake and the game can never disagree.
import { describe, expect, it, assert } from "vitest";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readdirSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { bakePlace, drivableRoadsInMetres } from "../../tools/bake/bake.js";
import { readOplRoadWays } from "../../tools/bake/opl.js";
import { writeBakeFiles } from "../../tools/bake/write.js";
import { readBakeArguments } from "../../tools/bake/cli.js";
import { indexProblemsForPlace, validateChunk, validateChunkIndex } from "../../src/world/chunk.js";
import { knownPlanets } from "../place/planets.js";
import {
  TINY_CENTRE,
  isOnRoad,
  metresFromTinyCentre,
  tinyExtractText,
  tinyPlace,
  tinyPlaceText,
  tinyPlaceTextWith,
  type BakedFile,
} from "./tiny.js";

const repoRoot = resolve(import.meta.dirname, "../..");

type BakeResult = ReturnType<typeof bakePlace>;

function bakeTiny(extract = tinyExtractText(), place = tinyPlaceText()): BakeResult {
  return bakePlace("tiny.json", place, knownPlanets(), extract);
}

function filesOf(result: BakeResult): BakedFile[] {
  if (result.ok) return result.files;
  return assert.fail(`the bake failed:\n${result.problems.join("\n")}`);
}

function notesOf(result: BakeResult): string[] {
  if (result.ok) return result.notes;
  return assert.fail(`the bake failed:\n${result.problems.join("\n")}`);
}

function problemsOf(result: BakeResult): string[] {
  if (result.ok) return assert.fail("the bake succeeded, but it should have refused");
  return result.problems;
}

interface IndexJson {
  format: number;
  cellSizeM: number;
  centre: { lat: number; lon: number };
  extent: { westM: number; southM: number; eastM: number; northM: number };
  start: { eastM: number; northM: number; headingDeg: number; roadWidthM: number; oneWay: boolean };
  cells: string[];
}

function indexOf(files: readonly BakedFile[]): IndexJson {
  const index = files.find((file) => file.name === "index.json");
  if (index === undefined) return assert.fail("the bake made no index.json");
  return JSON.parse(index.text) as IndexJson;
}

function chunkNames(files: readonly BakedFile[]): string[] {
  return files.map((file) => file.name).filter((name) => name !== "index.json");
}

function cellOfKey(key: string): { east: number; north: number } {
  const [east, north] = key.split("_").map(Number);
  return { east: east ?? Number.NaN, north: north ?? Number.NaN };
}

function roadsOf(extract = tinyExtractText()) {
  const read = readOplRoadWays(extract);
  return drivableRoadsInMetres(read.ways, TINY_CENTRE, 3.5);
}

function widthOfWay(id: number): number | undefined {
  return roadsOf().roads.find((road: { wayId: number }) => road.wayId === id)?.widthM;
}

function extractWithLine(line: string): string {
  return `${tinyExtractText()}${line}\n`;
}

const lineCountOfFixture = tinyExtractText().trimEnd().split("\n").length;

describe("bake: happy path", () => {
  it("turns the tiny extract into index.json and one chunk file per 100 m square with road, and lists exactly those squares", () => {
    const files = filesOf(bakeTiny());
    const names = chunkNames(files);
    expect(names.length).toBeGreaterThan(5);
    for (const name of names) expect(name).toMatch(/^-?\d+_-?\d+\.json$/);
    expect(indexOf(files).cells.toSorted()).toEqual(names.map((name) => name.replace(".json", "")).toSorted());
  });

  it("lists the squares south row first, then west to east", () => {
    const cells = indexOf(filesOf(bakeTiny())).cells.map(cellOfKey);
    const sorted = cells.toSorted((a, b) => a.north - b.north || a.east - b.east);
    expect(cells).toEqual(sorted);
  });

  it("records format 1, 100 m squares and the centre exactly as the place file writes it", () => {
    const index = indexOf(filesOf(bakeTiny()));
    expect(index.format).toBe(1);
    expect(index.cellSizeM).toBe(100);
    expect(index.centre).toEqual({ lat: 6.63, lon: 3.36 });
  });

  it("sets the map's extent from the place's mapHalfSizeM, not from how far the extract's roads reach", () => {
    const files = filesOf(bakeTiny());
    expect(indexOf(files).extent).toEqual({ westM: -300, southM: -300, eastM: 300, northM: 300 });
    for (const key of indexOf(files).cells) {
      const cell = cellOfKey(key);
      expect(cell.east, key).toBeGreaterThanOrEqual(-3);
      expect(cell.east, key).toBeLessThanOrEqual(2);
      expect(cell.north, key).toBeGreaterThanOrEqual(-3);
      expect(cell.north, key).toBeLessThanOrEqual(2);
    }
  });

  it("rounds the extent out to whole squares when mapHalfSizeM is not a whole number of squares", () => {
    const files = filesOf(bakeTiny(tinyExtractText(), tinyPlaceTextWith({ mapHalfSizeM: 250 })));
    expect(indexOf(files).extent).toEqual({ westM: -300, southM: -300, eastM: 300, northM: 300 });
  });

  it("parks the car on the road nearest the centre: Test Street, 5.5 m north, facing east, 7 m wide, two-way", () => {
    const start = indexOf(filesOf(bakeTiny())).start;
    expect(start.eastM).toBeCloseTo(0, 2);
    expect(start.northM).toBeCloseTo(metresFromTinyCentre(6.63005, 3.36).northM, 1);
    expect(start).toMatchObject({ headingDeg: 90, roadWidthM: 7, oneWay: false });
  });

  it("writes the start in whole centimetres and whole degrees, like every other baked number", () => {
    const start = indexOf(filesOf(bakeTiny())).start;
    for (const metres of [start.eastM, start.northM, start.roadWidthM]) {
      expect(Math.abs(metres * 100 - Math.round(metres * 100))).toBeLessThan(1e-6);
    }
    expect(Number.isInteger(start.headingDeg)).toBe(true);
  });

  it("puts the start on drawn road", () => {
    const files = filesOf(bakeTiny());
    const start = indexOf(files).start;
    expect(isOnRoad(files, start.eastM + 0.5, start.northM)).toBe(true);
    expect(isOnRoad(files, start.eastM - 0.5, start.northM)).toBe(true);
  });

  it("draws a two-way street with no lanes tag as two lanes of the place's lane width: 7 m across, not 8", () => {
    const files = filesOf(bakeTiny());
    const middle = metresFromTinyCentre(6.63005, 3.36).northM;
    expect(isOnRoad(files, -50, middle + 3.4)).toBe(true);
    expect(isOnRoad(files, -50, middle - 3.4)).toBe(true);
    expect(isOnRoad(files, -50, middle + 3.7)).toBe(false);
    expect(isOnRoad(files, -50, middle - 3.7)).toBe(false);
    expect(isOnRoad(files, 0, 50)).toBe(false);
  });

  it("uses a mapper's width in metres: the primary road tagged 12 m is 12 m across", () => {
    const files = filesOf(bakeTiny());
    const middle = metresFromTinyCentre(6.6297, 3.359).eastM;
    expect(isOnRoad(files, middle + 5.8, -30)).toBe(true);
    expect(isOnRoad(files, middle + 6.3, -30)).toBe(false);
    expect(widthOfWay(14)).toBe(12);
  });

  it("leaves no gap where a road crosses from one square into the next", () => {
    const files = filesOf(bakeTiny());
    const middle = metresFromTinyCentre(6.63005, 3.36).northM;
    for (const edge of [-200, -100, 0, 100, 200]) {
      expect(isOnRoad(files, edge - 0.01, middle), `west of ${edge}`).toBe(true);
      expect(isOnRoad(files, edge + 0.01, middle), `east of ${edge}`).toBe(true);
    }
  });

  it("makes files the game's own checkers accept: every chunk, and the index for this place", () => {
    const files = filesOf(bakeTiny());
    for (const name of chunkNames(files)) {
      const text = files.find((file) => file.name === name)?.text ?? "";
      const checked = validateChunk(name, text, cellOfKey(name.replace(".json", "")));
      expect(checked.ok ? [] : checked.messages, name).toEqual([]);
    }
    const index = validateChunkIndex("index.json", files.find((file) => file.name === "index.json")?.text ?? "");
    if (!index.ok) return assert.fail(index.messages.join("\n"));
    expect(indexProblemsForPlace(index.value, tinyPlace(), 100)).toEqual([]);
  });

  it("writes no empty squares: every chunk file has at least one triangle", () => {
    const files = filesOf(bakeTiny());
    for (const name of chunkNames(files)) {
      const chunk = JSON.parse(files.find((file) => file.name === name)?.text ?? "{}") as { triangles?: unknown[] };
      expect(chunk.triangles?.length ?? 0, name).toBeGreaterThanOrEqual(3);
    }
  });
});

describe("bake: deterministic (same input, byte-identical output)", () => {
  it("gives byte-identical files when run twice", () => {
    expect(filesOf(bakeTiny())).toEqual(filesOf(bakeTiny()));
  });

  it("gives the same bytes whatever order the lines of the extract are in", () => {
    const lines = tinyExtractText().trimEnd().split("\n");
    const reversed = `${lines.toReversed().join("\n")}\n`;
    expect(filesOf(bakeTiny(reversed))).toEqual(filesOf(bakeTiny()));
  });

  it("gives the same bytes for an extract saved with Windows line ends", () => {
    expect(filesOf(bakeTiny(tinyExtractText().replaceAll("\n", "\r\n")))).toEqual(filesOf(bakeTiny()));
  });

  it("ends every file with exactly one newline", () => {
    for (const file of filesOf(bakeTiny())) {
      expect(file.text.endsWith("\n"), file.name).toBe(true);
      expect(file.text.endsWith("\n\n"), file.name).toBe(false);
    }
  });

  it("writes byte-identical files to disk on two bakes into two folders", async () => {
    const root = mkdtempSync(join(tmpdir(), "we-bake-"));
    const folders = ["first", "second"].map((name) => join(root, name, "places", "tiny", "chunks"));
    for (const folder of folders) await writeBakeFiles(folder, filesOf(bakeTiny()));
    const [first, second] = folders.map((folder) =>
      readdirSync(folder)
        .toSorted()
        .map((name) => [name, readFileSync(join(folder, name))] as const),
    );
    expect(first?.length).toBeGreaterThan(5);
    expect(first).toEqual(second);
  });
});

describe("bake: which roads a car may use", () => {
  it("keeps the streets a car may use, in way-id order", () => {
    expect(roadsOf().roads.map((road: { wayId: number }) => road.wayId)).toEqual([10, 11, 14, 16, 18, 19, 20, 22]);
  });

  it("does not draw a footway, a square drawn as a road outline, or a road closed to all traffic", () => {
    const names = chunkNames(filesOf(bakeTiny()));
    expect(names).not.toContain("2_2.json");
    expect(names).not.toContain("-3_2.json");
    expect(names).not.toContain("-3_-3.json");
  });

  it("draws a road closed to traffic but open to cars (access=no, motorcar=yes)", () => {
    expect(chunkNames(filesOf(bakeTiny()))).toContain("2_-3.json");
  });

  it("measures each road in metres east and north of the place centre", () => {
    const testStreet = roadsOf().roads.find((road: { wayId: number }) => road.wayId === 10);
    const expected = [
      metresFromTinyCentre(6.63005, 3.358),
      metresFromTinyCentre(6.63005, 3.3601),
      metresFromTinyCentre(6.63005, 3.362),
    ];
    expect(testStreet?.points).toHaveLength(3);
    testStreet?.points.forEach((point: { eastM: number; northM: number }, at: number) => {
      expect(point.eastM).toBeCloseTo(expected[at]?.eastM ?? Number.NaN, 3);
      expect(point.northM).toBeCloseTo(expected[at]?.northM ?? Number.NaN, 3);
    });
  });
});

describe("bake: sad path (a broken input is reported, and nothing is baked)", () => {
  it("refuses a broken place file, with its file name and line, and bakes nothing", () => {
    const problems = problemsOf(bakeTiny(tinyExtractText(), tinyPlaceTextWith({ laneWidthM: "3.5" })));
    expect(problems.length).toBeGreaterThan(0);
    expect(problems[0]).toMatch(/^tiny\.json line \d+: `laneWidthM`/);
  });

  it("stops at a line with a broken escape, naming the line", () => {
    const problems = problemsOf(bakeTiny(extractWithLine("w30 Thighway=residential,name=Bad%zz%Name Nn50x3.36y6.63,n51x3.361y6.63")));
    expect(problems.join("\n")).toMatch(new RegExp(`line ${lineCountOfFixture + 1}\\b`));
  });

  it("stops at a way whose nodes have no positions, and says how to cut the extract", () => {
    const problems = problemsOf(bakeTiny(extractWithLine("w31 Thighway=residential Nn52xy,n53xy")));
    expect(problems.join("\n")).toContain("31");
    expect(problems.join("\n")).toContain("osmium add-locations-to-ways");
  });

  it("stops at a way line with no id, naming the line", () => {
    const problems = problemsOf(bakeTiny(extractWithLine("wabc Thighway=residential Nn1x3.36y6.63,n2x3.361y6.63")));
    expect(problems.join("\n")).toMatch(new RegExp(`line ${lineCountOfFixture + 1}\\b`));
  });

  it("says plainly when the extract has no road a car can use, and what to check", () => {
    for (const extract of ["", "w12 Thighway=footway Nn6x3.36225y6.63225,n7x3.3624y6.6324\n"]) {
      const problems = problemsOf(bakeTiny(extract));
      expect(problems, JSON.stringify(extract)).toHaveLength(1);
      expect(problems[0]).toContain("no roads a car can use");
    }
  });
});

describe("bake: idiot-proof path (odd data is handled and reported, not guessed at)", () => {
  it("skips a way with one node, notes it in the report, and still bakes the map", () => {
    const notes = notesOf(bakeTiny());
    expect(notes.some((note) => note.includes("17") && note.includes("fewer than two nodes"))).toBe(true);
  });

  it("notes a width it cannot read (10 ft) and draws the road from its lanes instead", () => {
    expect(notesOf(bakeTiny()).some((note) => note.includes("20") && note.includes("10 ft"))).toBe(true);
    expect(widthOfWay(20)).toBe(7);
  });

  it("notes a lanes tag it cannot use (abc) and counts the lanes instead", () => {
    expect(notesOf(bakeTiny()).some((note) => note.includes("19") && note.includes("abc"))).toBe(true);
    expect(widthOfWay(19)).toBe(7);
  });

  it("draws an untagged roundabout one lane wide, because a roundabout is one-way", () => {
    expect(widthOfWay(18)).toBe(3.5);
  });

  it("reads escapes in street names: %20% is a space, and %2c%%20% is a comma then a space", () => {
    const testStreet = readOplRoadWays(tinyExtractText()).ways.find((way: { id: number }) => way.id === 10);
    expect(testStreet?.tags["name"]).toBe("Test Street, One");
  });

  it("skips node and relation lines: ways carry their own positions", () => {
    const read = readOplRoadWays(tinyExtractText());
    expect(read.problems).toEqual([]);
    expect(read.ways.map((way: { id: number }) => way.id).toSorted((a: number, b: number) => a - b)).toEqual([10, 11, 12, 13, 14, 15, 16, 18, 19, 20, 21, 22, 23]);
  });

  it("keeps the last value of a tag written twice", () => {
    const read = readOplRoadWays("w40 Thighway=footway,highway=residential Nn1x3.36y6.63,n2x3.361y6.63\n");
    expect(read.ways[0]?.tags["highway"]).toBe("residential");
  });

  it("reads a way with no tags at all, and does not draw it", () => {
    const read = readOplRoadWays("w41 Nn1x3.36y6.63,n2x3.361y6.63\n");
    expect(read.ways[0]?.tags).toEqual({});
    expect(drivableRoadsInMetres(read.ways, TINY_CENTRE, 3.5).roads).toEqual([]);
  });

  it("reads the arguments of the bake command, and refuses missing or repeated ones with the usage line", () => {
    const good = readBakeArguments(["--place", "places/omole.json", "--extract", "raw-data/omole-roads.opl"]);
    expect(good).toMatchObject({ ok: true, placePath: "places/omole.json", extractPath: "raw-data/omole-roads.opl" });
    for (const words of [["--place", "places/omole.json"], ["--place", "a.json", "--place", "b.json", "--extract", "c.opl"], ["--extract"], []]) {
      const refused = readBakeArguments(words);
      expect(refused.ok, words.join(" ")).toBe(false);
      if (!refused.ok) expect(refused.problem, words.join(" ")).toMatch(/--place[\s\S]*--extract/);
    }
  });
});

describe("bake: writing to disk replaces the old map, and only the map", () => {
  function chunksFolder(): string {
    const folder = join(mkdtempSync(join(tmpdir(), "we-write-")), "places", "tiny", "chunks");
    mkdirSync(folder, { recursive: true });
    return folder;
  }

  it("writes every file and says how many it wrote", async () => {
    const folder = chunksFolder();
    const files = filesOf(bakeTiny());
    expect(await writeBakeFiles(folder, files)).toBe(files.length);
    expect(readdirSync(folder).toSorted()).toEqual(files.map((file) => file.name).toSorted());
  });

  it("removes a square left from an earlier bake that no longer has road", async () => {
    const folder = chunksFolder();
    writeFileSync(join(folder, "9_9.json"), "{}\n");
    await writeBakeFiles(folder, filesOf(bakeTiny()));
    expect(existsSync(join(folder, "9_9.json"))).toBe(false);
  });

  it("touches nothing in the folder but .json files", async () => {
    const folder = chunksFolder();
    writeFileSync(join(folder, "NOTES.txt"), "keep me\n");
    await writeBakeFiles(folder, filesOf(bakeTiny()));
    expect(readFileSync(join(folder, "NOTES.txt"), "utf8")).toBe("keep me\n");
  });

  it("refuses to write anywhere but places/<id>/chunks, so a typo cannot wipe another folder", async () => {
    const root = mkdtempSync(join(tmpdir(), "we-write-"));
    for (const wrong of [join(root, "places", "tiny"), join(root, "raw-data", "chunks"), join(root, "chunks"), join(root, "places", "Tiny Town", "chunks")]) {
      mkdirSync(wrong, { recursive: true });
      writeFileSync(join(wrong, "keep.json"), "{}\n");
      await expect(Promise.resolve().then(() => writeBakeFiles(wrong, filesOf(bakeTiny()))), wrong).rejects.toThrow();
      expect(readFileSync(join(wrong, "keep.json"), "utf8"), wrong).toBe("{}\n");
    }
  });
});

describe("bake: the command a person runs", () => {
  it("ends with failure and the usage line, and writes nothing, when --extract is missing", () => {
    const run = spawnSync("npx", ["tsx", "tools/bake/cli.ts", "--place", "tests/bake/fixtures/tiny-place.json"], {
      cwd: repoRoot,
      encoding: "utf8",
    });
    expect(run.status).not.toBe(0);
    expect(`${run.stdout}${run.stderr}`).toMatch(/--place[\s\S]*--extract/);
    expect(existsSync(join(repoRoot, "places", "tiny"))).toBe(false);
  });
});

describe("bake: tragedy path (a whole town, far ends of the map)", () => {
  // A grid town: streets every `spacing` metres, both ways, across 3 km.
  function gridTown(spacingM: number): string {
    const perDegree = { north: 110589, east: 110580 };
    const lines: string[] = [];
    let node = 1;
    for (let offset = -1450; offset <= 1450; offset += spacingM) {
      const along = Array.from({ length: 31 }, (_, step) => -1500 + step * 100);
      const eastWest = along.map((east) => `n${node++}x${(3.36 + east / perDegree.east).toFixed(7)}y${(6.63 + offset / perDegree.north).toFixed(7)}`);
      const northSouth = along.map((north) => `n${node++}x${(3.36 + offset / perDegree.east).toFixed(7)}y${(6.63 + north / perDegree.north).toFixed(7)}`);
      lines.push(`w${lines.length + 1} Thighway=residential N${eastWest.join(",")}`);
      lines.push(`w${lines.length + 1} Thighway=residential N${northSouth.join(",")}`);
    }
    return `${lines.join("\n")}\n`;
  }

  // D-0035: compare how time grows with size, plus a generous cap.
  it("bakes a 3 km grid town with four times the streets in time that grows evenly", () => {
    const place = tinyPlaceTextWith({ mapHalfSizeM: 1500 });
    const timeToBake = (extract: string) => {
      const started = performance.now();
      expect(chunkNames(filesOf(bakeTiny(extract, place))).length).toBeGreaterThan(100);
      return performance.now() - started;
    };
    const small = gridTown(100);
    const large = gridTown(25);
    timeToBake(small);
    const smallTime = timeToBake(small);
    const largeTime = timeToBake(large);
    expect(largeTime).toBeLessThan(Math.max(16 * smallTime, 500));
    expect(largeTime).toBeLessThan(30_000);
  }, 120_000);

  it("keeps a grid town inside its 1.5 km map, all 900 squares of it at most", () => {
    const files = filesOf(bakeTiny(gridTown(100), tinyPlaceTextWith({ mapHalfSizeM: 1500 })));
    const index = indexOf(files);
    expect(index.extent).toEqual({ westM: -1500, southM: -1500, eastM: 1500, northM: 1500 });
    expect(index.cells.length).toBeLessThanOrEqual(900);
  });
});
