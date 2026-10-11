// One control model for every device (CLAUDE.md touch rule; D-0026): keys,
// thumbs and a gamepad all produce the same four actions, and the car only
// ever sees actions. `steer` is −1 (full left) to 1 (full right),
// `accelerate` and `brake` 0 to 1 (brake reverses when stopped, pedals.ts),
// and `flipUpright` is pressed or not. Our own design:
// docs/designs/src/controls/actions.md.

export interface Actions {
  steer: number;
  accelerate: number;
  brake: number;
  flipUpright: boolean;
}

// When nothing is touched, the car is not driven.
export function noActions(): Actions {
  return { steer: 0, accelerate: 0, brake: 0, flipUpright: false };
}

// A broken reading (out of range, or not a number) never reaches the physics.
export function cleanActions(actions: Actions): Actions {
  // Number.isFinite (ECMA-262) is false for NaN, infinity and text such as "1".
  const steer = Number.isFinite(actions.steer) ? actions.steer : 0;
  const accelerate = Number.isFinite(actions.accelerate) ? actions.accelerate : 0;
  const brake = Number.isFinite(actions.brake) ? actions.brake : 0;
  return {
    steer: Math.max(-1, Math.min(1, steer)),
    accelerate: Math.max(0, Math.min(1, accelerate)),
    brake: Math.max(0, Math.min(1, brake)),
    flipUpright: actions.flipUpright === true,
  };
}

// Keys, a gamepad and the screen at once: the car does what the strongest
// asks, so nothing fights. On a steering tie, the first device's wins.
export function strongestActions(fromDevices: readonly Actions[]): Actions {
  if (fromDevices.length === 0) return noActions();
  const steers = fromDevices.map((one) => one.steer);
  const furthest = Math.max(...steers.map((steer) => Math.abs(steer)));
  return {
    // find gives the first, so on a tie the first device's steer wins.
    steer: steers.find((steer) => Math.abs(steer) === furthest) ?? 0,
    accelerate: Math.max(...fromDevices.map((one) => one.accelerate)),
    brake: Math.max(...fromDevices.map((one) => one.brake)),
    flipUpright: fromDevices.some((one) => one.flipUpright),
  };
}

// Holding Flip upright flips the car once, not sixty times a second.
export function pressedJustNow(lastFrame: boolean, thisFrame: boolean): boolean {
  return thisFrame && !lastFrame;
}
