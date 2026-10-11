// The street file the bake writes and the game reads, its checker, and the
// rule for which street the car is on (scope 005b). A bad file gives a
// message with the file's name, never a crash. Distances use the same
// nearest-point sum as the bake's start (grid.ts, nearestPointOnSegment).
// Design: docs/designs/src/world/streets.md.
//
// Street file places/<id>/streets.json:
//   {"format":1,"centre":{"lat","lon"},"streets":[
//   {"name":"Babatunde Ladega Street","size":"minor","lines":[[e0,n0,e1,n1,…],…]},
//   {"size":"minor","lines":[…]},
//   …]}
//   Every road a car may use, grouped by name and size; a road with no name
//   in OpenStreetMap has no "name". Points are whole decimetres east and
//   north of the place centre (the same projection as the chunks). "major" is
//   a tertiary road or bigger (tools/bake/roads.ts, roadSize).
import type { FileCheck } from "../place/check-file.js";
import type { Place } from "../place/place.js";
import { type CellBounds, type MapPoint, nearestPointOnSegment } from "./grid.js";

const FORMAT = 1;
const DECIMETRES_PER_METRE = 10;
// The farthest a map may reach, as in chunk.ts, in decimetres.
const FARTHEST_DM = 500_000;
const SIZES: readonly string[] = ["major", "minor"];

// The street-name rule's numbers. 15 m is the scope's "about 15 m" (owner,
// 2026-10-11). The hold and the margin are the owner's choice, proposed by
// the coder on 2026-10-11 and awaiting his yes: one second is long enough to
// cross a junction at town speed without the name flickering, and 3 m is
// about one lane, so the name only moves to a road the car is clearly nearer.
export const STREET_NAME_WITHIN_M = 15;
export const STREET_NAME_HOLD_MS = 1000;
export const KEEP_SHOWN_STREET_MARGIN_M = 3;

export type RoadSize = "major" | "minor";

// One line of a street in metres, with the box around it so a far line is
// skipped without measuring every segment.
export interface StreetLine {
  points: MapPoint[];
  box: CellBounds;
}

export interface Street {
  name: string | undefined;
  size: RoadSize;
  lines: StreetLine[];
}

export interface StreetMap {
  centre: { lat: number; lon: number };
  streets: Street[];
}

// The name on screen, and a different one waiting to replace it once it has
// been found for long enough.
export interface StreetNameHold {
  shown: string | undefined;
  waiting: { name: string | undefined; sinceMs: number } | undefined;
}

export const noStreetName: StreetNameHold = { shown: undefined, waiting: undefined };

// A file as it is written, before it is turned into metres.
interface StreetAsWritten {
  name?: string;
  size: RoadSize;
  lines: number[][];
}

// A damaged or half-downloaded street file must not crash the game; the game
// drives on without names and says why. JSON.parse (ECMA-262) throws a
// SyntaxError on cut-short text.
export function validateStreetsFile(fileName: string, text: string): FileCheck<StreetMap> {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    return { ok: false, messages: [`${fileName}: the file is not readable JSON; it may be cut short.`] };
  }
  const problems = streetsFileProblems(value);
  if (problems.length > 0) return { ok: false, messages: problems.map((problem) => `${fileName}: ${problem}`) };
  const file = value as { centre: { lat: number; lon: number }; streets: StreetAsWritten[] };
  return { ok: true, value: { centre: { lat: file.centre.lat, lon: file.centre.lon }, streets: file.streets.map(streetInMetres) } };
}

// The file's own fields, then each street; only the first broken street is
// reported, because one broken street usually means a broken bake.
export function streetsFileProblems(value: unknown): string[] {
  const file = Object(value) as Record<string, unknown>;
  const centre = Object(file["centre"]) as Record<string, unknown>;
  const problems: string[] = [];
  if (file["format"] !== FORMAT) problems.push(`made by a different bake version (format ${JSON.stringify(file["format"])}, not ${FORMAT}); bake again.`);
  if (typeof centre["lat"] !== "number" || typeof centre["lon"] !== "number") problems.push("`centre` must have a `lat` and a `lon`, each a number.");
  if (!Array.isArray(file["streets"])) return [...problems, "`streets` must be a list."];
  const broken = file["streets"].map(streetProblem).findIndex((problem) => problem !== undefined);
  if (broken >= 0) problems.push(`street ${broken + 1}: ${String(streetProblem(file["streets"][broken]))}`);
  return problems;
}

// One street: a name that is text with something in it, or none; a known
// size; at least one line. Object() lets any JSON value be looked into.
export function streetProblem(value: unknown): string | undefined {
  const street = Object(value) as Record<string, unknown>;
  const name = street["name"];
  if (name !== undefined && (typeof name !== "string" || name.trim() === "")) return "`name` must be text with letters in it, or left out for a road with no name.";
  if (!SIZES.includes(String(street["size"]))) return '`size` must be "major" or "minor".';
  const lines = street["lines"];
  if (!Array.isArray(lines) || lines.length === 0) return "`lines` must be a list of at least one line.";
  if (!lines.every(lineIsGood)) return `a line is broken: each must be an even count of whole decimetres, at least two points, within ${FARTHEST_DM} of the centre.`;
  return undefined;
}

// A loop, not a regular expression, so a long road is checked in time that
// grows evenly with its length.
export function lineIsGood(line: unknown): boolean {
  if (!Array.isArray(line) || line.length < 4 || line.length % 2 !== 0) return false;
  for (const number of line) {
    if (!Number.isInteger(number) || Math.abs(number as number) > FARTHEST_DM) return false;
  }
  return true;
}

// Decimetres to metres, and each line's box worked out once.
export function streetInMetres(street: StreetAsWritten): Street {
  const lines = street.lines.map(pointsFromDecimetres).map((points) => ({ points, box: boxAround(points) }));
  return { name: street.name, size: street.size, lines };
}

// East, north, east, north… in decimetres, to points in metres.
export function pointsFromDecimetres(numbers: readonly number[]): MapPoint[] {
  const points: MapPoint[] = [];
  for (let at = 0; at + 1 < numbers.length; at += 2) {
    points.push({ eastM: (numbers[at] as number) / DECIMETRES_PER_METRE, northM: (numbers[at + 1] as number) / DECIMETRES_PER_METRE });
  }
  return points;
}

export function boxAround(points: readonly MapPoint[]): CellBounds {
  const easts = points.map((point) => point.eastM);
  const norths = points.map((point) => point.northM);
  return { westM: Math.min(...easts), southM: Math.min(...norths), eastM: Math.max(...easts), northM: Math.max(...norths) };
}

// If the place's centre moved after the bake, every name would be found in
// the wrong place; the player is told to bake again instead. Compared
// exactly, as the index is (chunk.ts, indexProblemsForPlace).
export function streetsProblemsForPlace(map: StreetMap, place: Pick<Place, "centre">): string[] {
  if (map.centre.lat === place.centre.lat && map.centre.lon === place.centre.lon) return [];
  return ["The street names were made for a different centre than the place file's; bake again."];
}

// The nearest point of any line of the street; a line whose box is farther
// than the limit is not measured.
export function distanceToStreet(street: Street, point: MapPoint, limitM: number): number {
  let nearestM = Number.POSITIVE_INFINITY;
  for (const line of street.lines) {
    if (distanceToBox(point, line.box) > limitM) continue;
    for (let at = 1; at < line.points.length; at += 1) {
      nearestM = Math.min(nearestM, nearestPointOnSegment(point, line.points[at - 1] as MapPoint, line.points[at] as MapPoint).distanceM);
    }
  }
  return nearestM;
}

export function distanceToBox(point: MapPoint, box: CellBounds): number {
  const outsideEast = Math.max(box.westM - point.eastM, 0, point.eastM - box.eastM);
  const outsideNorth = Math.max(box.southM - point.northM, 0, point.northM - box.northM);
  return Math.hypot(outsideEast, outsideNorth);
}

// The name of the nearest named road within 15 m, or none. A road with no
// name hides nothing: a name is only looked for among named roads. The name
// on screen is kept while its road is within 15 m and no more than 3 m
// farther than the nearest, so standing at a junction does not swap names.
// On an exact tie, the street first in the file wins, so the answer never
// changes between runs.
export function nearestStreetName(streets: readonly Street[], point: MapPoint, shown: string | undefined): string | undefined {
  const near = namedStreetsWithin(streets, point, STREET_NAME_WITHIN_M);
  const nearest = near[0];
  if (nearest === undefined) return undefined;
  const shownDistanceM = Math.min(...near.filter((one) => one.name === shown).map((one) => one.distanceM));
  if (shownDistanceM - nearest.distanceM <= KEEP_SHOWN_STREET_MARGIN_M) return shown;
  return nearest.name;
}

// Every named street within the limit, with its distance, nearest first;
// equal distances stay in file order, because sort is stable (ECMA-262 since
// 2019). A name split into a major and a minor part appears once for each part.
export function namedStreetsWithin(streets: readonly Street[], point: MapPoint, limitM: number): { name: string; distanceM: number }[] {
  const near: { name: string; distanceM: number }[] = [];
  for (const street of streets) {
    if (street.name === undefined) continue;
    const distanceM = distanceToStreet(street, point, limitM);
    if (distanceM <= limitM) near.push({ name: street.name, distanceM });
  }
  return near.toSorted((a, b) => a.distanceM - b.distanceM);
}

// The name on screen changes only when a different answer, a name or no
// name, has been found for a whole second without a break.
export function streetNameAfter(hold: StreetNameHold, found: string | undefined, nowMs: number): StreetNameHold {
  if (found === hold.shown) return { shown: hold.shown, waiting: undefined };
  if (hold.waiting === undefined || hold.waiting.name !== found) return { shown: hold.shown, waiting: { name: found, sinceMs: nowMs } };
  if (nowMs - hold.waiting.sinceMs >= STREET_NAME_HOLD_MS) return { shown: found, waiting: undefined };
  return hold;
}
