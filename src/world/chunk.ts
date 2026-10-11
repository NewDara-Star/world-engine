// The two map file formats the bake writes and the game reads, and their
// checkers. A bad file gives a problem with the file's name, never a crash or
// a half-drawn road. The index is small and uses the place checker's pieces
// (src/place/parse.ts); a chunk can hold thousands of numbers, so it has its
// own quick checks. Design: docs/designs/src/world/chunk.md.
//
// Chunk file places/<id>/chunks/<east>_<north>.json:
//   {"format":1,"cell":{"east":3,"north":-2},"corners":[e0,n0,e1,n1,…],"triangles":[a,b,c,…]}
//   Corners are whole centimetres east and north of the square's south-west
//   corner (0 to 10000); triangles list three corner numbers each,
//   anticlockwise from above.
// Index file places/<id>/chunks/index.json:
//   {"format":1,"cellSizeM":100,"centre":{"lat","lon"},"extent":{"westM","southM","eastM","northM"},
//    "start":{"eastM","northM","headingDeg","roadWidthM","oneWay"},"cells":["3_-2",…],
//    "buildingCells":["3_-2",…]}
//   Format 2 (scope 006) added buildingCells, the squares with a buildings
//   file (src/world/buildings.ts).
import { type FileCheck, validateJsonFile } from "../place/check-file.js";
import {
  type FieldPath,
  type Fields,
  type Parsed,
  type Parser,
  type Problem,
  addCrossFieldRules,
  labelForPath,
  problemAt,
  requireListOf,
  requireNumberAbove,
  requireNumberBetween,
  requireNumberFromBelow,
  requireRecord,
  requireTextMatching,
  requireTrueOrFalse,
} from "../place/parse.js";
import type { Place } from "../place/place.js";
import { type Cell, cellKey } from "./grid.js";

const FORMAT = 1;
const INDEX_FORMAT = 2;
// A square is 100 m, so a corner is 0 to 10000 cm from its south-west corner.
const LARGEST_CORNER_CM = 10_000;
// The farthest a map may reach (place.ts, mapHalfSizeM).
const FARTHEST_M = 50_000;

export interface Chunk {
  cell: Cell;
  corners: number[];
  triangles: number[];
}

// The squares the map has, each named east_north. A square listed twice would
// be loaded twice and drawn on top of itself, so a repeat is refused here, in
// the list's own check: a cross-field rule would wait for a misspelt name and
// add "Fix these first" to a file with only that one mistake.
function requireSquareNames(): Parser<string[]> {
  const checkNames = requireListOf(requireTextMatching(/^-?\d+_-?\d+$/, "a square's name: east, an underscore, north, such as `3_-2`"), 0);
  function checkSquareNames(value: unknown, path: FieldPath): Parsed<string[]> {
    const names = checkNames(value, path);
    if (!names.ok) return names;
    const repeated = names.value.findIndex((key, at) => names.value.indexOf(key) !== at);
    if (repeated < 0) return names;
    return { ok: false, problems: [problemAt([...path, repeated], `${labelForPath(path)} lists \`${names.value[repeated]}\` twice.`)], crossCheckWaited: false };
  }
  return checkSquareNames;
}

const indexShape = {
  format: requireNumberBetween(INDEX_FORMAT, INDEX_FORMAT),
  cellSizeM: requireNumberAbove(0, "m"),
  centre: requireRecord({
    lat: requireNumberBetween(-90, 90, "degrees"),
    lon: requireNumberBetween(-180, 180, "degrees"),
  }),
  extent: requireRecord({
    westM: requireNumberBetween(-FARTHEST_M, FARTHEST_M, "m"),
    southM: requireNumberBetween(-FARTHEST_M, FARTHEST_M, "m"),
    eastM: requireNumberBetween(-FARTHEST_M, FARTHEST_M, "m"),
    northM: requireNumberBetween(-FARTHEST_M, FARTHEST_M, "m"),
  }),
  start: requireRecord({
    eastM: requireNumberBetween(-FARTHEST_M, FARTHEST_M, "m"),
    northM: requireNumberBetween(-FARTHEST_M, FARTHEST_M, "m"),
    headingDeg: requireNumberFromBelow(0, 360, "degrees"),
    roadWidthM: requireNumberAbove(0, "m"),
    oneWay: requireTrueOrFalse(),
  }),
  cells: requireSquareNames(),
  buildingCells: requireSquareNames(),
};

type IndexFields = Fields<typeof indexShape>;

// A map whose west edge is not west of its east edge has no inside.
function extentOrderProblems(index: Pick<IndexFields, "extent">): Problem[] {
  const { westM, southM, eastM, northM } = index.extent;
  const problems: Problem[] = [];
  if (!(westM < eastM)) problems.push(problemAt(["extent", "westM"], `\`extent.westM\` (${westM}) must be west of, so below, \`extent.eastM\` (${eastM}).`));
  if (!(southM < northM)) problems.push(problemAt(["extent", "southM"], `\`extent.southM\` (${southM}) must be south of, so below, \`extent.northM\` (${northM}).`));
  return problems;
}

const indexChecker = addCrossFieldRules(indexShape, [
  { reads: ["extent"], problems: extentOrderProblems },
]);

export type ChunkIndex = IndexFields;

// A damaged or half-downloaded map file must not crash the game or draw a
// spike across the sky; it is skipped and the player is told part of the map
// is missing. JSON.parse (ECMA-262) throws a SyntaxError on cut-short text.
export function validateChunk(fileName: string, text: string, cell: Cell): FileCheck<Chunk> {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    return { ok: false, messages: [`${fileName}: the file is not readable JSON; it may be cut short.`] };
  }
  const problems = chunkShapeProblems(value, cell);
  if (problems.length > 0) return { ok: false, messages: problems.map((problem) => `${fileName}: ${problem}`) };
  const chunk = value as Chunk;
  return { ok: true, value: { cell: { east: chunk.cell.east, north: chunk.cell.north }, corners: chunk.corners, triangles: chunk.triangles } };
}

// Each check catches one way a file goes wrong. Loops, not regular
// expressions, so a square crowded with road is checked in time that grows
// evenly with its size. Object() turns null or a number into an object with
// no fields, so any JSON value can be looked into without a crash.
export function chunkShapeProblems(value: unknown, cell: Cell): string[] {
  const chunk = Object(value) as Record<string, unknown>;
  const found = Object(chunk["cell"]) as Record<string, unknown>;
  const corners: unknown[] = Array.isArray(chunk["corners"]) ? chunk["corners"] : [Number.NaN];
  const triangles: unknown[] = Array.isArray(chunk["triangles"]) ? chunk["triangles"] : [Number.NaN];
  const cornerCount = Math.floor(corners.length / 2);
  const cornersGood = [
    corners.length % 2 === 0,
    corners.every(Number.isInteger),
    corners.reduce<number>((lowest, corner) => Math.min(lowest, Number(corner)), 0) >= 0,
    corners.reduce<number>((highest, corner) => Math.max(highest, Number(corner)), 0) <= LARGEST_CORNER_CM,
  ].every(Boolean);
  const trianglesGood = [
    triangles.length % 3 === 0,
    triangles.every(Number.isInteger),
    triangles.reduce<number>((lowest, corner) => Math.min(lowest, Number(corner)), 0) >= 0,
    triangles.reduce<number>((highest, corner) => Math.max(highest, Number(corner)), -1) < cornerCount,
  ].every(Boolean);
  const problems: string[] = [];
  if (chunk["format"] !== FORMAT) problems.push(`made by a different bake version (format ${JSON.stringify(chunk["format"])}, not ${FORMAT}); bake again.`);
  if (found["east"] !== cell.east || found["north"] !== cell.north) {
    problems.push(`this file is for square ${String(found["east"])}_${String(found["north"])}, expected ${cellKey(cell)}.`);
  }
  if (!cornersGood) problems.push(`the corner list is broken: it must be an even count of whole numbers from 0 to ${LARGEST_CORNER_CM}.`);
  if (!trianglesGood) problems.push("the triangle list is broken: it must be three corner numbers per triangle, each a corner that exists.");
  return problems;
}

// The index decides what the player can drive; it is checked with the same
// messages as a place file (file, line, found versus needed).
export function validateChunkIndex(fileName: string, text: string): FileCheck<ChunkIndex> {
  return validateJsonFile(fileName, text, indexChecker);
}

// If the place's centre moved, or the grid size changed, after the map was
// baked, every road would be drawn in the wrong place; the player is told to
// bake again instead. The centre is compared exactly: the bake writes it as
// the place file does.
export function indexProblemsForPlace(index: ChunkIndex, place: Pick<Place, "centre">, cellSizeM: number): string[] {
  const problems: string[] = [];
  if (index.cellSizeM !== cellSizeM) {
    problems.push(`The map was baked with ${index.cellSizeM} m squares; this game uses ${cellSizeM} m; bake again.`);
  }
  if (index.centre.lat !== place.centre.lat || index.centre.lon !== place.centre.lon) {
    problems.push("The map was baked for a different centre than the place file's; bake again.");
  }
  return problems;
}
