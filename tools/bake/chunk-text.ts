// Writes the chunk files and the index as text, the same bytes every time for
// the same input: no dates, no machine names, no random order; every list in
// an order fixed by the input; every number in a chunk a whole number of
// centimetres; keys in one fixed order; one newline at the end. The formats
// are stated and checked on the game side (src/world/chunk.ts).
// Design: docs/designs/tools/bake/chunk-text.md.
import { CELL_SIZE_M, type Cell, type CellBounds, type MapPoint, cellBounds, cellKey } from "../../src/world/grid.js";
import type { LatLon } from "./projection.js";
import type { CarStart } from "./start.js";

const CENTIMETRES_PER_METRE = 100;
const CHUNK_FORMAT = 1;
// Format 2 added the squares with buildings (scope 006).
const INDEX_FORMAT = 2;

// A triangle corner in whole centimetres from the square's south-west corner.
interface Corner {
  east: number;
  north: number;
}

// Whole centimetres from the square's south-west corner. Rounding can flip a
// thin sliver over as well as flatten it, and the format promises
// anticlockwise triangles, so both are left out (approver's F23).
export function chunkFileText(cell: Cell, triangles: readonly (readonly MapPoint[])[]): string {
  const southWest = cellBounds(cell);
  const corners: number[] = [];
  const numbers = new Map<string, number>();
  const kept: number[] = [];
  // Sharing corners makes the files about half the size.
  function cornerIndexFor(east: number, north: number): number {
    const key = `${east},${north}`;
    const seen = numbers.get(key);
    if (seen !== undefined) return seen;
    numbers.set(key, corners.length / 2);
    corners.push(east, north);
    return corners.length / 2 - 1;
  }
  for (const triangle of triangles) {
    // Adding 0 turns a rounded minus zero into 0, so it is written "0".
    const [a, b, c] = triangle.map((point) => ({
      east: Math.round((point.eastM - southWest.westM) * CENTIMETRES_PER_METRE) + 0,
      north: Math.round((point.northM - southWest.southM) * CENTIMETRES_PER_METRE) + 0,
    })) as [Corner, Corner, Corner];
    const indices = [a, b, c].map((corner) => cornerIndexFor(corner.east, corner.north));
    // Twice the signed area: positive when anticlockwise.
    const twiceArea = (b.east - a.east) * (c.north - a.north) - (b.north - a.north) * (c.east - a.east);
    if (twiceArea > 0) kept.push(...indices);
  }
  return `${JSON.stringify({ format: CHUNK_FORMAT, cell: { east: cell.east, north: cell.north }, corners, triangles: kept })}\n`;
}

// The index: which squares have road (south row first, then west to east),
// which have buildings, what centre and square size the map was baked for,
// how far it goes (rounded out to whole squares) and where the car starts, in
// whole centimetres and whole degrees.
export function indexFileText(cells: readonly Cell[], buildingCells: readonly Cell[], centre: LatLon, extent: CellBounds, start: CarStart): string {
  const index = {
    format: INDEX_FORMAT,
    cellSizeM: CELL_SIZE_M,
    centre: { lat: centre.lat, lon: centre.lon },
    extent: {
      westM: Math.floor(extent.westM / CELL_SIZE_M) * CELL_SIZE_M + 0,
      southM: Math.floor(extent.southM / CELL_SIZE_M) * CELL_SIZE_M + 0,
      eastM: Math.ceil(extent.eastM / CELL_SIZE_M) * CELL_SIZE_M + 0,
      northM: Math.ceil(extent.northM / CELL_SIZE_M) * CELL_SIZE_M + 0,
    },
    start: {
      eastM: Math.round(start.eastM * CENTIMETRES_PER_METRE) / CENTIMETRES_PER_METRE + 0,
      northM: Math.round(start.northM * CENTIMETRES_PER_METRE) / CENTIMETRES_PER_METRE + 0,
      headingDeg: Math.round(start.headingDeg) % 360,
      roadWidthM: Math.round(start.roadWidthM * CENTIMETRES_PER_METRE) / CENTIMETRES_PER_METRE,
      oneWay: start.oneWay,
    },
    cells: southRowFirst(cells).map(cellKey),
    buildingCells: southRowFirst(buildingCells).map(cellKey),
  };
  return `${JSON.stringify(index, null, 2)}\n`;
}

// Two stable sorts (ECMA-262 since 2019): by east, then by north.
export function southRowFirst(cells: readonly Cell[]): Cell[] {
  return cells.toSorted((a, b) => a.east - b.east).toSorted((a, b) => a.north - b.north);
}
