// One control model for every device: four actions, cleaned and combined.
// Design: src/controls/actions.md (CLAUDE.md touch rule, D-0026).
import { describe, expect, it } from "vitest";
import { cleanActions, noActions, pressedJustNow, strongestActions } from "../../src/controls/actions.js";

function actions(changes: Record<string, unknown> = {}) {
  return { ...noActions(), ...changes } as ReturnType<typeof noActions>;
}

describe("actions: happy path", () => {
  it("does nothing when nothing is touched", () => {
    expect(noActions()).toEqual({ steer: 0, accelerate: 0, brake: 0, flipUpright: false });
  });

  it("does what the strongest device asks: the steer furthest from the middle, the largest pedals", () => {
    const keys = actions({ steer: -1, accelerate: 1 });
    const thumbs = actions({ steer: 0.4, brake: 0.3 });
    expect(strongestActions([keys, thumbs])).toEqual({ steer: -1, accelerate: 1, brake: 0.3, flipUpright: false });
  });

  it("flips upright if any device asks", () => {
    expect(strongestActions([actions(), actions({ flipUpright: true }), actions()]).flipUpright).toBe(true);
  });

  it("flips once for a held button, on the frame it is first pressed", () => {
    const held = [false, true, true, true, false, true];
    const flips = held.map((now, frame) => pressedJustNow(held[frame - 1] ?? false, now));
    expect(flips).toEqual([false, true, false, false, false, true]);
  });
});

describe("actions: sad path (a broken reading never reaches the physics)", () => {
  it("turns anything that is not a finite number into 0", () => {
    const broken = actions({ steer: Number.NaN, accelerate: Number.POSITIVE_INFINITY, brake: "1" });
    expect(cleanActions(broken)).toEqual({ steer: 0, accelerate: 0, brake: 0, flipUpright: false });
  });

  it("keeps steer from -1 to 1 and the pedals from 0 to 1", () => {
    expect(cleanActions(actions({ steer: 3, accelerate: 1.5, brake: -0.5 }))).toEqual({ steer: 1, accelerate: 1, brake: 0, flipUpright: false });
    expect(cleanActions(actions({ steer: -7 })).steer).toBe(-1);
  });

  it("does nothing when there are no devices at all", () => {
    expect(strongestActions([])).toEqual(noActions());
  });
});

describe("actions: idiot-proof path (two devices at once never fight)", () => {
  it("keeps the first device's steer on a tie between left and right", () => {
    expect(strongestActions([actions({ steer: 0.5 }), actions({ steer: -0.5 })]).steer).toBe(0.5);
    expect(strongestActions([actions({ steer: -0.5 }), actions({ steer: 0.5 })]).steer).toBe(-0.5);
  });

  it("lets both pedals through when both are pressed, for the pedals to decide (brake wins there)", () => {
    expect(strongestActions([actions({ accelerate: 1 }), actions({ brake: 1 })])).toMatchObject({ accelerate: 1, brake: 1 });
  });
});
