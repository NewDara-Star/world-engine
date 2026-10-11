// The chase camera: behind and above the car, gliding toward its goal the same
// at any frame rate, jumping only after a flip or a return to the start.
// Design: src/camera/chase.md (approver's F12). Game axes: x east, y up,
// z south; the car's nose is its local +x.
import { describe, expect, it } from "vitest";
import { chaseCameraGoal, followFraction, moveChaseCamera } from "../../src/camera/chase.js";
import { multiply, quatAbout, rotationForHeading } from "../vehicle/fixtures.js";

function pose(x: number, z: number, headingDeg: number) {
  return { position: { x, y: 0.5, z }, rotation: rotationForHeading(headingDeg) };
}

function isFinitePoint(point: { x: number; y: number; z: number }): boolean {
  return [point.x, point.y, point.z].every(Number.isFinite);
}

describe("chase camera: happy path", () => {
  it("sits behind and above a car facing east, looking at a point ahead of it", () => {
    const goal = chaseCameraGoal(pose(100, -50, 90));
    expect(goal.cameraPoint.x).toBeLessThan(100);
    expect(goal.cameraPoint.z).toBeCloseTo(-50, 9);
    expect(goal.cameraPoint.y).toBeGreaterThan(1);
    expect(goal.lookPoint.x).toBeGreaterThan(100);
    expect(goal.lookPoint.z).toBeCloseTo(-50, 9);
  });

  it("sits behind a car facing north: to the south of it", () => {
    const goal = chaseCameraGoal(pose(0, 0, 0));
    expect(goal.cameraPoint.z).toBeGreaterThan(0);
    expect(goal.cameraPoint.x).toBeCloseTo(0, 9);
  });

  it("keeps the horizon level: a car leaning on a bump does not tilt the camera's height", () => {
    const flat = chaseCameraGoal(pose(0, 0, 90));
    const leaning = chaseCameraGoal({ ...pose(0, 0, 90), rotation: multiply(rotationForHeading(90), quatAbout({ x: 1, y: 0, z: 0 }, 0.2)) });
    expect(leaning.cameraPoint.y).toBeCloseTo(flat.cameraPoint.y, 9);
    expect(leaning.cameraPoint.x).toBeCloseTo(flat.cameraPoint.x, 9);
  });

  it("glides toward the goal: part of the way each frame", () => {
    const camera = { cameraPoint: { x: 0, y: 2, z: 0 }, lookPoint: { x: 0, y: 1, z: 0 } };
    const goal = { cameraPoint: { x: 10, y: 2, z: 0 }, lookPoint: { x: 20, y: 1, z: 0 } };
    const moved = moveChaseCamera(camera, goal, 1 / 60, false);
    expect(moved.cameraPoint.x).toBeGreaterThan(0);
    expect(moved.cameraPoint.x).toBeLessThan(10);
    expect(moved.lookPoint.x).toBeCloseTo(20 * (moved.cameraPoint.x / 10), 9);
  });
});

describe("chase camera: idiot-proof path", () => {
  it("jumps straight to the goal after a flip or a return to the start, instead of gliding across the map", () => {
    const camera = { cameraPoint: { x: 0, y: 2, z: 0 }, lookPoint: { x: 0, y: 1, z: 0 } };
    const goal = { cameraPoint: { x: 900, y: 2, z: 0 }, lookPoint: { x: 910, y: 1, z: 0 } };
    expect(moveChaseCamera(camera, goal, 1 / 60, true)).toEqual(goal);
  });

  it("never puts the camera at 'not a number' for a car standing on its nose or tail, which would blank the screen", () => {
    for (const angle of [Math.PI / 2, -Math.PI / 2]) {
      const standing = { position: { x: 5, y: 2, z: 5 }, rotation: quatAbout({ x: 0, y: 0, z: 1 }, angle) };
      const goal = chaseCameraGoal(standing);
      expect(isFinitePoint(goal.cameraPoint) && isFinitePoint(goal.lookPoint), String(angle)).toBe(true);
    }
  });

  it("stays put in a frame of no length", () => {
    expect(followFraction(4, 0)).toBe(0);
  });
});

describe("chase camera: the same feel at any frame rate", () => {
  it("follows by 1 minus e to the minus rate times the frame's length", () => {
    expect(followFraction(4, 1 / 60)).toBeCloseTo(1 - Math.exp(-4 / 60), 12);
    expect(followFraction(4, 10)).toBeGreaterThan(0.999);
  });

  it("ends in the same place after two 120 Hz frames as after one 60 Hz frame", () => {
    const camera = { cameraPoint: { x: 0, y: 2, z: 0 }, lookPoint: { x: 0, y: 1, z: 0 } };
    const goal = { cameraPoint: { x: 10, y: 3, z: -4 }, lookPoint: { x: 20, y: 1, z: -4 } };
    const twice = moveChaseCamera(moveChaseCamera(camera, goal, 1 / 120, false), goal, 1 / 120, false);
    const once = moveChaseCamera(camera, goal, 1 / 60, false);
    expect(twice.cameraPoint.x).toBeCloseTo(once.cameraPoint.x, 9);
    expect(twice.cameraPoint.z).toBeCloseTo(once.cameraPoint.z, 9);
    expect(twice.lookPoint.x).toBeCloseTo(once.lookPoint.x, 9);
  });
});

describe("chase camera: tragedy path (the far corner of the map)", () => {
  it("follows a car 2 km from the centre as precisely as one at the centre", () => {
    const near = chaseCameraGoal(pose(0, 0, 30));
    const far = chaseCameraGoal(pose(1450, 1450, 30));
    expect(far.cameraPoint.x - 1450).toBeCloseTo(near.cameraPoint.x, 6);
    expect(far.cameraPoint.z - 1450).toBeCloseTo(near.cameraPoint.z, 6);
  });
});
