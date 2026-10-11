// The small map's sums: north up, 300 m across, the car's heading, and which
// names are written where (scope 005b). Design: src/game/minimap.md.
import { describe, expect, it } from "vitest";
import { MINI_MAP_ACROSS_M, headingFromFlat, labelSpots, lineInView, mapView, segmentPartInCircle, toScreen } from "../../src/game/minimap.js";
import { boxAround, type Street } from "../../src/world/streets.js";

function street(name: string | undefined, size: "major" | "minor", points: [number, number][]): Street {
  const mapPoints = points.map(([eastM, northM]) => ({ eastM, northM }));
  return { name, size, lines: [{ points: mapPoints, box: boxAround(mapPoints) }] };
}

// Six characters wide per letter, like a 10 px font.
const measure = (text: string): number => text.length * 6;

describe("small map: happy path", () => {
  it("is 300 m across", () => {
    expect(MINI_MAP_ACROSS_M).toBe(300);
    expect(mapView({ eastM: 0, northM: 0 }, 150).pixelsPerMetre).toBeCloseTo(0.5);
  });

  it("puts the car in the middle, north up and east to the right", () => {
    const view = mapView({ eastM: 100, northM: 200 }, 150);
    expect(toScreen({ eastM: 100, northM: 200 }, view)).toEqual({ x: 75, y: 75 });
    const north = toScreen({ eastM: 100, northM: 250 }, view);
    expect(north.y).toBeLessThan(75);
    const east = toScreen({ eastM: 150, northM: 200 }, view);
    expect(east.x).toBeGreaterThan(75);
  });

  it("points the arrow the way the car faces: game x is east, z is south", () => {
    expect(headingFromFlat({ x: 0, z: -1 })).toBeCloseTo(0);
    expect(headingFromFlat({ x: 1, z: 0 })).toBeCloseTo(90);
    expect(headingFromFlat({ x: 0, z: 1 })).toBeCloseTo(180);
    expect(headingFromFlat({ x: -1, z: 0 })).toBeCloseTo(270);
  });

  it("names a road longer than the map, on its part inside the circle and clear of the car", () => {
    const view = mapView({ eastM: 0, northM: 0 }, 300);
    // One long straight segment through the car, from far west to far east.
    const spots = labelSpots([street("Through Road", "major", [[-1000, 0], [0, 0], [1000, 0]])], view, false, measure);
    expect(spots.length).toBe(1);
    expect(Math.abs((spots[0]?.x ?? 150) - 150)).toBeGreaterThan(14);
  });

  it("names a major road in view, at the middle of its longest segment inside the circle", () => {
    const view = mapView({ eastM: 0, northM: 0 }, 300);
    const spots = labelSpots([street("Big Road", "major", [[-100, 50], [100, 50]])], view, false, measure);
    expect(spots).toEqual([{ name: "Big Road", x: 150, y: 100, widthPx: 48 }]);
  });
});

describe("small map: sad path", () => {
  it("draws no line whose box is out of view", () => {
    const view = mapView({ eastM: 0, northM: 0 }, 150);
    expect(lineInView({ westM: 200, southM: 0, eastM: 300, northM: 10 }, view)).toBe(false);
    expect(lineInView({ westM: 140, southM: 0, eastM: 300, northM: 10 }, view)).toBe(true);
  });

  it("writes no name for a road with no name, nor for a road out of view", () => {
    const view = mapView({ eastM: 0, northM: 0 }, 300);
    const spots = labelSpots([street(undefined, "major", [[-100, 50], [100, 50]]), street("Far Road", "major", [[1000, 0], [1100, 0]])], view, true, measure);
    expect(spots).toEqual([]);
  });
});

describe("small map: idiot-proof path (labels)", () => {
  it("names only the bigger roads on the small map, and every named road on the big one", () => {
    const view = mapView({ eastM: 0, northM: 0 }, 300);
    const roads = [street("Big Road", "major", [[-100, 50], [100, 50]]), street("Little Close", "minor", [[-100, -50], [100, -50]])];
    expect(labelSpots(roads, view, false, measure).map((spot) => spot.name)).toEqual(["Big Road"]);
    expect(labelSpots(roads, view, true, measure).map((spot) => spot.name)).toEqual(["Big Road", "Little Close"]);
  });

  it("never writes two names on top of each other: the later one is left out", () => {
    const view = mapView({ eastM: 0, northM: 0 }, 300);
    const roads = [street("First Road", "major", [[-100, 50], [100, 50]]), street("Second Road", "major", [[-100, 52], [100, 52]])];
    expect(labelSpots(roads, view, false, measure).map((spot) => spot.name)).toEqual(["First Road"]);
  });

  it("never lets a name poke out of the round map", () => {
    const view = mapView({ eastM: 0, northM: 0 }, 140);
    for (let northM = -150; northM <= 150; northM += 7) {
      const spots = labelSpots([street("A Rather Long Street Name", "major", [[-150, northM], [150, northM]])], view, false, measure);
      for (const spot of spots) {
        const cornerX = Math.abs(spot.x - 70) + spot.widthPx / 2;
        const cornerY = Math.abs(spot.y - 70) + 6;
        expect(Math.hypot(cornerX, cornerY), `north ${northM}`).toBeLessThanOrEqual(70);
      }
    }
  });

  it("never writes a name over the car", () => {
    const view = mapView({ eastM: 0, northM: 0 }, 300);
    expect(labelSpots([street("Under Car Road", "major", [[-60, 0], [60, 0]])], view, false, measure)).toEqual([]);
  });

  it("writes a name once, even when the street is split into a major and a minor part", () => {
    const view = mapView({ eastM: 0, northM: 0 }, 300);
    const roads = [street("Split Road", "major", [[-100, 50], [100, 50]]), street("Split Road", "minor", [[-100, -50], [100, -50]])];
    expect(labelSpots(roads, view, true, measure).map((spot) => spot.name)).toEqual(["Split Road"]);
  });

  it("gives a heading from 0 up to but not including 360, never minus", () => {
    for (let degrees = -720; degrees <= 720; degrees += 15) {
      const radians = (degrees * Math.PI) / 180;
      const heading = headingFromFlat({ x: Math.sin(radians), z: -Math.cos(radians) });
      expect(heading).toBeGreaterThanOrEqual(0);
      expect(heading).toBeLessThan(360);
    }
  });
});

describe("small map: the part of a segment inside the circle", () => {
  it("cuts a segment that crosses the circle to the circle", () => {
    const part = segmentPartInCircle({ x: -100, y: 50 }, { x: 200, y: 50 }, 50);
    expect(part?.lengthPx).toBeCloseTo(100);
    expect(part?.middle.x).toBeCloseTo(50);
  });

  it("gives nothing for a segment that misses the circle, or a point", () => {
    expect(segmentPartInCircle({ x: 0, y: -10 }, { x: 100, y: -10 }, 50)).toBeUndefined();
    expect(segmentPartInCircle({ x: 50, y: 50 }, { x: 50, y: 50 }, 50)).toBeUndefined();
  });
});

describe("small map: tragedy path", () => {
  it("places the screen right far from the centre, at the map's edge", () => {
    const view = mapView({ eastM: 1499.9, northM: -1499.9 }, 140);
    const point = toScreen({ eastM: 1499.9 + 30, northM: -1499.9 }, view);
    expect(point.x).toBeCloseTo(70 + 30 * (140 / 300), 6);
    expect(point.y).toBeCloseTo(70, 6);
  });
});
