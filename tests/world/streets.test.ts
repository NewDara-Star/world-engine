// The street file and the rule for which street the car is on (scope 005b).
// Design: src/world/streets.md. Points are metres east and north of the
// place centre; the file holds whole decimetres.
import { describe, expect, it, assert } from "vitest";
import {
  KEEP_SHOWN_STREET_MARGIN_M,
  STREET_NAME_HOLD_MS,
  STREET_NAME_WITHIN_M,
  type Street,
  type StreetMap,
  type StreetNameHold,
  nearestStreetName,
  noStreetName,
  streetNameAfter,
  streetsProblemsForPlace,
  validateStreetsFile,
} from "../../src/world/streets.js";

const CENTRE = { lat: 6.63, lon: 3.36 };

// An east-west street along north = 0, a north-south one along east = 100,
// meeting in a T, and an unnamed lane along north = 5 from east 0 to 50.
function townFileValue(): Record<string, unknown> {
  return {
    format: 1,
    centre: CENTRE,
    streets: [
      { name: "Long Street", size: "minor", lines: [[-2000, 0, 1000, 0]] },
      { name: "Cross Road", size: "major", lines: [[1000, -2000, 1000, 0]] },
      { size: "minor", lines: [[0, 50, 500, 50]] },
    ],
  };
}

function townText(changes: Record<string, unknown> = {}): string {
  return JSON.stringify({ ...townFileValue(), ...changes });
}

function town(): StreetMap {
  const checked = validateStreetsFile("streets.json", townText());
  if (!checked.ok) return assert.fail(checked.messages.join("\n"));
  return checked.value;
}

function messages(text: string): string[] {
  const checked = validateStreetsFile("streets.json", text);
  return checked.ok ? [] : checked.messages;
}

function streets(): Street[] {
  return town().streets;
}

describe("street file: happy path", () => {
  it("reads names, sizes and lines, turning decimetres into metres", () => {
    const [long, cross, lane] = streets();
    expect(long?.name).toBe("Long Street");
    expect(long?.lines[0]?.points).toEqual([
      { eastM: -200, northM: 0 },
      { eastM: 100, northM: 0 },
    ]);
    expect(cross?.size).toBe("major");
    expect(lane?.name).toBeUndefined();
  });

  it("works out each line's box once", () => {
    expect(streets()[1]?.lines[0]?.box).toEqual({ westM: 100, southM: -200, eastM: 100, northM: 0 });
  });

  it("accepts a file made for the place's centre", () => {
    expect(streetsProblemsForPlace(town(), { centre: CENTRE })).toEqual([]);
  });
});

describe("street file: sad path", () => {
  it("says a cut-short file may be cut short, with the file's name", () => {
    expect(messages(townText().slice(0, 40))).toEqual(["streets.json: the file is not readable JSON; it may be cut short."]);
  });

  it("asks for a new bake when the file is from another bake version", () => {
    expect(messages(townText({ format: 2 })).join("\n")).toContain("bake again");
  });

  it("asks for a new bake when the place's centre moved after the bake", () => {
    expect(streetsProblemsForPlace(town(), { centre: { lat: 6.631, lon: 3.36 } }).join("\n")).toContain("bake again");
  });

  it("says when the streets list is missing", () => {
    expect(messages(townText({ streets: undefined })).join("\n")).toContain("`streets` must be a list");
  });
});

describe("street file: idiot-proof path", () => {
  it.each([
    ["a name that is a number", { name: 7, size: "minor", lines: [[0, 0, 10, 0]] }, "`name`"],
    ["an empty name", { name: "  ", size: "minor", lines: [[0, 0, 10, 0]] }, "`name`"],
    ["a misspelt size", { name: "A", size: "mayor", lines: [[0, 0, 10, 0]] }, "`size`"],
    ["no lines", { name: "A", size: "minor", lines: [] }, "`lines`"],
    ["a line of one point", { name: "A", size: "minor", lines: [[0, 0]] }, "a line is broken"],
    ["an odd count of numbers", { name: "A", size: "minor", lines: [[0, 0, 10]] }, "a line is broken"],
    ["numbers sent as text", { name: "A", size: "minor", lines: [["0", "0", "10", "0"]] }, "a line is broken"],
    ["a point a world away", { name: "A", size: "minor", lines: [[0, 0, 9_000_000, 0]] }, "a line is broken"],
  ])("refuses %s, saying which street and what to fix", (_, street, words) => {
    const text = messages(townText({ streets: [townFileValue()["streets"] as unknown[]].flat().slice(0, 1).concat([street]) })).join("\n");
    expect(text).toContain("street 2");
    expect(text).toContain(words);
  });

  it("does not crash on a file that is just a number or null", () => {
    expect(messages("7").length).toBeGreaterThan(0);
    expect(messages("null").length).toBeGreaterThan(0);
  });
});

describe("which street the car is on: happy path", () => {
  it("names the street the car is on", () => {
    expect(nearestStreetName(streets(), { eastM: -100, northM: 2 }, undefined)).toBe("Long Street");
  });

  it("names the other street after turning onto it", () => {
    expect(nearestStreetName(streets(), { eastM: 101, northM: -80 }, "Long Street")).toBe("Cross Road");
  });

  it("names a road up to 15 m away, and none beyond", () => {
    expect(STREET_NAME_WITHIN_M).toBe(15);
    expect(nearestStreetName(streets(), { eastM: -100, northM: -15 }, undefined)).toBe("Long Street");
    expect(nearestStreetName(streets(), { eastM: -100, northM: -15.5 }, undefined)).toBeUndefined();
  });
});

describe("which street the car is on: sad path", () => {
  it("names nothing off every road", () => {
    expect(nearestStreetName(streets(), { eastM: -100, northM: -60 }, "Long Street")).toBeUndefined();
  });

  it("names nothing when there are no streets", () => {
    expect(nearestStreetName([], { eastM: 0, northM: 0 }, undefined)).toBeUndefined();
  });

  it("never shows a road with no name, and does not let it hide a named one", () => {
    // On the unnamed lane (north 5), 5 m from Long Street.
    expect(nearestStreetName(streets(), { eastM: 20, northM: 5 }, undefined)).toBe("Long Street");
  });
});

describe("which street the car is on: idiot-proof path (junctions)", () => {
  it("keeps the shown name at a junction while its road is within 3 m of the nearest", () => {
    expect(KEEP_SHOWN_STREET_MARGIN_M).toBe(3);
    // 2 m from Cross Road, 4 m from Long Street.
    expect(nearestStreetName(streets(), { eastM: 98, northM: -4 }, "Long Street")).toBe("Long Street");
  });

  it("moves to the other road once it is clearly nearer", () => {
    // 1 m from Cross Road, 10 m from Long Street.
    expect(nearestStreetName(streets(), { eastM: 99, northM: -10 }, "Long Street")).toBe("Cross Road");
  });

  it("gives the same answer every time on an exact tie: the first street in the file", () => {
    for (let run = 0; run < 5; run += 1) expect(nearestStreetName(streets(), { eastM: 103, northM: 3 }, undefined)).toBe("Long Street");
  });
});

describe("the name on screen: no flicker", () => {
  it("changes only after the new answer has held for a whole second", () => {
    expect(STREET_NAME_HOLD_MS).toBe(1000);
    let hold = streetNameAfter(noStreetName, "Long Street", 0);
    expect(hold.shown).toBeUndefined();
    hold = streetNameAfter(hold, "Long Street", 999);
    expect(hold.shown).toBeUndefined();
    hold = streetNameAfter(hold, "Long Street", 1000);
    expect(hold.shown).toBe("Long Street");
  });

  it("does not change at all when the answer flickers back within the second", () => {
    let hold: StreetNameHold = { shown: "Long Street", waiting: undefined };
    hold = streetNameAfter(hold, "Cross Road", 0);
    hold = streetNameAfter(hold, "Long Street", 500);
    hold = streetNameAfter(hold, "Cross Road", 900);
    hold = streetNameAfter(hold, "Cross Road", 1800);
    expect(hold.shown).toBe("Long Street");
    hold = streetNameAfter(hold, "Cross Road", 1900);
    expect(hold.shown).toBe("Cross Road");
  });

  it("clears the name after a second off every road, the same way", () => {
    let hold: StreetNameHold = { shown: "Long Street", waiting: undefined };
    hold = streetNameAfter(hold, undefined, 0);
    expect(hold.shown).toBe("Long Street");
    hold = streetNameAfter(hold, undefined, 1000);
    expect(hold.shown).toBeUndefined();
  });
});

describe("tragedy path", () => {
  it("after a three-hour drive the hold still works: time is only ever compared, never added up", () => {
    const threeHoursMs = 3 * 60 * 60 * 1000;
    let hold = streetNameAfter({ shown: "Long Street", waiting: undefined }, "Cross Road", threeHoursMs);
    hold = streetNameAfter(hold, "Cross Road", threeHoursMs + 1000);
    expect(hold.shown).toBe("Cross Road");
  });

  it("finds the street among thousands quickly: lines whose box is far are skipped", () => {
    const many = Array.from({ length: 5000 }, (_, at) => ({ name: `Street ${at}`, size: "minor", lines: [[(at % 100) * 3000 - 150_000, 10_000 + Math.floor(at / 100) * 1000, (at % 100) * 3000 - 149_800, 10_000 + Math.floor(at / 100) * 1000]] }));
    const checked = validateStreetsFile("streets.json", JSON.stringify({ format: 1, centre: CENTRE, streets: [...many, ...(townFileValue()["streets"] as unknown[])] }));
    if (!checked.ok) return assert.fail(checked.messages.join("\n"));
    const started = performance.now();
    for (let run = 0; run < 100; run += 1) nearestStreetName(checked.value.streets, { eastM: -100, northM: 2 }, undefined);
    const perCallMs = (performance.now() - started) / 100;
    expect(nearestStreetName(checked.value.streets, { eastM: -100, northM: 2 }, undefined)).toBe("Long Street");
    // A generous cap (D-0035): the game asks ten times a second.
    expect(perCallMs).toBeLessThan(20);
  });

  it("finds the right street far from the centre, at the map's edge", () => {
    const far = validateStreetsFile("streets.json", JSON.stringify({ format: 1, centre: CENTRE, streets: [{ name: "Edge Road", size: "minor", lines: [[14_000, 14_990, 15_000, 14_990]] }] }));
    if (!far.ok) return assert.fail(far.messages.join("\n"));
    expect(nearestStreetName(far.value.streets, { eastM: 1450.3, northM: 1500.1 }, undefined)).toBe("Edge Road");
  });
});
