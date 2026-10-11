import { describe, expect, it } from "vitest";
import { lineAtOffset, lineOfPath, lineStartOffsets, readJsonText, syntaxProblemInWords } from "../../src/place/json-text.js";

// Every kind of broken JSON the reader names, plus our own two.
const KINDS = [
  "CommaExpected",
  "ColonExpected",
  "PropertyNameExpected",
  "ValueExpected",
  "InvalidSymbol",
  "InvalidNumberFormat",
  "UnexpectedEndOfNumber",
  "UnexpectedEndOfString",
  "InvalidCharacter",
  "InvalidEscapeCharacter",
  "InvalidUnicode",
  "CloseBraceExpected",
  "CloseBracketExpected",
  "EndOfFileExpected",
  "InvalidCommentToken",
  "UnexpectedEndOfComment",
  "empty",
  "nested too deeply",
];

describe("json text: happy path", () => {
  it("reads a file into values and finds the line of a field", () => {
    const text = '{\n  "a": 1,\n  "b": {\n    "c": [10, 20]\n  }\n}';
    const json = readJsonText(text);
    if (!json.read) throw new Error(json.kind);
    expect(json.values).toEqual({ a: 1, b: { c: [10, 20] } });
    const starts = lineStartOffsets(text);
    expect(lineOfPath(json.tree, starts, ["a"])).toBe(2);
    expect(lineOfPath(json.tree, starts, ["b", "c"])).toBe(4);
    expect(lineOfPath(json.tree, starts, [])).toBe(1);
  });

  it("names the line a place-maker sees, counting from 1", () => {
    const starts = lineStartOffsets("ab\ncd\nef");
    expect([0, 2, 3, 5, 6, 99].map((offset) => lineAtOffset(starts, offset))).toEqual([1, 1, 2, 2, 3, 3]);
  });
});

describe("json text: sad path", () => {
  it("names each reader error kind in a plain sentence about the file, never the reader's code", () => {
    for (const kind of KINDS) {
      const sentence = syntaxProblemInWords(kind);
      expect(sentence, kind).toMatch(/^the file /);
      expect(sentence, kind).not.toMatch(/[a-z][A-Z]/);
    }
  });

  it("gives a plain sentence even for a kind a later reader might add", () => {
    expect(syntaxProblemInWords("SomethingNew")).toBe("the file is not valid JSON here.");
  });

  it("says where a syntax error is and what kind it is", () => {
    expect(readJsonText('{"a": 1 "b": 2}')).toEqual({ read: false, kind: "CommaExpected", offset: 8 });
  });
});

describe("json text: idiot-proof path", () => {
  it("keeps a field called __proto__ as an ordinary field", () => {
    const json = readJsonText('{"__proto__": 1}');
    expect(json.read && Object.hasOwn(json.values as object, "__proto__")).toBe(true);
  });

  it("reads a file that is just null, so the checker can answer it", () => {
    expect(readJsonText("null")).toMatchObject({ read: true, values: null });
  });

  it("counts CR then LF once, and CR or LF alone once each", () => {
    expect(lineStartOffsets("a\r\nb\rc\nd")).toEqual([0, 3, 5, 7]);
    expect(lineStartOffsets("\r\n\r\n")).toEqual([0, 2, 4]);
  });

  it("finds the copy of a field written twice that is used, the last one", () => {
    const text = '{\n"g": 9.8,\n"g": 98\n}';
    const json = readJsonText(text);
    if (!json.read) throw new Error(json.kind);
    expect(json.values).toEqual({ g: 98 });
    expect(lineOfPath(json.tree, lineStartOffsets(text), ["g"])).toBe(3);
  });

  it("points a path that is not in the file at line 1", () => {
    const json = readJsonText('\n\n{"a": [1]}');
    if (!json.read) throw new Error(json.kind);
    expect(lineOfPath(json.tree, lineStartOffsets('\n\n{"a": [1]}'), ["a", 5])).toBe(1);
    expect(lineOfPath(json.tree, lineStartOffsets('\n\n{"a": [1]}'), ["a", "x"])).toBe(1);
  });
});

describe("json text: tragedy path", () => {
  it("says the brackets are nested too deeply instead of crashing, at the start of the file", () => {
    expect(readJsonText("[".repeat(20_000))).toEqual({ read: false, kind: "nested too deeply", offset: 0 });
    expect(readJsonText(`${"[".repeat(3_000)}${"]".repeat(3_000)}`)).toEqual({ read: false, kind: "nested too deeply", offset: 0 });
  });

  it("lists the line starts of a very large file quickly", () => {
    const text = "{}\n".repeat(1_000_000);
    const started = performance.now();
    const starts = lineStartOffsets(text);
    expect(lineAtOffset(starts, text.length - 1)).toBe(1_000_000);
    expect(performance.now() - started).toBeLessThan(500);
  });
});
