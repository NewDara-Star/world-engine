import { describe, expect, it } from "vitest";
import { validateVehicle } from "../../src/place/index.js";

const hatch = {
  id: "hatch-auto",
  name: "Automatic hatchback",
  class: "car",
  controls: { wheelPosition: "right", steering: "steering-wheel" },
  dynamics: "wheeled",
};

function errorsOf(json: unknown): string[] {
  const parsed = validateVehicle(json);
  return parsed.ok ? [] : parsed.errors;
}

describe("vehicle file: happy path", () => {
  it("accepts a right-hand-drive car, a bike, a boat and a plane", () => {
    const bike = { ...hatch, id: "okada", class: "bike", controls: { wheelPosition: "none", steering: "handlebars" }, dynamics: "two-wheeler" };
    const boat = { ...hatch, id: "ferry", class: "boat", controls: { wheelPosition: "centre", steering: "tiller" }, dynamics: "hull" };
    const plane = { ...hatch, id: "trainer", class: "plane", controls: { wheelPosition: "centre", steering: "yoke" }, dynamics: "aerodynamic" };
    for (const vehicle of [hatch, bike, boat, plane]) expect(errorsOf(vehicle), vehicle.id).toEqual([]);
  });
});

describe("vehicle file: sad path", () => {
  it("names the field when the class is unknown", () => {
    expect(errorsOf({ ...hatch, class: "hoverboard" })[0]).toMatch(/^class: must be one of "car", "bike"/);
  });

  it("names the nested field when the wheel position is missing", () => {
    expect(errorsOf({ ...hatch, controls: { steering: "steering-wheel" } })).toEqual([
      'controls.wheelPosition: must be one of "left", "right", "centre", "none", got nothing',
    ]);
  });
});

describe("vehicle file: idiot-proof path", () => {
  it("refuses a boat that moves like a car, saying what it can do instead", () => {
    expect(errorsOf({ ...hatch, class: "boat" })).toEqual([
      'the file: a boat cannot move as "wheeled" (it can be: hull)',
    ]);
  });

  it("refuses a misspelt field and a file that is not an object", () => {
    expect(errorsOf({ ...hatch, dynamic: "wheeled" }).some((e) => e.startsWith("dynamic: is not a field"))).toBe(true);
    expect(errorsOf("car")[0]).toMatch(/^the file: must be an object/);
  });
});

describe("vehicle file: tragedy path", () => {
  it("accepts every class paired with its own kind of movement, so no class is left unusable", () => {
    const pairs = { car: "wheeled", bus: "wheeled", truck: "wheeled", bike: "two-wheeler", boat: "hull", plane: "aerodynamic" };
    for (const [vehicleClass, dynamics] of Object.entries(pairs)) {
      expect(errorsOf({ ...hatch, class: vehicleClass, dynamics }), vehicleClass).toEqual([]);
    }
  });

  it("does not choke on a huge or hostile value", () => {
    expect(errorsOf({ ...hatch, name: "x".repeat(1_000_000) })).toEqual([]);
    expect(errorsOf({ ...hatch, id: "x".repeat(1_000_000) + " " })).toHaveLength(1);
  });
});
