// The small round map (scope 005b): north up, about 300 m across, centred
// on the car, with its roads from streets.json, the names of the bigger roads
// and an arrow for the car. Drawn with the browser's 2D canvas (MDN
// CanvasRenderingContext2D: arc, clip, moveTo, lineTo, stroke, fillText,
// strokeText, measureText). Labels are placed first come, first served, and
// one that would overlap a placed label is left out: the greedy collision
// test web maps use (MapLibre GL JS, maplibre/maplibre-gl-js,
// src/symbol/collision_index.ts, BSD-3-Clause, technique only; research/38-street-names-and-map.md). The view sums are
// pure, so they can be tested; drawing only follows them.
// Design: docs/designs/src/game/minimap.md.
import type { CellBounds, MapPoint } from "../world/grid.js";
import type { Street } from "../world/streets.js";

// The scope's "about 300 m across" (owner, 2026-10-11).
export const MINI_MAP_ACROSS_M = 300;

// Look-and-feel, the owner's choice, proposed by the coder on 2026-10-11:
// colours near the 3D world's ground and road, so the two read as one place.
const MAP_COLOURS = {
  ground: "#e6ead8",
  edge: "#1d2733",
  roadCasing: "#8f9488",
  road: "#ffffff",
  label: "#1d2733",
  labelHalo: "rgba(255,255,255,0.9)",
  car: "#d2452f",
};
// Road widths on the map, in pixels: the map is too small for true widths.
const ROAD_PX = { major: 5, minor: 3 };
const LABEL_FONT = "600 10px system-ui, sans-serif";
const LABEL_HEIGHT_PX = 12;
// No label within this of the centre, so the car arrow is never hidden.
const CAR_CLEAR_PX = 14;
const CAR_ARROW_PX = 9;

export interface MapView {
  centre: MapPoint;
  sizePx: number;
  pixelsPerMetre: number;
}

export interface ScreenPoint {
  x: number;
  y: number;
}

export interface LabelSpot {
  name: string;
  x: number;
  y: number;
  widthPx: number;
}

export function mapView(car: MapPoint, sizePx: number): MapView {
  return { centre: car, sizePx, pixelsPerMetre: sizePx / MINI_MAP_ACROSS_M };
}

// North up: metres east go right, metres north go up the screen.
export function toScreen(point: MapPoint, view: MapView): ScreenPoint {
  return {
    x: view.sizePx / 2 + (point.eastM - view.centre.eastM) * view.pixelsPerMetre,
    y: view.sizePx / 2 - (point.northM - view.centre.northM) * view.pixelsPerMetre,
  };
}

// A line is drawn only when its box reaches the map's square.
export function lineInView(box: CellBounds, view: MapView): boolean {
  const halfM = view.sizePx / 2 / view.pixelsPerMetre;
  const { eastM, northM } = view.centre;
  return box.eastM >= eastM - halfM && box.westM <= eastM + halfM && box.northM >= northM - halfM && box.southM <= northM + halfM;
}

// Degrees clockwise from north, from the way the car faces along the ground
// in game axes (x east, z south; src/vehicle/car.ts, flatHeading).
export function headingFromFlat(flat: { x: number; z: number }): number {
  const degrees = (Math.atan2(flat.x, -flat.z) * 180) / Math.PI;
  return ((degrees % 360) + 360) % 360;
}

// The names to write: a street with a name, major or (on the big map) any
// size; each name once, in file order, at the first spot that fits from
// labelCandidates; left out if none fits clear of placed names and the car.
export function labelSpots(streets: readonly Street[], view: MapView, big: boolean, measure: (text: string) => number): LabelSpot[] {
  const placed: LabelSpot[] = [];
  for (const street of streets) {
    if (street.name === undefined || (street.size !== "major" && !big)) continue;
    if (placed.some((spot) => spot.name === street.name)) continue;
    const widthPx = measure(street.name);
    const name = street.name;
    const spot = labelCandidates(street, view)
      .map((middle) => ({ name, x: middle.x, y: middle.y, widthPx }))
      .find((candidate) => labelFits(candidate, placed, view));
    if (spot !== undefined) placed.push(spot);
  }
  return placed;
}

// The middle of each part of the street inside the circle, longest part
// first, so the name sits on road the player can see, where it reads best.
// Equal lengths keep the street's own order (sort is stable, ECMA-262).
export function labelCandidates(street: Street, view: MapView): ScreenPoint[] {
  const parts: { lengthPx: number; middle: ScreenPoint }[] = [];
  for (const line of street.lines.filter((one) => lineInView(one.box, view))) {
    const points = line.points.map((point) => toScreen(point, view));
    for (let at = 1; at < points.length; at += 1) {
      const part = segmentPartInCircle(points[at - 1] as ScreenPoint, points[at] as ScreenPoint, view.sizePx / 2);
      if (part !== undefined) parts.push(part);
    }
  }
  return parts.toSorted((a, b) => b.lengthPx - a.lengthPx).map((part) => part.middle);
}

// The part of a segment inside the circle, which is centred in the square
// with a radius of half its side: where the point a + t(b − a) is exactly
// one radius from the centre, a quadratic in t (line–circle intersection,
// standard geometry), kept between the segment's ends.
export function segmentPartInCircle(a: ScreenPoint, b: ScreenPoint, radiusPx: number): { lengthPx: number; middle: ScreenPoint } | undefined {
  const along = { x: b.x - a.x, y: b.y - a.y };
  const fromCentre = { x: a.x - radiusPx, y: a.y - radiusPx };
  const quadratic = along.x * along.x + along.y * along.y;
  const linear = 2 * (fromCentre.x * along.x + fromCentre.y * along.y);
  const constant = fromCentre.x * fromCentre.x + fromCentre.y * fromCentre.y - radiusPx * radiusPx;
  const discriminant = linear * linear - 4 * quadratic * constant;
  if (quadratic === 0 || discriminant <= 0) return undefined;
  const enter = Math.max(0, (-linear - Math.sqrt(discriminant)) / (2 * quadratic));
  const leave = Math.min(1, (-linear + Math.sqrt(discriminant)) / (2 * quadratic));
  if (leave <= enter) return undefined;
  const middle = (enter + leave) / 2;
  return { lengthPx: (leave - enter) * Math.sqrt(quadratic), middle: { x: a.x + middle * along.x, y: a.y + middle * along.y } };
}

// Whole inside the circle, clear of the car and of every placed name.
export function labelFits(spot: LabelSpot, placed: readonly LabelSpot[], view: MapView): boolean {
  const halfWidth = spot.widthPx / 2;
  const halfHeight = LABEL_HEIGHT_PX / 2;
  const radiusPx = view.sizePx / 2;
  // The corner farthest from the centre decides whether the box is inside.
  const farthestX = Math.abs(spot.x - radiusPx) + halfWidth;
  const farthestY = Math.abs(spot.y - radiusPx) + halfHeight;
  if (Math.hypot(farthestX, farthestY) > radiusPx) return false;
  if (Math.abs(spot.x - radiusPx) < halfWidth + CAR_CLEAR_PX && Math.abs(spot.y - radiusPx) < halfHeight + CAR_CLEAR_PX) return false;
  return placed.every((other) => labelsApart(spot, other));
}

// Two names are apart when they are side by side or one above the other.
export function labelsApart(a: LabelSpot, b: LabelSpot): boolean {
  return Math.abs(a.x - b.x) >= (a.widthPx + b.widthPx) / 2 || Math.abs(a.y - b.y) >= LABEL_HEIGHT_PX;
}

// The whole map, once: ground, roads, names, the car, the edge and N.
export function drawMiniMap(context: CanvasRenderingContext2D, streets: readonly Street[], view: MapView, headingDeg: number, big: boolean): void {
  const middle = view.sizePx / 2;
  context.save();
  context.clearRect(0, 0, view.sizePx, view.sizePx);
  context.beginPath();
  context.arc(middle, middle, middle - 1, 0, Math.PI * 2);
  context.fillStyle = MAP_COLOURS.ground;
  context.fill();
  context.clip();
  drawRoads(context, streets, view);
  context.font = LABEL_FONT;
  drawLabels(context, labelSpots(streets, view, big, (text) => context.measureText(text).width));
  drawCarArrow(context, middle, headingDeg);
  context.restore();
  drawEdgeAndNorth(context, middle);
}

// Every road twice: a grey casing, then white on top, so crossings join up.
export function drawRoads(context: CanvasRenderingContext2D, streets: readonly Street[], view: MapView): void {
  context.lineCap = "round";
  context.lineJoin = "round";
  for (const [colour, extraPx] of [[MAP_COLOURS.roadCasing, 2], [MAP_COLOURS.road, 0]] as const) {
    context.strokeStyle = colour;
    for (const street of streets) {
      context.lineWidth = ROAD_PX[street.size] + extraPx;
      context.beginPath();
      for (const line of street.lines.filter((one) => lineInView(one.box, view))) traceLine(context, line.points, view);
      context.stroke();
    }
  }
}

export function traceLine(context: CanvasRenderingContext2D, points: readonly MapPoint[], view: MapView): void {
  for (const [at, point] of points.entries()) {
    const spot = toScreen(point, view);
    if (at === 0) context.moveTo(spot.x, spot.y);
    else context.lineTo(spot.x, spot.y);
  }
}

// A white halo under each name, so it reads over roads.
export function drawLabels(context: CanvasRenderingContext2D, spots: readonly LabelSpot[]): void {
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.lineWidth = 3;
  context.strokeStyle = MAP_COLOURS.labelHalo;
  context.fillStyle = MAP_COLOURS.label;
  for (const spot of spots) {
    context.strokeText(spot.name, spot.x, spot.y);
    context.fillText(spot.name, spot.x, spot.y);
  }
}

// An arrow at the centre pointing the way the car faces; the canvas turns
// clockwise for a positive angle, as a compass heading does.
export function drawCarArrow(context: CanvasRenderingContext2D, middle: number, headingDeg: number): void {
  context.save();
  context.translate(middle, middle);
  context.rotate((headingDeg * Math.PI) / 180);
  context.beginPath();
  context.moveTo(0, -CAR_ARROW_PX);
  context.lineTo(CAR_ARROW_PX * 0.7, CAR_ARROW_PX * 0.8);
  context.lineTo(0, CAR_ARROW_PX * 0.4);
  context.lineTo(-CAR_ARROW_PX * 0.7, CAR_ARROW_PX * 0.8);
  context.closePath();
  context.fillStyle = MAP_COLOURS.car;
  context.strokeStyle = MAP_COLOURS.road;
  context.lineWidth = 2;
  context.stroke();
  context.fill();
  context.restore();
}

// A ring round the map and an N at the top, since north is always up.
export function drawEdgeAndNorth(context: CanvasRenderingContext2D, middle: number): void {
  context.beginPath();
  context.arc(middle, middle, middle - 1, 0, Math.PI * 2);
  context.strokeStyle = MAP_COLOURS.edge;
  context.lineWidth = 2;
  context.stroke();
  context.font = LABEL_FONT;
  context.textAlign = "center";
  context.textBaseline = "top";
  context.lineWidth = 3;
  context.strokeStyle = MAP_COLOURS.labelHalo;
  context.strokeText("N", middle, 3);
  context.fillStyle = MAP_COLOURS.label;
  context.fillText("N", middle, 3);
}
