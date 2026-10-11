// The vehicle file's real-world figures, each with exactly one source (the
// data rule), checked by file and line. Design: src/place/vehicle.md
// ("Changed for scope 005", approver's F3 and F4, decision E1 (a)).
// These replace the old vehicle tests whose fixture had no figures.
import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { validateVehicle } from "../../src/place/index.js";

const hatchbackPath = resolve(import.meta.dirname, "../../vehicles/hatchback.json");

const FIGURE_GROUPS = ["body", "wheels", "engine", "air", "brakes", "published"] as const;

function hatchbackText(): string {
  expect(existsSync(hatchbackPath), "vehicles/hatchback.json exists").toBe(true);
  return readFileSync(hatchbackPath, "utf8");
}

function hatchback(): Record<string, unknown> {
  return JSON.parse(hatchbackText()) as Record<string, unknown>;
}

function withChanges(changes: Record<string, unknown>): string {
  return JSON.stringify({ ...hatchback(), ...changes }, null, 2);
}

// The hatchback with some figures of one group changed.
function withFigures(group: (typeof FIGURE_GROUPS)[number], changes: Record<string, unknown>): string {
  const figures = hatchback()[group] as Record<string, unknown>;
  return withChanges({ [group]: { ...figures, ...changes } });
}

function figure(group: (typeof FIGURE_GROUPS)[number], name: string): number {
  return (hatchback()[group] as Record<string, number>)[name] ?? Number.NaN;
}

function messagesOf(text: string): string[] {
  const checked = validateVehicle("hatchback.json", text);
  return checked.ok ? [] : checked.messages;
}

function sources(): Record<string, unknown>[] {
  return hatchback()["figureSources"] as Record<string, unknown>[];
}

function sourceOf(quantity: string): Record<string, unknown> | undefined {
  return sources().find((source) => source["quantity"] === quantity);
}

// Every way of moving the checker knows other than wheeled, read from its own
// message for a word it does not know, so this test names none itself.
function otherWaysToMove(): string[] {
  const message = messagesOf(withChanges({ dynamics: "zzz" })).find((one) => one.includes("`dynamics` must be one of"));
  const words = [...(message ?? "").matchAll(/`([^`]+)`/g)].map((match) => match[1] ?? "");
  return [...new Set(words)].filter((word) => !["dynamics", "wheeled", "zzz"].includes(word));
}

describe("vehicle figures: happy path", () => {
  it("accepts the hatchback, a wheeled car", () => {
    expect(messagesOf(hatchbackText())).toEqual([]);
    expect(hatchback()).toMatchObject({ class: "car", dynamics: "wheeled" });
  });

  it("gives every figure of the hatchback exactly one source, official, derived or owner-choice", () => {
    const quantities = sources().map((source) => source["quantity"]);
    for (const group of FIGURE_GROUPS) {
      for (const name of Object.keys(hatchback()[group] as object)) {
        expect(quantities.filter((quantity) => quantity === `${group}.${name}`), `${group}.${name}`).toHaveLength(1);
      }
    }
    for (const source of sources()) expect(["official", "derived", "owner-choice"]).toContain(source["status"]);
  });

  it("records the gear change time as the owner's choice", () => {
    expect(sourceOf("engine.gearChangeS")?.["status"]).toBe("owner-choice");
  });

  it("writes speeds in metres per second, never km/h: the published tests are from and to 100 km/h", () => {
    expect(figure("published", "testToSpeedMs")).toBeCloseTo(100 / 3.6, 1);
    expect(figure("brakes", "testFromSpeedMs")).toBeCloseTo(100 / 3.6, 1);
    expect(figure("published", "topSpeedMs")).toBeLessThan(80);
  });

  it("lists the forward gears first gear first, each taller than the one before", () => {
    const gears = (hatchback()["engine"] as { forwardGearRatios: number[] }).forwardGearRatios;
    expect(gears.length).toBeGreaterThanOrEqual(4);
    expect(gears.toSorted((a, b) => b - a)).toEqual(gears);
  });
});

describe("vehicle figures: sad path (file, line, what to fix)", () => {
  it("refuses a mass of 0, which no car has and which would divide by zero in the physics", () => {
    expect(messagesOf(withFigures("body", { massKg: 0 }))).toEqual([expect.stringMatching(/^hatchback\.json line \d+: `body\.massKg` must be a number above 0 kg; found 0\.$/), expect.stringMatching(/^hatchback\.json: Fix these first; some cross-checks run after\.$/)]);
  });

  it("refuses a figure written as text, showing the quote marks", () => {
    expect(messagesOf(withFigures("wheels", { tyreFriction: "1.0" }))).toEqual([expect.stringContaining('`wheels.tyreFriction` must be a number above 0; found "1.0".'), expect.stringMatching(/^hatchback\.json: Fix these first; some cross-checks run after\.$/)]);
  });

  it("refuses a share outside 0 to 1", () => {
    expect(messagesOf(withFigures("body", { frontAxleLoadShare: 1.2 }))).toEqual([expect.stringContaining("`body.frontAxleLoadShare` must be a number from 0 to 1"), expect.stringMatching(/^hatchback\.json: Fix these first; some cross-checks run after\.$/)]);
    expect(messagesOf(withFigures("engine", { drivetrainEfficiency: 90 }))).toEqual([expect.stringContaining("`engine.drivetrainEfficiency` must be a number from 0 to 1"), expect.stringMatching(/^hatchback\.json: Fix these first; some cross-checks run after\.$/)]);
  });

  it("says a wheeled vehicle without its driving figures is missing them", () => {
    const messages = messagesOf(withChanges({ wheels: undefined }));
    expect(messages).toEqual([expect.stringMatching(/^hatchback\.json line 1: `wheels` is missing; a wheeled vehicle needs its driving figures/)]);
  });

  it("says which figure has no source", () => {
    const text = withChanges({ figureSources: sources().filter((source) => source["quantity"] !== "body.massKg") });
    expect(messagesOf(text)).toEqual([expect.stringContaining("`figureSources` has no source for `body.massKg`.")]);
  });

  it("says which figure has two sources, pointing at the second", () => {
    const twice = sourceOf("engine.peakPowerKw") ?? {};
    const messages = messagesOf(withChanges({ figureSources: [...sources(), twice] }));
    expect(messages).toEqual([expect.stringContaining("`figureSources` has 2 sources for `engine.peakPowerKw`; each figure needs exactly one.")]);
  });

  it("refuses a source with a status that is a guess", () => {
    const changed = sources().map((source) => (source["quantity"] === "air.dragCoefficient" ? { ...source, status: "guess" } : source));
    expect(messagesOf(withChanges({ figureSources: changed }))[0]).toMatch(/`figureSources\[\d+\]\.status` must be one of `official`, `derived`, `owner-choice`/);
  });

  it("refuses a driven axle it does not know", () => {
    expect(messagesOf(withChanges({ drivenAxle: "middle" }))).toEqual([expect.stringContaining("`drivenAxle` must be one of `front`, `rear`, `both`")]);
  });
});

describe("vehicle figures: idiot-proof path (slipped digits that would make a car feel wrong with no clue why)", () => {
  it("refuses a wheelbase longer than the car", () => {
    const messages = messagesOf(withFigures("body", { wheelbaseM: figure("body", "lengthM") + 0.1 }));
    expect(messages).toHaveLength(1);
    expect(messages[0]).toMatch(/`body\.wheelbaseM`[\s\S]*`body\.lengthM`/);
  });

  it("refuses a track wider than the car", () => {
    const messages = messagesOf(withFigures("body", { trackM: figure("body", "widthM") + 0.1 }));
    expect(messages).toHaveLength(1);
    expect(messages[0]).toMatch(/`body\.trackM`[\s\S]*`body\.widthM`/);
  });

  it("refuses a centre of mass above the roof", () => {
    const messages = messagesOf(withFigures("body", { centreOfMassHeightM: figure("body", "heightM") + 0.1 }));
    expect(messages).toHaveLength(1);
    expect(messages[0]).toMatch(/`body\.centreOfMassHeightM`[\s\S]*`body\.heightM`/);
  });

  it("refuses a wheel taller than the car", () => {
    const messages = messagesOf(withFigures("wheels", { radiusM: figure("body", "heightM") }));
    expect(messages).toEqual([expect.stringContaining("`wheels.radiusM`")]);
  });

  it("refuses a turning circle given as the radius, too tight for the wheelbase and track", () => {
    const radius = figure("wheels", "turningCircleM") / 2;
    const messages = messagesOf(withFigures("wheels", { turningCircleM: radius }));
    expect(messages).toHaveLength(1);
    expect(messages[0]).toContain("`wheels.turningCircleM`");
    expect(messages[0]).toContain("too tight for a");
    expect(messages[0]).toContain("kerb-to-kerb diameter");
  });

  it("measures the turning circle at the outer front wheel: just over twice (wheelbase plus half the track) is accepted, just under is refused", () => {
    const wheelbase = figure("body", "wheelbaseM");
    const track = figure("body", "trackM");
    const tightest = 2 * wheelbase + track;
    expect(messagesOf(withFigures("wheels", { turningCircleM: tightest + 0.01 }))).toEqual([]);
    expect(messagesOf(withFigures("wheels", { turningCircleM: tightest - 0.01 }))).toEqual([expect.stringContaining("too tight for a")]);
  });

  it("refuses forward gears typed out of order, naming both gears", () => {
    const gears = (hatchback()["engine"] as { forwardGearRatios: number[] }).forwardGearRatios;
    const swapped = [gears[0], gears[2], gears[1], ...gears.slice(3)];
    const messages = messagesOf(withFigures("engine", { forwardGearRatios: swapped }));
    expect(messages).toHaveLength(1);
    expect(messages[0]).toMatch(/gear 3 \(ratio [\d.]+\) must be smaller than gear 2 \(ratio [\d.]+\)/);
  });

  it("refuses an empty list of forward gears", () => {
    expect(messagesOf(withFigures("engine", { forwardGearRatios: [] }))[0]).toContain("`engine.forwardGearRatios` needs at least 1 item");
  });

  it("refuses driving figures on a vehicle that does not move on wheels, which has no driving physics yet", () => {
    const others = otherWaysToMove();
    expect(others.length).toBeGreaterThan(0);
    for (const other of others) {
      const messages = messagesOf(withChanges({ dynamics: other }));
      expect(messages.some((message) => message.includes("`body`") && message.includes("only for wheeled vehicles")), other).toBe(true);
    }
  });

  it("reports several mistakes in one pass", () => {
    const text = withChanges({
      body: { ...(hatchback()["body"] as object), massKg: -1 },
      drivenAxle: "middle",
      figureSources: sources().filter((source) => source["quantity"] !== "air.frontalAreaM2"),
    });
    expect(messagesOf(text).length).toBeGreaterThanOrEqual(3);
  });
});

describe("vehicle figures: tragedy path (a vehicle file from before scope 005)", () => {
  it("tells an old file with no figures exactly which groups it lacks", () => {
    const old = Object.fromEntries([...FIGURE_GROUPS, "figureSources", "drivenAxle"].map((name) => [name, undefined]));
    const messages = messagesOf(withChanges(old));
    for (const name of [...FIGURE_GROUPS, "figureSources"]) {
      expect(messages.some((message) => message.startsWith(`hatchback.json line 1: \`${name}\` is missing`)), name).toBe(true);
    }
  });
});
