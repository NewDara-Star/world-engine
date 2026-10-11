// Measuring on the phone itself: bytes downloaded before driving, and the
// frame rate over 60 seconds of driving. Design: src/measure/measure.md
// (Resource Timing's transferSize, decodedBodySize and responseEnd).
import { describe, expect, it } from "vitest";
import {
  type Fetcher,
  bytesBeforeDriving,
  frameRateSummary,
  measureReportLines,
  percentileOf,
  serverSizeOf,
  serverSizes,
} from "../../src/measure/measure.js";

function entry(transferSize: number, decodedBodySize: number, responseEnd: number, name = "/file") {
  return { name, transferSize, decodedBodySize, responseEnd };
}

// A pretend server: each address answers HEAD with a Content-Length (or
// none), and GET with a body of so many bytes, or fails.
interface PretendFile {
  length?: string;
  body?: number;
  fails?: boolean;
}

function pretendServer(files: Record<string, PretendFile>, seen: RequestInit[] = []): Fetcher {
  return async (url, init) => {
    seen.push(init);
    const file = files[url];
    if (file === undefined || file.fails === true) throw new TypeError("Failed to fetch");
    const headers: Record<string, string> = file.length === undefined ? {} : { "Content-Length": file.length };
    if (init.method === "HEAD") return new Response(null, { headers });
    return new Response(new Uint8Array(file.body ?? 0));
  };
}

describe("bytes before driving", () => {
  it("adds up the page and every file that finished by the moment the player could drive", () => {
    const page = entry(5_000, 20_000, 100);
    const files = [entry(1_650_000, 4_340_000, 900), entry(300_000, 900_000, 1_200), entry(40_000, 40_000, 5_000)];
    expect(bytesBeforeDriving([page, ...files], 2_000)).toEqual({
      bytesTransferred: 1_955_000,
      bytesDecoded: 5_260_000,
      fileCount: 3,
      cachedFileCount: 0,
      unsizedUrls: [],
    });
  });

  it("counts a file that finished exactly at the drivable moment", () => {
    expect(bytesBeforeDriving([entry(10, 10, 0), entry(5, 5, 2_000)], 2_000).fileCount).toBe(2);
  });

  it("counts files that came from the cache, which would make a repeat visit look smaller", () => {
    const cached = entry(0, 500_000, 300, "/cached.js");
    const bytes = bytesBeforeDriving([entry(5_000, 20_000, 100), cached], 2_000);
    expect(bytes.cachedFileCount).toBe(1);
    expect(bytes.unsizedUrls).toEqual(["/cached.js"]);
  });

  it("keeps the address of every file the browser gave no size for, cached or hidden", () => {
    const bytes = bytesBeforeDriving([entry(0, 0, 100, "/"), entry(0, 0, 200, "/a.js"), entry(0, 9, 300, "/b.bin")], 2_000);
    expect(bytes.unsizedUrls).toEqual(["/", "/a.js", "/b.bin"]);
    expect(bytes.cachedFileCount).toBe(1);
  });
});

describe("sizes from the server, when the browser gave none", () => {
  it("asks the server for the size first, past the browser's cache", async () => {
    const seen: RequestInit[] = [];
    expect(await serverSizeOf("/a.js", pretendServer({ "/a.js": { length: "12345", body: 40_000 } }, seen))).toEqual({ method: "asked", bytes: 12_345 });
    expect(seen).toEqual([{ method: "HEAD", cache: "no-store" }]);
  });

  it("downloads the file again and counts it when the server will not say its size", async () => {
    const seen: RequestInit[] = [];
    expect(await serverSizeOf("/a.js", pretendServer({ "/a.js": { body: 40_000 } }, seen))).toEqual({ method: "counted", bytes: 40_000 });
    expect(seen[1]).toEqual({ method: "GET", cache: "no-store" });
  });

  it("adds the sizes up by how they were found", async () => {
    const server = pretendServer({ "/a": { length: "1000" }, "/b": { length: "2000" }, "/c": { body: 500 }, "/d": { fails: true } });
    expect(await serverSizes(["/a", "/b", "/c", "/d"], server)).toEqual({ askedFiles: 2, askedBytes: 3_000, countedFiles: 1, countedBytes: 500, unknownFiles: 1 });
  });
});

describe("sizes from the server: sad path", () => {
  it("says no size was found when the server cannot be reached", async () => {
    expect(await serverSizeOf("/gone", pretendServer({}))).toEqual({ method: "unknown", bytes: 0 });
  });

  it("does not count an error page as the file", async () => {
    const notFound: Fetcher = async () => new Response("Not found", { status: 404, headers: { "Content-Length": "9" } });
    expect(await serverSizeOf("/gone", notFound)).toEqual({ method: "unknown", bytes: 0 });
  });
});

describe("sizes from the server: idiot-proof path", () => {
  it("does not believe a Content-Length that is not a whole number, or is 0", async () => {
    for (const length of ["lots", "12.5", "-3", "0", ""]) {
      expect(await serverSizeOf("/a", pretendServer({ "/a": { length, body: 700 } }))).toEqual({ method: "counted", bytes: 700 });
    }
  });

  it("asks nothing when every size was given", async () => {
    const seen: RequestInit[] = [];
    expect(await serverSizes([], pretendServer({}, seen))).toEqual({ askedFiles: 0, askedBytes: 0, countedFiles: 0, countedBytes: 0, unknownFiles: 0 });
    expect(seen).toEqual([]);
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
  const bytes = { bytesTransferred: 12_345_678, bytesDecoded: 30_000_000, fileCount: 42, cachedFileCount: 0, unsizedUrls: [] };
  const fromServer = { askedFiles: 45, askedBytes: 11_000_000, countedFiles: 2, countedBytes: 1_300_000, unknownFiles: 0 };
  const summary = { medianFps: 58.7, slowest5PercentFps: 31.2, framesBelow30: 12, secondsMeasured: 60 };

  it("says the download in megabytes to one decimal, with the decoded size and the number of files", () => {
    const lines = measureReportLines(bytes, undefined, summary).join("\n");
    expect(lines).toMatch(/12\.3 MB/);
    expect(lines).toMatch(/30\.0 MB/);
    expect(lines).toContain("42");
  });

  it("warns when files came from the cache, and says to clear it for a first-visit figure", () => {
    const lines = measureReportLines({ ...bytes, cachedFileCount: 3, unsizedUrls: ["/a", "/b", "/c"] }, fromServer, summary).join("\n");
    expect(lines).toContain("3 files came from the browser's cache");
    expect(lines).toContain("clear the cache");
  });

  it("says it is still measuring before the 60 seconds are up", () => {
    expect(measureReportLines(bytes, undefined, undefined).join("\n")).toContain("still measuring");
  });

  it("gives the frame rate numbers when done", () => {
    const lines = measureReportLines(bytes, undefined, summary).join("\n");
    expect(lines).toContain("12");
    expect(lines).toMatch(/58\.7|59/);
  });
});

describe("the report on screen when the browser hid sizes (the owner's Safari test)", () => {
  const summary = { medianFps: 58.7, slowest5PercentFps: 31.2, framesBelow30: 12, secondsMeasured: 60 };
  const hidden = { bytesTransferred: 0, bytesDecoded: 0, fileCount: 47, cachedFileCount: 0, unsizedUrls: Array.from({ length: 47 }, (_, at) => `/f${at}`) };

  it("never says a confident 0.0 MB downloaded when the browser gave no sizes", () => {
    const lines = measureReportLines(hidden, undefined, summary).join("\n");
    expect(lines).not.toContain("Downloaded before driving: 0.0 MB");
    expect(lines).toContain("The browser gave sizes for 0 of the 47 files");
    expect(lines).toContain("asking the server for the other 47");
  });

  it("gives the total with the server's sizes, and says which way each was found", () => {
    const server = { askedFiles: 45, askedBytes: 11_000_000, countedFiles: 2, countedBytes: 1_300_000, unknownFiles: 0 };
    const lines = measureReportLines(hidden, server, summary).join("\n");
    expect(lines).toContain("Downloaded before driving: about 12.3 MB, in 47 files.");
    expect(lines).toContain("45 files: size asked from the server (HEAD), 11.0 MB.");
    expect(lines).toContain("2 files: downloaded again and counted, 1.3 MB unpacked");
    expect(lines).not.toContain("no size could be found");
  });

  it("says how many files it found no size for, and that the total leaves them out", () => {
    const server = { askedFiles: 40, askedBytes: 10_000_000, countedFiles: 0, countedBytes: 0, unknownFiles: 7 };
    const lines = measureReportLines(hidden, server, summary).join("\n");
    expect(lines).toContain("7 files: no size could be found; the total leaves them out.");
    expect(lines).not.toContain("downloaded again");
  });

  it("adds the sizes the browser did give to the server's", () => {
    const some = { ...hidden, bytesTransferred: 2_000_000, unsizedUrls: hidden.unsizedUrls.slice(0, 40) };
    const server = { askedFiles: 40, askedBytes: 10_000_000, countedFiles: 0, countedBytes: 0, unknownFiles: 0 };
    const lines = measureReportLines(some, server, summary).join("\n");
    expect(lines).toContain("about 12.0 MB");
    expect(lines).toContain("The browser gave sizes for 7 of the 47 files (2.0 MB)");
  });
});

describe("measuring: tragedy path", () => {
  it("asks a very large city's thousands of sizes a few at a time, not all at once", async () => {
    let open = 0;
    let most = 0;
    const slow: Fetcher = async () => {
      open += 1;
      most = Math.max(most, open);
      await Promise.resolve();
      open -= 1;
      return new Response(null, { headers: { "Content-Length": "10" } });
    };
    const urls = Array.from({ length: 3_000 }, (_, at) => `/chunk/${at}`);
    expect((await serverSizes(urls, slow)).askedBytes).toBe(30_000);
    expect(most).toBeLessThanOrEqual(6);
  });

  it("summarises an hour of frames without slowing down", () => {
    const lengths = Array.from({ length: 216_000 }, (_, at) => (at % 100 === 0 ? 40 : 1000 / 60));
    const started = performance.now();
    expect(frameRateSummary(lengths)?.framesBelow30).toBe(2_160);
    expect(performance.now() - started).toBeLessThan(2_000);
  });
});
