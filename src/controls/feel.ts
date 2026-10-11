// The game-feel numbers no published figure decides: how the controls, the
// steering and Flip upright feel in the hand. Each is the owner's choice,
// proposed 2026-10-11 (Scope 005), until he has driven it and says yes
// (docs/designs/OVERVIEW-005.md, "Rules every design here follows").
// Constants only; the code that reads them cites its own design.

// Stick dead zone, as a fraction of the stick's reach: nipplejs's default
// `threshold` (research/36 section 4). Owner-choice, proposed 2026-10-11.
export const STICK_DEAD_ZONE = 0.1;

// Gamepad stick dead zone, as a fraction of full travel. Owner-choice,
// proposed 2026-10-11.
export const GAMEPAD_DEAD_ZONE = 0.1;

// How far the thumb moves the on-screen stick to full lock, in CSS pixels.
// Owner-choice, proposed 2026-10-11.
export const STICK_RADIUS_PX = 60;

// Below this speed the car counts as stopped, so holding brake reverses
// (src/vehicle/pedals.md): 0.5 m/s, under 2 km/h. Owner-choice, proposed
// 2026-10-11.
export const STOPPED_SPEED_MS = 0.5;

// How fast the front wheels turn, as a fraction of full lock per second
// (src/vehicle/steering.md; rates from the F1 game in
// research/world-drive/12, item 3). Owner-choice, proposed 2026-10-11.
export const STEER_RATE_TOWARD_LOCK = 2.6;
export const STEER_RATE_BACK_TO_MIDDLE = 5;
export const STEER_RATE_ACROSS_MIDDLE = 7;

// How much full lock shrinks with speed, per m/s: Sketchbook's 0.3
// (swift502/Sketchbook, src/ts/vehicles/Car.ts, MIT, technique only).
// Owner-choice, proposed 2026-10-11.
export const STEER_SHRINK_PER_MS = 0.3;

// Flip upright works only under this speed, or when the car has tipped more
// than this far from upright (orchestrator's decision E2 (b), 2026-10-11,
// recorded as owner-choice).
export const FLIP_UPRIGHT_BELOW_MS = 1.4;
export const FLIP_UPRIGHT_TIPPED_DEG = 45;
