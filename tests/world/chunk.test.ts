// The map files the bake writes and the game reads, and their checkers. A bad
// file gives a message with the file's name, never a crash or a spike across
// the sky. Design and formats: src/world/chunk.md.
import { describe, expect, it, assert } from "vitest";
import { indexProblemsForPlace, validateChunk, validateChunkIndex } from "../../src/world/chunk.js";
import { tinyPlace } from "../bake/tiny.js";

const cell = { east: 3, north: -2 };

function chunkText(changes: Record<string, unknown> = {}): string {
  return JSON.stringify({ format: 1, cell, corners: [0, 0, 1000, 0, 0, 1000], triangles: [0, 1, 2], ...changes });
}

function chunkMessages(text: string): string[] {
  const checked = validateChunk("3_-2.json", text, cell);
  return checked.ok ? [] : checked.messages;
}

function goodIndex(): Record<string, unknown> {
  return {
    format: 1,
    cellSizeM: 100,
    centre: { lat: 6.63, lon: 3.36 },
    extent: { westM: -300, southM: -300, eastM: 300, northM: 300 },
    start: { eastM: 0, northM: 5.53, headingDeg: 90, roadWidthM: 7, oneWay: false },
    cells: ["-1_0", "0_0", "3_-2"],
  };
}

function indexText(changes: Record<string, unknown> = {}): string {
  return JSON.stringify({ ...goodIndex(), ...changes }, null, 2);
}

function startWith(changes: Record<string, unknown>): Record<string, unknown> {
  return { ...(goodIndex()["start"] as Record<string, unknown>), ...changes };
}

function indexMessages(text: string): string[] {
  const checked = validateChunkIndex("index.json", text);
  return checked.ok ? [] : checked.messages;
}

function checkedIndex(text: string) {
  const checked = validateChunkIndex("index.json", text);
  if (checked.ok) return checked.value;
  return assert.fail(checked.messages.join("\n"));
}

describe("chunk file: happy path", () => {
  it("accepts a good chunk and gives its square, corners and triangles", () => {
    const checked = validateChunk("3_-2.json", chunkText(), cell);
    expect(checked).toMatchObject({ ok: true, value: { cell, corners: [0, 0, 1000, 0, 0, 1000], triangles: [0, 1, 2] } });
  });

  it("accepts corners on the far edges of the square, 0 and 10000 centimetres", () => {
    expect(chunkMessages(chunkText({ corners: [0, 0, 10000, 0, 10000, 10000] }))).toEqual([]);
  });
});

describe("chunk file: sad path (a damaged or half-downloaded file)", () => {
  it("says a file cut short is not readable JSON, naming the file", () => {
    const messages = chunkMessages(chunkText().slice(0, 30));
    expect(messages).toHaveLength(1);
    expect(messages[0]).toContain("3_-2.json");
    expect(messages[0]).toContain("not readable JSON");
  });

  it("says a file made by a different bake version needs baking again", () => {
    const messages = chunkMessages(chunkText({ format: 2 }));
    expect(messages).toHaveLength(1);
    expect(messages[0]).toContain("different bake version");
    expect(messages[0]).toContain("bake again");
  });

  it("refuses another square's file, so its road is never drawn in the wrong place", () => {
    const messages = chunkMessages(chunkText({ cell: { east: 4, north: -2 } }));
    expect(messages).toHaveLength(1);
    expect(messages[0]).toContain("square");
  });

  it.each([
    ["an odd count", [0, 0, 1000]],
    ["a corner past the square", [0, 0, 10001, 0, 0, 1000]],
    ["a corner below zero", [0, -1, 1000, 0, 0, 1000]],
    ["a part of a centimetre", [0, 0.5, 1000, 0, 0, 1000]],
    ["a number written as text", [0, 0, "1000", 0, 0, 1000]],
    ["not a list at all", "0,0,1000"],
  ])("says the corner list is broken: %s", (_, corners) => {
    const messages = chunkMessages(chunkText({ corners }));
    expect(messages.some((message) => message.includes("corner list is broken"))).toBe(true);
  });

  it.each([
    ["not a multiple of three", [0, 1, 2, 0]],
    ["a corner number that does not exist", [0, 1, 3]],
    ["a negative corner number", [0, 1, -1]],
    ["a part of a number", [0, 1, 1.5]],
  ])("says the triangle list is broken: %s", (_, triangles) => {
    const messages = chunkMessages(chunkText({ triangles }));
    expect(messages).toEqual([expect.stringContaining("triangle list is broken")]);
  });

  it("lists every problem at once, each with the file's name", () => {
    const messages = chunkMessages(chunkText({ format: 2, corners: [0, 0, 1000], triangles: [0, 1] }));
    expect(messages.length).toBeGreaterThanOrEqual(3);
    for (const message of messages) expect(message).toContain("3_-2.json");
  });
});

describe("chunk file: idiot-proof path", () => {
  it.each(["null", "[]", "42", '"chunk"', "{}"])("refuses %s without crashing", (text) => {
    expect(chunkMessages(text).length).toBeGreaterThan(0);
  });
});

describe("chunk file: tragedy path (a square crowded with road)", () => {
  // D-0035: how time grows with size, plus a generous cap.
  it("checks a chunk of 100,000 triangles in time that grows evenly with its size", () => {
    const bigChunk = (count: number) =>
      chunkText({
        corners: Array.from({ length: 2 * (count + 2) }, (_, at) => at % 10001),
        triangles: Array.from({ length: 3 * count }, (_, at) => Math.floor(at / 3) + (at % 3)),
      });
    const small = bigChunk(10_000);
    const large = bigChunk(100_000);
    const timeToCheck = (text: string) => {
      const started = performance.now();
      expect(chunkMessages(text)).toEqual([]);
      return performance.now() - started;
    };
    timeToCheck(small);
    const smallTime = timeToCheck(small);
    const largeTime = timeToCheck(large);
    expect(largeTime).toBeLessThan(Math.max(20 * smallTime, 200));
    expect(largeTime).toBeLessThan(5000);
  });
});

describe("map index: happy path", () => {
  it("accepts a good index", () => {
    expect(indexMessages(indexText())).toEqual([]);
    expect(checkedIndex(indexText())).toMatchObject({ cellSizeM: 100, start: { headingDeg: 90, roadWidthM: 7, oneWay: false } });
  });

  it("accepts a heading just under 360 and a one-way start", () => {
    expect(indexMessages(indexText({ start: startWith({ headingDeg: 359.99, oneWay: true }) }))).toEqual([]);
  });
});

describe("map index: sad path (file, line, what to fix)", () => {
  it.each([
    ["a heading of 360", { headingDeg: 360 }, "`start.headingDeg`"],
    ["a heading below 0", { headingDeg: -1 }, "`start.headingDeg`"],
    ["a road with no width", { roadWidthM: 0 }, "`start.roadWidthM`"],
    ["one-way written as text", { oneWay: "yes" }, "`start.oneWay`"],
  ])("refuses %s in the start", (_, change, field) => {
    const messages = indexMessages(indexText({ start: startWith(change) }));
    expect(messages).toEqual([expect.stringMatching(/^index\.json line \d+: /)]);
    expect(messages[0]).toContain(field);
  });

  it("refuses a format other than 1", () => {
    expect(indexMessages(indexText({ format: 2 }))).toEqual([expect.stringContaining("`format`")]);
  });

  it("refuses an extent whose west edge is not west of its east edge", () => {
    expect(indexMessages(indexText({ extent: { westM: 300, southM: -300, eastM: 300, northM: 300 } })).length).toBeGreaterThan(0);
    expect(indexMessages(indexText({ extent: { westM: -300, southM: 400, eastM: 300, northM: 300 } })).length).toBeGreaterThan(0);
  });

  it("refuses a square listed twice, naming it", () => {
    const messages = indexMessages(indexText({ cells: ["0_0", "1_0", "0_0"] }));
    expect(messages).toHaveLength(1);
    expect(messages[0]).toContain("0_0");
  });

  it("refuses a square name that is not east_north", () => {
    expect(indexMessages(indexText({ cells: ["0_0", "3-2"] }))).toEqual([expect.stringContaining("`cells[1]`")]);
  });

  it("says a missing start is missing", () => {
    expect(indexMessages(indexText({ start: undefined }))).toContain("index.json line 1: `start` is missing.");
  });
});

describe("map index: idiot-proof path", () => {
  it("offers the field that was meant for a misspelt one", () => {
    const text = indexText({ cellSizeM: undefined, cellSize: 100 });
    expect(indexMessages(text)).toEqual([expect.stringContaining("Did you mean `cellSizeM`?")]);
  });
});

describe("map index against its place", () => {
  it("finds nothing wrong when the map was baked for this place's centre with 100 m squares", () => {
    expect(indexProblemsForPlace(checkedIndex(indexText()), tinyPlace(), 100)).toEqual([]);
  });

  it("says the map was baked with other squares, with both sizes, and to bake again", () => {
    const problems = indexProblemsForPlace(checkedIndex(indexText({ cellSizeM: 50 })), tinyPlace(), 100);
    expect(problems).toHaveLength(1);
    expect(String(problems[0])).toMatch(/50[\s\S]*100/);
    expect(String(problems[0])).toContain("bake again");
  });

  it("says the map was baked for a different centre, and to bake again, when the place's centre moved by even 1 cm", () => {
    const problems = indexProblemsForPlace(checkedIndex(indexText({ centre: { lat: 6.6300001, lon: 3.36 } })), tinyPlace(), 100);
    expect(problems).toHaveLength(1);
    expect(String(problems[0])).toContain("different centre");
    expect(String(problems[0])).toContain("bake again");
  });

  it("gives both problems together", () => {
    const text = indexText({ cellSizeM: 50, centre: { lat: 6.64, lon: 3.36 } });
    expect(indexProblemsForPlace(checkedIndex(text), tinyPlace(), 100)).toHaveLength(2);
  });
});
