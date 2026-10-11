// Where the small map goes: never over a thumb control, in portrait or
// landscape (scope 005b). Design: src/game/hud-layout.md. The controls are
// laid out here as index.html lays them out: the steering area is the left
// half; Go is 104 px, 16 px from the right and bottom; Brake 88 px, 116 px
// further left; Flip upright 72 px, 120 px above Go.
import { describe, expect, it } from "vitest";
import {
  MINI_MAP_BIG_PX,
  MINI_MAP_SMALL_PX,
  MINI_MAP_TOP_PX,
  SMALLEST_MINI_MAP_PX,
  type ScreenBox,
  boxesTouch,
  miniMapBox,
} from "../../src/game/hud-layout.js";

function box(left: number, top: number, width: number, height: number): ScreenBox {
  return { left, top, right: left + width, bottom: top + height };
}

function thumbControls(width: number, height: number): ScreenBox[] {
  return [
    box(0, 0, width / 2, height),
    box(width - 16 - 104, height - 16 - 104, 104, 104),
    box(width - 16 - 116 - 88, height - 16 - 88, 88, 88),
    box(width - 16 - 72, height - 16 - 120 - 72, 72, 72),
  ];
}

function overlaps(a: ScreenBox, b: ScreenBox): boolean {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}

function sizeOf(map: ScreenBox | undefined): number {
  return map === undefined ? 0 : map.right - map.left;
}

// Every screen from 200 px up, both ways round, at both map sizes: the maps
// that showed, with the controls they were placed among.
function mapsOnManyScreens(): { label: string; map: ScreenBox | undefined; controls: ScreenBox[] }[] {
  const placed: { label: string; map: ScreenBox | undefined; controls: ScreenBox[] }[] = [];
  for (let height = 200; height <= 1200; height += 29) {
    for (let width = 200; width <= 1200; width += 31) {
      const controls = thumbControls(width, height);
      for (const wanted of [MINI_MAP_SMALL_PX, MINI_MAP_BIG_PX]) placed.push({ label: `${width}×${height} at ${wanted} px`, map: miniMapBox({ width, height }, controls, wanted), controls });
    }
  }
  return placed;
}

// Phones in both ways round, a small old phone, a tablet.
const SCREENS: [string, number, number][] = [
  ["a mid-range Android phone upright", 393, 851],
  ["the same phone sideways", 851, 393],
  ["a small phone upright", 320, 568],
  ["a small phone sideways", 568, 320],
  ["a large phone sideways", 932, 430],
  ["a tablet", 1024, 768],
];

describe("small map layout: happy path", () => {
  it.each(SCREENS)("on %s, neither the small nor the big map covers any thumb control", (_, width, height) => {
    const controls = thumbControls(width, height);
    for (const wanted of [MINI_MAP_SMALL_PX, MINI_MAP_BIG_PX]) {
      const map = miniMapBox({ width, height }, controls, wanted);
      if (map === undefined) continue;
      for (const control of controls) expect(overlaps(map, control), `${wanted} px map over a control`).toBe(false);
      expect(map.left).toBeGreaterThanOrEqual(0);
      expect(map.right).toBeLessThanOrEqual(width);
      expect(map.bottom).toBeLessThanOrEqual(height);
    }
  });

  it.each(SCREENS.slice(0, 2))("on %s, the map shows, and tapping makes it bigger", (_, width, height) => {
    const small = miniMapBox({ width, height }, thumbControls(width, height), MINI_MAP_SMALL_PX);
    const big = miniMapBox({ width, height }, thumbControls(width, height), MINI_MAP_BIG_PX);
    expect(sizeOf(small)).toBeGreaterThan(0);
    expect(sizeOf(big)).toBeGreaterThan(sizeOf(small));
  });

  it("upright, sits in the top-right corner at the size asked for, below the street name", () => {
    expect(miniMapBox({ width: 393, height: 851 }, thumbControls(393, 851), MINI_MAP_SMALL_PX)).toEqual(box(393 - 8 - 140, MINI_MAP_TOP_PX, 140, 140));
  });

  it("on a computer with no thumb controls, sits in the top-right corner", () => {
    expect(miniMapBox({ width: 1440, height: 900 }, [], MINI_MAP_BIG_PX)).toEqual(box(1440 - 8 - 260, MINI_MAP_TOP_PX, 260, 260));
  });
});

describe("small map layout: sad path", () => {
  it("is not shown at all when no readable map fits", () => {
    expect(miniMapBox({ width: 200, height: 120 }, thumbControls(200, 120), MINI_MAP_SMALL_PX)).toBeUndefined();
  });

  it("is never smaller than readable when it is shown", () => {
    for (const { label, map } of mapsOnManyScreens().filter((one) => one.map !== undefined)) {
      expect(sizeOf(map), label).toBeGreaterThanOrEqual(SMALLEST_MINI_MAP_PX);
    }
  });
});

describe("small map layout: idiot-proof path", () => {
  it("never covers a control on any screen from 200 to 1200 px wide, either way round", () => {
    for (const { label, map, controls } of mapsOnManyScreens()) {
      if (map !== undefined) expect(controls.some((control) => overlaps(map, control)), label).toBe(false);
    }
  });

  it("keeps a gap round a control, so a thumb aimed at its edge does not land on the map", () => {
    expect(boxesTouch(box(0, 0, 10, 10), box(14, 0, 10, 10))).toBe(true);
    expect(boxesTouch(box(0, 0, 10, 10), box(18, 0, 10, 10))).toBe(false);
  });

  it("copes with a control placed in an odd spot, top right, by moving left of it", () => {
    const odd = box(393 - 100, 40, 100, 100);
    const map = miniMapBox({ width: 393, height: 851 }, [box(0, 0, 196, 851), odd], MINI_MAP_SMALL_PX);
    expect(map).toBeDefined();
    expect(overlaps(map as ScreenBox, odd)).toBe(false);
  });
});

describe("small map layout: tragedy path", () => {
  it("answers quickly for many controls, so turning the phone never stutters", () => {
    const many = Array.from({ length: 200 }, (_, at) => box(400 + (at % 20) * 30, 300 + Math.floor(at / 20) * 30, 20, 20));
    const started = performance.now();
    const map = miniMapBox({ width: 1200, height: 900 }, many, MINI_MAP_BIG_PX);
    expect(performance.now() - started).toBeLessThan(200);
    expect(map).toBeDefined();
  });
});
