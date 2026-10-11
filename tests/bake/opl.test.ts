// Reading the OSM extract, one OPL line per object. Design: tools/bake/opl.md
// (libosmium's OPL format: `w<id> T<tags> N<nodes>`, nodes `n<id>x<lon>y<lat>`,
// escapes `%<hex>%`, and no `%%` rule; approver's F19 and F21).
import { describe, expect, it } from "vitest";
import { readOplRoadWays } from "../../tools/bake/opl.js";

function nameOf(escaped: string): string | undefined {
  const read = readOplRoadWays(`w1 Thighway=residential,name=${escaped} Nn1x3.36y6.63,n2x3.361y6.63\n`);
  return read.ways[0]?.tags["name"];
}

function idsOf(ways: readonly { id: number }[]): number[] {
  return ways.map((way) => way.id);
}

function problemsFor(escaped: string): string[] {
  return readOplRoadWays(`w1 Thighway=residential,name=${escaped} Nn1x3.36y6.63,n2x3.361y6.63\n`).problems;
}

describe("OPL: happy path", () => {
  it("reads a way's id, tags and node positions in order", () => {
    const read = readOplRoadWays("w123 Thighway=residential,oneway=yes Nn1x3.3601y6.6302,n2x3.3605y6.6304\n");
    expect(read.problems).toEqual([]);
    expect(read.notes).toEqual([]);
    expect(read.ways).toEqual([
      {
        id: 123,
        tags: { highway: "residential", oneway: "yes" },
        nodes: [
          { id: 1, lat: 6.6302, lon: 3.3601 },
          { id: 2, lat: 6.6304, lon: 3.3605 },
        ],
      },
    ]);
  });

  it("keeps the ways in the order of the file", () => {
    const read = readOplRoadWays("w9 Thighway=road Nn1x1y1,n2x1y2\nw3 Thighway=road Nn3x1y1,n4x1y2\nw5 Thighway=road Nn5x1y1,n6x1y2\n");
    expect(idsOf(read.ways)).toEqual([9, 3, 5]);
  });

  it("skips nodes, relations and blank lines", () => {
    const read = readOplRoadWays("n1 T x3.36 y6.63\n\nr1 Ttype=route Mw2@\nw2 Thighway=road Nn1x3.36y6.63,n2x3.361y6.63\n\n");
    expect(read.problems).toEqual([]);
    expect(idsOf(read.ways)).toEqual([2]);
  });

  it("reads negative longitudes and latitudes, as west of Greenwich and south of the equator", () => {
    const read = readOplRoadWays("w1 Thighway=road Nn1x-6.296y53.396,n2x-43.2y-22.9\n");
    expect(read.ways[0]?.nodes).toEqual([
      { id: 1, lat: 53.396, lon: -6.296 },
      { id: 2, lat: -22.9, lon: -43.2 },
    ]);
  });
});

describe("OPL: escapes in text", () => {
  it("reads %20% as a space and %2c% as a comma", () => {
    expect(nameOf("Babatunde%20%Ladega%2c%%20%Omole")).toBe("Babatunde Ladega, Omole");
  });

  it("reads two escapes side by side, %2c%%20%, as a comma then a space, never as a %% rule", () => {
    expect(nameOf("a%2c%%20%b")).toBe("a, b");
  });

  it("reads %25% as a percent sign", () => {
    expect(nameOf("100%25%")).toBe("100%");
  });

  it("reads hex digits in either case, and up to six of them", () => {
    expect(nameOf("a%2C%b")).toBe("a,b");
    expect(nameOf("%1f600%")).toBe("😀");
    expect(nameOf("%e9%")).toBe("é");
  });

  it("refuses a broken escape, naming the line, instead of guessing", () => {
    for (const broken of ["a%%b", "a%zz%b", "a%2c", "a%1234567%b", "%"]) {
      const problems = problemsFor(broken);
      expect(problems, broken).toHaveLength(1);
      expect(problems[0], broken).toMatch(/line 1\b/);
    }
  });
});

describe("OPL: sad path", () => {
  it("refuses a way line with no id, naming the line", () => {
    const read = readOplRoadWays("w1 Thighway=road Nn1x1y1,n2x1y2\nwx Thighway=road Nn1x1y1,n2x1y2\n");
    expect(read.problems).toHaveLength(1);
    expect(read.problems[0]).toMatch(/line 2\b/);
  });

  it("refuses nodes without positions, and says to make the extract with osmium add-locations-to-ways", () => {
    for (const nodes of ["Nn1xy,n2xy", "Nn1,n2", "Nn1x3.36y6.63,n2y6.63", "Nn1x3.36y6.63,n2xabcy6.63"]) {
      const read = readOplRoadWays(`w7 Thighway=road ${nodes}\n`);
      expect(read.problems, nodes).toHaveLength(1);
      expect(read.problems[0], nodes).toContain("7");
      expect(read.problems[0], nodes).toContain("osmium add-locations-to-ways");
    }
  });

  it("reports every broken line in one pass, not just the first", () => {
    const read = readOplRoadWays("wx Thighway=road Nn1x1y1,n2x1y2\nw2 Thighway=road Nn1x1y1,n2x1y2\nw3 Tname=a%zz% Nn1x1y1,n2x1y2\n");
    expect(read.problems).toHaveLength(2);
    expect(read.problems[0]).toMatch(/line 1\b/);
    expect(read.problems[1]).toMatch(/line 3\b/);
    expect(idsOf(read.ways)).toEqual([2]);
  });
});

describe("OPL: idiot-proof path", () => {
  it("skips a way with fewer than two nodes with a note, instead of stopping the map", () => {
    for (const nodes of ["Nn1x3.36y6.63", "N", ""]) {
      const read = readOplRoadWays(`w17 Thighway=residential ${nodes}\n`.replace(" \n", "\n"));
      expect(read.problems, nodes).toEqual([]);
      expect(read.ways, nodes).toEqual([]);
      expect(read.notes, nodes).toEqual([expect.stringContaining("17")]);
      expect(read.notes[0], nodes).toContain("fewer than two nodes");
    }
  });

  it("counts lines the same for Windows line ends", () => {
    const text = "n1 T x1 y1\r\nwx Thighway=road Nn1x1y1,n2x1y2\r\nw2 Thighway=road Nn1x1y1,n2x1y2\r\n";
    const read = readOplRoadWays(text);
    expect(read.problems).toHaveLength(1);
    expect(read.problems[0]).toMatch(/line 2\b/);
    expect(read.ways[0]?.nodes[1]).toEqual({ id: 2, lat: 2, lon: 1 });
  });

  it("splits a tag at its first equals sign only", () => {
    const read = readOplRoadWays("w1 Thighway=road,note=a=b Nn1x1y1,n2x1y2\n");
    expect(read.ways[0]?.tags["note"]).toBe("a=b");
  });
});

describe("OPL: tragedy path (a whole country's worth of lines)", () => {
  // D-0035: how time grows with size, plus a generous cap.
  it("reads 200,000 way lines in time that grows evenly with the file", () => {
    const linesOf = (count: number) =>
      Array.from({ length: count }, (_, at) => `w${at + 1} Thighway=residential,name=Street%20%${at} Nn${2 * at}x3.36y6.63,n${2 * at + 1}x3.361y6.631`).join("\n");
    const small = linesOf(20_000);
    const large = linesOf(200_000);
    const timeToRead = (text: string, count: number) => {
      const started = performance.now();
      expect(readOplRoadWays(text).ways).toHaveLength(count);
      return performance.now() - started;
    };
    timeToRead(small, 20_000);
    const smallTime = timeToRead(small, 20_000);
    const largeTime = timeToRead(large, 200_000);
    expect(largeTime).toBeLessThan(Math.max(20 * smallTime, 300));
    expect(largeTime).toBeLessThan(20_000);
  }, 60_000);
});
