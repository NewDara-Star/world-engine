// Loads the files the game needs before the player can drive, and checks each
// with the checker that already exists for it. Any failure stops loading and
// comes back as a failure for failure.ts to put into words; nothing here
// touches the screen. Order: start.json, the place, its planet, the place
// checked against the planet, the vehicle, the map index. Browser plumbing:
// `fetch` with an AbortController's signal and `setTimeout` (MDN).
// Design: docs/designs/src/game/load.md.
import type { FileCheck } from "../place/check-file.js";
import { requireShortId } from "../place/parse.js";
import { type Place, validatePlace } from "../place/place.js";
import { type Planet, validatePlanet } from "../place/planet.js";
import { startChoiceFromLink, validateStartChoice } from "../place/start.js";
import { type Vehicle, validateVehicle } from "../place/vehicle.js";
import { type ChunkIndex, indexProblemsForPlace, validateChunkIndex } from "../world/chunk.js";
import { type StreetMap, streetsProblemsForPlace, validateStreetsFile } from "../world/streets.js";
import { CELL_SIZE_M } from "../world/grid.js";
import type { GameFailure } from "./failure.js";

// How long a download may take before the player is told the signal may be
// weak (approver's F14). Owner-choice, proposed 2026-10-11.
export const DOWNLOAD_GIVE_UP_MS = 30_000;

export type Loaded<T> = { ok: true; value: T } | { ok: false; failure: GameFailure };

export interface GameData {
  place: Place;
  planet: Planet;
  vehicle: Vehicle;
  mapIndex: ChunkIndex;
  // Things the player is told about the link, such as a place name it could not open.
  notes: string[];
}

// "No connection", "too slow" and "file missing" need different advice, so
// every way a download can fail is told apart. A request that never answers
// is given up after 30 s, so "Loading the map" never stays on screen forever.
export async function fetchText(path: string): Promise<Loaded<string>> {
  const giveUp = new AbortController();
  const timer = setTimeout(() => giveUp.abort(), DOWNLOAD_GIVE_UP_MS);
  try {
    const answer = await fetch(path, { signal: giveUp.signal });
    if (answer.status === 404) return { ok: false, failure: { kind: "file-missing", path } };
    if (!answer.ok) return { ok: false, failure: { kind: "server-error", path, status: answer.status } };
    return { ok: true, value: await answer.text() };
  } catch {
    if (giveUp.signal.aborted) return { ok: false, failure: { kind: "too-slow", path } };
    return { ok: false, failure: { kind: "no-connection", path } };
  } finally {
    clearTimeout(timer);
  }
}

// A file that downloads but has mistakes is reported with the checker's own
// messages (file, line, what to fix).
export async function fetchChecked<T>(path: string, check: (fileName: string, text: string) => FileCheck<T>): Promise<Loaded<T>> {
  const text = await fetchText(path);
  if (!text.ok) return text;
  const checked = check(path, text.value);
  if (!checked.ok) return { ok: false, failure: { kind: "file-has-mistakes", path, messages: checked.messages } };
  return { ok: true, value: checked.value };
}

// The planet file to fetch is named in the place file, read before the place
// is checked; anything odd is left for the place check to report properly.
export function planetIdWrittenIn(placeText: string): string | undefined {
  let planet: unknown;
  try {
    planet = (Object(JSON.parse(placeText)) as Record<string, unknown>)["planet"];
  } catch {
    return undefined;
  }
  if (typeof planet === "string" && requireShortId()(planet, []).ok) return planet;
  return undefined;
}

// The place and its planet, checked together, so a place on a planet with no
// file, or with gravity outside its planet's range, gets the usual message.
export async function loadPlaceOnItsPlanet(placeId: string): Promise<Loaded<{ place: Place; planet: Planet }>> {
  const path = `places/${placeId}.json`;
  const text = await fetchText(path);
  if (!text.ok) return text;
  const planetId = planetIdWrittenIn(text.value);
  const planets: Planet[] = [];
  if (planetId !== undefined) {
    const planet = await fetchChecked(`planets/${planetId}.json`, validatePlanet);
    if (!planet.ok) return planet;
    planets.push(planet.value);
  }
  const place = validatePlace(path, text.value, planets);
  const planet = planets[0];
  if (!place.ok || planet === undefined) {
    return { ok: false, failure: { kind: "file-has-mistakes", path, messages: place.ok ? [] : place.messages } };
  }
  return { ok: true, value: { place: place.value, planet } };
}

// The car must exist, be a good file, and be a kind of vehicle the place allows.
export async function loadVehicleForPlace(vehicleId: string, place: Place): Promise<Loaded<Vehicle>> {
  const vehicle = await fetchChecked(`vehicles/${vehicleId}.json`, validateVehicle);
  if (!vehicle.ok) return vehicle;
  if (!place.allowedVehicleClasses.includes(vehicle.value.class)) {
    return {
      ok: false,
      failure: { kind: "vehicle-not-allowed", vehicleName: vehicle.value.name, vehicleClass: vehicle.value.class, allowedClasses: [...place.allowedVehicleClasses] },
    };
  }
  return vehicle;
}

// The map must have been baked, and baked for this place.
export async function loadMapIndexForPlace(place: Place): Promise<Loaded<ChunkIndex>> {
  const index = await fetchChecked(`places/${place.id}/chunks/index.json`, validateChunkIndex);
  if (!index.ok) {
    if (index.failure.kind === "file-missing") return { ok: false, failure: { kind: "map-not-baked", placeId: place.id } };
    return index;
  }
  const problems = indexProblemsForPlace(index.value, place, CELL_SIZE_M);
  if (problems.length > 0) return { ok: false, failure: { kind: "map-baked-for-something-else", problems } };
  return index;
}

// Everything needed to start driving, in one call, ending at the first thing
// that is wrong.
export async function loadGameData(query: string): Promise<Loaded<GameData>> {
  const start = await fetchChecked("start.json", validateStartChoice);
  if (!start.ok) return start;
  const choice = startChoiceFromLink(start.value, query);
  const placed = await loadPlaceOnItsPlanet(choice.placeId);
  if (!placed.ok) return placed;
  const vehicle = await loadVehicleForPlace(choice.vehicleId, placed.value.place);
  if (!vehicle.ok) return vehicle;
  const mapIndex = await loadMapIndexForPlace(placed.value.place);
  if (!mapIndex.ok) return mapIndex;
  return { ok: true, value: { ...placed.value, vehicle: vehicle.value, mapIndex: mapIndex.value, notes: choice.notes } };
}

// The street names and the small map's roads (scope 005b). They are not
// needed to drive, so the game starts without waiting for them and a failure
// only takes the names and the map away; the failure says why.
export async function loadStreetsForPlace(place: Place): Promise<Loaded<StreetMap>> {
  const streets = await fetchChecked(`places/${place.id}/streets.json`, validateStreetsFile);
  if (!streets.ok) return streets;
  const problems = streetsProblemsForPlace(streets.value, place);
  if (problems.length > 0) return { ok: false, failure: { kind: "map-baked-for-something-else", problems } };
  return streets;
}
