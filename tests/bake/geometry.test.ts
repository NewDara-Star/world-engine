// The bake's geometry: map projection, road shapes, cutting into squares,
// and where the car starts. Designs: tools/bake/projection.md, ribbons.md,
// clip.md and start.md; nearestPointOnSegment, src/world/grid.md. Points are metres east and north of the place centre.
import { describe, expect, it } from "vitest";
import { localProjection } from "../../tools/bake/projection.js";
import { nodeOctagon, roadPieces, segmentRectangle } from "../../tools/bake/ribbons.js";
import { cellsUnderPiece, clipPieceToCell, fanTriangles, trianglesByCell } from "../../tools/bake/clip.js";
import { carStartOnRoad, compassHeading } from "../../tools/bake/start.js";
import { nearestPointOnSegment } from "../../src/world/grid.js";
import { crossOf, metresPerDegree } from "./tiny.js";

interface Point {
  eastM: number;
  northM: number;
}

function at(eastM: number, northM: number): Point {
  return { eastM, northM };
}

function pair(point: Point): [number, number] {
  return [point.eastM, point.northM];
}

// Shoelace area: positive when the corners go round anticlockwise.
function signedArea(corners: readonly Point[]): number {
  let twice = 0;
  corners.forEach((corner, index) => {
    const next = corners[(index + 1) % corners.length] ?? corner;
    twice += corner.eastM * next.northM - next.eastM * corner.northM;
  });
  return twice / 2;
}

function square(west: number, south: number, size: number): Point[] {
  return [at(west, south), at(west + size, south), at(west + size, south + size), at(west, south + size)];
}

function triangleArea(triangle: readonly Point[]): number {
  const [a, b, c] = triangle;
  if (a === undefined || b === undefined || c === undefined) return Number.NaN;
  return crossOf(pair(a), pair(b), pair(c)) / 2;
}

describe("projection: latitude and longitude to metres from the centre", () => {
  it("puts the centre itself at exactly zero", () => {
    expect(localProjection({ lat: 6.63, lon: 3.36 })({ lat: 6.63, lon: 3.36 })).toEqual({ eastM: 0, northM: 0 });
  });

  it("makes a degree of latitude 110,589 m and a degree of longitude 110,580 m at 6.63° N, by the WGS84 radii", () => {
    const toMetres = localProjection({ lat: 6.63, lon: 3.36 });
    const reference = metresPerDegree(6.63);
    expect(toMetres({ lat: 7.63, lon: 3.36 }).northM).toBeCloseTo(reference.north, 2);
    expect(toMetres({ lat: 6.63, lon: 4.36 }).eastM).toBeCloseTo(reference.east, 2);
    expect(Math.abs(reference.north - 110_589)).toBeLessThan(1);
    expect(Math.abs(reference.east - 110_580)).toBeLessThan(1);
  });

  it("gives west and south as negative metres", () => {
    const point = localProjection({ lat: 6.63, lon: 3.36 })({ lat: 6.62, lon: 3.35 });
    expect(point.eastM).toBeLessThan(0);
    expect(point.northM).toBeLessThan(0);
  });

  it("shrinks a degree of longitude away from the equator: Finglas, 53.4° N", () => {
    const toMetres = localProjection({ lat: 53.396, lon: -6.296 });
    expect(toMetres({ lat: 53.396, lon: -6.286 }).eastM).toBeCloseTo(metresPerDegree(53.396).east / 100, 2);
    expect(toMetres({ lat: 53.406, lon: -6.296 }).northM).toBeCloseTo(metresPerDegree(53.396).north / 100, 2);
  });
});

describe("road shapes: a road becomes flat pieces as wide as the street", () => {
  it("makes a rectangle from A to B: A right, B right, B left, A left, half the width from the line", () => {
    expect(segmentRectangle(at(0, 0), at(10, 0), 3.5)).toEqual([at(0, -3.5), at(10, -3.5), at(10, 3.5), at(0, 3.5)]);
  });

  it("makes a rectangle along a diagonal road the same width all along", () => {
    const corners = segmentRectangle(at(0, 0), at(30, 40), 2) ?? [];
    expect(corners).toHaveLength(4);
    expect(signedArea(corners)).toBeCloseTo(50 * 4, 6);
  });

  it("makes no rectangle for a segment shorter than 1 cm, which has no direction", () => {
    expect(segmentRectangle(at(5, 5), at(5, 5), 3.5) ?? undefined).toBeUndefined();
    expect(segmentRectangle(at(5, 5), at(5.005, 5), 3.5) ?? undefined).toBeUndefined();
  });

  it("makes an octagon whose flat sides sit exactly half the width from the node, starting due east", () => {
    const corners = nodeOctagon(at(10, 20), 3.5);
    expect(corners).toHaveLength(8);
    const reach = 3.5 / Math.cos(Math.PI / 8);
    corners.forEach((corner: Point, index: number) => {
      const angle = (index * Math.PI) / 4;
      expect(corner.eastM, `corner ${index}`).toBeCloseTo(10 + reach * Math.cos(angle), 9);
      expect(corner.northM, `corner ${index}`).toBeCloseTo(20 + reach * Math.sin(angle), 9);
    });
  });

  it("gives rectangles first, then octagons, in the road's own order, all going round anticlockwise", () => {
    const pieces = roadPieces([at(0, 0), at(50, 0), at(50, 50)], 7);
    expect(pieces).toHaveLength(5);
    expect(pieces.slice(0, 2).map((piece: Point[]) => piece.length)).toEqual([4, 4]);
    expect(pieces.slice(2).map((piece: Point[]) => piece.length)).toEqual([8, 8, 8]);
    expect(pieces[2]?.[0]?.eastM).toBeCloseTo(0 + 3.5 / Math.cos(Math.PI / 8), 9);
    for (const piece of pieces) expect(signedArea(piece)).toBeGreaterThan(0);
  });

  it("drops a repeated node's rectangle but keeps its octagon, so the road has no hole", () => {
    expect(roadPieces([at(0, 0), at(0, 0), at(10, 0)], 7)).toHaveLength(1 + 3);
  });
});

describe("cutting into 100 m squares", () => {
  it("keeps a piece inside one square as it is", () => {
    const piece = square(10, 10, 20);
    expect(signedArea(clipPieceToCell(piece, { east: 0, north: 0 }) ?? [])).toBeCloseTo(400, 9);
  });

  it("gives nothing for a square the piece does not reach", () => {
    expect(clipPieceToCell(square(10, 10, 20), { east: 3, north: 0 }) ?? undefined).toBeUndefined();
  });

  it("cuts a piece across four squares with no gap and no overlap: the parts add up to the whole", () => {
    const piece = nodeOctagon(at(100, 100), 5);
    const cells = cellsUnderPiece(piece);
    expect(cells).toEqual([
      { east: 0, north: 0 },
      { east: 1, north: 0 },
      { east: 0, north: 1 },
      { east: 1, north: 1 },
    ]);
    const parts: Point[][] = cells.map((cell: { east: number; north: number }) => clipPieceToCell(piece, cell) ?? []);
    for (const part of parts) expect(signedArea(part)).toBeGreaterThan(0);
    expect(parts.reduce((sum, part) => sum + signedArea(part), 0)).toBeCloseTo(signedArea(piece), 6);
  });

  it("keeps every cut part inside its own square", () => {
    const piece = segmentRectangle(at(-130, 40), at(270, 60), 4) ?? [];
    for (const cell of cellsUnderPiece(piece)) {
      for (const corner of clipPieceToCell(piece, cell) ?? []) {
        expect(corner.eastM).toBeGreaterThanOrEqual(cell.east * 100 - 1e-9);
        expect(corner.eastM).toBeLessThanOrEqual(cell.east * 100 + 100 + 1e-9);
        expect(corner.northM).toBeGreaterThanOrEqual(cell.north * 100 - 1e-9);
        expect(corner.northM).toBeLessThanOrEqual(cell.north * 100 + 100 + 1e-9);
      }
    }
  });

  it("lists the squares under a piece south row first, west to east, including squares west and south of the centre", () => {
    expect(cellsUnderPiece(square(-150, -150, 100))).toEqual([
      { east: -2, north: -2 },
      { east: -1, north: -2 },
      { east: -2, north: -1 },
      { east: -1, north: -1 },
    ]);
  });

  it("fans a convex shape into triangles from its first corner, all facing up", () => {
    const pentagon = [at(0, 0), at(10, 0), at(12, 8), at(5, 12), at(-2, 8)];
    const triangles = fanTriangles(pentagon);
    expect(triangles).toEqual([
      [at(0, 0), at(10, 0), at(12, 8)],
      [at(0, 0), at(12, 8), at(5, 12)],
      [at(0, 0), at(5, 12), at(-2, 8)],
    ]);
    for (const triangle of triangles) expect(triangleArea(triangle)).toBeGreaterThan(0);
  });

  it("drops a sliver smaller than 1 square centimetre left by a cut", () => {
    const withSliver = [at(0, 0), at(10, 0), at(10, 0.000001), at(10, 10)];
    const triangles = fanTriangles(withSliver);
    expect(triangles).toHaveLength(1);
    expect(triangleArea(triangles[0] ?? [])).toBeCloseTo(50, 6);
  });

  it("puts every piece's triangles in the squares they lie in, keyed by square, with the area kept", () => {
    const pieces = roadPieces([at(-150, 50), at(250, 50)], 7);
    const byCell = trianglesByCell(pieces);
    expect([...byCell.keys()].toSorted()).toEqual(["-1_0", "-2_0", "0_0", "1_0", "2_0"]);
    const area = [...byCell.values()].flat().reduce((sum, triangle) => sum + triangleArea(triangle), 0);
    expect(area).toBeGreaterThan(400 * 7);
  });

  it("gives the same triangles in the same order every time", () => {
    const pieces = roadPieces([at(-150, 50), at(250, 50), at(250, -120)], 7);
    expect([...trianglesByCell(pieces).entries()]).toEqual([...trianglesByCell(pieces).entries()]);
  });
});

describe("where the car starts", () => {
  it("gives compass headings clockwise from north, from 0 up to but not including 360", () => {
    expect(compassHeading(at(0, 0), at(0, 10))).toBeCloseTo(0, 9);
    expect(compassHeading(at(0, 0), at(10, 0))).toBeCloseTo(90, 9);
    expect(compassHeading(at(0, 0), at(0, -10))).toBeCloseTo(180, 9);
    expect(compassHeading(at(0, 0), at(-10, 0))).toBeCloseTo(270, 9);
    expect(compassHeading(at(0, 0), at(-10, 10))).toBeCloseTo(315, 9);
    const nearlyNorth = compassHeading(at(0, 0), at(-1e-12, 10));
    expect(nearlyNorth).toBeGreaterThanOrEqual(0);
    expect(nearlyNorth).toBeLessThan(360);
  });

  it("finds the nearest point on a segment, kept between its ends", () => {
    expect(nearestPointOnSegment(at(5, 3), at(0, 0), at(10, 0))).toEqual({ point: at(5, 0), distanceM: 3 });
    expect(nearestPointOnSegment(at(-4, 3), at(0, 0), at(10, 0))).toEqual({ point: at(0, 0), distanceM: 5 });
    expect(nearestPointOnSegment(at(1, 1), at(2, 2), at(2, 2))).toEqual({ point: at(2, 2), distanceM: Math.SQRT2 });
  });

  function road(wayId: number, points: Point[], tags: Record<string, string> = { highway: "residential" }, widthM = 7) {
    return { wayId, tags, widthM, points };
  }

  it("starts on the road nearest the centre, facing along it, with its width and whether it is one-way", () => {
    const far = road(1, [at(-50, 40), at(50, 40)]);
    const near = road(2, [at(8, -50), at(8, 50)], { highway: "residential", oneway: "yes" }, 3.5);
    expect(carStartOnRoad([far, near])).toEqual({ eastM: 8, northM: 0, headingDeg: 0, roadWidthM: 3.5, oneWay: true });
  });

  it("turns round on a road that is one-way against its drawing direction (oneway=-1), so the car faces the legal way", () => {
    const start = carStartOnRoad([road(1, [at(-50, 5), at(50, 5)], { highway: "residential", oneway: "-1" })]);
    expect(start.headingDeg).toBeCloseTo(270, 9);
    expect(start.oneWay).toBe(true);
  });

  it("calls an untagged roundabout one-way", () => {
    expect(carStartOnRoad([road(1, [at(-50, 5), at(50, 5)], { highway: "residential", junction: "roundabout" })]).oneWay).toBe(true);
  });

  it("keeps the first road in bake order on a tie, so the start never changes between bakes", () => {
    const north = road(1, [at(-50, 10), at(50, 10)]);
    const south = road(2, [at(50, -10), at(-50, -10)]);
    expect(carStartOnRoad([north, south])).toMatchObject({ northM: 10, headingDeg: 90 });
    expect(carStartOnRoad([south, north])).toMatchObject({ northM: -10, headingDeg: 270 });
  });
});
