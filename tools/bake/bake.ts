// The whole bake, from the place file and the extract's text to the text of
// every output file, without touching the disk, so tests can run it on a
// small made-up extract and compare bytes. Design: docs/designs/tools/bake/bake.md.
import { type Place, type Planet, validatePlace } from "../../src/place/index.js";
import type { Cell, CellBounds, MapPoint } from "../../src/world/grid.js";
import { buildingFileName, buildingFileText, buildingsByCell, readOplBuildings } from "./buildings.js";
import { chunkFileText, indexFileText } from "./chunk-text.js";
import { type Edge, clipAgainstEdge, trianglesByCell } from "./clip.js";
import { type OsmWay, readOplRoadWays } from "./opl.js";
import { type LatLon, localProjection } from "./projection.js";
import { roadPieces } from "./ribbons.js";
import { isDrivableRoad, roadWidthMetres } from "./roads.js";
import { type CarStart, type RoadInMetres, carStartOnRoad } from "./start.js";
import { streetsFileText } from "./streets.js";

export interface BakedFile {
  name: string;
  text: string;
}

export type BakeResult =
  | { ok: true; placeId: string; files: BakedFile[]; streetsText: string; notes: string[]; roadCount: number; buildingCount: number; start: CarStart }
  | { ok: false; problems: string[] };

// A square whose triangles all rounded away has nothing to draw.
const EMPTY_TRIANGLE_LIST = '"triangles":[]';

// Anything wrong with the input is reported, not baked into a broken map. The
// map's size is the place file's mapHalfSizeM, not the extract's reach:
// osmium extract keeps every node of a way that crosses its box (its default
// complete_ways), so a trunk road could stretch the map kilometres past the
// place (approver's F20). Road pieces are clipped to that square with the
// same Sutherland–Hodgman step as the squares (clip.ts).
// The buildings extract is optional (scope 006): without it the map has roads only.
export function bakePlace(placeFileName: string, placeText: string, planets: readonly Planet[], extractText: string, buildingsText?: string): BakeResult {
  const place = validatePlace(placeFileName, placeText, planets);
  if (!place.ok) return { ok: false, problems: place.messages };
  const read = readOplRoadWays(extractText);
  if (read.problems.length > 0) return { ok: false, problems: read.problems };
  const { centre, laneWidthM, mapHalfSizeM } = place.value;
  const drivable = drivableRoadsInMetres(read.ways, centre, laneWidthM);
  if (drivable.roads.length === 0) {
    return {
      ok: false,
      problems: [`${placeFileName}: the extract has no roads a car can use; check the extract covers the place centre and was cut with the highway ways.`],
    };
  }
  const extent = { westM: -mapHalfSizeM, southM: -mapHalfSizeM, eastM: mapHalfSizeM, northM: mapHalfSizeM };
  const mapEdges: Edge[] = [
    { axis: "eastM", atM: extent.westM, insideIsAbove: true },
    { axis: "northM", atM: extent.southM, insideIsAbove: true },
    { axis: "eastM", atM: extent.eastM, insideIsAbove: false },
    { axis: "northM", atM: extent.northM, insideIsAbove: false },
  ];
  const pieces = drivable.roads
    .flatMap((road) => roadPieces(road.points, road.widthM))
    .map((piece) => mapEdges.reduce((kept, edge) => clipAgainstEdge(kept, edge), piece))
    .filter((piece) => piece.length >= 3);
  const byCell = trianglesByCell(pieces);
  const start = carStartOnRoad(drivable.roads);
  // A square's name is east_north (src/world/grid.ts, cellKey).
  const chunks = [...byCell.entries()]
    .map(([key, triangles]) => ({ key, cell: { east: Number(key.split("_")[0]), north: Number(key.split("_")[1]) }, triangles }))
    .map((square) => ({ cell: square.cell, name: `${square.key}.json`, text: chunkFileText(square.cell, square.triangles) }))
    .filter((file) => !file.text.includes(EMPTY_TRIANGLE_LIST));
  const cells: Cell[] = chunks.map((file) => file.cell);
  const buildings = buildingsText === undefined ? emptyBuildingBake() : bakeBuildings(placeFileName, place.value, buildingsText, extent);
  if (!buildings.ok) return buildings;
  return {
    ok: true,
    placeId: place.value.id,
    files: [
      ...chunks.map((file) => ({ name: file.name, text: file.text })),
      ...buildings.files,
      { name: "index.json", text: indexFileText(cells, buildings.cells, centre, extent, start) },
    ],
    streetsText: streetsFileText(drivable.roads, centre, mapHalfSizeM),
    notes: [...read.notes, ...drivable.notes, ...buildings.notes],
    roadCount: drivable.roads.length,
    buildingCount: buildings.count,
    start,
  };
}

type BuildingBake = { ok: true; files: BakedFile[]; cells: Cell[]; notes: string[]; count: number } | { ok: false; problems: string[] };

function emptyBuildingBake(): BuildingBake {
  return { ok: true, files: [], cells: [], notes: [], count: 0 };
}

// One file per square with buildings (scope 006). A building counts as on the
// map when its first corner is inside the map's square, the same edge the
// roads are clipped to.
export function bakeBuildings(placeFileName: string, place: Place, buildingsText: string, extent: CellBounds): BuildingBake {
  if (place.buildingHeights === undefined) {
    return { ok: false, problems: [`${placeFileName}: a buildings extract was given, but the place file has no \`buildingHeights\`; add them, or bake without --buildings.`] };
  }
  const read = readOplBuildings(buildingsText);
  if (read.problems.length > 0) return { ok: false, problems: read.problems };
  function isInsideMap(point: MapPoint): boolean {
    return point.eastM >= extent.westM && point.eastM < extent.eastM && point.northM >= extent.southM && point.northM < extent.northM;
  }
  const grouped = buildingsByCell(read.buildings, place.centre, place.buildingHeights, isInsideMap);
  const squares = [...grouped.byCell.values()];
  return {
    ok: true,
    files: squares.map((square) => ({ name: buildingFileName(square.cell), text: buildingFileText(square.cell, square.buildings) })),
    cells: squares.map((square) => square.cell),
    notes: [...read.notes, ...grouped.notes],
    count: squares.reduce((total, square) => total + square.buildings.length, 0),
  };
}

// From every way to just the streets, each with its width and its line in
// metres, in way-id order so the output never depends on the order of the file.
export function drivableRoadsInMetres(ways: readonly OsmWay[], centre: LatLon, laneWidthM: number): { roads: RoadInMetres[]; notes: string[] } {
  const metresFromCentre = localProjection(centre);
  const roads: RoadInMetres[] = [];
  const notes: string[] = [];
  for (const way of ways.toSorted((a, b) => a.id - b.id)) {
    if (!isDrivableRoad(way.tags)) continue;
    const width = roadWidthMetres(way.id, way.tags, laneWidthM);
    roads.push({ wayId: way.id, tags: way.tags, widthM: width.widthM, points: way.nodes.map(metresFromCentre) });
    notes.push(...width.notes);
  }
  return { roads, notes };
}
