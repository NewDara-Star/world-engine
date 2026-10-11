// Keys to actions, read by physical key (`code`), and the listener that keeps
// the set of held keys right. Design: src/controls/keyboard.md (approver's F9).
// The listener is driven with a stand-in window built on Node's own
// EventTarget, so no browser is needed.
import { afterEach, describe, expect, it, vi } from "vitest";
import { keyboardActions, listenToKeyboard } from "../../src/controls/keyboard.js";

function held(...codes: string[]): Set<string> {
  return new Set(codes);
}

interface KeyInit {
  code: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  repeat?: boolean;
}

function keyEvent(type: "keydown" | "keyup", init: KeyInit): Event {
  const key = { key: init.code, ctrlKey: false, metaKey: false, altKey: false, shiftKey: false, repeat: false, ...init };
  return Object.assign(new Event(type, { cancelable: true }), key);
}

// A stand-in window and document: both are event targets; the document says
// whether the page is hidden.
function fakePage() {
  const document = Object.assign(new EventTarget(), { hidden: false, visibilityState: "visible" });
  const window = Object.assign(new EventTarget(), { document });
  vi.stubGlobal("document", document);
  return { window, document };
}

function listen(window: EventTarget, keys: Set<string>) {
  return listenToKeyboard(window as unknown as Parameters<typeof listenToKeyboard>[0], keys);
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("keyboard: happy path", () => {
  it("drives with the arrows: up accelerates, right steers right", () => {
    expect(keyboardActions(held("ArrowUp", "ArrowRight"))).toEqual({ steer: 1, accelerate: 1, brake: 0, flipUpright: false });
  });

  it("drives with WASD the same way: W accelerates, A steers left, S brakes", () => {
    expect(keyboardActions(held("KeyW", "KeyA"))).toEqual({ steer: -1, accelerate: 1, brake: 0, flipUpright: false });
    expect(keyboardActions(held("KeyS"))).toMatchObject({ brake: 1 });
  });

  it("brakes and reverses with the down arrow or Space too", () => {
    expect(keyboardActions(held("ArrowDown")).brake).toBe(1);
    expect(keyboardActions(held("Space")).brake).toBe(1);
  });

  it("flips the car upright with R", () => {
    expect(keyboardActions(held("KeyR")).flipUpright).toBe(true);
  });

  it("does nothing with no keys held", () => {
    expect(keyboardActions(held())).toEqual({ steer: 0, accelerate: 0, brake: 0, flipUpright: false });
  });
});

describe("keyboard: idiot-proof path", () => {
  it("steers straight when left and right are both held", () => {
    expect(keyboardActions(held("ArrowLeft", "ArrowRight")).steer).toBe(0);
    expect(keyboardActions(held("KeyA", "ArrowRight")).steer).toBe(0);
  });

  it("passes both pedals on when up and down are both held, for the pedals to decide", () => {
    expect(keyboardActions(held("ArrowUp", "ArrowDown"))).toMatchObject({ accelerate: 1, brake: 1 });
  });

  it("ignores keys that are not for driving", () => {
    expect(keyboardActions(held("KeyQ", "Enter", "F5"))).toEqual({ steer: 0, accelerate: 0, brake: 0, flipUpright: false });
  });

  it("holds a driving key while it is down and lets it go when it comes up, and stops the page scrolling", () => {
    const { window } = fakePage();
    const keys = held();
    listen(window, keys);
    const down = keyEvent("keydown", { code: "ArrowUp" });
    window.dispatchEvent(down);
    expect(keys.has("ArrowUp")).toBe(true);
    expect(down.defaultPrevented).toBe(true);
    window.dispatchEvent(keyEvent("keyup", { code: "ArrowUp" }));
    expect(keys.has("ArrowUp")).toBe(false);
  });

  it("leaves browser shortcuts alone: Cmd+R and Ctrl+R reload, they never flip the car", () => {
    const { window } = fakePage();
    const keys = held();
    listen(window, keys);
    for (const modifier of [{ metaKey: true }, { ctrlKey: true }, { altKey: true }]) {
      const event = keyEvent("keydown", { code: "KeyR", ...modifier });
      window.dispatchEvent(event);
      expect(keys.size, JSON.stringify(modifier)).toBe(0);
      expect(event.defaultPrevented, JSON.stringify(modifier)).toBe(false);
    }
  });

  it("leaves other keys alone, so typing and the browser's own keys still work", () => {
    const { window } = fakePage();
    const keys = held();
    listen(window, keys);
    const event = keyEvent("keydown", { code: "Tab" });
    window.dispatchEvent(event);
    expect(keys.size).toBe(0);
    expect(event.defaultPrevented).toBe(false);
  });

  it("does not change anything on a held key's repeats", () => {
    const { window } = fakePage();
    const keys = held();
    listen(window, keys);
    for (let at = 0; at < 30; at++) window.dispatchEvent(keyEvent("keydown", { code: "KeyW", repeat: at > 0 }));
    expect([...keys]).toEqual(["KeyW"]);
  });
});

describe("keyboard: sad path (a key-up that never comes)", () => {
  it("lets go of every key when the window loses focus, so the car does not keep accelerating on its own", () => {
    const { window } = fakePage();
    const keys = held();
    listen(window, keys);
    window.dispatchEvent(keyEvent("keydown", { code: "ArrowUp" }));
    window.dispatchEvent(new Event("blur"));
    expect(keys.size).toBe(0);
  });

  it("lets go of every key when the page is hidden", () => {
    const { window, document } = fakePage();
    const keys = held();
    listen(window, keys);
    window.dispatchEvent(keyEvent("keydown", { code: "KeyW" }));
    Object.assign(document, { hidden: true, visibilityState: "hidden" });
    document.dispatchEvent(new Event("visibilitychange"));
    expect(keys.size).toBe(0);
  });

  it("stops listening when asked", () => {
    const { window } = fakePage();
    const keys = held();
    const stop = listen(window, keys);
    stop();
    window.dispatchEvent(keyEvent("keydown", { code: "ArrowUp" }));
    expect(keys.size).toBe(0);
  });
});
