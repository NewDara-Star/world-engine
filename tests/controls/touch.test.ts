// Thumbs to actions: a stick where the left thumb lands, pedals and Flip
// upright on the right, every finger followed by its own pointer id so two
// thumbs work at once. Design: src/controls/touch.md (approver's F11,
// decision E3 (a)). The decisions are pure functions over the touch state;
// the browser part (listenToTouches) needs a real page and is not tested here.
import { describe, expect, it } from "vitest";
import {
  noTouches,
  portraitHintShown,
  shouldShowTouchControls,
  stickSteer,
  touchActions,
  touchStateAfter,
} from "../../src/controls/touch.js";

type Role = "stick" | "accelerate" | "brake" | "flipUpright" | "none";
type Kind = "down" | "move" | "up" | "cancel";

const screen = { width: 800, height: 400 };

function finger(kind: Kind, pointerId: number, x: number, y: number, role: Role) {
  return { kind, pointerId, x, y, role, screen };
}

type TouchState = typeof noTouches;

function play(...events: ReturnType<typeof finger>[]): TouchState {
  return events.reduce<TouchState>((state, event) => touchStateAfter(state, event), noTouches);
}

function after(state: TouchState, ...events: ReturnType<typeof finger>[]): TouchState {
  return events.reduce<TouchState>((current, event) => touchStateAfter(current, event), state);
}

describe("touch: happy path", () => {
  it("does nothing with no fingers down", () => {
    expect(touchActions(noTouches)).toEqual({ steer: 0, accelerate: 0, brake: 0, flipUpright: false });
  });

  it("steers right as the left thumb slides right from where it landed, and full right at the stick's edge", () => {
    const landed = play(finger("down", 1, 200, 300, "stick"));
    expect(touchActions(landed).steer).toBe(0);
    const little = touchActions(after(landed, finger("move", 1, 220, 300, "stick"))).steer;
    const more = touchActions(after(landed, finger("move", 1, 240, 300, "stick"))).steer;
    expect(little).toBeGreaterThan(0);
    expect(more).toBeGreaterThan(little);
    expect(touchActions(after(landed, finger("move", 1, 400, 300, "stick"))).steer).toBe(1);
    expect(touchActions(after(landed, finger("move", 1, 0, 300, "stick"))).steer).toBe(-1);
  });

  it("steers only with sideways movement, not up and down", () => {
    const state = play(finger("down", 1, 200, 300, "stick"), finger("move", 1, 200, 50, "stick"));
    expect(touchActions(state).steer).toBe(0);
  });

  it("accelerates, brakes and flips with the buttons on the right", () => {
    expect(touchActions(play(finger("down", 2, 750, 350, "accelerate"))).accelerate).toBe(1);
    expect(touchActions(play(finger("down", 2, 650, 350, "brake"))).brake).toBe(1);
    expect(touchActions(play(finger("down", 2, 700, 200, "flipUpright"))).flipUpright).toBe(true);
  });

  it("works with two thumbs at once: steering left while accelerating", () => {
    const state = play(
      finger("down", 1, 200, 300, "stick"),
      finger("down", 2, 750, 350, "accelerate"),
      finger("move", 1, 100, 300, "stick"),
    );
    expect(touchActions(state)).toEqual({ steer: -1, accelerate: 1, brake: 0, flipUpright: false });
  });

  it("lets go of exactly what a lifted thumb held", () => {
    const both = play(finger("down", 1, 200, 300, "stick"), finger("move", 1, 400, 300, "stick"), finger("down", 2, 750, 350, "accelerate"));
    expect(touchActions(after(both, finger("up", 2, 750, 350, "accelerate")))).toEqual({ steer: 1, accelerate: 0, brake: 0, flipUpright: false });
    expect(touchActions(after(both, finger("up", 1, 400, 300, "stick")))).toEqual({ steer: 0, accelerate: 1, brake: 0, flipUpright: false });
  });

  it("matches the stick's steer to its sums: sideways over the radius, with the dead zone taken out", () => {
    expect(stickSteer({ x: 100, y: 0 }, { x: 130, y: 0 }, 60, 0.1)).toBeCloseTo((0.5 - 0.1) / 0.9, 9);
    expect(stickSteer({ x: 100, y: 0 }, { x: 105, y: 0 }, 60, 0.1)).toBe(0);
    expect(stickSteer({ x: 100, y: 0 }, { x: 0, y: 0 }, 60, 0.1)).toBe(-1);
  });
});

describe("touch: sad path (the phone takes a finger away)", () => {
  it("treats a cancelled finger, such as a call coming in, the same as a lifted one", () => {
    const state = play(finger("down", 2, 750, 350, "accelerate"), finger("cancel", 2, 750, 350, "accelerate"));
    expect(touchActions(state).accelerate).toBe(0);
  });

  it("does nothing for a finger that lands on nothing", () => {
    expect(touchActions(play(finger("down", 3, 600, 50, "none")))).toEqual({ steer: 0, accelerate: 0, brake: 0, flipUpright: false });
  });

  it("ignores a lift from a finger it never saw", () => {
    const state = play(finger("down", 2, 750, 350, "accelerate"), finger("up", 9, 10, 10, "none"));
    expect(touchActions(state).accelerate).toBe(1);
  });
});

describe("touch: idiot-proof path (thumbs do unexpected things)", () => {
  it("does not let a second thumb on the stick area steal the stick", () => {
    const state = play(
      finger("down", 1, 200, 300, "stick"),
      finger("move", 1, 400, 300, "stick"),
      finger("down", 3, 100, 300, "stick"),
      finger("move", 3, 0, 300, "stick"),
    );
    expect(touchActions(state).steer).toBe(1);
  });

  it("presses both pedals with two fingers, for the pedals to decide (brake wins there)", () => {
    const state = play(finger("down", 2, 750, 350, "accelerate"), finger("down", 3, 650, 350, "brake"));
    expect(touchActions(state)).toMatchObject({ accelerate: 1, brake: 1 });
  });

  it("holds the pedal a thumb is rocked onto: from brake onto accelerate it accelerates, never reverses", () => {
    const state = play(finger("down", 2, 650, 350, "brake"), finger("move", 2, 750, 350, "accelerate"));
    expect(touchActions(state)).toMatchObject({ accelerate: 1, brake: 0 });
    const back = after(state, finger("move", 2, 650, 350, "brake"));
    expect(touchActions(back)).toMatchObject({ accelerate: 0, brake: 1 });
  });

  it("keeps the pedal when the thumb slides off every button, as on a real pedal", () => {
    const state = play(finger("down", 2, 750, 350, "accelerate"), finger("move", 2, 790, 390, "none"));
    expect(touchActions(state).accelerate).toBe(1);
  });

  it("never slides onto Flip upright, which needs its own press", () => {
    const state = play(finger("down", 2, 750, 350, "accelerate"), finger("move", 2, 700, 200, "flipUpright"));
    expect(touchActions(state)).toMatchObject({ accelerate: 1, flipUpright: false });
  });

  it("can still reach full left when the thumb lands right at the screen's edge", () => {
    const state = play(finger("down", 1, 1, 300, "stick"), finger("move", 1, 0, 300, "stick"));
    expect(touchActions(state).steer).toBe(-1);
  });

  it("keeps steering from where the thumb landed when the thumb slides far off the stick area", () => {
    const state = play(finger("down", 1, 200, 300, "stick"), finger("move", 1, 700, 300, "accelerate"));
    expect(touchActions(state)).toMatchObject({ steer: 1, accelerate: 0 });
  });
});

describe("touch: when the controls and the hint show", () => {
  it("shows the thumb controls on a phone, and on a computer once a touch is seen", () => {
    expect(shouldShowTouchControls(true, false)).toBe(true);
    expect(shouldShowTouchControls(false, true)).toBe(true);
    expect(shouldShowTouchControls(false, false)).toBe(false);
  });

  it("suggests turning the phone sideways only while it is held upright with the thumb controls shown", () => {
    expect(portraitHintShown(true, 400, 800)).toBe(true);
    expect(portraitHintShown(true, 800, 400)).toBe(false);
    expect(portraitHintShown(false, 400, 800)).toBe(false);
    expect(portraitHintShown(true, 500, 500)).toBe(false);
  });
});

describe("touch: tragedy path (a long session of touches)", () => {
  it("holds nothing after ten thousand presses and lifts with many fingers", () => {
    let state = noTouches;
    const roles: Role[] = ["accelerate", "brake", "flipUpright", "stick"];
    for (let at = 0; at < 10_000; at++) {
      const role = roles[at % roles.length] ?? "none";
      state = touchStateAfter(state, finger("down", at, role === "stick" ? 200 : 700, 300, role));
      state = touchStateAfter(state, finger(at % 7 === 0 ? "cancel" : "up", at, 700, 300, role));
    }
    expect(touchActions(state)).toEqual({ steer: 0, accelerate: 0, brake: 0, flipUpright: false });
    expect(state).toEqual(noTouches);
  });
});
