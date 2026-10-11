// Thumbs to actions. The left half of the screen is the stick area: the stick
// appears where the left thumb lands and only its sideways movement steers
// (nipplejs `dynamic` mode, yoannmoinet/nipplejs, MIT, technique only;
// research/36 section 4). On the right: accelerate, brake/reverse beside it,
// and Flip upright above. Every finger is followed by its own pointerId (MDN
// Pointer Events), so the stick and a pedal work at once. The decisions are
// pure functions over a small touch state; the browser part only turns
// pointer events into those calls. Design: docs/designs/src/controls/touch.md.
import { type Actions } from "./actions.js";
import { STICK_DEAD_ZONE, STICK_RADIUS_PX } from "./feel.js";
import { withDeadZone } from "./gamepad.js";

// What a finger can land on; the controls layer marks each element with its
// role in a `data-role` attribute.
export type TouchRole = "stick" | "accelerate" | "brake" | "flipUpright" | "none";
export type ButtonRole = "accelerate" | "brake" | "flipUpright";

export interface ScreenPoint {
  x: number;
  y: number;
}

export interface TouchEventInWords {
  kind: "down" | "move" | "up" | "cancel";
  pointerId: number;
  x: number;
  y: number;
  // What is under the finger now.
  role: TouchRole;
  screen: { width: number; height: number };
}

export interface TouchState {
  stick: { pointerId: number; start: ScreenPoint; now: ScreenPoint } | null;
  buttons: readonly { pointerId: number; role: ButtonRole }[];
}

export const noTouches: TouchState = { stick: null, buttons: [] };

const PEDALS: readonly TouchRole[] = ["accelerate", "brake"];
const BUTTONS: readonly TouchRole[] = ["accelerate", "brake", "flipUpright"];
const ROLES: readonly TouchRole[] = ["stick", ...BUTTONS, "none"];

// Pointer event types to the four kinds (MDN Pointer Events).
const KIND_OF_POINTER_EVENT: Record<string, TouchEventInWords["kind"]> = {
  pointerdown: "down",
  pointermove: "move",
  pointerup: "up",
  pointercancel: "cancel",
};

// A call coming in or a swipe from the edge cancels a finger; cancel is the
// same as a lift, so a lost finger never leaves the car accelerating.
export function touchStateAfter(state: TouchState, event: TouchEventInWords): TouchState {
  switch (event.kind) {
    case "down":
      return fingerDown(state, event);
    case "move":
      return fingerMoved(state, event);
    case "up":
    case "cancel":
      return fingerLifted(state, event.pointerId);
  }
}

// The stick starts where the thumb lands, moved inward to at least one stick
// radius from the screen's edges so full left and right are always reachable
// (approver's F11). A second thumb on the stick area does not steal it.
export function fingerDown(state: TouchState, event: TouchEventInWords): TouchState {
  if (event.role === "stick") {
    if (state.stick !== null) return state;
    const start = {
      x: Math.min(Math.max(event.x, STICK_RADIUS_PX), event.screen.width - STICK_RADIUS_PX),
      y: Math.min(Math.max(event.y, STICK_RADIUS_PX), event.screen.height - STICK_RADIUS_PX),
    };
    return { ...state, stick: { pointerId: event.pointerId, start, now: { x: event.x, y: event.y } } };
  }
  if (event.role !== "none") return { ...state, buttons: [...state.buttons, { pointerId: event.pointerId, role: event.role }] };
  return state;
}

// The stick follows its thumb. A thumb rocked from one pedal onto the other
// holds the one it is now on; off every button, or over Flip upright, a
// finger keeps what it had (approver's F11).
export function fingerMoved(state: TouchState, event: TouchEventInWords): TouchState {
  if (state.stick?.pointerId === event.pointerId) return { ...state, stick: { ...state.stick, now: { x: event.x, y: event.y } } };
  const held = state.buttons.find((button) => button.pointerId === event.pointerId);
  if (held !== undefined && PEDALS.includes(held.role) && PEDALS.includes(event.role) && held.role !== event.role) {
    const otherPedal = event.role as ButtonRole;
    return { ...state, buttons: [...state.buttons.filter((button) => button !== held), { pointerId: event.pointerId, role: otherPedal }] };
  }
  return state;
}

// Lifting a thumb lets go of exactly what that thumb held.
export function fingerLifted(state: TouchState, pointerId: number): TouchState {
  if (state.stick?.pointerId === pointerId) return { ...state, stick: null };
  return { ...state, buttons: state.buttons.filter((button) => button.pointerId !== pointerId) };
}

// Sideways movement over the stick's radius, with a small dead zone so a
// resting thumb does not steer.
export function stickSteer(start: ScreenPoint, now: ScreenPoint, radiusPx: number, deadZone: number): number {
  const sideways = Math.max(-1, Math.min(1, (now.x - start.x) / radiusPx));
  return withDeadZone(sideways, deadZone);
}

// The thumbs give the same four actions as keys and pads.
export function touchActions(state: TouchState): Actions {
  const steer = state.stick === null ? 0 : stickSteer(state.stick.start, state.stick.now, STICK_RADIUS_PX, STICK_DEAD_ZONE);
  const roles = state.buttons.map((button) => button.role);
  return {
    steer,
    accelerate: Number(roles.includes("accelerate")),
    brake: Number(roles.includes("brake")),
    flipUpright: roles.includes("flipUpright"),
  };
}

// The Mac with a mouse does not have thumb controls covering the road until
// someone touches a touch screen.
export function shouldShowTouchControls(coarsePointer: boolean, touchSeen: boolean): boolean {
  return coarsePointer || touchSeen;
}

// Held upright the view is narrow, so a hint says how to get a wider one
// (orchestrator's decision E3 (a)); never a block.
export function portraitHintShown(touchControlsShown: boolean, width: number, height: number): boolean {
  return touchControlsShown && height > width;
}

// Joins the phone's pointer events to the touch state. A call coming in or a
// switch to another app does not always send pointercancel, so the state is
// also emptied when the page is hidden or the window loses focus (approver's
// F11). Browser plumbing (MDN): setPointerCapture, elementFromPoint,
// addEventListener with an AbortController's signal, contextmenu.
export function listenToTouches(layer: HTMLElement, kept: { state: TouchState }): () => void {
  const page = layer.ownerDocument;
  // Pointer capture keeps the event's target on the element the finger first
  // landed on, so what is under the finger now is found at its point.
  function passPointerEvent(event: PointerEvent): void {
    if (event.type === "pointerdown") (event.target as Element).setPointerCapture(event.pointerId);
    event.preventDefault();
    const under = page.elementFromPoint(event.clientX, event.clientY)?.closest("[data-role]")?.getAttribute("data-role") ?? "none";
    const role = ROLES.find((known) => known === under) ?? "none";
    kept.state = touchStateAfter(kept.state, {
      kind: KIND_OF_POINTER_EVENT[event.type] ?? "cancel",
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      role,
      screen: { width: page.documentElement.clientWidth, height: page.documentElement.clientHeight },
    });
  }
  const listening = new AbortController();
  const options = { signal: listening.signal };
  for (const type of Object.keys(KIND_OF_POINTER_EVENT)) layer.addEventListener(type, passPointerEvent as EventListener, options);
  page.addEventListener("visibilitychange", () => (kept.state = noTouches), options);
  page.defaultView?.addEventListener("blur", () => (kept.state = noTouches), options);
  layer.addEventListener("contextmenu", (event) => event.preventDefault(), options);
  return () => listening.abort();
}
