// A frame's length, and how far the fog sits so squares never pop in at the
// sides of a wide phone. Designs: src/game/loop.md (frameSeconds) and
// src/game/scene.md (fogRangeForView, approver's F13: three.js fogs by depth).
import { describe, expect, it } from "vitest";
import { frameSeconds } from "../../src/game/loop.js";
import { fogRangeForView } from "../../src/game/scene.js";

describe("frame length", () => {
  it("turns milliseconds between frames into seconds", () => {
    expect(frameSeconds(1000, 1016)).toBeCloseTo(0.016, 12);
  });

  it("never simulates the minutes a locked phone was away: at most a quarter of a second", () => {
    expect(frameSeconds(1000, 181_000)).toBe(0.25);
  });

  it("gives 0 for a clock that went backwards", () => {
    expect(frameSeconds(5000, 4000)).toBe(0);
  });

  it("stays exact three hours into a session", () => {
    const threeHours = 3 * 3600 * 1000;
    expect(frameSeconds(threeHours, threeHours + 1000 / 60)).toBeCloseTo(1 / 60, 9);
  });
});

describe("fog for the screen's shape", () => {
  it("pulls the fog in on a 20:9 phone held sideways, so a square 294 m away at the screen's edge is already fogged", () => {
    const fog = fogRangeForView(300, 6, 60, 20 / 9);
    const halfWide = Math.atan(Math.tan(Math.PI / 6) * (20 / 9));
    expect(fog.far).toBeCloseTo(294 * Math.cos(halfWide), 6);
    expect(fog.far).toBeGreaterThan(175);
    expect(fog.far).toBeLessThan(185);
    expect(fog.near).toBeCloseTo(fog.far / 2, 9);
  });

  it("uses the taller view angle on a phone held upright", () => {
    const fog = fogRangeForView(300, 6, 60, 9 / 20);
    expect(fog.far).toBeCloseTo(294 * Math.cos(Math.PI / 6), 6);
  });

  it("works it out again for a new shape: a wider screen gets nearer fog", () => {
    expect(fogRangeForView(300, 6, 60, 2).far).toBeLessThan(fogRangeForView(300, 6, 60, 1).far);
  });

  it("never gives fog at 'not a number' for a window shrunk to nothing in one direction", () => {
    for (const aspect of [0, Number.POSITIVE_INFINITY]) {
      const fog = fogRangeForView(300, 6, 60, aspect);
      expect(Number.isFinite(fog.near) && Number.isFinite(fog.far), String(aspect)).toBe(true);
    }
  });
});
