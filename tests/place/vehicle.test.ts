import { describe, expect, it } from "vitest";
import { validateVehicle } from "../../src/place/index.js";

const hatch = {
  id: "hatch-auto",
  name: "Automatic hatchback",
  class: "car",
  controls: { wheelPosition: "right", steering: "steering-wheel" },
  dynamics: "wheeled",
};

// A vehicle written out as a vehicle-maker would see it, one field per line.
function fileText(vehicle: object): string {
  return JSON.stringify(vehicle, null, 2);
}

function messagesOf(vehicle: object | string): string[] {
  const text = typeof vehicle === "string" ? vehicle : fileText(vehicle);
  const checked = validateVehicle("hatch.json", text);
  return checked.ok ? [] : checked.messages;
}

describe("vehicle file: happy path", () => {
  it("accepts a right-hand-drive car, a bike, a boat and a plane", () => {
    const bike = { ...hatch, id: "okada", class: "bike", controls: { wheelPosition: "none", steering: "handlebars" }, dynamics: "two-wheeler" };
    const boat = { ...hatch, id: "ferry", class: "boat", controls: { wheelPosition: "centre", steering: "tiller" }, dynamics: "hull" };
    const plane = { ...hatch, id: "trainer", class: "plane", controls: { wheelPosition: "centre", steering: "yoke" }, dynamics: "aerodynamic" };
    for (const vehicle of [hatch, bike, boat, plane]) expect(messagesOf(vehicle), vehicle.id).toEqual([]);
  });

  it("gives back the checked vehicle, as validatePlace gives back the place", () => {
    const checked = validateVehicle("hatch.json", fileText(hatch));
    expect(checked).toEqual({ ok: true, value: hatch });
  });
});

describe("vehicle file: sad path", () => {
  it("names the file, the line and the field when the class is unknown", () => {
    expect(messagesOf({ ...hatch, class: "hoverboard" })[0]).toMatch(/^hatch\.json line 4: `class` must be one of `car`, `bike`/);
  });

  it("says a missing wheel position is missing, on the line of its object", () => {
    expect(messagesOf({ ...hatch, controls: { steering: "steering-wheel" } })).toEqual([
      "hatch.json line 5: `controls.wheelPosition` is missing.",
    ]);
  });

  it("names the line of invalid JSON", () => {
    const text = fileText(hatch).replace('"class": "car",', '"class": "car"');
    expect(messagesOf(text)[0]).toMatch(/^hatch\.json line 5: the file is not valid JSON here: a comma is missing/);
  });
});

describe("vehicle file: idiot-proof path", () => {
  it("refuses a boat that moves like a car, on the dynamics line, saying what it can do instead", () => {
    expect(messagesOf({ ...hatch, class: "boat" })).toEqual([
      'hatch.json line 9: a boat cannot move as "wheeled"; it can move as `hull`.',
    ]);
  });

  it("suggests the field that was meant, and refuses a file that is not an object", () => {
    const { dynamics, ...rest } = hatch;
    expect(messagesOf({ ...rest, dynamic: dynamics })).toEqual([
      "hatch.json line 9: `dynamic` is not a field. Did you mean `dynamics`?",
      "hatch.json: Fix these first; some cross-checks run after.",
    ]);
    expect(messagesOf('"car"')).toEqual([
      'hatch.json line 1: the file must be an object in curly brackets; found "car".',
      "hatch.json: Fix these first; some cross-checks run after.",
    ]);
  });

  it.each(["constructor", "toString", "__proto__", "hasOwnProperty", "valueOf"])("reports a field called %s as not a field", (name) => {
    expect(messagesOf({ ...hatch, [name]: 1 })[0]).toContain(`\`${name}\` is not a field here`);
  });

  it("waits to compare class and movement until both are good, and says so", () => {
    expect(messagesOf({ ...hatch, class: "hovercraft" })).toEqual([
      expect.stringContaining("`class` must be one of"),
      "hatch.json: Fix these first; some cross-checks run after.",
    ]);
  });

  it("compares class and movement even when the controls are wrong", () => {
    const messages = messagesOf({ ...hatch, class: "boat", controls: { wheelPosition: "middle", steering: "tiller" } });
    expect(messages).toHaveLength(2);
    expect(messages[1]).toContain('a boat cannot move as "wheeled"');
  });
});

describe("vehicle file: tragedy path", () => {
  it("accepts every class paired with its own kind of movement, so no class is left unusable", () => {
    const pairs = { car: "wheeled", bus: "wheeled", truck: "wheeled", bike: "two-wheeler", boat: "hull", plane: "aerodynamic" };
    for (const [vehicleClass, dynamics] of Object.entries(pairs)) {
      expect(messagesOf({ ...hatch, class: vehicleClass, dynamics }), vehicleClass).toEqual([]);
    }
  });

  it("does not choke on a huge or hostile value", () => {
    expect(messagesOf({ ...hatch, name: "x".repeat(1_000_000) })).toEqual([]);
    expect(messagesOf({ ...hatch, id: "x".repeat(1_000_000) + " " })).toHaveLength(1);
  });
});
