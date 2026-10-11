// Cuts the road pieces into the 100 m squares the game streams (D-0008), and
// turns each cut piece into triangles. Clipping a convex shape against the
// four edges of a square, one edge at a time, is the Sutherland–Hodgman method
// (Sutherland and Hodgman, "Reentrant polygon clipping", Communications of the
// ACM 17(1), 1974; citation checked by the approver). A convex piece cut by a
// square stays convex, so a fan of triangles from its first corner is always
// right. Design: docs/designs/tools/bake/clip.md.
import { type Cell, type MapPoint, cellBounds, cellKey, cellOfPoint } from "../../src/world/grid.js";

// A cut can leave slivers too thin to see, which only cause shading glitches.
const SMALLEST_TRIANGLE_M2 = 1e-4;

// One edge of a square: which way (east or north) it runs across, where it
// is, and which side is inside.
export interface Edge {
  axis: "eastM" | "northM";
  atM: number;
  insideIsAbove: boolean;
}

// Each square's triangles, in bake order, keyed by the square's name. A Map
// keeps the order its keys were first added (ECMA-262), so the result is the
// same every time.
export function trianglesByCell(pieces: readonly MapPoint[][]): Map<string, MapPoint[][]> {
  const byCell = new Map<string, MapPoint[][]>();
  for (const piece of pieces) {
    for (const cell of cellsUnderPiece(piece)) {
      const inside = clipPieceToCell(piece, cell);
      if (inside === undefined) continue;
      const key = cellKey(cell);
      byCell.set(key, [...(byCell.get(key) ?? []), ...fanTriangles(inside)]);
    }
  }
  return byCell;
}

// South row first, west to east within each row.
export function cellsUnderPiece(corners: readonly MapPoint[]): Cell[] {
  const easts = corners.map((corner) => corner.eastM);
  const norths = corners.map((corner) => corner.northM);
  const southWest = cellOfPoint({ eastM: Math.min(...easts), northM: Math.min(...norths) });
  const northEast = cellOfPoint({ eastM: Math.max(...easts), northM: Math.max(...norths) });
  const cells: Cell[] = [];
  for (let north = southWest.north; north <= northEast.north; north += 1) {
    for (let east = southWest.east; east <= northEast.east; east += 1) cells.push({ east, north });
  }
  return cells;
}

export function clipPieceToCell(corners: readonly MapPoint[], cell: Cell): MapPoint[] | undefined {
  const bounds = cellBounds(cell);
  const edges: Edge[] = [
    { axis: "eastM", atM: bounds.westM, insideIsAbove: true },
    { axis: "northM", atM: bounds.southM, insideIsAbove: true },
    { axis: "eastM", atM: bounds.eastM, insideIsAbove: false },
    { axis: "northM", atM: bounds.northM, insideIsAbove: false },
  ];
  const left = edges.reduce<MapPoint[]>((kept, edge) => clipAgainstEdge(kept, edge), [...corners]);
  if (left.length < 3) return undefined;
  return left;
}

// One Sutherland–Hodgman step: walk round the corners, each with the one
// before it, keeping what is inside the edge and the points where a side
// crosses it. Order is kept, so the corners stay anticlockwise.
export function clipAgainstEdge(corners: readonly MapPoint[], edge: Edge): MapPoint[] {
  const kept: MapPoint[] = [];
  for (let index = 0; index < corners.length; index += 1) {
    const corner = corners[index] as MapPoint;
    const before = corners[(index + corners.length - 1) % corners.length] as MapPoint;
    const cornerInside = edge.insideIsAbove === corner[edge.axis] >= edge.atM;
    const beforeInside = edge.insideIsAbove === before[edge.axis] >= edge.atM;
    // Where the side from `before` to `corner` crosses the edge; the crossing
    // is put exactly on the edge, so neighbouring squares meet with no gap.
    const fraction = (edge.atM - before[edge.axis]) / (corner[edge.axis] - before[edge.axis]);
    const crossing = {
      eastM: before.eastM + fraction * (corner.eastM - before.eastM),
      northM: before.northM + fraction * (corner.northM - before.northM),
      [edge.axis]: edge.atM,
    };
    if (cornerInside !== beforeInside) kept.push(crossing);
    if (cornerInside) kept.push(corner);
  }
  return kept;
}

// A fan from the first corner: right for any convex shape. A triangle smaller
// than 1 cm² is dropped, and the fan carries on from the corner before it, so
// the next triangle takes in the sliver's corner and no hole is left.
export function fanTriangles(corners: readonly MapPoint[]): MapPoint[][] {
  const first = corners[0] as MapPoint;
  const triangles: MapPoint[][] = [];
  let from = corners[1] as MapPoint;
  for (let at = 1; at + 1 < corners.length; at += 1) {
    const next = corners[at + 1] as MapPoint;
    const twiceArea = (from.eastM - first.eastM) * (next.northM - first.northM) - (from.northM - first.northM) * (next.eastM - first.eastM);
    if (twiceArea / 2 >= SMALLEST_TRIANGLE_M2) {
      triangles.push([first, from, next]);
      from = next;
    }
  }
  return triangles;
}
