// A gamepad to actions. Only pads the browser reports with `mapping`
// "standard" are used, so the buttons are where the W3C Gamepad spec's
// standard layout puts them (w3c/gamepad index.html, opened for research/36
// section 4): axis 0 left stick sideways, button 7 right trigger, button 6
// left trigger, button 3 top of the right-hand cluster. The pads are asked for
// every frame (MDN, "Using the Gamepad API").
// Design: docs/designs/src/controls/gamepad.md.
import { GAMEPAD_DEAD_ZONE } from "./feel.js";
import { type Actions, noActions } from "./actions.js";

const STEER_AXIS = 0;
const ACCELERATE_BUTTON = 7;
const BRAKE_BUTTON = 6;
const FLIP_BUTTON = 3;
// The standard layout has 17 buttons (W3C Gamepad, "Remapping").
const STANDARD_BUTTON_ZEROS: readonly number[] = Array.from({ length: 17 }, () => 0);

// A worn stick never rests exactly at zero; the edge of the dead zone becomes
// 0 and full travel stays 1.
export function withDeadZone(value: number, deadZone: number): number {
  if (Math.abs(value) <= deadZone) return 0;
  return (Math.sign(value) * (Math.abs(value) - deadZone)) / (1 - deadZone);
}

// Some browsers hide getGamepads on plain http://, which is how the phone
// opens the dev link, and asking can throw; then there is no pad, never an
// error every frame (approver's F10).
export function gamepadActions(navigator: Pick<Navigator, "getGamepads">): Actions {
  let pads: readonly (Gamepad | null)[];
  try {
    pads = navigator.getGamepads();
  } catch {
    return noActions();
  }
  const [pad] = pads
    .filter((one): one is Gamepad => one !== null)
    .filter((one) => one.connected)
    .filter((one) => one.mapping === "standard");
  if (pad === undefined) return noActions();
  // A missing axis or button reads as 0: each list is followed by enough
  // zeros to cover every index the standard layout uses.
  const axes = [...pad.axes, 0];
  const values = [...pad.buttons.map((button) => button.value), ...STANDARD_BUTTON_ZEROS];
  const pressed = [...pad.buttons.map((button) => button.pressed), ...STANDARD_BUTTON_ZEROS.map(Boolean)];
  return {
    steer: withDeadZone(Number(axes[STEER_AXIS]), GAMEPAD_DEAD_ZONE),
    accelerate: Number(values[ACCELERATE_BUTTON]),
    brake: Number(values[BRAKE_BUTTON]),
    flipUpright: pressed[FLIP_BUTTON] === true,
  };
}
