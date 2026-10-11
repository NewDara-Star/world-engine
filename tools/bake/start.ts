// Where the car is parked when the game opens: on the road nearest the place
// centre (the place file's centre is on the owner's street), facing along it.
// The start also records the road's width and whether it is one-way, so the
// game can move the car to the driving side on a two-way road and keep it in
// the middle of a one-way one (approver's F7). Our own design.
// Design: docs/designs/tools/bake/start.md.
import { type MapPoint, nearestPointOnSegment } from "../../src/world/grid.js";
import { type Tags, isOneWay } from "./roads.js";

// A drivable road in metres from the place centre, as the bake keeps it.
export interface RoadInMetres {
  wayId: number;
  tags: Tags;
  widthM: number;
  points: MapPoint[];
}

export interface CarStart {
  eastM: number;
  northM: number;
  headingDeg: number;
  roadWidthM: number;
  oneWay: boolean;
}

const CENTRE: MapPoint = { eastM: 0, northM: 0 };

// The nearest point of every segment of every road; on a tie the first in
// bake order is kept (strictly nearer only), so the answer never changes.
export function carStartOnRoad(roads: readonly RoadInMetres[]): CarStart {
  let best = { distanceM: Number.POSITIVE_INFINITY, point: CENTRE, from: CENTRE, to: CENTRE, road: roads[0] as RoadInMetres };
  for (const road of roads) {
    for (let at = 1; at < road.points.length; at += 1) {
      const from = road.points[at - 1] as MapPoint;
      const to = road.points[at] as MapPoint;
      const nearest = nearestPointOnSegment(CENTRE, from, to);
      if (nearest.distanceM < best.distanceM) best = { ...nearest, from, to, road };
    }
  }
  let headingDeg = compassHeading(best.from, best.to);
  // oneway=-1: one-way against the drawing direction, so the car faces the legal way.
  if (best.road.tags["oneway"] === "-1") headingDeg = (headingDeg + 180) % 360;
  return { eastM: best.point.eastM, northM: best.point.northM, headingDeg, roadWidthM: best.road.widthM, oneWay: isOneWay(best.road.tags) };
}

// Degrees clockwise from north, from 0 up to but not including 360.
export function compassHeading(a: MapPoint, b: MapPoint): number {
  const degrees = (Math.atan2(b.eastM - a.eastM, b.northM - a.northM) * 180) / Math.PI;
  return ((degrees % 360) + 360) % 360;
}
