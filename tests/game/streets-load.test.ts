// Loading the street names after the game has started, and what the player
// is told when they cannot load (scope 005b). Designs: src/game/load.md
// (loadStreetsForPlace) and src/game/hud.md (streetsFailureNotice). The
// browser's fetch is a stand-in serving the tiny place's baked street file.
import { afterEach, beforeEach, describe, expect, it, vi, assert } from "vitest";
import { loadStreetsForPlace } from "../../src/game/load.js";
import { streetsFailureNotice } from "../../src/game/hud.js";
import { bakePlace } from "../../tools/bake/bake.js";
import { knownPlanets } from "../place/planets.js";
import { checkedPlace, tinyExtractText, tinyPlace, tinyPlaceText, tinyPlaceTextWith } from "../bake/tiny.js";

type Answer = string | number | "throw";
let files = new Map<string, Answer>();

function tinyStreetsText(): string {
  const baked = bakePlace("tiny.json", tinyPlaceText(), knownPlanets(), tinyExtractText());
  if (!baked.ok) return assert.fail(baked.problems.join("\n"));
  return baked.streetsText;
}

function fakeFetch(input: unknown): Promise<Response> {
  const path = String(input).replace(/^\.?\//, "");
  const answer = files.get(path) ?? 404;
  if (answer === "throw") return Promise.reject(new TypeError("Failed to fetch"));
  if (typeof answer === "number") return Promise.resolve(new Response("not here", { status: answer }));
  return Promise.resolve(new Response(answer, { status: 200 }));
}

beforeEach(() => {
  files = new Map<string, Answer>([["places/tiny/streets.json", tinyStreetsText()]]);
  vi.stubGlobal("fetch", vi.fn(fakeFetch));
});

afterEach(() => vi.unstubAllGlobals());

async function noticeFor(place = tinyPlace()): Promise<string> {
  const loaded = await loadStreetsForPlace(place);
  if (loaded.ok) return assert.fail("the streets loaded, but they should have failed");
  return streetsFailureNotice(loaded.failure);
}

describe("loading street names: happy path", () => {
  it("loads places/<id>/streets.json for the place", async () => {
    const loaded = await loadStreetsForPlace(tinyPlace());
    expect(loaded.ok && loaded.value.streets.some((street) => street.name === "Test Street, One")).toBe(true);
  });
});

describe("loading street names: sad path", () => {
  it("tells the player an old map needs baking again when the file is missing", async () => {
    files.clear();
    expect(await noticeFor()).toBe("No street names or small map: this map was made before they existed. Bake it again to get them.");
  });

  it("says to check the connection when there is none", async () => {
    files.set("places/tiny/streets.json", "throw");
    expect(await noticeFor()).toContain("Check the Wi-Fi or mobile data");
  });

  it("asks for a new bake when the file was made for another centre", async () => {
    const moved = checkedPlace("tiny.json", tinyPlaceTextWith({ centre: { lat: 6.631, lon: 3.36 } }));
    expect(await noticeFor(moved)).toContain("bake again");
  });
});

describe("loading street names: idiot-proof path", () => {
  it("names the file when it has mistakes, in plain words", async () => {
    files.set("places/tiny/streets.json", '{"format":1}');
    const notice = await noticeFor();
    expect(notice).toContain("places/tiny/streets.json");
    expect(notice).not.toContain("undefined");
  });
});

describe("loading street names: tragedy path", () => {
  it("says the file may be cut short when a download stops half-way", async () => {
    files.set("places/tiny/streets.json", tinyStreetsText().slice(0, 200));
    expect(await noticeFor()).toContain("places/tiny/streets.json");
  });
});
