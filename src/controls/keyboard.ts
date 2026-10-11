// Keys to actions. Keys are read by `code`, the physical key, so WASD sits in
// the same place on an AZERTY keyboard (MDN, KeyboardEvent.code; research/36
// section 4). Browser plumbing: addEventListener with an AbortController's signal,
// Event.preventDefault, the window's blur and the document's visibilitychange
// (MDN). Design: docs/designs/src/controls/keyboard.md.
import type { Actions } from "./actions.js";

const LEFT_KEYS = ["ArrowLeft", "KeyA"];
const RIGHT_KEYS = ["ArrowRight", "KeyD"];
const UP_KEYS = ["ArrowUp", "KeyW"];
const DOWN_KEYS = ["ArrowDown", "KeyS", "Space"];
const FLIP_KEY = "KeyR";
const DRIVING_KEYS = new Set([...LEFT_KEYS, ...RIGHT_KEYS, ...UP_KEYS, ...DOWN_KEYS, FLIP_KEY]);

// The Mac player drives with the arrows or WASD; left and right together steer straight.
export function keyboardActions(held: ReadonlySet<string>): Actions {
  const left = LEFT_KEYS.some((code) => held.has(code));
  const right = RIGHT_KEYS.some((code) => held.has(code));
  return {
    steer: Number(right) - Number(left),
    accelerate: Number(UP_KEYS.some((code) => held.has(code))),
    brake: Number(DOWN_KEYS.some((code) => held.has(code))),
    flipUpright: held.has(FLIP_KEY),
  };
}

// Keeps the set of held keys right, including when the player switches window
// with a key still down. Returns a function that stops listening.
export function listenToKeyboard(window: Window, held: Set<string>): () => void {
  // A key held with Ctrl, Cmd or Alt is a browser shortcut, such as Cmd+R to
  // reload, not driving (approver's F9). The arrows and Space would otherwise
  // scroll the page; a repeat of a held key changes nothing.
  function holdKey(event: KeyboardEvent): void {
    if (!DRIVING_KEYS.has(event.code) || event.ctrlKey || event.metaKey || event.altKey) return;
    event.preventDefault();
    held.add(event.code);
  }
  function letGoOfKey(event: KeyboardEvent): void {
    held.delete(event.code);
  }
  // A key held while switching window never sends its key-up.
  function letGoOfAllKeys(): void {
    held.clear();
  }
  // One AbortController takes every listener off at once (DOM Standard,
  // addEventListener's `signal` option).
  const listening = new AbortController();
  const options = { signal: listening.signal };
  window.addEventListener("keydown", holdKey, options);
  window.addEventListener("keyup", letGoOfKey, options);
  window.addEventListener("blur", letGoOfAllKeys, options);
  window.document.addEventListener("visibilitychange", letGoOfAllKeys, options);
  return () => listening.abort();
}
