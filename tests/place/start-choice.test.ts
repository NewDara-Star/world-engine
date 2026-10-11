// start.json: which place and which car the game opens with, and a link that
// asks for others (`?place=` and `?vehicle=`). Design: src/place/start.md.
import { describe, expect, it, assert } from "vitest";
import { startChoiceFromLink, validateStartChoice } from "../../src/place/start.js";

function messagesOf(text: string): string[] {
  const result = validateStartChoice("start.json", text);
  return result.ok ? [] : result.messages;
}

function checked(text = '{"place": "omole", "vehicle": "hatchback"}') {
  const result = validateStartChoice("start.json", text);
  if (result.ok) return result.value;
  return assert.fail(result.messages.join("\n"));
}

describe("start choice: happy path", () => {
  it("reads which place and which vehicle to open with", () => {
    expect(checked()).toEqual({ place: "omole", vehicle: "hatchback" });
  });

  it("opens start.json's place and car when the link asks for nothing", () => {
    expect(startChoiceFromLink(checked(), "")).toEqual({ placeId: "omole", vehicleId: "hatchback", notes: [] });
  });

  it("opens the place and car the link asks for", () => {
    expect(startChoiceFromLink(checked(), "?place=yaba&vehicle=bus-1")).toEqual({ placeId: "yaba", vehicleId: "bus-1", notes: [] });
  });

  it("lets the link change only one of the two", () => {
    expect(startChoiceFromLink(checked(), "?vehicle=van")).toEqual({ placeId: "omole", vehicleId: "van", notes: [] });
    expect(startChoiceFromLink(checked(), "?measure&place=finglas")).toEqual({ placeId: "finglas", vehicleId: "hatchback", notes: [] });
  });
});

describe("start choice: sad path", () => {
  it("says a missing field is missing, with the file and line", () => {
    expect(messagesOf('{"place": "omole"}')).toEqual(["start.json line 1: `vehicle` is missing."]);
  });

  it("refuses a place that is not a short id", () => {
    const messages = messagesOf('{\n  "place": "Omole Phase 1",\n  "vehicle": "hatchback"\n}');
    expect(messages).toEqual([expect.stringMatching(/^start\.json line 2: `place` must be an id/)]);
  });

  it("refuses a file that is not JSON, naming the line", () => {
    expect(messagesOf('{"place": "omole" "vehicle": "hatchback"}')[0]).toMatch(/^start\.json line 1: the file is not valid JSON here/);
  });
});

describe("start choice: idiot-proof path (a link typed by hand)", () => {
  it("ignores a link value that is not a short id, keeps start.json's, and keeps a note to show the player", () => {
    const choice = startChoiceFromLink(checked(), "?place=../secret&vehicle=hatchback");
    expect(choice.placeId).toBe("omole");
    expect(choice.vehicleId).toBe("hatchback");
    expect(choice.notes).toHaveLength(1);
    expect(choice.notes[0]).toContain("place");
  });

  it("ignores an empty link value", () => {
    expect(startChoiceFromLink(checked(), "?place=&vehicle=")).toMatchObject({ placeId: "omole", vehicleId: "hatchback" });
  });

  it("does not let capitals or spaces through", () => {
    for (const query of ["?place=Yaba", "?place=yaba%20lagos", "?place=<script>"]) {
      expect(startChoiceFromLink(checked(), query).placeId, query).toBe("omole");
    }
  });

  it("refuses a misspelt field with a did-you-mean", () => {
    expect(messagesOf('{"place": "omole", "vehicel": "hatchback"}')).toEqual([expect.stringContaining("Did you mean `vehicle`?")]);
  });
});
