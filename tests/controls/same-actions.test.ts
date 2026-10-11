// One control model for every device (CLAUDE.md touch rule, D-0026): the same
// driving done with keys, with two thumbs and with a gamepad gives exactly the
// same actions, so nothing is out of reach on a phone. Designs:
// src/controls/actions.md, keyboard.md, touch.md, gamepad.md.
import { describe, expect, it } from "vitest";
import { keyboardActions } from "../../src/controls/keyboard.js";
import { noTouches, touchActions, touchStateAfter } from "../../src/controls/touch.js";
import { gamepadActions } from "../../src/controls/gamepad.js";
import { cleanActions, strongestActions } from "../../src/controls/actions.js";

const screen = { width: 800, height: 400 };

type Role = "stick" | "accelerate" | "brake" | "flipUpright";

// Two thumbs: the left one on the stick, slid fully to one side (or not),
// the right one on a button (or none).
function thumbs(steer: -1 | 0 | 1, button?: Role) {
  let state = touchStateAfter(noTouches, { kind: "down", pointerId: 1, x: 200, y: 300, role: "stick", screen });
  state = touchStateAfter(state, { kind: "move", pointerId: 1, x: 200 + steer * 300, y: 300, role: "stick", screen });
  if (button !== undefined) state = touchStateAfter(state, { kind: "down", pointerId: 2, x: 700, y: 350, role: button, screen });
  return touchActions(state);
}

function gamepad(steer: -1 | 0 | 1, button?: number) {
  const buttons = Array.from({ length: 17 }, (_, index) => ({ value: index === button ? 1 : 0, pressed: index === button, touched: false }));
  const pad = { id: "pad", index: 0, connected: true, mapping: "standard", axes: [steer, 0, 0, 0], buttons, timestamp: 0 };
  return gamepadActions({ getGamepads: () => [pad] } as unknown as Parameters<typeof gamepadActions>[0]);
}

const cases = [
  { what: "accelerate while steering right", keys: ["ArrowUp", "ArrowRight"], touch: thumbs(1, "accelerate"), pad: gamepad(1, 7) },
  { what: "brake or reverse while steering left", keys: ["KeyS", "KeyA"], touch: thumbs(-1, "brake"), pad: gamepad(-1, 6) },
  { what: "flip upright", keys: ["KeyR"], touch: thumbs(0, "flipUpright"), pad: gamepad(0, 3) },
  { what: "just steer right", keys: ["KeyD"], touch: thumbs(1), pad: gamepad(1) },
];

describe("the same actions from every device", () => {
  it.each(cases)("$what: keys, two thumbs and a gamepad give the same actions", ({ keys, touch, pad }) => {
    const fromKeys = keyboardActions(new Set(keys));
    expect(touch).toEqual(fromKeys);
    expect(pad).toEqual(fromKeys);
  });

  it("can do every action on a touchscreen alone", () => {
    const reachable = strongestActions([thumbs(1, "accelerate"), thumbs(-1, "brake"), thumbs(0, "flipUpright")].map(cleanActions));
    expect(reachable).toEqual({ steer: 1, accelerate: 1, brake: 1, flipUpright: true });
    expect(thumbs(-1).steer).toBe(-1);
  });

  it("combines keys and thumbs used at the same time without either one fighting the other", () => {
    const combined = strongestActions([keyboardActions(new Set(["ArrowUp"])), thumbs(-1)].map(cleanActions));
    expect(combined).toEqual({ steer: -1, accelerate: 1, brake: 0, flipUpright: false });
  });
});
