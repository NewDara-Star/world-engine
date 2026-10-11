// Measuring on the phone itself: bytes downloaded before driving, and the
// frame rate over 60 seconds of driving. Design: src/measure/measure.md
// (Resource Timing's transferSize, decodedBodySize and responseEnd).
import { describe, expect, it } from "vitest";
import { bytesBeforeDriving, frameRateSummary, measureReportLines, percentileOf } from "../../src/measure/measure.js";

function entry(transferSize: number, decodedBodySize: number, responseEnd: number) {
  return { transferSize, decodedBodySize, responseEnd };
}

describe("bytes before driving", () => {
  it("adds up the page and every file that finished by the moment the player could drive", () => {
    const page = entry(5_000, 20_000, 100);
    const files = [entry(1_650_000, 4_340_000, 900), entry(300_000, 900_000, 1_200), entry(40_000, 40_000, 5_000)];
    expect(bytesBeforeDriving(page, files, 2_000)).toEqual({ bytesTransferred: 1_955_000, bytesDecoded: 5_260_000, fileCount: 3, cachedFileCount: 0 });
  });

  it("counts a file that finished exactly at the drivable moment", () => {
    expect(bytesBeforeDriving(entry(10, 10, 0), [entry(5, 5, 2_000)], 2_000).fileCount).toBe(2);
  });

  it("counts files that came from the cache, which would make a repeat visit look smaller", () => {
    const cached = entry(0, 500_000, 300);
    expect(bytesBeforeDriving(entry(5_000, 20_000, 100), [cached], 2_000).cachedFileCount).toBe(1);
  });
});

describe("frame rate", () => {
  it("picks the value at the nearest rank", () => {
    expect(percentileOf([10, 20, 30, 40], 0.5)).toBe(20);
    expect(percentileOf([10, 20, 30, 40], 0.95)).toBe(40);
    expect(percentileOf([10, 20, 30, 40], 0)).toBe(10);
    expect(percentileOf([], 0.5) ?? undefined).toBeUndefined();
  });

  it("gives the usual frame rate, the slowest 5 %, and how many frames fell below 30 a second", () => {
    const lengths = [...Array.from({ length: 95 }, () => 1000 / 60), ...Array.from({ length: 5 }, () => 50)];
    const summary = frameRateSummary(lengths);
    expect(summary?.medianFps).toBeCloseTo(60, 6);
    expect(summary?.slowest5PercentFps).toBeCloseTo(60, 6);
    expect(summary?.framesBelow30).toBe(5);
    expect(summary?.secondsMeasured).toBeCloseTo((95 * 1000) / 60 / 1000 + 0.25, 6);
  });

  it("shows the stutters in the slowest 5 % when more than one frame in twenty is slow", () => {
    const lengths = [...Array.from({ length: 90 }, () => 1000 / 60), ...Array.from({ length: 10 }, () => 50)];
    expect(frameRateSummary(lengths)?.slowest5PercentFps).toBeCloseTo(20, 6);
  });

  it("says nothing was measured when there are no frames", () => {
    expect(frameRateSummary([]) ?? undefined).toBeUndefined();
  });
});

describe("the report on screen", () => {
  const bytes = { bytesTransferred: 12_345_678, bytesDecoded: 30_000_000, fileCount: 42, cachedFileCount: 0 };
  const summary = { medianFps: 58.7, slowest5PercentFps: 31.2, framesBelow30: 12, secondsMeasured: 60 };

  it("says the download in megabytes to one decimal, with the decoded size and the number of files", () => {
    const lines = measureReportLines(bytes, summary).join("\n");
    expect(lines).toMatch(/12\.3 MB/);
    expect(lines).toMatch(/30\.0 MB/);
    expect(lines).toContain("42");
  });

  it("warns when files came from the cache, and says to clear it for a first-visit figure", () => {
    const lines = measureReportLines({ ...bytes, cachedFileCount: 3 }, summary).join("\n");
    expect(lines).toContain("3 files came from the cache");
    expect(lines).toContain("clear the cache");
  });

  it("says it is still measuring before the 60 seconds are up", () => {
    expect(measureReportLines(bytes, undefined).join("\n")).toContain("still measuring");
  });

  it("gives the frame rate numbers when done", () => {
    const lines = measureReportLines(bytes, summary).join("\n");
    expect(lines).toContain("12");
    expect(lines).toMatch(/58\.7|59/);
  });
});

describe("measuring: tragedy path", () => {
  it("summarises an hour of frames without slowing down", () => {
    const lengths = Array.from({ length: 216_000 }, (_, at) => (at % 100 === 0 ? 40 : 1000 / 60));
    const started = performance.now();
    expect(frameRateSummary(lengths)?.framesBelow30).toBe(2_160);
    expect(performance.now() - started).toBeLessThan(2_000);
  });
});
