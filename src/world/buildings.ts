// The buildings file the bake writes for a square and the game reads (scope
// 006), its checker, and the walls and flat roofs drawn from it. A bad file is
// skipped with a problem naming it, never a crash or a spike across the sky,
// like a road file (chunk.ts). Extruding a footprint into walls and a roof is
// the plain prism every OSM renderer starts from (OSM2World, Streets GL: MIT,
// research/world-drive/24 section 3; technique only).
// Design: docs/designs/src/world/buildings.md.
//
// File places/<id>/chunks/buildings_<east>_<north>.json:
//   {"format":1,"cell":{"east":3,"north":-2},"buildings":[
//     {"heightCm":600,"shade":2,"rings":[[e0,n0,e1,n1,…],[hole…]],"roof":[a,b,c,…]}]}
//   Corners are whole centimetres east and north of the square's south-west
//   corner; a building belongs to the square that holds its middle, so its
//   corners may reach up to 200 m outside the square. The first ring is the
//   outline, anticlockwise from above; the rest are holes, clockwise. The roof
//   lists three corner numbers per triangle, counting the outline's corners
//   first and then each hole's, anticlockwise from above.
import type { FileCheck } from "../place/check-file.js";
import { type Cell, cellKey } from "./grid.js";

const FORMAT = 1;
// The bake's reach (tools/bake/buildings.ts, REACH_OUTSIDE_SQUARE_CM).
const REACH_OUTSIDE_SQUARE_CM = 20_000;
const LOWEST_CORNER_CM = -REACH_OUTSIDE_SQUARE_CM;
const HIGHEST_CORNER_CM = 10_000 + REACH_OUTSIDE_SQUARE_CM;
// 300 m, the bake's tallest building.
const TALLEST_CM = 30_000;
// How many wall shades there are (src/game/scene.ts).
export const SHADE_COUNT = 4;

export interface Building {
  heightCm: number;
  shade: number;
  rings: number[][];
  roof: number[];
}

export interface BuildingChunk {
  cell: Cell;
  buildings: Building[];
}

// What the phone draws for one square, in metres from the square's south-west
// corner, game axes: x east, y up, z south (so north is minus z). `shades`
// gives each corner's wall shade, or SHADE_COUNT for a roof; `tones` darkens
// walls by the way they face, so two walls meeting at a corner never look
// like one surface, whatever the sun does.
export interface BuildingSurfaces {
  positions: Float32Array;
  normals: Float32Array;
  shades: Uint8Array;
  tones: Float32Array;
  indices: Uint32Array;
}

// JSON.parse (ECMA-262) throws on cut-short text; that becomes a problem.
export function validateBuildingChunk(fileName: string, text: string, cell: Cell): FileCheck<BuildingChunk> {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    return { ok: false, messages: [`${fileName}: the file is not readable JSON; it may be cut short.`] };
  }
  const problems = buildingChunkProblems(value, cell);
  if (problems.length > 0) return { ok: false, messages: problems.map((problem) => `${fileName}: ${problem}`) };
  const chunk = value as BuildingChunk;
  return { ok: true, value: { cell: { east: cell.east, north: cell.north }, buildings: chunk.buildings } };
}

// Object() turns null or a number into an object with no fields, so any JSON
// value can be looked into without a crash (as chunk.ts).
export function buildingChunkProblems(value: unknown, cell: Cell): string[] {
  const chunk = Object(value) as Record<string, unknown>;
  const found = Object(chunk["cell"]) as Record<string, unknown>;
  const problems: string[] = [];
  if (chunk["format"] !== FORMAT) problems.push(`made by a different bake version (format ${JSON.stringify(chunk["format"])}, not ${FORMAT}); bake again.`);
  if (found["east"] !== cell.east || found["north"] !== cell.north) {
    problems.push(`this file is for square ${String(found["east"])}_${String(found["north"])}, expected ${cellKey(cell)}.`);
  }
  const buildings: unknown[] = Array.isArray(chunk["buildings"]) ? chunk["buildings"] : [undefined];
  const broken = buildings.findIndex((building) => !isGoodBuilding(building));
  if (broken >= 0) problems.push(`building ${broken} is broken: it needs a height, a shade, rings of whole centimetres, and roof triangles that name corners it has.`);
  return problems;
}

// One building's every number checked, with loops so a square crowded with
// buildings is checked in time that grows evenly with its size.
export function isGoodBuilding(value: unknown): boolean {
  const building = Object(value) as Record<string, unknown>;
  const rings: unknown[] = Array.isArray(building["rings"]) ? building["rings"] : [];
  const roof: unknown[] = Array.isArray(building["roof"]) ? building["roof"] : [Number.NaN];
  const heightCm = building["heightCm"];
  const shade = building["shade"];
  const cornerCount = rings.reduce<number>((count, ring) => count + (Array.isArray(ring) ? ring.length / 2 : 0), 0);
  return [
    isWholeNumberFrom(heightCm, 1, TALLEST_CM),
    isWholeNumberFrom(shade, 0, SHADE_COUNT - 1),
    rings.length >= 1 && rings.every(isGoodRing),
    roof.length % 3 === 0 && roof.every((corner) => isWholeNumberFrom(corner, 0, cornerCount - 1)),
  ].every(Boolean);
}

export function isWholeNumberFrom(value: unknown, lowest: number, highest: number): boolean {
  return Number.isInteger(value) && Number(value) >= lowest && Number(value) <= highest;
}

// At least three corners, each a pair of whole centimetres within reach.
export function isGoodRing(ring: unknown): boolean {
  if (!Array.isArray(ring) || ring.length < 6 || ring.length % 2 !== 0) return false;
  return ring.every((value) => isWholeNumberFrom(value, LOWEST_CORNER_CM, HIGHEST_CORNER_CM));
}

// How many corners the surfaces need: four per wall, one per roof corner.
function surfaceSizes(chunk: BuildingChunk): { corners: number; indices: number } {
  let corners = 0;
  let indices = 0;
  for (const building of chunk.buildings) {
    const ringCorners = building.rings.reduce((count, ring) => count + ring.length / 2, 0);
    corners += ringCorners * 4 + ringCorners;
    indices += ringCorners * 6 + building.roof.length;
  }
  return { corners, indices };
}

// Every building of a square as one set of triangles, so the phone draws a
// square's buildings in one go (scope 006, item 2).
export function buildingSurfaces(chunk: BuildingChunk): BuildingSurfaces {
  const sizes = surfaceSizes(chunk);
  const surfaces: BuildingSurfaces = {
    positions: new Float32Array(sizes.corners * 3),
    normals: new Float32Array(sizes.corners * 3),
    shades: new Uint8Array(sizes.corners),
    tones: new Float32Array(sizes.corners),
    indices: new Uint32Array(sizes.indices),
  };
  const next = { corner: 0, index: 0 };
  for (const building of chunk.buildings) {
    for (const ring of building.rings) addWalls(surfaces, next, ring, building);
    addRoof(surfaces, next, building);
  }
  return surfaces;
}

// Walls facing east or west are drawn a little lighter than walls facing
// north or south (our own choice, scene.md), so corners always read.
const TONE_FACING_NORTH_OR_SOUTH = 0.86;

// One wall per side of the ring, four corners each with the wall's own
// normal, so each wall is lit flat. A ring going anticlockwise from above has
// its outside on the right of each side; a hole goes clockwise, so its walls
// face into the courtyard.
function addWalls(surfaces: BuildingSurfaces, next: { corner: number; index: number }, ring: readonly number[], building: Building): void {
  const top = building.heightCm / 100;
  const count = ring.length / 2;
  for (let side = 0; side < count; side += 1) {
    const [aEast, aNorth] = [(ring[side * 2] as number) / 100, (ring[side * 2 + 1] as number) / 100];
    const after = (side + 1) % count;
    const [bEast, bNorth] = [(ring[after * 2] as number) / 100, (ring[after * 2 + 1] as number) / 100];
    const length = Math.hypot(bEast - aEast, bNorth - aNorth) || 1;
    // Outward is the side turned a quarter right: (north, −east), and minus
    // north is plus z, so the normal in game axes is (Δnorth, 0, Δeast).
    const normal = [(bNorth - aNorth) / length, 0, (bEast - aEast) / length] as const;
    const tone = TONE_FACING_NORTH_OR_SOUTH + (1 - TONE_FACING_NORTH_OR_SOUTH) * Math.abs(normal[0]);
    const first = next.corner;
    const corners = [
      [aEast, 0, -aNorth],
      [bEast, 0, -bNorth],
      [bEast, top, -bNorth],
      [aEast, top, -aNorth],
    ];
    for (const corner of corners) putCorner(surfaces, next, corner, normal, building.shade, tone);
    surfaces.indices.set([first, first + 1, first + 2, first, first + 2, first + 3], next.index);
    next.index += 6;
  }
}

// The flat roof: every ring corner at the top, facing up, roof-coloured.
function addRoof(surfaces: BuildingSurfaces, next: { corner: number; index: number }, building: Building): void {
  const top = building.heightCm / 100;
  const first = next.corner;
  for (const ring of building.rings) {
    for (let at = 0; at < ring.length; at += 2) {
      putCorner(surfaces, next, [(ring[at] as number) / 100, top, -(ring[at + 1] as number) / 100], [0, 1, 0], SHADE_COUNT, 1);
    }
  }
  surfaces.indices.set(
    building.roof.map((corner) => first + corner),
    next.index,
  );
  next.index += building.roof.length;
}

function putCorner(
  surfaces: BuildingSurfaces,
  next: { corner: number; index: number },
  position: readonly number[],
  normal: readonly number[],
  shade: number,
  tone: number,
): void {
  surfaces.positions.set(position, next.corner * 3);
  surfaces.normals.set(normal, next.corner * 3);
  surfaces.shades[next.corner] = shade;
  surfaces.tones[next.corner] = tone;
  next.corner += 1;
}

// The footprint outline of each building, in metres from the square's
// south-west corner, for its collider: one simple solid per building.
export function buildingOutlinesInMetres(chunk: BuildingChunk): { outline: { eastM: number; northM: number }[]; heightM: number }[] {
  return chunk.buildings.map((building) => {
    const outer = building.rings[0] ?? [];
    const outline = Array.from({ length: outer.length / 2 }, (_, at) => ({ eastM: (outer[at * 2] as number) / 100, northM: (outer[at * 2 + 1] as number) / 100 }));
    return { outline, heightM: building.heightCm / 100 };
  });
}
