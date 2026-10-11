// With `?measure` in the link, the page measures itself, so the owner can read
// the numbers off his own phone: the bytes downloaded before he could drive,
// and the frame rate over 60 seconds of driving. Bytes come from the browser's
// Resource Timing entries (transferSize, decodedBodySize, responseEnd; MDN,
// research/36 section 6). When the browser gives no size for a file (cached,
// or hidden, as Safari often does), the size is read from the server instead
// and the report says how (research/39). Design:
// docs/designs/src/measure/measure.md.

export interface TimingEntry {
  name: string;
  transferSize: number;
  decodedBodySize: number;
  responseEnd: number;
}

export interface BytesBeforeDriving {
  bytesTransferred: number;
  bytesDecoded: number;
  fileCount: number;
  cachedFileCount: number;
  // Files the browser gave transfer size 0 for: cached, or sizes hidden.
  unsizedUrls: string[];
}

// How the server's size for one file was found: by asking its size (HEAD),
// by downloading it again and counting the bytes, or not at all.
export type SizeMethod = "asked" | "counted" | "unknown";

export interface ServerSize {
  method: SizeMethod;
  bytes: number;
}

export interface ServerSizes {
  askedFiles: number;
  askedBytes: number;
  countedFiles: number;
  countedBytes: number;
  unknownFiles: number;
}

export type Fetcher = (url: string, init: RequestInit) => Promise<Response>;

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
// what loads later. A file with transfer size 0 but a body came from the
// cache; a file with both 0 had its sizes hidden (MDN, transferSize: 0 for a
// cache hit, and for a cross-origin file without Timing-Allow-Origin; Safari
// gives 0 more often). Either way the browser gave no size, so its address is
// kept for the server to answer.
export function bytesBeforeDriving(entries: readonly TimingEntry[], drivableAtMs: number): BytesBeforeDriving {
  const before = entries.filter((entry) => entry.responseEnd <= drivableAtMs);
  const unsized = before.filter((entry) => entry.transferSize === 0);
  return {
    bytesTransferred: before.reduce((sum, entry) => sum + entry.transferSize, 0),
    bytesDecoded: before.reduce((sum, entry) => sum + entry.decodedBodySize, 0),
    fileCount: before.length,
    cachedFileCount: unsized.filter((entry) => entry.decodedBodySize > 0).length,
    unsizedUrls: unsized.map((entry) => entry.name),
  };
}

// The size the server says it sends (RFC 9110 section 9.3.2: a HEAD answer
// carries the headers a GET would, Content-Length among them, section 8.6;
// with compression, that is the packed size). "no-store" skips the browser's
// cache (Fetch standard, request cache mode; MDN Request.cache). A server may
// leave Content-Length out, and 0 is taken as left out.
export async function askedSize(url: string, fetcher: Fetcher): Promise<number | undefined> {
  try {
    const answer = await fetcher(url, { method: "HEAD", cache: "no-store" });
    const length = Number(answer.headers.get("Content-Length") ?? Number.NaN);
    return answer.ok && Number.isInteger(length) && length > 0 ? length : undefined;
  } catch {
    return undefined;
  }
}

// Download the file again past the cache and count its bytes (Fetch standard,
// Response.arrayBuffer). The browser unpacks compressed files, so this is the
// unpacked size: more than what was really downloaded.
export async function countedSize(url: string, fetcher: Fetcher): Promise<number | undefined> {
  try {
    const answer = await fetcher(url, { method: "GET", cache: "no-store" });
    return answer.ok ? (await answer.arrayBuffer()).byteLength : undefined;
  } catch {
    return undefined;
  }
}

// Ask first, because it downloads nothing; count only when the server will
// not say.
export async function serverSizeOf(url: string, fetcher: Fetcher): Promise<ServerSize> {
  const asked = await askedSize(url, fetcher);
  if (asked !== undefined) return { method: "asked", bytes: asked };
  const counted = await countedSize(url, fetcher);
  return counted === undefined ? { method: "unknown", bytes: 0 } : { method: "counted", bytes: counted };
}

// A few at a time (RFC 9112 section 9.4 asks a client to limit its open
// connections to one server; six is Chromium's per-server limit,
// net/socket/client_socket_pool_manager.cc, BSD), so a city of a thousand squares does not send a thousand requests at
// once.
const AT_ONCE = 6;

export async function serverSizes(urls: readonly string[], fetcher: Fetcher): Promise<ServerSizes> {
  const found: ServerSize[] = [];
  for (let from = 0; from < urls.length; from += AT_ONCE) {
    found.push(...(await Promise.all(urls.slice(from, from + AT_ONCE).map((url) => serverSizeOf(url, fetcher)))));
  }
  const asked = foundBy(found, "asked");
  const counted = foundBy(found, "counted");
  return {
    askedFiles: asked.files,
    askedBytes: asked.bytes,
    countedFiles: counted.files,
    countedBytes: counted.bytes,
    unknownFiles: foundBy(found, "unknown").files,
  };
}

// How many files' sizes were found one way, and their bytes together.
export function foundBy(found: readonly ServerSize[], method: SizeMethod): { files: number; bytes: number } {
  const these = found.filter((size) => size.method === method);
  return { files: these.length, bytes: these.reduce((sum, size) => sum + size.bytes, 0) };
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

// Megabytes to one decimal, as the 30 MB target is written (1 MB = 1,000,000 bytes).
function megabytes(bytes: number): string {
  return `${(bytes / BYTES_IN_MB).toFixed(1)} MB`;
}

// The download line. When the browser gave every size, its figures; when it
// did not, never a confident total from the sizes it gave: either "asking the
// server", or a total that says which part came from where.
export function downloadLines(bytes: BytesBeforeDriving, server: ServerSizes | undefined): string[] {
  const unsized = bytes.unsizedUrls.length;
  const sized = bytes.fileCount - unsized;
  if (unsized === 0) {
    return [`Downloaded before driving: ${megabytes(bytes.bytesTransferred)} (${megabytes(bytes.bytesDecoded)} unpacked), in ${bytes.fileCount} files.`];
  }
  const fromBrowser = `The browser gave sizes for ${sized} of the ${bytes.fileCount} files (${megabytes(bytes.bytesTransferred)})`;
  if (server === undefined) return [`${fromBrowser}; asking the server for the other ${unsized}...`];
  const total = bytes.bytesTransferred + server.askedBytes + server.countedBytes;
  return [
    `Downloaded before driving: about ${megabytes(total)}, in ${bytes.fileCount} files.`,
    `${fromBrowser}; the server gave the rest.`,
    ...serverLines(server),
  ];
}

// One line per way a size was found, and only the ways that were used.
function serverLines(server: ServerSizes): string[] {
  const lines: string[] = [];
  if (server.askedFiles > 0) lines.push(`${server.askedFiles} files: size asked from the server (HEAD), ${megabytes(server.askedBytes)}.`);
  if (server.countedFiles > 0) {
    lines.push(`${server.countedFiles} files: downloaded again and counted, ${megabytes(server.countedBytes)} unpacked, so the real download was likely smaller.`);
  }
  if (server.unknownFiles > 0) lines.push(`${server.unknownFiles} files: no size could be found; the total leaves them out.`);
  return lines;
}

// The numbers on screen, in words, with the warnings that make them honest.
export function measureReportLines(bytes: BytesBeforeDriving, server: ServerSizes | undefined, frames: FrameRateSummary | undefined): string[] {
  const lines = downloadLines(bytes, server);
  if (bytes.cachedFileCount > 0) {
    lines.push(`${bytes.cachedFileCount} files came from the browser's cache; clear the cache and reload for a first-visit figure.`);
  }
  if (frames === undefined) return [...lines, "Frame rate: still measuring; keep driving for 60 seconds."];
  return [
    ...lines,
    `Frame rate: ${frames.medianFps.toFixed(1)} a second usually, ${frames.slowest5PercentFps.toFixed(1)} in the slowest 5 %; ${frames.framesBelow30} frames below 30 a second, over ${frames.secondsMeasured.toFixed(0)} seconds.`,
  ];
}
