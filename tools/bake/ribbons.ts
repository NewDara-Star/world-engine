// One road (its line in metres and its width) becomes flat convex pieces of
// grey road: a rectangle along each segment and an octagon at each node. Every
// piece goes round anticlockwise seen from above. Overlaps are invisible
// because every road is the same grey and is drawn without depth (research/36
// section 2, items 3 and 4). Our own simplification; osm2streets' junction
// polygons (Apache-2.0, geometry/general_case.rs) are the later replacement.
// Design: docs/designs/tools/bake/ribbons.md.
import type { MapPoint } from "../../src/world/grid.js";

// A segment shorter than this has no direction to speak of.
const SHORTEST_SEGMENT_M = 0.01;

// Rectangles first, then octagons, in the road's own order.
export function roadPieces(points: readonly MapPoint[], widthM: number): MapPoint[][] {
  const halfWidthM = widthM / 2;
  const pieces: MapPoint[][] = [];
  for (let at = 1; at < points.length; at += 1) {
    const rectangle = segmentRectangle(points[at - 1] as MapPoint, points[at] as MapPoint, halfWidthM);
    if (rectangle !== undefined) pieces.push(rectangle);
  }
  return [...pieces, ...points.map((point) => nodeOctagon(point, halfWidthM))];
}

// A right, B right, B left, A left: anticlockwise, each half the width from the line.
export function segmentRectangle(a: MapPoint, b: MapPoint, halfWidthM: number): MapPoint[] | undefined {
  const lengthM = Math.hypot(b.eastM - a.eastM, b.northM - a.northM);
  if (lengthM < SHORTEST_SEGMENT_M) return undefined;
  const alongEast = (b.eastM - a.eastM) / lengthM;
  const alongNorth = (b.northM - a.northM) / lengthM;
  // The side direction is the direction along the road turned a quarter left.
  const leftEast = -alongNorth * halfWidthM;
  const leftNorth = alongEast * halfWidthM;
  return [
    { eastM: a.eastM - leftEast, northM: a.northM - leftNorth },
    { eastM: b.eastM - leftEast, northM: b.northM - leftNorth },
    { eastM: b.eastM + leftEast, northM: b.northM + leftNorth },
    { eastM: a.eastM + leftEast, northM: a.northM + leftNorth },
  ];
}

// Corners at h / cos(22.5°), so the flat sides sit exactly h from the point
// and cover the rectangle ends; starting due east, anticlockwise.
export function nodeOctagon(point: MapPoint, halfWidthM: number): MapPoint[] {
  const reachM = halfWidthM / Math.cos(Math.PI / 8);
  return Array.from({ length: 8 }, (_, corner) => ({
    eastM: point.eastM + reachM * Math.cos((corner * Math.PI) / 4),
    northM: point.northM + reachM * Math.sin((corner * Math.PI) / 4),
  }));
}
