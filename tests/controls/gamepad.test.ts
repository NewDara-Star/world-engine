// A gamepad with the standard layout to actions: left stick steers, right
// trigger accelerates, left trigger brakes, the top right-hand button flips
// the car upright. Design: src/controls/gamepad.md (W3C Gamepad standard
// mapping; approver's F10). The browser's navigator is a stand-in object.
import { describe, expect, it } from "vitest";
import { gamepadActions, withDeadZone } from "../../src/controls/gamepad.js";
import { noActions } from "../../src/controls/actions.js";

interface PadInit {
  axes?: number[];
  pressed?: Record<number, number>;
  mapping?: string;
  connected?: boolean;
}

function pad({ axes = [0, 0, 0, 0], pressed = {}, mapping = "standard", connected = true }: PadInit = {}) {
  const buttons = Array.from({ length: 17 }, (_, index) => ({ value: pressed[index] ?? 0, pressed: (pressed[index] ?? 0) > 0.5, touched: false }));
  return { id: "test pad", index: 0, connected, mapping, axes, buttons, timestamp: 0 };
}

function navigatorWith(...pads: (ReturnType<typeof pad> | null)[]) {
  return { getGamepads: () => pads } as unknown as Parameters<typeof gamepadActions>[0];
}

describe("gamepad: happy path", () => {
  it("steers with the left stick and drives with the triggers", () => {
    const actions = gamepadActions(navigatorWith(pad({ axes: [1, 0, 0, 0], pressed: { 7: 1, 6: 0.25 } })));
    expect(actions).toEqual({ steer: 1, accelerate: 1, brake: 0.25, flipUpright: false });
  });

  it("flips upright with the top button of the right-hand cluster", () => {
    expect(gamepadActions(navigatorWith(pad({ pressed: { 3: 1 } }))).flipUpright).toBe(true);
  });

  it("takes a small stick wobble out, and still reaches full lock", () => {
    expect(withDeadZone(0.05, 0.1)).toBe(0);
    expect(withDeadZone(-0.1, 0.1)).toBe(0);
    expect(withDeadZone(1, 0.1)).toBe(1);
    expect(withDeadZone(-1, 0.1)).toBe(-1);
    expect(withDeadZone(0.55, 0.1)).toBeCloseTo(0.5, 9);
    expect(withDeadZone(-0.55, 0.1)).toBeCloseTo(-0.5, 9);
  });

  it("does not drift when a worn stick rests a little off centre", () => {
    expect(gamepadActions(navigatorWith(pad({ axes: [0.06, 0, 0, 0] }))).steer).toBe(0);
  });
});

describe("gamepad: sad path (no pad, or a browser that hides them)", () => {
  it("does nothing when no pad is connected", () => {
    expect(gamepadActions(navigatorWith())).toEqual(noActions());
    expect(gamepadActions(navigatorWith(null, null))).toEqual(noActions());
    expect(gamepadActions(navigatorWith(pad({ connected: false, pressed: { 7: 1 } })))).toEqual(noActions());
  });

  it("does nothing, and never throws, in a browser without getGamepads, as on the phone's plain http link", () => {
    expect(gamepadActions({} as unknown as Parameters<typeof gamepadActions>[0])).toEqual(noActions());
  });

  it("does nothing, and never throws, when asking for the pads throws", () => {
    const refusing = {
      getGamepads: () => {
        throw new Error("SecurityError: not allowed here");
      },
    } as unknown as Parameters<typeof gamepadActions>[0];
    expect(gamepadActions(refusing)).toEqual(noActions());
  });
});

describe("gamepad: idiot-proof path", () => {
  it("ignores a pad without the standard layout, whose buttons could be anywhere", () => {
    expect(gamepadActions(navigatorWith(pad({ mapping: "", pressed: { 7: 1 } })))).toEqual(noActions());
  });

  it("uses the first connected standard pad when there are several", () => {
    const actions = gamepadActions(navigatorWith(null, pad({ mapping: "" }), pad({ pressed: { 6: 1 } }), pad({ pressed: { 7: 1 } })));
    expect(actions).toMatchObject({ accelerate: 0, brake: 1 });
  });

  it("reads a missing axis or button as 0", () => {
    const bare = { ...pad(), axes: [], buttons: [] };
    expect(gamepadActions(navigatorWith(bare))).toEqual(noActions());
  });
});
