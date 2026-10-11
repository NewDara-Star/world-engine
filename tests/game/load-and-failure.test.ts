// Loading the game's files, and saying what went wrong in plain words, never
// a blank page. Designs: src/game/load.md (approver's F14) and
// src/game/failure.md. The browser's fetch is a stand-in serving the tiny
// test place, the real Earth and hatchback files, and the tiny place's map
// baked by the real bake.
import { afterEach, beforeEach, describe, expect, it, vi, assert } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { loadGameData } from "../../src/game/load.js";
import { failureMessage } from "../../src/game/failure.js";
import { bakePlace } from "../../tools/bake/bake.js";
import { knownPlanets } from "../place/planets.js";
import { tinyExtractText, tinyPlaceText, tinyPlaceTextWith } from "../bake/tiny.js";

const repoRoot = resolve(import.meta.dirname, "../..");

type Answer = string | number | "throw" | "hang";

function repoText(path: string): string {
  return readFileSync(resolve(repoRoot, path), "utf8");
}

function tinyIndexText(placeText = tinyPlaceText()): string {
  const baked = bakePlace("tiny.json", placeText, knownPlanets(), tinyExtractText());
  if (!baked.ok) return assert.fail(baked.problems.join("\n"));
  return baked.files.find((file: { name: string }) => file.name === "index.json")?.text ?? "";
}

// The files a good game finds, by path. A number answers with that status.
function goodFiles(): Map<string, Answer> {
  return new Map<string, Answer>([
    ["start.json", '{"place": "tiny", "vehicle": "hatchback"}'],
    ["places/tiny.json", tinyPlaceText()],
    ["planets/earth.json", repoText("planets/earth.json")],
    ["vehicles/hatchback.json", repoText("vehicles/hatchback.json")],
    ["places/tiny/chunks/index.json", tinyIndexText()],
  ]);
}

let files = new Map<string, Answer>();
const asked: string[] = [];

function pathOf(input: unknown): string {
  const url = input instanceof Request ? input.url : String(input);
  return url.replace(/^https?:\/\/[^/]+/, "").replace(/^\.?\//, "").replace(/\?.*$/, "");
}

function hangUntilAborted(signal: AbortSignal | null | undefined): Promise<Response> {
  return new Promise((_, reject) => {
    signal?.addEventListener("abort", () => reject(signal.reason ?? new DOMException("aborted", "AbortError")));
  });
}

function fakeFetch(input: unknown, init?: { signal?: AbortSignal | null }): Promise<Response> {
  const path = pathOf(input);
  asked.push(path);
  const answer = files.get(path) ?? 404;
  if (answer === "throw") return Promise.reject(new TypeError("Failed to fetch"));
  if (answer === "hang") return hangUntilAborted(init?.signal);
  if (typeof answer === "number") return Promise.resolve(new Response("not here", { status: answer }));
  return Promise.resolve(new Response(answer, { status: 200 }));
}

beforeEach(() => {
  files = goodFiles();
  asked.length = 0;
  vi.stubGlobal("fetch", vi.fn(fakeFetch));
  vi.stubGlobal("location", new URL("http://192.168.1.20:5173/"));
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

async function failureText(query = ""): Promise<string> {
  const loaded = await loadGameData(query);
  if (loaded.ok) return assert.fail("the game loaded, but it should have failed");
  return [failureMessage(loaded.failure)].flat().join("\n");
}

function expectPlainWords(text: string): void {
  for (const jargon of ["undefined", "null", "[object Object]", "NaN", "TypeError", "Error:", "at <anonymous>", "{", "}"]) {
    expect(text, `"${jargon}" in: ${text}`).not.toContain(jargon);
  }
}

describe("loading: happy path", () => {
  it("loads the place, its planet, the car and the map index named in start.json", async () => {
    const loaded = await loadGameData("");
    if (!loaded.ok) return assert.fail([failureMessage(loaded.failure)].flat().join("\n"));
    expect(loaded.value.place.id).toBe("tiny");
    expect(loaded.value.planet.id).toBe("earth");
    expect(loaded.value.vehicle.class).toBe("car");
    expect(loaded.value.mapIndex.cellSizeM).toBe(100);
    expect(loaded.value.notes).toEqual([]);
  });

  it("asks for start.json, then the place, its planet, the car and the map index, in that order", async () => {
    await loadGameData("");
    expect(asked).toEqual(["start.json", "places/tiny.json", "planets/earth.json", "vehicles/hatchback.json", "places/tiny/chunks/index.json"]);
  });

  it("opens the place a link asks for", async () => {
    files.set("places/other.json", tinyPlaceTextWith({ id: "other" }));
    files.set("places/other/chunks/index.json", tinyIndexText(tinyPlaceTextWith({ id: "other" })));
    const loaded = await loadGameData("?place=other");
    expect(loaded.ok && loaded.value.place.id).toBe("other");
  });

  it("keeps a note for the player when the link's place is not a proper id, and opens start.json's place", async () => {
    const loaded = await loadGameData("?place=../../secret");
    if (!loaded.ok) return assert.fail("it should have loaded start.json's place");
    expect(loaded.value.place.id).toBe("tiny");
    expect(loaded.value.notes).toHaveLength(1);
  });
});

describe("loading: sad path, in plain words (the player is never left with a blank screen)", () => {
  it("says the game could not reach its files when there is no connection", async () => {
    files.set("start.json", "throw");
    const text = await failureText();
    expect(text).toContain("The game could not reach its files. Check the Wi-Fi or mobile data, then reload the page.");
    expectPlainWords(text);
  });

  it("says which file is missing, and to check a link typed by hand", async () => {
    const text = await failureText("?vehicle=hatchbak");
    expect(text).toContain("A file the game needs is missing");
    expect(text).toContain("vehicles/hatchbak.json");
    expect(text).toContain("check the spelling");
    expectPlainWords(text);
  });

  it("says the map has not been made yet, and how to make it, when the place was never baked", async () => {
    files.delete("places/tiny/chunks/index.json");
    const text = await failureText();
    expect(text).toContain("has not been made yet");
    expect(text).toContain("README");
    expectPlainWords(text);
  });

  it("says the map does not match the place, and to bake again, when the place's centre moved after baking", async () => {
    files.set("places/tiny.json", tinyPlaceTextWith({ centre: { lat: 6.631, lon: 3.36 } }));
    const text = await failureText();
    expect(text).toContain("The map files do not match the place file");
    expect(text).toContain("bake again");
    expectPlainWords(text);
  });

  it("says the server could not send a file, with its error number, and to reload in a moment", async () => {
    files.set("planets/earth.json", 503);
    const text = await failureText();
    expect(text).toContain("planets/earth.json");
    expect(text).toContain("503");
    expect(text).toContain("Reload in a moment");
  });

  it("says a file has mistakes, then the checker's own lines, so a place-maker can fix them", async () => {
    files.set("places/tiny.json", tinyPlaceTextWith({ drivingSide: "up" }));
    const text = await failureText();
    expect(text).toContain("places/tiny.json has mistakes, so the game cannot start");
    expect(text).toMatch(/tiny\.json line \d+: `drivingSide` must be one of `left`, `right`; found "up"\./);
  });

  it("shows the first ten mistakes and says how many more", async () => {
    const sources = Array.from({ length: 15 }, () => ({ name: "Map", url: "http://x.test", licence: "ODbL-1.0", attribution: "a" }));
    files.set("places/tiny.json", tinyPlaceTextWith({ dataSources: sources }));
    const text = await failureText();
    expect(text.match(/line \d+: `dataSources\[\d+\]\.url`/g)).toHaveLength(10);
    expect(text).toContain("5 more");
  });

  it("says the car is not allowed in this place, with its class and the classes the place allows", async () => {
    files.set("places/tiny.json", tinyPlaceTextWith({ allowedVehicleClasses: ["bus"] }));
    files.set("places/tiny/chunks/index.json", tinyIndexText(tinyPlaceTextWith({ allowedVehicleClasses: ["bus"] })));
    const text = await failureText();
    expect(text).toContain("is a car, and the place allows only bus");
    expectPlainWords(text);
  });

  it("says a place on a planet with no file is on no known planet", async () => {
    files.set("places/tiny.json", tinyPlaceTextWith({ planet: "mars" }));
    const text = await failureText();
    expect(text).toContain("A file the game needs is missing");
    expect(text).toContain("planets/mars.json");
  });
});

describe("loading: tragedy path (weak Lagos mobile data)", () => {
  it("gives up on a download that never ends after 30 seconds, and says the signal may be weak", async () => {
    vi.useFakeTimers();
    files.set("vehicles/hatchback.json", "hang");
    let settled = false;
    const loading = loadGameData("").then((loaded: Awaited<ReturnType<typeof loadGameData>>) => {
      settled = true;
      return loaded;
    });
    await vi.advanceTimersByTimeAsync(29_000);
    expect(settled).toBe(false);
    await vi.advanceTimersByTimeAsync(1_500);
    const loaded = await loading;
    if (loaded.ok) return assert.fail("a download that never ends should fail");
    const text = [failureMessage(loaded.failure)].flat().join("\n");
    expect(text).toContain("The game's files are taking too long. The signal may be weak; reload to try again.");
  });
});
