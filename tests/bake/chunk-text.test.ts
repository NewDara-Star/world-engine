// One chunk file's text: whole centimetres from the square's south-west
// corner, shared corners written once, flat or flipped triangles left out.
// Design: tools/bake/chunk-text.md (approver's F23); format: src/world/chunk.md.
import { describe, expect, it } from "vitest";
import { chunkFileText } from "../../tools/bake/chunk-text.js";

function at(eastM: number, northM: number) {
  return { eastM, northM };
}

function parsed(text: string): { format: number; cell: { east: number; north: number }; corners: number[]; triangles: number[] } {
  return JSON.parse(text) as { format: number; cell: { east: number; north: number }; corners: number[]; triangles: number[] };
}

describe("chunk file text: happy path", () => {
  it("writes format 1, the square, corners in whole centimetres from its south-west corner, and three corner numbers per triangle", () => {
    const text = chunkFileText({ east: 0, north: 0 }, [[at(0, 0), at(10, 0), at(0, 10)]]);
    expect(parsed(text)).toEqual({ format: 1, cell: { east: 0, north: 0 }, corners: [0, 0, 1000, 0, 0, 1000], triangles: [0, 1, 2] });
  });

  it("writes the fields in one fixed order and ends with exactly one newline", () => {
    const text = chunkFileText({ east: 0, north: 0 }, [[at(0, 0), at(10, 0), at(0, 10)]]);
    expect(Object.keys(parsed(text))).toEqual(["format", "cell", "corners", "triangles"]);
    expect(text.endsWith("}\n")).toBe(true);
  });

  it("writes a corner shared by two triangles once", () => {
    const text = chunkFileText({ east: 0, north: 0 }, [
      [at(0, 0), at(10, 0), at(10, 10)],
      [at(0, 0), at(10, 10), at(0, 10)],
    ]);
    expect(parsed(text).corners).toEqual([0, 0, 1000, 0, 1000, 1000, 0, 1000]);
    expect(parsed(text).triangles).toEqual([0, 1, 2, 0, 2, 3]);
  });

  it("measures from the square's own corner, also west and south of the centre", () => {
    const text = chunkFileText({ east: -1, north: -2 }, [[at(-50, -150), at(-40, -150), at(-50, -140)]]);
    expect(parsed(text)).toMatchObject({ cell: { east: -1, north: -2 }, corners: [5000, 5000, 6000, 5000, 5000, 6000] });
  });

  it("gives the same text for the same triangles every time", () => {
    const triangles = [[at(1.234, 5.678), at(20.5, 5.678), at(1.234, 30.001)]];
    expect(chunkFileText({ east: 0, north: 0 }, triangles)).toBe(chunkFileText({ east: 0, north: 0 }, triangles));
  });
});

describe("chunk file text: idiot-proof path (rounding never breaks the promise of anticlockwise triangles)", () => {
  it("rounds to the nearest centimetre", () => {
    const text = chunkFileText({ east: 0, north: 0 }, [[at(0.004, 0.006), at(10.004, 0.006), at(0.004, 10.006)]]);
    expect(parsed(text).corners).toEqual([0, 1, 1000, 1, 0, 1001]);
  });

  it("leaves out a triangle that rounding makes flat", () => {
    const text = chunkFileText({ east: 0, north: 0 }, [
      [at(0, 0), at(10, 0), at(0, 10)],
      [at(0, 0), at(1, 0.002), at(2, 0.004)],
    ]);
    expect(parsed(text).triangles).toEqual([0, 1, 2]);
  });

  it("leaves out a thin triangle that rounding turns over", () => {
    const flipsWhenRounded = [at(0, 0), at(1, 0.0051), at(2, 0.0149)];
    const text = chunkFileText({ east: 0, north: 0 }, [[at(0, 0), at(10, 0), at(0, 10)], flipsWhenRounded]);
    expect(parsed(text).triangles).toEqual([0, 1, 2]);
  });
});

describe("chunk file text: tragedy path (the far corner of a big map)", () => {
  it("keeps centimetres exact in a square 1.4 km from the centre", () => {
    const text = chunkFileText({ east: 14, north: -15 }, [[at(1450.12, -1449.01), at(1460.12, -1449.01), at(1450.12, -1439.01)]]);
    expect(parsed(text).corners).toEqual([5012, 5099, 6012, 5099, 5012, 6099]);
  });
});
