// Which 100 m squares are loaded as the car moves: load within the load
// radius, let go beyond the larger keep radius, only inside the map.
// Design: src/game/streaming.md (streamingPlan); squares: src/world/grid.md.
// The radii here are the design's proposed 300 m and 400 m, passed in.
import { describe, expect, it } from "vitest";
import { streamingPlan } from "../../src/game/streaming.js";
import { cellKey, distanceToCell } from "../../src/world/grid.js";

const LOAD = 300;
const KEEP = 400;
const bigMap = { westM: -1500, southM: -1500, eastM: 1500, northM: 1500 };

interface Cell {
  east: number;
  north: number;
}

interface Point {
  eastM: number;
  northM: number;
}

// Follows the car along a path, applying each plan, and counts what happened.
class Streamer {
  loaded = new Map<string, Cell>();
  loads = 0;
  letGo = 0;
  most = 0;

  constructor(private readonly extent = bigMap) {}

  moveTo(car: Point): void {
    const plan = streamingPlan(car, [...this.loaded.values()], this.extent, LOAD, KEEP);
    for (const cell of plan.toLetGo) {
      this.loaded.delete(cellKey(cell));
      this.letGo++;
    }
    for (const cell of plan.toLoad) {
      this.loaded.set(cellKey(cell), cell);
      this.loads++;
    }
    this.most = Math.max(this.most, this.loaded.size);
  }

  has(point: Point): boolean {
    return this.loaded.has(cellKey({ east: Math.floor(point.eastM / 100), north: Math.floor(point.northM / 100) }));
  }
}

function line(from: Point, to: Point, stepM: number): Point[] {
  const length = Math.hypot(to.eastM - from.eastM, to.northM - from.northM);
  const count = Math.max(1, Math.round(length / stepM));
  return Array.from({ length: count + 1 }, (_, at) => ({
    eastM: from.eastM + ((to.eastM - from.eastM) * at) / count,
    northM: from.northM + ((to.northM - from.northM) * at) / count,
  }));
}

describe("streaming: happy path", () => {
  it("loads the squares around a parked car, its own square first, all within the load radius", () => {
    const car = { eastM: 50, northM: 50 };
    const plan = streamingPlan(car, [], bigMap, LOAD, KEEP);
    expect(plan.toLoad[0]).toEqual({ east: 0, north: 0 });
    expect(plan.toLoad.length).toBeGreaterThan(20);
    for (const cell of plan.toLoad) expect(distanceToCell(car, cell)).toBeLessThanOrEqual(LOAD);
    expect(plan.toLetGo).toEqual([]);
  });

  it("loads nearer squares before farther ones", () => {
    const car = { eastM: 50, northM: 50 };
    const distances: number[] = streamingPlan(car, [], bigMap, LOAD, KEEP).toLoad.map((cell: Cell) => distanceToCell(car, cell));
    expect(distances).toEqual(distances.toSorted((a, b) => a - b));
  });

  it("asks for nothing more once everything near the car is loaded", () => {
    const streamer = new Streamer();
    streamer.moveTo({ eastM: 50, northM: 50 });
    expect(streamingPlan({ eastM: 50, northM: 50 }, [...streamer.loaded.values()], bigMap, LOAD, KEEP)).toEqual({ toLoad: [], toLetGo: [] });
  });

  it("loads squares ahead and lets go of squares behind as the car drives 1 km east, with its own square always there", () => {
    const streamer = new Streamer();
    for (const car of line({ eastM: -500, northM: 5 }, { eastM: 500, northM: 5 }, 10)) {
      streamer.moveTo(car);
      expect(streamer.has(car), JSON.stringify(car)).toBe(true);
      expect(streamer.has({ eastM: car.eastM + 250, northM: car.northM }), "the road 250 m ahead").toBe(true);
    }
    expect(streamer.has({ eastM: -500, northM: 5 })).toBe(false);
    expect(streamer.letGo).toBeGreaterThan(0);
  });
});

describe("streaming: idiot-proof path", () => {
  it("never loads a square outside the map, even with the car at its edge", () => {
    const small = { westM: -300, southM: -300, eastM: 300, northM: 300 };
    const plan = streamingPlan({ eastM: 295, northM: 295 }, [], small, LOAD, KEEP);
    expect(plan.toLoad.length).toBeGreaterThan(0);
    for (const cell of plan.toLoad) {
      expect(cell.east).toBeGreaterThanOrEqual(-3);
      expect(cell.east).toBeLessThanOrEqual(2);
      expect(cell.north).toBeGreaterThanOrEqual(-3);
      expect(cell.north).toBeLessThanOrEqual(2);
    }
  });

  it("keeps a square between the load and keep radii, and lets go of one past the keep radius", () => {
    const near = { east: 3, north: 0 };
    const far = { east: 5, north: 0 };
    const plan = streamingPlan({ eastM: 0, northM: 50 }, [near, far], bigMap, LOAD, KEEP);
    expect(plan.toLetGo).toEqual([far]);
  });

  it("does not load and drop the same squares over and over while the car goes back and forth", () => {
    const streamer = new Streamer();
    const there = line({ eastM: 280, northM: 50 }, { eastM: 330, northM: 50 }, 5);
    for (const car of there) streamer.moveTo(car);
    for (const car of there.toReversed()) streamer.moveTo(car);
    const [loadsAfterOnce, letGoAfterOnce] = [streamer.loads, streamer.letGo];
    for (let round = 0; round < 100; round++) {
      for (const car of [...there, ...there.toReversed()]) streamer.moveTo(car);
    }
    expect(streamer.loads).toBe(loadsAfterOnce);
    expect(streamer.letGo).toBe(letGoAfterOnce);
  });

  it("copes with a car that jumps across the map, as after a return to the start", () => {
    const streamer = new Streamer();
    streamer.moveTo({ eastM: 1400, northM: 1400 });
    streamer.moveTo({ eastM: -1400, northM: -1400 });
    expect(streamer.has({ eastM: -1400, northM: -1400 })).toBe(true);
    expect(streamer.has({ eastM: 1400, northM: 1400 })).toBe(false);
  });
});

describe("streaming: tragedy path (a three-hour drive)", () => {
  it("holds no more squares on the fiftieth lap of the map than on the first: nothing piles up", () => {
    const loop = [
      ...line({ eastM: -1000, northM: -1000 }, { eastM: 1000, northM: -1000 }, 10),
      ...line({ eastM: 1000, northM: -1000 }, { eastM: 1000, northM: 1000 }, 10),
      ...line({ eastM: 1000, northM: 1000 }, { eastM: -1000, northM: 1000 }, 10),
      ...line({ eastM: -1000, northM: 1000 }, { eastM: -1000, northM: -1000 }, 10),
    ];
    const streamer = new Streamer();
    for (const car of loop) streamer.moveTo(car);
    const mostOnFirstLap = streamer.most;
    const loadsBefore = streamer.loads;
    for (const car of loop) streamer.moveTo(car);
    const loadsPerLap = streamer.loads - loadsBefore;
    for (let lap = 2; lap < 50; lap++) for (const car of loop) streamer.moveTo(car);
    expect(streamer.most).toBe(mostOnFirstLap);
    expect(streamer.loads - loadsBefore).toBe(49 * loadsPerLap);
    expect(mostOnFirstLap).toBeLessThan(100);
  });
});
