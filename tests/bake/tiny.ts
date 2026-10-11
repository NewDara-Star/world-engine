// The hand-made bake fixture: a made-up town of a few streets around 6.63° N,
// 3.36° E (not real map data), written the way `osmium add-locations-to-ways`
// writes OPL (tools/bake/cli.md; libosmium's OPL format, research/36 section
// 2), and its place file. What each way is for:
//   w10 Test Street: two-way, untagged lanes, its name full of escapes; the
//       road nearest the centre (5.5 m north), drawn west to east.
//   w11 one-way north-south street. w14 primary road, `width=12 m`.
//   w12 footway, w13 `area=yes`, w15 `access=no`, w21 `vehicle=no`, w23 track:
//       none of them is drawn.
//   w16 `access=no` with `motorcar=yes`: drawn. w17 one node: skipped, noted.
//   w18 untagged roundabout. w19 `lanes=abc`. w20 `width=10 ft`.
//   w22 a trunk road running far past the map's 300 m edge.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { knownPlanets } from "../place/planets.js";
import { validatePlace } from "../../src/place/index.js";

export const fixturesDir = resolve(import.meta.dirname, "fixtures");

export const TINY_CENTRE = { lat: 6.63, lon: 3.36 } as const;

export function tinyExtractText(): string {
  return readFileSync(resolve(fixturesDir, "tiny.opl"), "utf8");
}

export function tinyPlaceText(): string {
  return readFileSync(resolve(fixturesDir, "tiny-place.json"), "utf8");
}

// The tiny place file with some fields changed; `undefined` removes a field.
export function tinyPlaceTextWith(changes: Record<string, unknown>): string {
  const place = JSON.parse(tinyPlaceText()) as Record<string, unknown>;
  return JSON.stringify({ ...place, ...changes }, null, 2);
}

export function checkedPlace(fileName: string, text: string) {
  const checked = validatePlace(fileName, text, knownPlanets());
  if (!checked.ok) throw new Error(checked.messages.join("\n"));
  return checked.value;
}

export function tinyPlace() {
  return checkedPlace("tiny.json", tinyPlaceText());
}

// Reference: WGS84 defining values a = 6378137 m, f = 1/298.257223563; the
// meridian radius M = a(1 − e²)/(1 − e² sin²φ)^1.5 and prime-vertical radius
// N = a/√(1 − e² sin²φ), e² = f(2 − f) (tools/bake/projection.md).
export function metresPerDegree(latDeg: number): { north: number; east: number } {
  const a = 6378137;
  const f = 1 / 298.257223563;
  const e2 = f * (2 - f);
  const phi = (latDeg * Math.PI) / 180;
  const w = 1 - e2 * Math.sin(phi) ** 2;
  const meridian = (a * (1 - e2)) / w ** 1.5;
  const primeVertical = a / Math.sqrt(w);
  return { north: (meridian * Math.PI) / 180, east: (primeVertical * Math.cos(phi) * Math.PI) / 180 };
}

export function metresFromTinyCentre(lat: number, lon: number): { eastM: number; northM: number } {
  const perDegree = metresPerDegree(TINY_CENTRE.lat);
  return { eastM: (lon - TINY_CENTRE.lon) * perDegree.east, northM: (lat - TINY_CENTRE.lat) * perDegree.north };
}

export interface BakedFile {
  name: string;
  text: string;
}

// The chunk format, from src/world/chunk.md.
interface ChunkJson {
  cell: { east: number; north: number };
  corners: number[];
  triangles: number[];
}

// Is this map point inside (or on the edge of) a road triangle of the baked
// chunk for its square? Chunk corners are whole centimetres from the
// square's south-west corner (src/world/chunk.md).
export function isOnRoad(files: readonly BakedFile[], eastM: number, northM: number): boolean {
  const east = Math.floor(eastM / 100);
  const north = Math.floor(northM / 100);
  const file = files.find((one) => one.name === `${east}_${north}.json`);
  if (file === undefined) return false;
  const chunk = JSON.parse(file.text) as ChunkJson;
  const x = (eastM - east * 100) * 100;
  const y = (northM - north * 100) * 100;
  for (let at = 0; at + 2 < chunk.triangles.length; at += 3) {
    const corners = [0, 1, 2].map((offset) => cornerOf(chunk, chunk.triangles[at + offset] ?? -1));
    if (insideTriangle(corners, x, y)) return true;
  }
  return false;
}

function cornerOf(chunk: ChunkJson, index: number): [number, number] {
  return [chunk.corners[2 * index] ?? Number.NaN, chunk.corners[2 * index + 1] ?? Number.NaN];
}

// Twice the signed area of the triangle a, b, c: positive when anticlockwise.
export function crossOf(a: readonly [number, number], b: readonly [number, number], c: readonly [number, number]): number {
  return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
}

function insideTriangle(corners: [number, number][], x: number, y: number): boolean {
  const [a, b, c] = corners;
  if (a === undefined || b === undefined || c === undefined) return false;
  const point: [number, number] = [x, y];
  const sides = [crossOf(a, b, point), crossOf(b, c, point), crossOf(c, a, point)];
  return sides.every((side) => side >= -1e-6) || sides.every((side) => side <= 1e-6);
}
