// Writes places/<id>/streets.json: every road a car may use, as its name (when
// OpenStreetMap has one), its size and its centre line, so the game can say
// which street the car is on and draw the small map (scope 005b). The same
// bytes every time for the same input: streets in name order, lines in way-id
// order, every number a whole decimetre. The format is stated and checked on
// the game side (src/world/streets.ts). Design: docs/designs/tools/bake/streets.md.
import type { MapPoint } from "../../src/world/grid.js";
import type { LatLon } from "./projection.js";
import { roadSize } from "./roads.js";
import type { RoadInMetres } from "./start.js";

const STREETS_FORMAT = 1;
const DECIMETRES_PER_METRE = 10;
// Roads are kept this far past the map's edge, half the small map's 300 m, so
// the map near the edge shows what is there rather than a blank. Our own
// choice, from the scope's map size.
const KEPT_PAST_EDGE_M = 150;

interface StreetGroup {
  name: string | undefined;
  size: "major" | "minor";
  lines: number[][];
}

// Named streets first, in plain text order of their names; then the roads
// with no name; major before minor where the rest is equal.
export function streetsFileText(roads: readonly RoadInMetres[], centre: LatLon, mapHalfSizeM: number): string {
  const reachM = mapHalfSizeM + KEPT_PAST_EDGE_M;
  const groups = new Map<string, StreetGroup>();
  for (const road of roads) {
    const name = road.tags["name"]?.trim() || undefined;
    const size = roadSize(road.tags);
    const lines = linesInsideSquare(road.points, reachM).map(decimetreLine).filter((line) => line.length >= 4);
    if (lines.length === 0) continue;
    const key = `${name ?? ""}\u0000${size}`;
    const group = groups.get(key) ?? { name, size, lines: [] };
    group.lines.push(...lines);
    groups.set(key, group);
  }
  const sorted = [...groups.values()].toSorted(compareStreets);
  const streetLines = sorted.map(streetLineText);
  return `{"format":${STREETS_FORMAT},"centre":${JSON.stringify({ lat: centre.lat, lon: centre.lon })},"streets":[\n${streetLines.join(",\n")}\n]}\n`;
}

// One street on one line of the file, keys in one fixed order; a road with
// no name has no name key at all.
export function streetLineText(group: StreetGroup): string {
  if (group.name === undefined) return JSON.stringify({ size: group.size, lines: group.lines });
  return JSON.stringify({ name: group.name, size: group.size, lines: group.lines });
}

// Plain UTF-16 order (not the computer's language), so every machine bakes
// the same bytes.
export function compareStreets(a: StreetGroup, b: StreetGroup): number {
  if ((a.name === undefined) !== (b.name === undefined)) return a.name === undefined ? 1 : -1;
  const byName = Number((a.name ?? "") > (b.name ?? "")) - Number((a.name ?? "") < (b.name ?? ""));
  if (byName !== 0) return byName;
  return Number(a.size === "minor") - Number(b.size === "minor");
}

// The parts of a line near the map: a segment is kept when its box reaches
// the square of plus and minus reach around the centre (so a long segment
// that crosses the map with both ends outside is kept too), and kept
// segments in a row make one line.
export function linesInsideSquare(points: readonly MapPoint[], reachM: number): MapPoint[][] {
  const lines: MapPoint[][] = [];
  let current: MapPoint[] = [];
  for (let at = 1; at < points.length; at += 1) {
    const from = points[at - 1] as MapPoint;
    const to = points[at] as MapPoint;
    if (!segmentReachesSquare(from, to, reachM)) {
      if (current.length > 0) lines.push(current);
      current = [];
      continue;
    }
    if (current.length === 0) current.push(from);
    current.push(to);
  }
  if (current.length > 0) lines.push(current);
  return lines;
}

export function segmentReachesSquare(from: MapPoint, to: MapPoint, reachM: number): boolean {
  const reachesEast = Math.min(from.eastM, to.eastM) <= reachM && Math.max(from.eastM, to.eastM) >= -reachM;
  const reachesNorth = Math.min(from.northM, to.northM) <= reachM && Math.max(from.northM, to.northM) >= -reachM;
  return reachesEast && reachesNorth;
}

// Whole decimetres, east then north, each point once: a point that rounds
// onto the one before it is left out. Adding 0 turns minus zero into 0.
export function decimetreLine(points: readonly MapPoint[]): number[] {
  const numbers: number[] = [];
  for (const point of points) {
    const east = Math.round(point.eastM * DECIMETRES_PER_METRE) + 0;
    const north = Math.round(point.northM * DECIMETRES_PER_METRE) + 0;
    if (numbers.at(-2) === east && numbers.at(-1) === north) continue;
    numbers.push(east, north);
  }
  return numbers;
}
