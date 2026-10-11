import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { LICENCES, validatePlace, type Place } from "../../src/place/index.js";

const placesDir = resolve(import.meta.dirname, "../../places");

function readPlaceText(file: string): string {
  return readFileSync(resolve(placesDir, file), "utf8");
}

function good(file: string): Place {
  const checked = validatePlace(file, readPlaceText(file));
  if (!checked.ok) throw new Error(checked.messages.join("\n"));
  return checked.value;
}

// Yaba's file as plain values, to make broken copies from.
function yaba(): Record<string, unknown> {
  return JSON.parse(readPlaceText("yaba.json")) as Record<string, unknown>;
}

// Yaba with some fields changed, written out as a place-maker would see it;
// `undefined` removes a field.
function withChanges(changes: Record<string, unknown>): string {
  return JSON.stringify({ ...yaba(), ...changes }, null, 2);
}

function messagesOf(text: string, fileName = "yaba.json"): string[] {
  const checked = validatePlace(fileName, text);
  return checked.ok ? [] : checked.messages;
}

// The line (counting from 1) of the first line holding `needle`, after `from`.
function lineOf(text: string, needle: string, from = 0): number {
  const at = text.indexOf(needle, from);
  if (at < 0) throw new Error(`not in the text: ${needle}`);
  return text.slice(0, at).split("\n").length;
}

const FIX_FIRST = "yaba.json: Fix these first; some cross-checks run after.";

describe("place file: happy path", () => {
  it("accepts Finglas, which drives on the left", () => {
    expect(good("finglas.json")).toMatchObject({ id: "finglas", drivingSide: "left", planet: "earth" });
  });

  it("accepts Yaba, which drives on the right", () => {
    expect(good("yaba.json")).toMatchObject({ id: "yaba", drivingSide: "right", planet: "earth" });
  });

  it("accepts every file in places/, so a new place is checked the day it is added", () => {
    const files = readdirSync(placesDir).filter((name) => name.endsWith(".json"));
    expect(files.length).toBeGreaterThanOrEqual(2);
    for (const file of files) expect(messagesOf(readPlaceText(file), file), file).toEqual([]);
  });

  it("names each place file after the place inside it", () => {
    for (const file of readdirSync(placesDir)) expect(good(file).id).toBe(file.replace(".json", ""));
  });

  it("accepts a file saved on Windows, and one that starts with an invisible byte-order mark", () => {
    const text = readPlaceText("yaba.json");
    expect(messagesOf(text.replaceAll("\n", "\r\n"))).toEqual([]);
    expect(messagesOf(`\uFEFF${text}`)).toEqual([]);
  });
});

describe("place file: sad path (a broken file says where and what)", () => {
  it("names the file, the line, the allowed words and what was found when the driving side is wrong", () => {
    const text = withChanges({ drivingSide: "up" });
    expect(messagesOf(text)).toEqual([
      `yaba.json line ${lineOf(text, '"drivingSide"')}: \`drivingSide\` must be one of \`left\`, \`right\`; found "up".`,
    ]);
  });

  it("says a missing field is missing, on the line where its object starts", () => {
    expect(messagesOf(withChanges({ gravityMs2: undefined }))).toEqual(["yaba.json line 1: `gravityMs2` is missing."]);
  });

  it("says a missing field inside an object is missing, on that object's line", () => {
    const text = withChanges({ skyPosition: { lat: 6.51 } });
    expect(messagesOf(text)).toEqual([`yaba.json line ${lineOf(text, '"skyPosition"')}: \`skyPosition.lon\` is missing.`]);
  });

  it("points into nested things: which source, which field, which line", () => {
    const sources = [{ name: "Map", url: "http://x.test", licence: "CC0-1.0", attribution: "a" }];
    const text = withChanges({ dataSources: sources });
    expect(messagesOf(text)).toEqual([
      `yaba.json line ${lineOf(text, '"url": "http://x.test"')}: \`dataSources[0].url\` must be a link starting with https://; found "http://x.test".`,
    ]);
  });

  it("says how many items a list has and how many it needs", () => {
    const text = withChanges({ dataSources: [] });
    expect(messagesOf(text)).toEqual([
      `yaba.json line ${lineOf(text, '"dataSources"')}: \`dataSources\` needs at least 1 item; found 0 items.`,
    ]);
  });

  it("names the unit of a number out of range", () => {
    const text = withChanges({ gravityMs2: -9.8 });
    expect(messagesOf(text)).toEqual([
      `yaba.json line ${lineOf(text, '"gravityMs2"')}: \`gravityMs2\` must be a number from 0 to 100 m/s²; found -9.8.`,
    ]);
  });

  it("refuses something that is not a place at all, saying it must be an object and the cross-checks wait", () => {
    for (const nonsense of ["null", '"yaba"', "42", "[]"]) {
      expect(messagesOf(nonsense), nonsense).toEqual([
        `yaba.json line 1: the file must be an object in curly brackets; found ${nonsense}.`,
        FIX_FIRST,
      ]);
    }
  });

  it("names the line of invalid JSON: a missing comma is reported where the next field starts", () => {
    const text = readPlaceText("yaba.json").replace('"id": "yaba",', '"id": "yaba"');
    const [message, ...rest] = messagesOf(text);
    expect(rest).toEqual([]);
    expect(message).toMatch(/^yaba\.json line 3: the file is not valid JSON here: a comma is missing before this point/);
  });

  it("says an empty file is empty, on line 1", () => {
    for (const empty of ["", "  \n\n\t\r\n"]) {
      expect(messagesOf(empty)).toEqual([
        "yaba.json line 1: the file is empty. A place or vehicle file starts with `{` and ends with `}`.",
      ]);
    }
  });

  it("says a bracket left open is only noticed at the end of the file", () => {
    const text = readPlaceText("yaba.json").replace(/\}\s*$/, "");
    const [message] = messagesOf(text);
    expect(message).toMatch(new RegExp(`^yaba\\.json line ${text.split("\n").length}: the file is not valid JSON here: a \`\\{\` opened earlier is never closed`));
  });

  it("uses the file name it is given in every message", () => {
    expect(messagesOf(withChanges({ name: "" }), "lagos/yaba-v2.json")[0]).toMatch(/^lagos\/yaba-v2\.json line \d+: /);
  });
});

describe("place file: idiot-proof path", () => {
  it.each(["constructor", "toString", "__proto__", "hasOwnProperty", "valueOf"])(
    "reports a field called %s as not a field, never accepts it silently",
    (name) => {
      const text = readPlaceText("yaba.json").replace('"id": "yaba",', `"id": "yaba",\n  "${name}": 1,`);
      expect(messagesOf(text)).toEqual([
        expect.stringMatching(new RegExp(`^yaba\\.json line 3: \`${name}\` is not a field here; the fields are \`id\`, \`name\`, `)),
      ]);
    },
  );

  it("gives one message for a misspelt field: did you mean, and no separate 'is missing'", () => {
    const text = readPlaceText("yaba.json").replace('"name":', '"nmae":');
    expect(messagesOf(text)).toEqual([`yaba.json line ${lineOf(text, '"nmae"')}: \`nmae\` is not a field. Did you mean \`name\`?`]);
  });

  it("lists every field, and says what is missing, when an unknown field is close to nothing", () => {
    const text = readPlaceText("yaba.json").replace('"name":', '"title":');
    const messages = messagesOf(text);
    expect(messages).toHaveLength(2);
    expect(messages[0]).toMatch(/^yaba\.json line 3: `title` is not a field here; the fields are `id`, `name`, `planet`, /);
    expect(messages[1]).toBe("yaba.json line 1: `name` is missing.");
  });

  it("suggests the allowed word that was meant: rihgt is right", () => {
    const text = withChanges({ drivingSide: "rihgt" });
    expect(messagesOf(text)).toEqual([
      `yaba.json line ${lineOf(text, '"drivingSide"')}: \`drivingSide\` must be one of \`left\`, \`right\`; found "rihgt". Did you mean \`right\`?`,
    ]);
  });

  it("refuses ids with a capital, a dash at the end, two dashes together, or over 32 characters", () => {
    for (const id of ["Yaba", "yaba-", "a--b", "a".repeat(33), "-yaba", "yaba lagos", "../yaba", ""]) {
      expect(messagesOf(withChanges({ id })), id).toEqual([expect.stringContaining("`id` must be an id")]);
    }
  });

  it("accepts ids of letters a to z and digits with single dashes, up to 32 characters", () => {
    for (const id of ["yaba", "1yaba", "omole-phase-1", "a".repeat(32)]) {
      expect(messagesOf(withChanges({ id })), id).toEqual([]);
    }
  });

  it("offers the fixed id when the fix is obvious", () => {
    expect(messagesOf(withChanges({ id: "Yaba" }))[0]).toMatch(/; found "Yaba"\. Did you mean `yaba`\?$/);
    expect(messagesOf(withChanges({ id: "omole phase 1" }))[0]).toMatch(/Did you mean `omole-phase-1`\?$/);
    expect(messagesOf(withChanges({ id: "Ọ̀yọ́" }))[0]).toMatch(/Did you mean `oyo`\?$/);
  });

  it("offers no id at all rather than a wrong one, for letters with no plain a to z form", () => {
    for (const id of ["Ɗanbatta", "straße", "a".repeat(40)]) {
      expect(messagesOf(withChanges({ id }))[0], id).not.toContain("Did you mean");
    }
  });

  it("refuses a number written as text, and shows the quote marks so the slip can be seen", () => {
    const text = withChanges({ gravityMs2: "9.8" });
    expect(messagesOf(text)).toEqual([
      `yaba.json line ${lineOf(text, '"gravityMs2"')}: \`gravityMs2\` must be a number from 0 to 100 m/s²; found "9.8".`,
    ]);
  });

  it("calls a number too big to hold 'a number too big to use', never null", () => {
    const text = readPlaceText("yaba.json").replace('"gravityMs2": 9.781', '"gravityMs2": 1e400');
    expect(messagesOf(text)[0]).toMatch(/`gravityMs2` must be a number from 0 to 100 m\/s²; found a number too big to use\.$/);
  });

  it("offers a tenth when a number is ten times too big and a tenth fits, and only then", () => {
    expect(messagesOf(withChanges({ gravityMs2: 981 }))[0]).toMatch(/found 981\. Did you mean 98\.1\?$/);
    expect(messagesOf(withChanges({ gravityMs2: 9810 }))[0]).toMatch(/found 9810\.$/);
    expect(messagesOf(withChanges({ gravityMs2: -1 }))[0]).toMatch(/found -1\.$/);
  });

  it("refuses a latitude off the planet", () => {
    const text = withChanges({ skyPosition: { lat: 910, lon: 0 } });
    expect(messagesOf(text)).toEqual([
      `yaba.json line ${lineOf(text, '"lat"')}: \`skyPosition.lat\` must be a number from -90 to 90 degrees; found 910.`,
    ]);
  });

  it("refuses a licence outside the working rule, such as GPL", () => {
    const sources = [{ name: "Map", url: "https://x.test", licence: "GPL-3.0", attribution: "a" }];
    expect(messagesOf(withChanges({ dataSources: sources }))[0]).toContain("`dataSources[0].licence` must be one of");
    expect(LICENCES).not.toContain("GPL-3.0");
  });

  it("refuses the same vehicle class listed twice, and none at all", () => {
    const twice = withChanges({ allowedVehicleClasses: ["car", "car"] });
    expect(messagesOf(twice)).toEqual([
      `yaba.json line ${lineOf(twice, '"allowedVehicleClasses"')}: \`allowedVehicleClasses\` lists \`car\` twice.`,
    ]);
    expect(messagesOf(withChanges({ allowedVehicleClasses: [] }))).toEqual([expect.stringContaining("needs at least 1 item"), FIX_FIRST]);
  });

  it("reports three mistakes in different places in one run", () => {
    const text = withChanges({ name: undefined, nmae: "Yaba", allowedVehicleClasses: ["car", "car"], constantsSources: yabaSources("gravity") });
    expect(messagesOf(text)).toEqual([
      `yaba.json line ${lineOf(text, '"nmae"')}: \`nmae\` is not a field. Did you mean \`name\`?`,
      `yaba.json line ${lineOf(text, '"allowedVehicleClasses"')}: \`allowedVehicleClasses\` lists \`car\` twice.`,
      `yaba.json line ${lineOf(text, '"constantsSources"')}: \`constantsSources\` has no source for \`airDensity\`.`,
    ]);
  });

  it("reports a vehicle class listed twice even while another field is wrong", () => {
    const messages = messagesOf(withChanges({ drivingSide: "up", allowedVehicleClasses: ["bus", "bus"] }));
    expect(messages).toHaveLength(2);
    expect(messages[1]).toContain("`allowedVehicleClasses` lists `bus` twice.");
    expect(messages).not.toContain(FIX_FIRST);
  });

  it("refuses two sources for gravity, pointing at the second", () => {
    const sources = [...yabaSources("gravity", "airDensity"), ...yabaSources("gravity")];
    const text = withChanges({ constantsSources: sources });
    const second = text.indexOf('"quantity": "gravity"', text.indexOf('"quantity": "airDensity"'));
    expect(messagesOf(text)).toEqual([
      `yaba.json line ${lineOf(text, "{", text.lastIndexOf("{", second))}: \`constantsSources\` has 2 sources for \`gravity\`; each constant needs exactly one.`,
    ]);
  });

  it("lists every constant with no source and every one with more, together", () => {
    const sources = [...yabaSources("gravity"), ...yabaSources("gravity"), ...yabaSources("gravity")];
    const messages = messagesOf(withChanges({ constantsSources: sources }));
    expect(messages).toHaveLength(2);
    expect(messages[0]).toContain("`constantsSources` has 3 sources for `gravity`; each constant needs exactly one.");
    expect(messages[1]).toContain("`constantsSources` has no source for `airDensity`.");
  });

  it("says when a cross-check waited for a broken field, on a last line naming the file only", () => {
    const [first, ...rest] = yabaSources("gravity", "airDensity");
    const messages = messagesOf(withChanges({ constantsSources: [{ ...first, status: "trust-me" }, ...rest] }));
    expect(messages).toHaveLength(2);
    expect(messages[0]).toMatch(/^yaba\.json line \d+: `constantsSources\[0\]\.status` must be one of/);
    expect(messages[1]).toBe(FIX_FIRST);
  });

  it("reports a field written twice, naming both lines, and points the value's message at the copy that is used", () => {
    const original = readPlaceText("yaba.json");
    const text = original.replace('"seaLevelDatum":', '"gravityMs2": -9.8,\n  "seaLevelDatum":');
    const firstLine = lineOf(text, '"gravityMs2"');
    const usedLine = lineOf(text, '"gravityMs2": -9.8');
    expect(messagesOf(text)).toEqual([
      `yaba.json line ${usedLine}: \`gravityMs2\` is written twice, on lines ${firstLine} and ${usedLine}; keep one.`,
      `yaba.json line ${usedLine}: \`gravityMs2\` must be a number from 0 to 100 m/s²; found -9.8.`,
    ]);
  });

  it("finds a field written twice inside an object in a list", () => {
    const text = withChanges({}).replace('"licence": "ODbL-1.0",', '"licence": "ODbL-1.0",\n      "licence": "MIT",');
    expect(messagesOf(text)[0]).toMatch(/`dataSources\[0\]\.licence` is written twice, on lines \d+ and \d+; keep one\.$/);
  });

  it("explains a comment, single quotes and a trailing comma in plain words, never a code", () => {
    const text = readPlaceText("yaba.json");
    const broken = [
      text.replace('"planet": "earth",', '"planet": "earth", // home'),
      text.replace('"planet": "earth",', "'planet': 'earth',"),
      text.replace('"lon": 3.38', '"lon": 3.38,'),
    ];
    const [comment, quotes, comma] = broken.map((one) => messagesOf(one)[0]);
    expect(comment).toBe(
      "yaba.json line 4: the file is not valid JSON here: comments (`//` or `/* */`) are not allowed in this file; take the comment out.",
    );
    expect(quotes).toMatch(/^yaba\.json line 4: the file is not valid JSON here: something here is not allowed in JSON\. Names and text need straight double quotes/);
    expect(comma).toMatch(/^yaba\.json line 14: the file is not valid JSON here: a field name in double quotes is expected here\./);
  });
});

describe("place file: tragedy path (limits, scale, old files)", () => {
  it("accepts the edges of the planet and a world with no gravity or air (space)", () => {
    const edges = { skyPosition: { lat: -90, lon: 180 }, gravityMs2: 0, airDensityKgM3: 0 };
    expect(messagesOf(withChanges(edges))).toEqual([]);
  });

  it("checks a very large place file in under a second", () => {
    const fine = { name: "Map", url: "https://x.test", licence: "CC0-1.0", attribution: "a" };
    const text = withChanges({ dataSources: Array.from({ length: 50_000 }, () => fine) });
    expect(text.length).toBeGreaterThan(5_000_000);
    const started = performance.now();
    expect(messagesOf(text)).toEqual([]);
    expect(performance.now() - started).toBeLessThan(1000);
  });

  it("checks a place with thousands of sources, and reports every bad one on its own line", () => {
    const fine = { name: "Map", url: "https://x.test", licence: "CC0-1.0", attribution: "a" };
    const many = Array.from({ length: 5000 }, (_, index) => (index % 5 === 0 ? { ...fine, licence: "?" } : fine));
    const text = withChanges({ dataSources: many });
    const messages = messagesOf(text);
    expect(messages).toHaveLength(1000);
    expect(messages[999]).toBe(
      `yaba.json line ${lineOf(text, '"licence": "?"', text.lastIndexOf('"licence": "?"'))}: \`dataSources[4995].licence\` must be one of \`CC0-1.0\`, \`CC-BY-4.0\`, \`MIT\`, \`Apache-2.0\`, \`ODbL-1.0\`; found "?".`,
    );
  });

  it("keeps an enormous wrong value out of the message, and stays quick", () => {
    const started = performance.now();
    const [message] = messagesOf(withChanges({ drivingSide: "x".repeat(5_000_000) }));
    expect(performance.now() - started).toBeLessThan(1000);
    expect(message?.length).toBeLessThan(200);
  });

  it("says brackets nested thousands deep are nested too deeply, on line 1, and does not crash", () => {
    for (const depth of [20_000, 2_500]) {
      const messages = messagesOf("[".repeat(depth) + "]".repeat(depth));
      expect(messages.length, String(depth)).toBeLessThanOrEqual(2);
      expect(messages[0], String(depth)).toMatch(/^yaba\.json line 1: the file (has brackets nested too deeply|must be an object)/);
    }
    expect(messagesOf(`{"id": ${"[".repeat(2_500)}${"]".repeat(2_500)}}`).length).toBeGreaterThan(0);
  });

  it("counts lines the editor's way: Windows, old Mac and Linux line breaks alike", () => {
    const text = withChanges({ drivingSide: "up" });
    const line = lineOf(text, '"drivingSide"');
    for (const lineBreak of ["\r\n", "\r", "\n"]) {
      expect(messagesOf(text.replaceAll("\n", lineBreak))[0], JSON.stringify(lineBreak)).toMatch(new RegExp(`^yaba\\.json line ${line}: `));
    }
  });

  it("tells an old file, written before a field existed, exactly which fields it lacks", () => {
    const oldFile = withChanges({ constantsNote: undefined, constantsSources: undefined, seaLevelDatum: undefined });
    expect(messagesOf(oldFile)).toEqual([
      "yaba.json line 1: `seaLevelDatum` is missing.",
      "yaba.json line 1: `constantsNote` is missing.",
      "yaba.json line 1: `constantsSources` is missing.",
      FIX_FIRST,
    ]);
  });
});

// Yaba's own constant sources, picked by quantity, in the order asked.
function yabaSources(...quantities: string[]): Record<string, unknown>[] {
  const sources = yaba()["constantsSources"] as Record<string, unknown>[];
  return quantities.flatMap((quantity) => sources.filter((source) => source["quantity"] === quantity));
}

// Reference: WGS84 normal gravity by Somigliana's formula, NIMA TR8350.2 (2000);
// constants as tabulated at https://ahrs.readthedocs.io/en/latest/constants.html
// (equatorial gravity, Somigliana constant, first eccentricity squared).
function wgs84NormalGravity(latitudeDegrees: number): number {
  const equatorial = 9.7803253359;
  const somigliana = 1.931852652458e-3;
  const eccentricitySquared = 6.69437999014e-3;
  const sinSquared = Math.sin((latitudeDegrees * Math.PI) / 180) ** 2;
  return (equatorial * (1 + somigliana * sinSquared)) / Math.sqrt(1 - eccentricitySquared * sinSquared);
}

// Reference: ISO 2533 standard atmosphere, troposphere (the standard's defining
// constants; the standard text itself was not opened) and the ideal gas law for
// dry air, R = 287.05 J/(kg·K). Worked through in research/30-place-constants.md.
function isoPressureAt(heightM: number): number {
  const lapse = 0.0065;
  const seaLevelK = 288.15;
  const exponent = (9.80665 * 0.0289644) / (8.31446 * lapse);
  return 101325 * (1 - (lapse * heightM) / seaLevelK) ** exponent;
}

function dryAirDensity(celsius: number, pascals: number): number {
  return pascals / (287.05 * (celsius + 273.15));
}

describe("place file: gravity and air density carry their sources (scope 001b)", () => {
  const files = readdirSync(placesDir).filter((name) => name.endsWith(".json"));

  it.each(files)("%s: stored gravity matches the Somigliana formula at the place's latitude", (file) => {
    const place = good(file);
    expect(place.gravityMs2).toBeCloseTo(wgs84NormalGravity(place.skyPosition.lat), 3);
  });

  it.each(files)("%s: cites exactly one source for gravity and one for air density", (file) => {
    const quantities = good(file).constantsSources.map((source) => source.quantity);
    expect(quantities.toSorted()).toEqual(["airDensity", "gravity"]);
  });

  it("Finglas cites Met Éireann 1991–2020 for air density", () => {
    const air = good("finglas.json").constantsSources.find((source) => source.quantity === "airDensity");
    expect(air).toMatchObject({ period: "1991–2020", status: "derived" });
    expect(air?.source).toContain("Met Éireann");
  });

  it("Yaba's air density is derived from Lagos/Ikeja 1991–2020, and says it is not an official NiMet figure", () => {
    const air = good("yaba.json").constantsSources.find((source) => source.quantity === "airDensity");
    expect(air).toMatchObject({ period: "1991–2020", status: "derived" });
    expect(air?.source).toContain("NOT an official NiMet figure");
    expect(air?.source).toContain("gaps");
  });

  it("Yaba's stored air density is the ideal-gas value for 27.8 °C at 40 m in the standard atmosphere", () => {
    expect(good("yaba.json").airDensityKgM3).toBeCloseTo(dryAirDensity(27.8, isoPressureAt(40)), 3);
    expect(good("yaba.json").airDensityKgM3).toBe(1.167);
  });

  it("every constant says whether it is official, derived, or the owner's choice", () => {
    for (const file of files) {
      for (const source of good(file).constantsSources) expect(["official", "derived", "owner-choice"]).toContain(source.status);
    }
  });

  it("refuses the old status words, so a file from before scope 002 says exactly what to change", () => {
    const [first, ...rest] = yabaSources("gravity", "airDensity");
    const [message] = messagesOf(withChanges({ constantsSources: [{ ...first, status: "partly-verified" }, ...rest] }));
    expect(message).toContain("must be one of `official`, `derived`, `owner-choice`");
  });

  it("refuses a place that gives gravity a source but air density none", () => {
    const text = withChanges({ constantsSources: yabaSources("gravity") });
    expect(messagesOf(text)).toEqual([
      `yaba.json line ${lineOf(text, '"constantsSources"')}: \`constantsSources\` has no source for \`airDensity\`.`,
    ]);
  });

  it("refuses a made-up verification state and a source without a link", () => {
    const [first, ...rest] = yabaSources("gravity", "airDensity");
    const messages = messagesOf(withChanges({ constantsSources: [{ ...first, status: "trust-me", url: "ncei" }, ...rest] }));
    expect(messages).toHaveLength(3);
    expect(messages[2]).toBe(FIX_FIRST);
  });

  it("refuses an empty list of sources and sources sent as text", () => {
    expect(messagesOf(withChanges({ constantsSources: [] }))).toHaveLength(2);
    expect(messagesOf(withChanges({ constantsSources: "Met Eireann" }))).toEqual([
      expect.stringContaining('`constantsSources` must be a list in square brackets; found "Met Eireann".'),
      FIX_FIRST,
    ]);
  });

  it("checks gravity at the poles and equator without drifting", () => {
    expect(wgs84NormalGravity(0)).toBeCloseTo(9.7803253359, 9);
    expect(wgs84NormalGravity(90)).toBeCloseTo(9.8321849379, 6);
  });
});
