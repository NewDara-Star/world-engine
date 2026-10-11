// The 100 m squares the world is cut into, shared by the bake and the game
// (D-0008). Design: src/world/grid.md. Points are metres east and north of
// the place centre; a square is named by how many squares east and north.
import { describe, expect, it } from "vitest";
import { cellBounds, cellKey, cellOfPoint, cellsWithin, distanceToCell } from "../../src/world/grid.js";

describe("grid: happy path", () => {
  it("finds the square a point is in", () => {
    expect(cellOfPoint({ eastM: 350, northM: 120 })).toEqual({ east: 3, north: 1 });
    expect(cellOfPoint({ eastM: 0, northM: 0 })).toEqual({ east: 0, north: 0 });
  });

  it("names a square east, underscore, north", () => {
    expect(cellKey({ east: 3, north: -2 })).toBe("3_-2");
  });

  it("gives a square's edges in metres", () => {
    expect(cellBounds({ east: 3, north: -2 })).toEqual({ westM: 300, southM: -200, eastM: 400, northM: -100 });
  });

  it("measures 0 to a square from a point inside it, and the straight-line gap from outside", () => {
    expect(distanceToCell({ eastM: 50, northM: 50 }, { east: 0, north: 0 })).toBe(0);
    expect(distanceToCell({ eastM: 150, northM: 50 }, { east: 0, north: 0 })).toBe(50);
    expect(distanceToCell({ eastM: 130, northM: 140 }, { east: 0, north: 0 })).toBe(50);
  });

  it("lists the squares within a radius, nearest first, including squares only partly in reach", () => {
    expect(cellsWithin({ eastM: 50, northM: 50 }, 60)).toHaveLength(5);
    const cells = cellsWithin({ eastM: 50, northM: 50 }, 75);
    expect(cells[0]).toEqual({ east: 0, north: 0 });
    expect(cells).toHaveLength(9);
    for (const cell of cells) expect(distanceToCell({ eastM: 50, northM: 50 }, cell)).toBeLessThanOrEqual(75);
  });
});

describe("grid: idiot-proof path (edges and the minus side)", () => {
  it("rounds down, not toward zero: -0.5 m is in square -1", () => {
    expect(cellOfPoint({ eastM: -0.5, northM: -0.5 })).toEqual({ east: -1, north: -1 });
    expect(cellOfPoint({ eastM: -100, northM: -100.01 })).toEqual({ east: -1, north: -2 });
  });

  it("puts a point on a square's edge in exactly one square: the one to its east and north", () => {
    expect(cellOfPoint({ eastM: 100, northM: 200 })).toEqual({ east: 1, north: 2 });
  });

  it("writes minus zero as 0 in a square's name", () => {
    expect(cellKey({ east: -0, north: -0 })).toBe("0_0");
    expect(cellKey(cellOfPoint({ eastM: -0, northM: 0.5 }))).toBe("0_0");
  });

  it("counts a square as near when its corner is near, not only its middle", () => {
    const cells = cellsWithin({ eastM: 99, northM: 99 }, 2);
    expect(cells.map(cellKey).toSorted()).toEqual(["0_0", "0_1", "1_0", "1_1"]);
  });

  it("orders squares at equal distance by their names, so the order never changes between runs", () => {
    const first = cellsWithin({ eastM: 50, northM: 50 }, 160).map(cellKey);
    expect(cellsWithin({ eastM: 50, northM: 50 }, 160).map(cellKey)).toEqual(first);
    const atFifty = first.filter((key: string) =>["1_0", "0_1", "-1_0", "0_-1"].includes(key));
    expect(atFifty).toEqual(["-1_0", "0_-1", "0_1", "1_0"]);
  });
});

describe("grid: tragedy path (far from the centre)", () => {
  it("still finds the right square 10 km out, and a point in its corner", () => {
    expect(cellOfPoint({ eastM: 9999.99, northM: -10000 })).toEqual({ east: 99, north: -100 });
    expect(cellsWithin({ eastM: 10_050, northM: -9_950 }, 10)[0]).toEqual({ east: 100, north: -100 });
  });
});
