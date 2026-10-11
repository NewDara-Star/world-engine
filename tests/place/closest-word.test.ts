import { describe, expect, it } from "vitest";
import { closeEnoughLimit, closestWord, editDistance } from "../../src/place/closest-word.js";

describe("closest word: happy path", () => {
  it("counts a swap of two neighbouring letters as one slip", () => {
    expect(editDistance("nmae", "name")).toBe(1);
    expect(editDistance("rihgt", "right")).toBe(1);
  });

  it("counts inserts, deletes and replacements one each", () => {
    expect(editDistance("gravty", "gravity")).toBe(1);
    expect(editDistance("lefft", "left")).toBe(1);
    expect(editDistance("lift", "left")).toBe(1);
    expect(editDistance("kitten", "sitting")).toBe(3);
  });

  it("finds the word that was meant", () => {
    expect(closestWord("nmae", ["id", "name", "planet"])).toBe("name");
    expect(closestWord("rihgt", ["left", "right"])).toBe("right");
  });
});

describe("closest word: sad path", () => {
  it("offers nothing when no word is close", () => {
    expect(closestWord("title", ["name", "planet"])).toBeUndefined();
    expect(closestWord("anything", [])).toBeUndefined();
  });
});

describe("closest word: idiot-proof path", () => {
  it("never corrects a word of one or two letters, so id is never guessed", () => {
    expect(closeEnoughLimit("id")).toBe(0);
    expect(closestWord("ix", ["id"])).toBeUndefined();
  });

  it("allows one slip for words of 3 to 5 letters and two for 6 or more", () => {
    expect([3, 5, 6, 30].map((length) => closeEnoughLimit("a".repeat(length)))).toEqual([1, 1, 2, 2]);
  });

  it("offers nothing when two words are equally close, so the hint never sends someone the wrong way", () => {
    expect(closestWord("cat", ["car", "bat"])).toBeUndefined();
  });

  it("measures empty words without trouble", () => {
    expect(editDistance("", "abc")).toBe(3);
    expect(editDistance("abc", "")).toBe(3);
    expect(editDistance("", "")).toBe(0);
  });
});

describe("closest word: tragedy path", () => {
  it("skips a whole pasted paragraph quickly instead of measuring it", () => {
    const started = performance.now();
    expect(closestWord("x".repeat(5_000_000), ["left", "right"])).toBeUndefined();
    expect(performance.now() - started).toBeLessThan(100);
  });
});
