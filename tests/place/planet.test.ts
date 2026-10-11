import { describe, expect, it } from "vitest";
import { validatePlanet } from "../../src/place/index.js";
import { goodPlanet, planetFiles, readPlanetText } from "./planets.js";

// Earth's file as plain values, to make broken copies from.
function earth(): Record<string, unknown> {
  return JSON.parse(readPlanetText("earth.json")) as Record<string, unknown>;
}

function earthRange(quantity: string): Record<string, unknown> {
  return (earth()["ranges"] as Record<string, Record<string, unknown>>)[quantity] ?? {};
}

// Earth with its gravity range changed; `undefined` removes a field.
function withGravityRange(changes: Record<string, unknown>): string {
  const ranges = { gravity: { ...earthRange("gravity"), ...changes }, airDensity: earthRange("airDensity") };
  return JSON.stringify({ ...earth(), ranges }, null, 2);
}

function withRanges(ranges: unknown): string {
  return JSON.stringify({ ...earth(), ranges }, null, 2);
}

function messagesOf(text: string, fileName = "earth.json"): string[] {
  const checked = validatePlanet(fileName, text);
  return checked.ok ? [] : checked.messages;
}

// The line (counting from 1) of the first line holding `needle`.
function lineOf(text: string, needle: string): number {
  const at = text.indexOf(needle);
  if (at < 0) throw new Error(`not in the text: ${needle}`);
  return text.slice(0, at).split("\n").length;
}

describe("planet file: happy path", () => {
  it("accepts Earth, with gravity 9.76 to 9.84 m/s² and air density 0.56 to 1.84 kg/m³", () => {
    expect(goodPlanet("earth.json")).toMatchObject({
      id: "earth",
      ranges: {
        gravity: { min: 9.76, max: 9.84, unit: "m/s²", status: "derived" },
        airDensity: { min: 0.56, max: 1.84, unit: "kg/m³", status: "derived" },
      },
    });
  });

  it("accepts every file in planets/, each named after the planet inside it", () => {
    for (const file of planetFiles()) expect(goodPlanet(file).id).toBe(file.replace(".json", ""));
  });

  it("keeps every range narrow enough that a value ten times too big or too small is always outside", () => {
    for (const file of planetFiles()) {
      for (const range of Object.values(goodPlanet(file).ranges)) expect(range.max).toBeLessThan(10 * range.min);
    }
  });

  it("accepts a range of exactly one value", () => {
    expect(messagesOf(withGravityRange({ min: 9.8, max: 9.8 }))).toEqual([]);
  });
});

describe("planet file: sad path (a broken planet says where and what)", () => {
  it("refuses a range written back to front, pointing at its min", () => {
    const text = withGravityRange({ min: 9.84, max: 9.76 });
    expect(messagesOf(text)).toEqual([
      `earth.json line ${lineOf(text, '"min": 9.84')}: \`min\` is 9.84, above \`max\` (9.76); \`min\` must not be above \`max\`.`,
    ]);
  });

  it("says a constant with no range is missing", () => {
    const text = withRanges({ gravity: earthRange("gravity") });
    expect(messagesOf(text)).toEqual([`earth.json line ${lineOf(text, '"ranges"')}: \`ranges.airDensity\` is missing.`]);
  });

  it("refuses a range with no source, and a link that is not https", () => {
    const text = withGravityRange({ source: undefined, url: "ahrs.readthedocs.io" });
    expect(messagesOf(text)).toEqual([
      `earth.json line ${lineOf(text, '"gravity"')}: \`ranges.gravity.source\` is missing.`,
      `earth.json line ${lineOf(text, '"url"')}: \`ranges.gravity.url\` must be a link starting with https://; found "ahrs.readthedocs.io".`,
    ]);
  });

  it("refuses a status outside the data rule", () => {
    expect(messagesOf(withGravityRange({ status: "guessed" }))[0]).toContain(
      "`ranges.gravity.status` must be one of `official`, `derived`, `owner-choice`; found \"guessed\".",
    );
  });
});

describe("planet file: idiot-proof path", () => {
  it("offers the right unit when it is typed without the superscript: m/s2 is m/s²", () => {
    const text = withGravityRange({ unit: "m/s2" });
    expect(messagesOf(text)).toEqual([
      `earth.json line ${lineOf(text, '"unit"')}: \`ranges.gravity.unit\` must be one of \`m/s²\`; found "m/s2". Did you mean \`m/s²\`?`,
    ]);
  });

  it("refuses the unit of another constant, so the file and the engine never disagree", () => {
    expect(messagesOf(withGravityRange({ unit: "kg/m³" }))[0]).toContain("`ranges.gravity.unit` must be one of `m/s²`; found \"kg/m³\".");
  });

  it("refuses a min written as text and a negative max, saying the floor and the unit", () => {
    const text = withGravityRange({ min: "9.76", max: -9.84 });
    expect(messagesOf(text)).toEqual([
      `earth.json line ${lineOf(text, '"min"')}: \`ranges.gravity.min\` must be a number of at least 0 m/s²; found "9.76".`,
      `earth.json line ${lineOf(text, '"max"')}: \`ranges.gravity.max\` must be a number of at least 0 m/s²; found -9.84.`,
      "earth.json: Fix these first; some cross-checks run after.",
    ]);
  });

  it("matches a misspelt constant to the one that was meant, and names an extra one", () => {
    const text = withRanges({ gravty: earthRange("gravity"), airDensity: earthRange("airDensity"), magnetism: earthRange("gravity") });
    expect(messagesOf(text)).toEqual([
      `earth.json line ${lineOf(text, '"gravty"')}: \`ranges.gravty\` is not a field. Did you mean \`gravity\`?`,
      `earth.json line ${lineOf(text, '"magnetism"')}: \`ranges.magnetism\` is not a field here; the fields are \`gravity\`, \`airDensity\`.`,
    ]);
  });

  it("offers the id when the planet's id has a capital", () => {
    expect(messagesOf(JSON.stringify({ ...earth(), id: "Earth" }))[0]).toMatch(/`id` must be an id: .*found "Earth"\. Did you mean `earth`\?$/);
  });
});

describe("planet file: tragedy path (other worlds, old files, limits)", () => {
  it("accepts a world with no air at all, such as the Moon: a range of 0 to 0", () => {
    const airless = { ...earthRange("airDensity"), min: 0, max: 0 };
    expect(messagesOf(withRanges({ gravity: earthRange("gravity"), airDensity: airless }))).toEqual([]);
  });

  it("tells a planet file written before ranges existed exactly what it lacks", () => {
    expect(messagesOf(JSON.stringify({ id: "earth", name: "Earth" }))).toEqual(["earth.json line 1: `ranges` is missing."]);
  });

  it("calls a min too big to hold 'a number too big to use', and the back-to-front rule waits", () => {
    const text = readPlanetText("earth.json").replace('"min": 9.76', '"min": 1e400');
    expect(messagesOf(text)).toEqual([
      `earth.json line ${lineOf(text, "1e400")}: \`ranges.gravity.min\` must be a number of at least 0 m/s²; found a number too big to use.`,
      "earth.json: Fix these first; some cross-checks run after.",
    ]);
  });

  it("accepts the planet file saved on Windows", () => {
    expect(messagesOf(readPlanetText("earth.json").replaceAll("\n", "\r\n"))).toEqual([]);
  });
});
