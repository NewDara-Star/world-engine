// Reads the OpenStreetMap extract: an OPL file (one OSM object per line),
// written by `osmium add-locations-to-ways` with `add_metadata=false` and
// `locations_on_ways=true`, so every way line carries its own node positions.
// A way line: `w123 Thighway=residential,name=Ladega%20%Street Nn1x3.3601y6.6302,n2x3.3605y6.6304`.
// Format facts from libosmium's OPL reader
// (include/osmium/io/detail/opl_parser_functions.hpp, BSL-1.0, technique
// only; research/36 section 2). Design: docs/designs/tools/bake/opl.md.

export interface WayNode {
  id: number;
  lat: number;
  lon: number;
}

export interface OsmWay {
  id: number;
  tags: Record<string, string>;
  nodes: WayNode[];
}

// A node as read, before we know every node has a position.
interface ReadNode {
  id: number;
  lat?: number;
  lon?: number;
}

export type WayLine = { kind: "way"; way: OsmWay } | { kind: "skipped"; note: string } | { kind: "problem"; problem: string };

const WAY_ID = /^w(-?\d+)$/;
const NODE_WITH_POSITION = /^n(-?\d+)x(-?\d+(?:\.\d+)?)y(-?\d+(?:\.\d+)?)$/;
const NODE_ID = /^n(-?\d+)/;
// An escape: `%`, 1 to 6 hex digits in either case, `%` (libosmium
// opl_parse_escaped). Sticky, so it is tried exactly where a % is.
const ESCAPE = /%([0-9a-fA-F]{1,6})%/y;
// The largest Unicode code point (The Unicode Standard, section 3.4).
const LARGEST_CODE_POINT = 0x10ffff;

// Ways in the order of the file; nodes and relations are skipped, because
// ways carry their own positions. Every broken line is reported with its
// number, so a missing road is never mistaken for a real gap.
export function readOplRoadWays(text: string): { ways: OsmWay[]; problems: string[]; notes: string[] } {
  const ways: OsmWay[] = [];
  const problems: string[] = [];
  const notes: string[] = [];
  const lines = text.split(/\r?\n/);
  for (let at = 0; at < lines.length; at += 1) {
    const line = lines[at] as string;
    if (!line.startsWith("w")) continue;
    const read = parseWayLine(line, at + 1);
    if (read.kind === "problem") problems.push(read.problem);
    if (read.kind === "skipped") notes.push(read.note);
    if (read.kind === "way") ways.push(read.way);
  }
  return { ways, problems, notes };
}

// Only the T (tags) and N (nodes) fields are used.
export function parseWayLine(line: string, lineNumber: number): WayLine {
  const fields = line.split(" ");
  const id = WAY_ID.exec(fields[0] ?? "");
  if (id === null) return { kind: "problem", problem: `line ${lineNumber}: does not start with a way id (w and a whole number).` };
  const wayId = Number(id[1]);
  const tagsField = fields.find((field) => field.startsWith("T")) ?? "T";
  const nodesField = fields.find((field) => field.startsWith("N")) ?? "N";
  if (nodesField.split(",").length < 2) {
    return { kind: "skipped", note: `way ${wayId} has fewer than two nodes; skipped.` };
  }
  const tags = parseTags(tagsField.slice(1));
  const nodes = parseWayNodes(nodesField.slice(1));
  if (typeof tags === "string") return { kind: "problem", problem: `line ${lineNumber}: ${tags}` };
  const placed = nodes.filter((node): node is WayNode => node.lat !== undefined);
  if (placed.length < nodes.length) {
    return {
      kind: "problem",
      problem: `line ${lineNumber}: way ${wayId} has nodes without positions; make the extract with \`osmium add-locations-to-ways\` (README).`,
    };
  }
  return { kind: "way", way: { id: wayId, tags, nodes: placed } };
}

// Key to value; a key written twice keeps its last value, as OSM allows only
// one. A broken escape gives the problem as text.
export function parseTags(text: string): Record<string, string> | string {
  const tags: Record<string, string> = {};
  if (text === "") return tags;
  for (const pair of text.split(",")) {
    const equals = pair.indexOf("=");
    const key = unescapeOplText(equals < 0 ? pair : pair.slice(0, equals));
    const value = unescapeOplText(equals < 0 ? "" : pair.slice(equals + 1));
    if (key === undefined || value === undefined) return `a broken escape in the tags, near "${pair}".`;
    tags[key] = value;
  }
  return tags;
}

// Each node: n, its id, x and its longitude, y and its latitude; a node with
// x or y missing or not a number has no position.
export function parseWayNodes(text: string): ReadNode[] {
  const nodes: ReadNode[] = [];
  for (const node of text.split(",")) {
    const placed = NODE_WITH_POSITION.exec(node);
    if (placed === null) nodes.push({ id: Number(NODE_ID.exec(node)?.[1] ?? Number.NaN) });
    else nodes.push({ id: Number(placed[1]), lat: Number(placed[3]), lon: Number(placed[2]) });
  }
  return nodes;
}

// One pass, left to right. libosmium writes % itself as %25% and has no %%
// rule (an empty escape is an error), so %2c%%20% is two escapes side by
// side (approver's F21). Anything else after a % is broken: undefined.
export function unescapeOplText(text: string): string | undefined {
  if (!text.includes("%")) return text;
  let written = "";
  let at = 0;
  while (at < text.length) {
    const character = text[at] as string;
    if (character !== "%") {
      written += character;
      at += 1;
      continue;
    }
    ESCAPE.lastIndex = at;
    const escape = ESCAPE.exec(text);
    const code = Number.parseInt(escape?.[1] ?? "", 16);
    if (escape === null || code > LARGEST_CODE_POINT) return undefined;
    written += String.fromCodePoint(code);
    at = ESCAPE.lastIndex;
  }
  return written;
}
