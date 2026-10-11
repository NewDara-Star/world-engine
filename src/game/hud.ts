// The street-name line and the small map on the page (scope 005b): filled
// when the street file arrives, placed clear of the thumb controls, redrawn
// ten times a second, and made bigger or smaller with a tap. The rules are
// in streets.ts (which street), hud-layout.ts (where) and minimap.ts (what is
// drawn); this joins them to the page. Browser plumbing (MDN):
// getBoundingClientRect, canvas getContext("2d"), setTransform, the click
// event, devicePixelRatio. Design: docs/designs/src/game/hud.md.
import { flatHeading } from "../vehicle/car.js";
import type { MapPoint } from "../world/grid.js";
import { type StreetMap, nearestStreetName, streetNameAfter } from "../world/streets.js";
import { type GameFailure, failureMessage, showNotice } from "./failure.js";
import type { Game } from "./game.js";
import { MINI_MAP_BIG_PX, MINI_MAP_SMALL_PX, type ScreenBox, miniMapBox } from "./hud-layout.js";
import type { Loaded } from "./load.js";
import { drawMiniMap, headingFromFlat, mapView } from "./minimap.js";

// Ten times a second is smooth enough for a map 300 m across and a name, and
// leaves the phone's time for the 3D picture. The owner's choice, proposed by
// the coder on 2026-10-11, to be confirmed by the frame-rate measurement.
const HUD_EVERY_MS = 100;
// Sharper costs drawing time, as for the 3D picture (scene.ts).
const MOST_PIXEL_RATIO = 2;

// The game drives on without names; the player is told why, once.
export function streetsArrived(game: Game, loaded: Loaded<StreetMap>): void {
  if (loaded.ok) {
    game.streets = loaded.value.streets;
    placeHud(game);
    return;
  }
  game.streets = "failed";
  placeHud(game);
  showNotice(game.page, streetsFailureNotice(loaded.failure));
}

// One line, in words a non-coder understands; an old bake, which has no
// street file, gets the fix.
export function streetsFailureNotice(failure: GameFailure): string {
  if (failure.kind === "file-missing") return "No street names or small map: this map was made before they existed. Bake it again to get them.";
  const reason = failure.kind === "map-baked-for-something-else" ? (failure.problems[0] ?? "") : (failureMessage(failure)[0] ?? "");
  return `No street names or small map: ${reason}`;
}

// Where the map fits now, from the controls as they are on the page; hidden
// when it does not fit or there are no streets to show. Drawn again at once.
export function placeHud(game: Game): void {
  const map = game.page.miniMap;
  const controls = game.page.controls.hidden ? [] : [...game.page.controls.querySelectorAll("[data-role]")];
  const keepOut: ScreenBox[] = controls.map((control) => control.getBoundingClientRect());
  const screen = { width: game.page.canvas.clientWidth, height: game.page.canvas.clientHeight };
  const box = Array.isArray(game.streets) ? miniMapBox(screen, keepOut, game.miniMap.big ? MINI_MAP_BIG_PX : MINI_MAP_SMALL_PX) : undefined;
  game.miniMap.box = box;
  game.miniMap.drawnAtMs = undefined;
  map.hidden = box === undefined;
  if (box === undefined) return;
  const pixelRatio = Math.min(window.devicePixelRatio, MOST_PIXEL_RATIO);
  const sizePx = box.right - box.left;
  Object.assign(map.style, { left: `${box.left}px`, top: `${box.top}px`, width: `${sizePx}px`, height: `${sizePx}px` });
  map.width = Math.round(sizePx * pixelRatio);
  map.height = Math.round(sizePx * pixelRatio);
  map.getContext("2d")?.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
}

// A tap swaps between the small and the big map.
export function listenToMiniMapTaps(game: Game): void {
  game.page.miniMap.addEventListener("click", () => {
    game.miniMap.big = !game.miniMap.big;
    placeHud(game);
  });
}

// Ten times a second: which street (held for a moment before it changes,
// streets.ts), and the map around the car.
export function updateHud(game: Game, car: MapPoint, nowMs: number): void {
  const streets = game.streets;
  if (!Array.isArray(streets)) return;
  if (game.miniMap.drawnAtMs !== undefined && nowMs - game.miniMap.drawnAtMs < HUD_EVERY_MS) return;
  game.miniMap.drawnAtMs = nowMs;
  game.streetName = streetNameAfter(game.streetName, nearestStreetName(streets, car, game.streetName.shown), nowMs);
  game.page.streetName.textContent = game.streetName.shown ?? "";
  game.page.streetName.hidden = game.streetName.shown === undefined;
  const box = game.miniMap.box;
  const context = game.page.miniMap.getContext("2d");
  if (box === undefined || context === null) return;
  const headingDeg = headingFromFlat(flatHeading(game.car.body.rotation()));
  drawMiniMap(context, streets, mapView(car, box.right - box.left), headingDeg, game.miniMap.big);
}
