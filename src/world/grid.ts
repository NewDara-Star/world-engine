// The 100 m squares the world is cut into, used by the bake to cut and by the
// game to stream, so the two can never disagree about where a square is.
// Positions are map words: metres east and north of the place centre. A square
// is named by how many squares east and north of the centre's square it is.
// Design: docs/designs/src/world/grid.md.

// D-0008 (owner, 2026-10-10): the world streams in plain 100 m grid chunks.
export const CELL_SIZE_M = 100;

// A point on the map, in metres east and north of the place centre.
export interface MapPoint {
  eastM: number;
  northM: number;
}

// A square of the grid: how many squares east and north of the centre's square.
export interface Cell {
  east: number;
  north: number;
}

// A square's edges, in metres east and north of the place centre.
export interface CellBounds {
  westM: number;
  southM: number;
  eastM: number;
  northM: number;
}

// Rounding down, not toward zero, so -0.5 m is in square -1 and a point on an
// edge is in the square to its east and north. Adding 0 turns minus zero
// (Math.floor(-0) is -0, ECMA-262) into 0.
export function cellOfPoint(point: MapPoint): Cell {
  return { east: Math.floor(point.eastM / CELL_SIZE_M) + 0, north: Math.floor(point.northM / CELL_SIZE_M) + 0 };
}

// String(-0) is "0" (ECMA-262 Number::toString), so minus zero is written as 0.
export function cellKey(cell: Cell): string {
  return `${String(cell.east)}_${String(cell.north)}`;
}

export function cellBounds(cell: Cell): CellBounds {
  const westM = cell.east * CELL_SIZE_M;
  const southM = cell.north * CELL_SIZE_M;
  return { westM, southM, eastM: westM + CELL_SIZE_M, northM: southM + CELL_SIZE_M };
}

// The distance from a point to the nearest part of a square (0 inside it), so
// a square counts as near when any part of it is near.
export function distanceToCell(point: MapPoint, cell: Cell): number {
  const bounds = cellBounds(cell);
  const outsideEast = Math.max(bounds.westM - point.eastM, 0, point.eastM - bounds.eastM);
  const outsideNorth = Math.max(bounds.southM - point.northM, 0, point.northM - bounds.northM);
  return Math.hypot(outsideEast, outsideNorth);
}

// Nearest first, so the road under and in front of the car arrives before the
// far squares; equal distances in key order, so the order never changes: sorted
// by key (plain UTF-16 order), then by distance, which keeps the key order for
// equal distances because sort is stable (ECMA-262 since 2019).
export function cellsWithin(point: MapPoint, radiusM: number): Cell[] {
  const from = cellOfPoint({ eastM: point.eastM - radiusM, northM: point.northM - radiusM });
  const to = cellOfPoint({ eastM: point.eastM + radiusM, northM: point.northM + radiusM });
  const near: { cell: Cell; distance: number; key: string }[] = [];
  for (let east = from.east; east <= to.east; east += 1) {
    for (let north = from.north; north <= to.north; north += 1) {
      const cell = { east, north };
      const distance = distanceToCell(point, cell);
      if (distance <= radiusM) near.push({ cell, distance, key: cellKey(cell) });
    }
  }
  near.sort((a, b) => Number(a.key > b.key) - Number(a.key < b.key));
  near.sort((a, b) => a.distance - b.distance);
  return near.map((one) => one.cell);
}
