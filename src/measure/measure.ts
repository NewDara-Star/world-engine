// With `?measure` in the link, the page measures itself, so the owner can read
// the numbers off his own phone: the bytes downloaded before he could drive,
// and the frame rate over 60 seconds of driving. Bytes come from the browser's
// Resource Timing entries (transferSize, decodedBodySize, responseEnd; MDN,
// research/36 section 6). Design: docs/designs/src/measure/measure.md.

export interface TimingEntry {
  transferSize: number;
  decodedBodySize: number;
  responseEnd: number;
}

export interface BytesBeforeDriving {
  bytesTransferred: number;
  bytesDecoded: number;
  fileCount: number;
  cachedFileCount: number;
}

export interface FrameRateSummary {
  medianFps: number;
  slowest5PercentFps: number;
  framesBelow30: number;
  secondsMeasured: number;
}

// Collects frame lengths for 60 seconds of driving after the drivable moment.
export interface FrameRecorder {
  drivableAtMs: number | undefined;
  lengthsMs: number[];
  collectedS: number;
  finished: boolean;
}

const MEASURE_FOR_S = 60;
const SLOW_FRAME_MS = 1000 / 30;
const BYTES_IN_MB = 1_000_000;

// The 30 MB target is about what the player waits for before driving, not
// what loads later. A file with transfer size 0 but a body came from the cache.
export function bytesBeforeDriving(page: TimingEntry, files: readonly TimingEntry[], drivableAtMs: number): BytesBeforeDriving {
  const before = [page, ...files].filter((entry) => entry.responseEnd <= drivableAtMs);
  return {
    bytesTransferred: before.reduce((sum, entry) => sum + entry.transferSize, 0),
    bytesDecoded: before.reduce((sum, entry) => sum + entry.decodedBodySize, 0),
    fileCount: before.length,
    cachedFileCount: before.filter((entry) => entry.transferSize === 0).filter((entry) => entry.decodedBodySize > 0).length,
  };
}

// The nearest-rank percentile: the fraction times the count, rounded up,
// counting from 1, at least the first.
export function percentileOf(sorted: readonly number[], fraction: number): number | undefined {
  if (sorted.length === 0) return undefined;
  return sorted[Math.max(1, Math.ceil(fraction * sorted.length)) - 1];
}

// The usual frame rate, the frame rate in the worst moments, and how many
// frames fell below 30 a second.
export function frameRateSummary(lengthsMs: readonly number[]): FrameRateSummary | undefined {
  if (lengthsMs.length === 0) return undefined;
  const sorted = lengthsMs.toSorted((a, b) => a - b);
  return {
    medianFps: 1000 / (percentileOf(sorted, 0.5) ?? Number.NaN),
    slowest5PercentFps: 1000 / (percentileOf(sorted, 0.95) ?? Number.NaN),
    framesBelow30: lengthsMs.filter((length) => length > SLOW_FRAME_MS).length,
    secondsMeasured: lengthsMs.reduce((sum, length) => sum + length, 0) / 1000,
  };
}

// Exactly 60 seconds of driving after the drivable moment, then it stops, so
// the report is the same length every time.
export function recordFrame(recorder: FrameRecorder, lengthMs: number): void {
  if (recorder.drivableAtMs === undefined || recorder.finished) return;
  recorder.lengthsMs.push(lengthMs);
  recorder.collectedS += lengthMs / 1000;
  if (recorder.collectedS >= MEASURE_FOR_S) recorder.finished = true;
}

// The numbers on screen, in words, with the warnings that make them honest.
export function measureReportLines(bytes: BytesBeforeDriving, frames: FrameRateSummary | undefined): string[] {
  const lines = [
    `Downloaded before driving: ${(bytes.bytesTransferred / BYTES_IN_MB).toFixed(1)} MB (${(bytes.bytesDecoded / BYTES_IN_MB).toFixed(1)} MB unpacked), in ${bytes.fileCount} files.`,
  ];
  if (bytes.cachedFileCount > 0) {
    lines.push(`${bytes.cachedFileCount} files came from the cache; clear the cache and reload for a first-visit figure.`);
  }
  if (frames === undefined) return [...lines, "Frame rate: still measuring; keep driving for 60 seconds."];
  return [
    ...lines,
    `Frame rate: ${frames.medianFps.toFixed(1)} a second usually, ${frames.slowest5PercentFps.toFixed(1)} in the slowest 5 %; ${frames.framesBelow30} frames below 30 a second, over ${frames.secondsMeasured.toFixed(0)} seconds.`,
  ];
}
