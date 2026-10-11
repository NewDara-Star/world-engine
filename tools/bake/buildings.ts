// Buildings for the bake (scope 006): every OpenStreetMap building in the
// extract, as a flat-roofed block standing on its real footprint, written into
// the 100 m square that holds the middle of its footprint, so a building
// across a square's edge is drawn once. Read from the same OPL format as the
// roads (opl.ts); a multipolygon relation (OSM wiki, Relation:multipolygon)
// gives the outer ring and its holes. Roofs are cut into triangles with
// earcut (mapbox/earcut, ISC, as bundled in three.js 0.186.1 and reached
// through `ShapeUtils.triangulateShape`, MIT).
// Heights: OSM wiki Key:height and Key:building:levels; otherwise the place
// file's height by building type. Design: docs/designs/tools/bake/buildings.md.
import { ShapeUtils, Vector2 } from "three";
import type { BuildingHeights } from "../../src/place/index.js";
import { SHADE_COUNT } from "../../src/world/buildings.js";
import { type Cell, type MapPoint, cellBounds, cellKey, cellOfPoint } from "../../src/world/grid.js";
import { type OsmWay, type WayNode, parseTags, parseWayLine } from "./opl.js";
import { type LatLon, localProjection } from "./projection.js";

const CENTIMETRES_PER_METRE = 100;
const BUILDINGS_FORMAT = 1;
// A corner may lie up to this far outside its square (src/world/buildings.ts
// checks the same reach); a building wider than that is left out and noted.
export const REACH_OUTSIDE_SQUARE_CM = 20_000;
// Sanity limits, our own choice, not measured: no building near Omole comes
// close, and a typing slip (600 for 6.00) would otherwise put a tower there.
const TALLEST_M = 300;
const MOST_LEVELS = 100;
const WHOLE_NUMBER = /^\d+$/;
const PLAIN_NUMBER = /^\d+(?:\.\d+)?$/;
const TRAILING_METRES = /\s?m$/;
const RELATION_ID = /^r(-?\d+)$/;
const MEMBER = /^([nwr])(-?\d+)@(.*)$/;

// One building as read: its tags, its outer ring and its holes, as OSM nodes.
export interface BuildingOutline {
  // "w123" or "r456": the OSM object it came from, for notes and order.
  source: string;
  sourceId: number;
  tags: Record<string, string>;
  outer: WayNode[];
  holes: WayNode[][];
}

// A building ready for its square's file: whole centimetres from the square's
// south-west corner, outer ring anticlockwise and holes clockwise seen from
// above, and the roof's triangles as corner numbers across all rings in order.
export interface BakedBuilding {
  heightCm: number;
  shade: number;
  rings: number[][];
  roof: number[];
}

export interface RelationLine {
  id: number;
  tags: Record<string, string>;
  members: { kind: string; id: number; role: string }[];
}

// building=no is OSM's way of saying "not a building".
export function isBuilding(tags: Readonly<Record<string, string>>): boolean {
  const building = tags["building"];
  return building !== undefined && building !== "no";
}

// Every building in the extract, ways then relations, each in id order, so
// the output never depends on the order of the file.
export function readOplBuildings(text: string): { buildings: BuildingOutline[]; problems: string[]; notes: string[] } {
  const read = readOplWaysAndRelations(text);
  const outlines = buildingOutlines(read.ways, read.relations);
  return { buildings: outlines.buildings, problems: read.problems, notes: outlines.notes };
}

// Every way is kept by id, tagged or not, because a relation's rings are
// untagged ways; every broken line is reported with its number.
export function readOplWaysAndRelations(text: string): OplObjects {
  const read: OplObjects = { ways: new Map<number, OsmWay>(), relations: [], problems: [] };
  const lines = text.split(/\r?\n/);
  for (let at = 0; at < lines.length; at += 1) addOplLine(read, lines[at] as string, at + 1);
  return read;
}

export interface OplObjects {
  ways: Map<number, OsmWay>;
  relations: RelationLine[];
  problems: string[];
}

// A way or relation line is added to what has been read; nodes are skipped,
// because ways carry their own positions.
function addOplLine(read: OplObjects, line: string, lineNumber: number): void {
  if (line.startsWith("w")) {
    const way = parseWayLine(line, lineNumber);
    if (way.kind === "problem") read.problems.push(way.problem);
    if (way.kind === "way") read.ways.set(way.way.id, way.way);
  }
  if (line.startsWith("r")) {
    const relation = parseRelationLine(line, lineNumber);
    if (typeof relation === "string") read.problems.push(relation);
    else read.relations.push(relation);
  }
}

// A way that is also a ring of a building relation is drawn once, as part of
// the relation (OSM wiki, Relation:multipolygon: the tags belong on the relation).
export function buildingOutlines(ways: ReadonlyMap<number, OsmWay>, relations: readonly RelationLine[]): { buildings: BuildingOutline[]; notes: string[] } {
  const fromRelations = relations.toSorted((a, b) => a.id - b.id).filter((relation) => isBuilding(relation.tags) && relation.tags["type"] === "multipolygon");
  const ringWayIds = new Set(fromRelations.flatMap((relation) => relation.members.map((member) => member.id)));
  const fromWays = [...ways.values()].toSorted((a, b) => a.id - b.id).filter((way) => isBuilding(way.tags) && !ringWayIds.has(way.id));
  const buildings: BuildingOutline[] = [];
  const notes: string[] = [];
  for (const way of fromWays) {
    if (isClosed(way.nodes)) buildings.push({ source: `w${way.id}`, sourceId: way.id, tags: way.tags, outer: way.nodes, holes: [] });
    else notes.push(`building way ${way.id} does not close on itself; skipped.`);
  }
  for (const relation of fromRelations) {
    const outlines = relationOutlines(relation, ways);
    if (typeof outlines === "string") notes.push(outlines);
    else buildings.push(...outlines);
  }
  return { buildings, notes };
}

// `r12 v1 … Tbuilding=yes,type=multipolygon Mw1@outer,w2@inner`: only the T
// (tags) and M (members) fields are used (libosmium's OPL format, as opl.ts).
export function parseRelationLine(line: string, lineNumber: number): RelationLine | string {
  const fields = line.split(" ");
  const id = RELATION_ID.exec(fields[0] ?? "");
  if (id === null) return `line ${lineNumber}: does not start with a relation id (r and a whole number).`;
  const tags = parseTags((fields.find((field) => field.startsWith("T")) ?? "T").slice(1));
  if (typeof tags === "string") return `line ${lineNumber}: ${tags}`;
  const membersText = (fields.find((field) => field.startsWith("M")) ?? "M").slice(1);
  const members = membersText === "" ? [] : membersText.split(",").map((member) => MEMBER.exec(member));
  if (members.some((member) => member === null)) return `line ${lineNumber}: a relation member is not written as type, id, @ and role.`;
  return {
    id: Number(id[1]),
    tags,
    members: members.map((member) => ({ kind: member?.[1] ?? "", id: Number(member?.[2]), role: member?.[3] ?? "" })),
  };
}

// A ring ends on the node it starts on (OSM wiki, Way: closed way).
export function isClosed(nodes: readonly WayNode[]): boolean {
  return nodes.length >= 4 && nodes[0]?.id === nodes[nodes.length - 1]?.id;
}

// Each outer ring is one building; a hole belongs to the outer ring its first
// corner lies in. Rings made of several ways joined end to end are not put
// together yet: such a relation is noted and skipped.
export function relationOutlines(relation: RelationLine, ways: ReadonlyMap<number, OsmWay>): BuildingOutline[] | string {
  const rings = relation.members.map((member) => ({ role: member.role, nodes: ways.get(member.id)?.nodes }));
  if (rings.some((ring) => ring.nodes === undefined || !isClosed(ring.nodes))) {
    return `building relation ${relation.id} has a ring that is missing from the extract or not closed on itself; skipped.`;
  }
  const outers = rings.filter((ring) => ring.role !== "inner").map((ring) => ring.nodes as WayNode[]);
  const inners = rings.filter((ring) => ring.role === "inner").map((ring) => ring.nodes as WayNode[]);
  return outers.map((outer) => ({
    source: `r${relation.id}`,
    sourceId: relation.id,
    tags: relation.tags,
    outer,
    holes: inners.filter((inner) => pointInRing(inner[0] as WayNode, outer)),
  }));
}

// Even-odd ray casting (W. Randolph Franklin's PNPOLY test), in degrees: fine
// for telling which of a few nearby rings holds a point.
export function pointInRing(point: WayNode, ring: readonly WayNode[]): boolean {
  let inside = false;
  for (let at = 0, before = ring.length - 1; at < ring.length; before = at, at += 1) {
    const a = ring[at] as WayNode;
    const b = ring[before] as WayNode;
    const crosses = a.lat > point.lat !== b.lat > point.lat && point.lon < ((b.lon - a.lon) * (point.lat - a.lat)) / (b.lat - a.lat) + a.lon;
    if (crosses) inside = !inside;
  }
  return inside;
}

// A mapper's height wins, then levels times the place's storey height, then
// the place's height for the building's type, then its default. A tag that
// could not be used is noted for the bake report.
export function buildingHeightM(source: string, tags: Readonly<Record<string, string>>, heights: BuildingHeights): { heightM: number; notes: string[] } {
  const notes: string[] = [];
  const height = heightFromTag(tags["height"]);
  if (typeof height === "number") return { heightM: height, notes };
  if (height === "unreadable") notes.push(`building ${source} has a height we could not read ("${tags["height"]}"); used its levels or type instead.`);
  const levels = levelsFromTag(tags["building:levels"]);
  if (typeof levels === "number") return { heightM: levels * heights.metresPerLevel, notes };
  if (levels === "unreadable") notes.push(`building ${source} has levels we could not read ("${tags["building:levels"]}"); used its type instead.`);
  const byType = heights.byType.find((entry) => entry.type === tags["building"]);
  return { heightM: byType?.heightM ?? heights.defaultM, notes };
}

// Only metres are safe to use without guessing: `9`, `9 m`, `9.5`.
export function heightFromTag(text: string | undefined): number | "unreadable" | undefined {
  if (text === undefined) return undefined;
  const number = text.trim().replace(TRAILING_METRES, "");
  const metres = Number(number);
  if (PLAIN_NUMBER.test(number) && metres > 0 && metres <= TALLEST_M) return metres;
  return "unreadable";
}

// A whole number of storeys above the ground.
export function levelsFromTag(text: string | undefined): number | "unreadable" | undefined {
  if (text === undefined) return undefined;
  const levels = Number(text.trim());
  if (WHOLE_NUMBER.test(text.trim()) && levels >= 1 && levels <= MOST_LEVELS) return levels;
  return "unreadable";
}

// Whole centimetres from the square's south-west corner; the closing corner and
// any corner that rounds onto the one before it are dropped.
export function ringInCentimetres(nodes: readonly WayNode[], metresFromCentre: (point: LatLon) => MapPoint, southWest: MapPoint): number[] {
  const flat: number[] = [];
  for (const node of nodes.slice(0, -1)) {
    const point = metresFromCentre(node);
    const east = Math.round((point.eastM - southWest.eastM) * CENTIMETRES_PER_METRE) + 0;
    const north = Math.round((point.northM - southWest.northM) * CENTIMETRES_PER_METRE) + 0;
    const sameAsBefore = flat.length > 0 && flat[flat.length - 2] === east && flat[flat.length - 1] === north;
    if (!sameAsBefore) flat.push(east, north);
  }
  if (flat.length > 2 && flat[0] === flat[flat.length - 2] && flat[1] === flat[flat.length - 1]) flat.splice(-2);
  return flat;
}

// Twice the signed area (the shoelace formula): positive when anticlockwise.
export function twiceSignedArea(ring: readonly number[]): number {
  let sum = 0;
  for (let at = 0; at < ring.length; at += 2) {
    const next = (at + 2) % ring.length;
    sum += (ring[at] as number) * (ring[next + 1] as number) - (ring[next] as number) * (ring[at + 1] as number);
  }
  return sum;
}

// Turns a ring round, keeping each east and north together.
export function reversedRing(ring: readonly number[]): number[] {
  const turned: number[] = [];
  for (let at = ring.length - 2; at >= 0; at -= 2) turned.push(ring[at] as number, ring[at + 1] as number);
  return turned;
}

// earcut's triangles, each turned anticlockwise seen from above so the roof
// faces up; a triangle with no area (from rounding) is left out.
export function roofTriangles(rings: readonly number[][]): number[] {
  const asPoints = rings.map((ring) => Array.from({ length: ring.length / 2 }, (_, at) => new Vector2(ring[at * 2], ring[at * 2 + 1])));
  const flat = rings.flat();
  // Corner numbers count the outer ring's corners first, then each hole's.
  const found = ShapeUtils.triangulateShape(asPoints[0] ?? [], asPoints.slice(1));
  const roof: number[] = [];
  for (const [a, b, c] of found as [number, number, number][]) {
    const area = twiceSignedArea([flat[a * 2] as number, flat[a * 2 + 1] as number, flat[b * 2] as number, flat[b * 2 + 1] as number, flat[c * 2] as number, flat[c * 2 + 1] as number]);
    if (area > 0) roof.push(a, b, c);
    if (area < 0) roof.push(a, c, b);
  }
  return roof;
}

// The square that holds the middle of the footprint's box: one square per
// building, so a building on a square's edge is drawn once.
export function cellForOutline(outer: readonly MapPoint[]): Cell {
  const easts = outer.map((point) => point.eastM);
  const norths = outer.map((point) => point.northM);
  return cellOfPoint({ eastM: (Math.min(...easts) + Math.max(...easts)) / 2, northM: (Math.min(...norths) + Math.max(...norths)) / 2 });
}

// Whether every corner of every ring is within the reach the file format allows.
export function ringsFitTheirSquare(rings: readonly number[][]): boolean {
  const largest = 10_000 + REACH_OUTSIDE_SQUARE_CM;
  return rings.every((ring) => ring.every((value) => value >= -REACH_OUTSIDE_SQUARE_CM && value <= largest));
}

// One building, from OSM nodes to its square and its baked block, or a note
// saying why it was left out. Holes too small to keep are dropped quietly.
export function bakeBuilding(outline: BuildingOutline, metresFromCentre: (point: LatLon) => MapPoint, heights: BuildingHeights): { cell: Cell; building: BakedBuilding; notes: string[] } | string {
  const cell = cellForOutline(outline.outer.map(metresFromCentre));
  const bounds = cellBounds(cell);
  const southWest = { eastM: bounds.westM, northM: bounds.southM };
  const outer = ringInCentimetres(outline.outer, metresFromCentre, southWest);
  if (outer.length < 6 || twiceSignedArea(outer) === 0) return `building ${outline.source} has no area once rounded to centimetres; skipped.`;
  const holes = outline.holes.map((hole) => ringInCentimetres(hole, metresFromCentre, southWest)).filter((hole) => hole.length >= 6 && twiceSignedArea(hole) !== 0);
  const rings = [twiceSignedArea(outer) > 0 ? outer : reversedRing(outer), ...holes.map((hole) => (twiceSignedArea(hole) < 0 ? hole : reversedRing(hole)))];
  if (!ringsFitTheirSquare(rings)) return `building ${outline.source} reaches more than ${REACH_OUTSIDE_SQUARE_CM / 100} m outside its square; skipped.`;
  const height = buildingHeightM(outline.source, outline.tags, heights);
  const building = { heightCm: Math.round(height.heightM * CENTIMETRES_PER_METRE), shade: outline.sourceId % SHADE_COUNT, rings, roof: roofTriangles(rings) };
  return { cell, building, notes: height.notes };
}

// Every building inside the map, grouped by square in bake order (a Map keeps
// the order its keys were first added, ECMA-262), with the notes.
export function buildingsByCell(
  outlines: readonly BuildingOutline[],
  centre: LatLon,
  heights: BuildingHeights,
  isInsideMap: (point: MapPoint) => boolean,
): { byCell: Map<string, { cell: Cell; buildings: BakedBuilding[] }>; notes: string[] } {
  const metresFromCentre = localProjection(centre);
  const byCell = new Map<string, { cell: Cell; buildings: BakedBuilding[] }>();
  const notes: string[] = [];
  for (const outline of outlines) {
    const first = metresFromCentre(outline.outer[0] as WayNode);
    if (!isInsideMap(first)) continue;
    const baked = bakeBuilding(outline, metresFromCentre, heights);
    if (typeof baked === "string") {
      notes.push(baked);
      continue;
    }
    notes.push(...baked.notes);
    const key = cellKey(baked.cell);
    const square = byCell.get(key) ?? { cell: baked.cell, buildings: [] };
    square.buildings.push(baked.building);
    byCell.set(key, square);
  }
  return { byCell, notes };
}

// The same bytes every time for the same input: keys in one order, whole
// numbers only, one newline at the end. Format: src/world/buildings.ts.
export function buildingFileText(cell: Cell, buildings: readonly BakedBuilding[]): string {
  const written = buildings.map((building) => ({ heightCm: building.heightCm, shade: building.shade, rings: building.rings, roof: building.roof }));
  return `${JSON.stringify({ format: BUILDINGS_FORMAT, cell: { east: cell.east, north: cell.north }, buildings: written })}\n`;
}

// A square's buildings file sits beside its road file: buildings_3_-2.json.
export function buildingFileName(cell: Cell): string {
  return `buildings_${cellKey(cell)}.json`;
}
