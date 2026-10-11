// The place file's slice-1 fields: `centre` (was `skyPosition`), the lane
// width and the map's half size, each number with its source (the data rule).
// Design: src/place/place.md, "Changed for scope 005" (approver's F20).
// These replace the old tests that named `skyPosition`.
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { validatePlace } from "../../src/place/index.js";
import { knownPlanets } from "./planets.js";

const placesDir = resolve(import.meta.dirname, "../../places");

function readPlaceText(file: string): string {
  return readFileSync(resolve(placesDir, file), "utf8");
}

function yaba(): Record<string, unknown> {
  return JSON.parse(readPlaceText("yaba.json")) as Record<string, unknown>;
}

function withChanges(changes: Record<string, unknown>): string {
  return JSON.stringify({ ...yaba(), ...changes }, null, 2);
}

function messagesOf(text: string): string[] {
  const checked = validatePlace("yaba.json", text, knownPlanets());
  return checked.ok ? [] : checked.messages;
}

function lineOf(text: string, needle: string): number {
  const at = text.indexOf(needle);
  if (at < 0) throw new Error(`not in the text: ${needle}`);
  return text.slice(0, at).split("\n").length;
}

function sourceWith(changes: Record<string, unknown>): Record<string, unknown> {
  return { source: "A test source.", url: "https://example.test/lanes", status: "owner-choice", ...changes };
}

describe("place centre, lane width and map size: happy path", () => {
  it.each(["finglas.json", "yaba.json"])("%s has a centre, a lane width and a map size, each with a source", (file) => {
    const checked = validatePlace(file, readPlaceText(file), knownPlanets());
    expect(checked.ok ? [] : checked.messages).toEqual([]);
    if (!checked.ok) return;
    expect(checked.value.centre).toEqual({ lat: expect.any(Number), lon: expect.any(Number) });
    expect(checked.value.laneWidthM).toBeGreaterThanOrEqual(2);
    expect(checked.value.laneWidthM).toBeLessThanOrEqual(5);
    expect(checked.value.mapHalfSizeM).toBeGreaterThanOrEqual(100);
    expect(["official", "derived", "owner-choice"]).toContain(checked.value.laneWidthSource.status);
  });

  it.each(["finglas.json", "yaba.json"])("%s records its map size as the owner's choice", (file) => {
    const place = JSON.parse(readPlaceText(file)) as { mapHalfSizeSource?: { status?: string } };
    expect(place.mapHalfSizeSource?.status).toBe("owner-choice");
  });

  it("no place file still uses the old name skyPosition", () => {
    for (const file of ["finglas.json", "yaba.json"]) expect(readPlaceText(file), file).not.toContain("skyPosition");
  });

  it("accepts lane widths of 2 m and 5 m, the ends of the range", () => {
    expect(messagesOf(withChanges({ laneWidthM: 2 }))).toEqual([]);
    expect(messagesOf(withChanges({ laneWidthM: 5 }))).toEqual([]);
  });

  it("accepts map half sizes of 100 m and 50,000 m, the ends of the range", () => {
    expect(messagesOf(withChanges({ mapHalfSizeM: 100 }))).toEqual([]);
    expect(messagesOf(withChanges({ mapHalfSizeM: 50_000 }))).toEqual([]);
  });
});

describe("place centre, lane width and map size: sad path", () => {
  it("refuses a lane width of 30, a slip for 3.0, naming the range and unit", () => {
    const text = withChanges({ laneWidthM: 30 });
    expect(messagesOf(text)).toEqual([`yaba.json line ${lineOf(text, '"laneWidthM"')}: \`laneWidthM\` must be a number from 2 to 5 m; found 30.`]);
  });

  it("refuses lane widths just outside the range", () => {
    expect(messagesOf(withChanges({ laneWidthM: 1.99 }))).toEqual([expect.stringContaining("`laneWidthM` must be a number from 2 to 5 m; found 1.99.")]);
    expect(messagesOf(withChanges({ laneWidthM: 5.01 }))).toEqual([expect.stringContaining("`laneWidthM` must be a number from 2 to 5 m; found 5.01.")]);
  });

  it("refuses a map half size under 100 m or over 50,000 m", () => {
    for (const size of [99, 50_001, 0, -1500]) {
      expect(messagesOf(withChanges({ mapHalfSizeM: size })), String(size)).toEqual([
        expect.stringMatching(new RegExp(`\`mapHalfSizeM\` must be a number from 100 to 50,?000 m; found ${size}\\.$`)),
      ]);
    }
  });

  it("says a missing lane width source is missing: every number needs one", () => {
    expect(messagesOf(withChanges({ laneWidthSource: undefined }))).toContain("yaba.json line 1: `laneWidthSource` is missing.");
    expect(messagesOf(withChanges({ mapHalfSizeSource: undefined }))).toContain("yaba.json line 1: `mapHalfSizeSource` is missing.");
  });

  it("refuses a source whose status is not official, derived or owner-choice: never a silent guess", () => {
    const text = withChanges({ laneWidthSource: sourceWith({ status: "guess" }) });
    expect(messagesOf(text)).toEqual([expect.stringMatching(/`laneWidthSource\.status` must be one of `official`, `derived`, `owner-choice`; found "guess"\./)]);
  });

  it("refuses a source link that is not https, and a blank source", () => {
    expect(messagesOf(withChanges({ mapHalfSizeSource: sourceWith({ url: "http://example.test" }) }))).toEqual([
      expect.stringContaining("`mapHalfSizeSource.url` must be a link starting with https://"),
    ]);
    expect(messagesOf(withChanges({ mapHalfSizeSource: sourceWith({ source: "  " }) }))).toEqual([expect.stringContaining("`mapHalfSizeSource.source`")]);
  });

  it("refuses a centre off the globe, naming the field and the range", () => {
    const text = withChanges({ centre: { lat: 91, lon: 3.38 } });
    expect(messagesOf(text)).toEqual([`yaba.json line ${lineOf(text, '"lat"')}: \`centre.lat\` must be a number from -90 to 90 degrees; found 91.`]);
  });
});

describe("place centre, lane width and map size: idiot-proof path", () => {
  it("refuses a lane width written as text, showing the quote marks", () => {
    expect(messagesOf(withChanges({ laneWidthM: "3.5" }))).toEqual([expect.stringContaining('`laneWidthM` must be a number from 2 to 5 m; found "3.5".')]);
  });

  it("offers laneWidthM for a misspelt laneWidth", () => {
    const text = withChanges({ laneWidthM: undefined, laneWidth: 3.5 });
    expect(messagesOf(text)).toEqual([`yaba.json line ${lineOf(text, '"laneWidth"')}: \`laneWidth\` is not a field. Did you mean \`laneWidthM\`?`]);
  });
});

describe("place centre, lane width and map size: tragedy path (a file written before scope 005)", () => {
  it("tells an old file with skyPosition exactly what it lacks: the centre, the lane width and the map size, with their sources", () => {
    const old = withChanges({
      centre: undefined,
      skyPosition: { lat: 6.51, lon: 3.38 },
      laneWidthM: undefined,
      laneWidthSource: undefined,
      mapHalfSizeM: undefined,
      mapHalfSizeSource: undefined,
    });
    const messages = messagesOf(old);
    expect(messages.some((message) => message.includes("`skyPosition`"))).toBe(true);
    expect(messages.some((message) => message.includes("`centre`"))).toBe(true);
    for (const field of ["laneWidthM", "laneWidthSource", "mapHalfSizeM", "mapHalfSizeSource"]) {
      expect(messages, field).toContain(`yaba.json line 1: \`${field}\` is missing.`);
    }
  });
});
