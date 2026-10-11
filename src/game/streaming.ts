// The 100 m squares follow the car: loaded within the load radius, let go
// beyond the larger keep radius, so a car driving along a square's edge does
// not load and drop the same square over and over; only squares inside the
// map's extent (scope 005 item 4; D-0008). The ground and its collider appear
// at once; the road and the buildings with their solids (scope 006) follow
// when their files arrive.
// Design: docs/designs/src/game/streaming.md.
import type { MapExtent } from "../vehicle/car.js";
import { validateBuildingChunk } from "../world/buildings.js";
import { validateChunk } from "../world/chunk.js";
import { type Cell, type MapPoint, cellBounds, cellKey, cellsWithin, distanceToCell } from "../world/grid.js";
import { showNotice } from "./failure.js";
import type { Game, LoadedSquare } from "./game.js";
import { type Loaded, fetchText } from "./load.js";
import { addBuildingColliders, addGroundCollider } from "./physics.js";
import { buildingMeshFromChunk, groundTileMesh, releaseMesh, roadMeshFromChunk } from "./scene.js";

// Performance numbers, the owner's choice, proposed 2026-10-11, to be
// confirmed by the frame-rate measurement on the phone.
export const LOAD_RADIUS_M = 300;
export const KEEP_RADIUS_M = 400;
// A road that failed is tried again after this long.
const RETRY_AFTER_MS = 5000;

export interface StreamingPlan {
  toLoad: Cell[];
  toLetGo: Cell[];
}

// Only a few dozen squares are ever in the phone's memory, nearest first.
export function streamingPlan(car: MapPoint, loaded: readonly Cell[], extent: MapExtent, loadRadiusM: number, keepRadiusM: number): StreamingPlan {
  const loadedKeys = new Set(loaded.map(cellKey));
  const toLoad: Cell[] = [];
  for (const cell of cellsWithin(car, loadRadiusM)) {
    const bounds = cellBounds(cell);
    const inside = bounds.westM >= extent.westM && bounds.eastM <= extent.eastM && bounds.southM >= extent.southM && bounds.northM <= extent.northM;
    if (inside && !loadedKeys.has(cellKey(cell))) toLoad.push(cell);
  }
  const toLetGo = loaded.filter((cell) => distanceToCell(car, cell) > keepRadiusM);
  return { toLoad, toLetGo };
}

// The ground and its collider appear at once, so the car never falls through
// a square whose road file is slow; the road is fetched without waiting.
export function loadCell(game: Game, cell: Cell): void {
  const key = cellKey(cell);
  const groundMesh = groundTileMesh(cell, game.parts.groundMaterial);
  game.parts.scene.add(groundMesh);
  const groundCollider = addGroundCollider(game.world, cell);
  const hasRoad = game.roadCells.has(key);
  const hasBuildings = game.buildingCells.has(key);
  game.squares.set(key, {
    cell,
    groundMesh,
    groundCollider,
    roadMesh: undefined,
    road: hasRoad ? "loading" : "not-needed",
    failedAtMs: undefined,
    buildingMesh: undefined,
    buildingColliders: [],
    buildings: hasBuildings ? "loading" : "not-needed",
    buildingsFailedAtMs: undefined,
    failedBefore: false,
  });
  if (hasRoad) fetchRoad(game, cell);
  if (hasBuildings) fetchBuildings(game, cell);
}

function fetchRoad(game: Game, cell: Cell): void {
  void fetchText(`places/${game.data.place.id}/chunks/${cellKey(cell)}.json`).then((answer) => roadArrived(game, cell, answer));
}

function fetchBuildings(game: Game, cell: Cell): void {
  void fetchText(`places/${game.data.place.id}/chunks/buildings_${cellKey(cell)}.json`).then((answer) => buildingsArrived(game, cell, answer));
}

// The first failure of a square is told to the player; retries stay quiet.
function tellFirstFailure(game: Game, square: LoadedSquare): void {
  if (!square.failedBefore) showNotice(game.page, "Part of the map did not load; trying again.");
  square.failedBefore = true;
}

// A road file that arrives after the car has driven away is dropped; a broken
// one is reported once and tried again later.
export function roadArrived(game: Game, cell: Cell, answer: Loaded<string>): void {
  const key = cellKey(cell);
  const square = game.squares.get(key);
  if (square === undefined || square.road !== "loading") return;
  const chunk = answer.ok ? validateChunk(`${key}.json`, answer.value, cell) : undefined;
  if (chunk === undefined || !chunk.ok) {
    square.road = "failed";
    square.failedAtMs = performance.now();
    tellFirstFailure(game, square);
    return;
  }
  square.roadMesh = roadMeshFromChunk(chunk.value, game.parts.roadMaterial);
  game.parts.scene.add(square.roadMesh);
  square.road = "loaded";
}

// The same for a square's buildings: drawn as one mesh, each with its solid,
// so the car stops at a wall instead of driving through it.
export function buildingsArrived(game: Game, cell: Cell, answer: Loaded<string>): void {
  const key = cellKey(cell);
  const square = game.squares.get(key);
  if (square === undefined || square.buildings !== "loading") return;
  const chunk = answer.ok ? validateBuildingChunk(`buildings_${key}.json`, answer.value, cell) : undefined;
  if (chunk === undefined || !chunk.ok) {
    square.buildings = "failed";
    square.buildingsFailedAtMs = performance.now();
    tellFirstFailure(game, square);
    return;
  }
  square.buildingMesh = buildingMeshFromChunk(chunk.value, game.parts.buildingMaterial);
  game.parts.scene.add(square.buildingMesh);
  square.buildingColliders = addBuildingColliders(game.world, chunk.value);
  square.buildings = "loaded";
}

// Letting go of a square removes everything it added, so a three-hour drive
// uses the same memory as a three-minute one.
export function unloadCell(game: Game, cell: Cell): void {
  const key = cellKey(cell);
  const square = game.squares.get(key);
  if (square === undefined) return;
  releaseMesh(square.groundMesh, game.parts.scene);
  game.world.removeCollider(game.world.getCollider(square.groundCollider), false);
  if (square.roadMesh !== undefined) releaseMesh(square.roadMesh, game.parts.scene);
  if (square.buildingMesh !== undefined) releaseMesh(square.buildingMesh, game.parts.scene);
  for (const handle of square.buildingColliders) game.world.removeCollider(game.world.getCollider(handle), false);
  game.squares.delete(key);
}

// A road or buildings file that failed on a weak signal comes back by itself
// when the signal does.
export function retryFailedFiles(game: Game, nowMs: number): void {
  for (const square of game.squares.values()) {
    if (square.road === "failed" && nowMs - (square.failedAtMs ?? nowMs) >= RETRY_AFTER_MS) {
      square.road = "loading";
      fetchRoad(game, square.cell);
    }
    if (square.buildings === "failed" && nowMs - (square.buildingsFailedAtMs ?? nowMs) >= RETRY_AFTER_MS) {
      square.buildings = "loading";
      fetchBuildings(game, square.cell);
    }
  }
}

// Once a frame, the squares follow the car.
export function updateStreaming(game: Game, car: MapPoint, nowMs: number): void {
  const plan = streamingPlan(car, [...game.squares.values()].map((square) => square.cell), game.data.mapIndex.extent, LOAD_RADIUS_M, KEEP_RADIUS_M);
  for (const cell of plan.toLetGo) unloadCell(game, cell);
  for (const cell of plan.toLoad) loadCell(game, cell);
  retryFailedFiles(game, nowMs);
}
