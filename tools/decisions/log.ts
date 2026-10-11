// Reads docs/DECISIONS.md into entries the clash check can compare, and finds
// what is wrong with the file so a broken entry is never silently skipped
// (scope 004, item 4). Designs: docs/designs/tools/decisions/log.md. The entry
// format is our own, written at the top of docs/DECISIONS.md (scope 004,
// item 3).
//
// The functions here follow their designs diamond for diamond, so each check
// is a list built first (the lines that fail it) and one `if` on whether the
// list has anything in it. Plumbing: String and RegExp from the ECMAScript
// standard library only.
import { editDistance } from "../../src/place/closest-word.js";

export interface Decision {
  id: string;
  date: string;
  decision: string;
  why: string;
  decidedBy: string;
  tags: string[];
  replaces?: string;
}

export interface LogProblem {
  line: number;
  message: string;
}

export interface DecisionLog {
  entries: Decision[];
  problems: LogProblem[];
}

const BLOCK_START = "## D-";
const HEADING = /^## D-\d{4}[ \t]*$/;
const ENTRY_ID = /^D-\d{4}$/;
// A field line, `- Name: value`: the name ends at the first colon followed by
// a space or the end of the line, so a value may hold colons of its own. The
// value group always takes part in the match (it may be empty).
const FIELD = /^- (.+?):( .*|)$/g;
const FIELD_OR_BLANK = /^(- .+?:( .*|)|\s*)$/;
const REQUIRED_FIELDS = ["Date", "Decision", "Why", "Decided by", "Tags"];
const KNOWN_FIELDS: readonly string[] = [...REQUIRED_FIELDS, "Replaces"];
// How far a misspelt field name may be from a known one and still be named
// as the one meant (the design: at most two letter-changes).
const FIELD_SUGGESTION_LIMIT = 2;

// Our own design (log.md, readDecisionLog). Blocks are found by their heading
// lines; each runs to the next heading, and the last to the end of the file.
// Problems that need the whole log (an id used twice, a Replaces that points
// nowhere sensible) are found here, after every block is read.
export function readDecisionLog(text: string): DecisionLog {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/);
  const starts = lines.map((line, at) => ({ line, at })).filter((found) => found.line.startsWith(BLOCK_START)).map((found) => found.at);
  const blocks = starts.map((at, which) => ({ start: at + 1, lines: lines.slice(at, starts[which + 1]) }));
  if (blocks.length === 0) return { entries: [], problems: [{ line: 1, message: "the file has no decisions in it (no line starting ## D-)" }] };
  const parsed = blocks.map((block) => ({ ...block, id: String(block.lines[0]).trim().slice(3), result: parseEntry(block.lines, block.start) }));
  const entries = parsed.map((block) => block.result).filter((result): result is Decision => !Array.isArray(result));
  const problems = parsed.map((block) => block.result).filter((result) => Array.isArray(result)).flat();
  const linesOfId = new Map(parsed.map((block) => [block.id, [] as number[]]));
  parsed.forEach((block) => linesOfId.get(block.id)?.push(block.start));
  const repeated = [...linesOfId].filter(([, at]) => at.length > 1);
  if (repeated.length > 0) {
    problems.push(...repeated.map(([id, at]) => ({ line: Number(at[1]), message: `${id} is the id of more than one entry, at lines ${at.join(" and ")}` })));
  }
  const position = new Map(parsed.map((block, at) => [block.id, at]));
  const replacing = parsed.flatMap((block, at) =>
    [block.result]
      .filter((result): result is Decision => !Array.isArray(result))
      .flatMap((entry) => [entry.replaces].filter((replaces) => replaces !== undefined))
      .map((replaces) => ({ replaces, at, line: block.start + block.lines.findIndex((line) => line.startsWith("- Replaces:")) })),
  );
  const replacesProblems = [
    ...replacing.filter((found) => !position.has(found.replaces)).map((found) => ({ line: found.line, message: `Replaces names ${found.replaces}, which is not in the log` })),
    ...replacing.filter((found) => position.get(found.replaces) === found.at).map((found) => ({ line: found.line, message: `Replaces names ${found.replaces}, the entry itself` })),
    ...replacing.filter((found) => Number(position.get(found.replaces)) > found.at).map((found) => ({ line: found.line, message: `Replaces names ${found.replaces}, an entry that comes after it; an entry can only replace an older one` })),
  ];
  if (replacesProblems.length > 0) problems.push(...replacesProblems);
  return { entries, problems: problems.sort((first, second) => first.line - second.line) };
}

// Our own design (log.md, parseEntry). Every check runs whatever the others
// found, so one pass reports every problem in the block. The first copy of a
// field written twice is the one checked and kept.
export function parseEntry(lines: readonly string[], start: number): Decision | LogProblem[] {
  const problems: LogProblem[] = [];
  const heading = String(lines[0]);
  const id = heading.trim().slice(3);
  if (!HEADING.test(heading)) problems.push({ line: start, message: `the heading ${heading.trim()} is not an id like ## D-0001` });
  const body = lines.slice(1).map((text, at) => ({ text, line: start + 1 + at }));
  const strays = body.filter((found) => !FIELD_OR_BLANK.test(found.text)).map((found) => ({ line: found.line, message: "this line is not a field like - Why: the reason" }));
  const fields = body.flatMap((found) => [...found.text.matchAll(FIELD)].map((parts) => ({ line: found.line, name: String(parts[1]), value: String(parts[2]).trim() })));
  const firstOf = new Map(fields.toReversed().map((field) => [field.name, field]));
  const firstCopies = fields.filter((field) => firstOf.get(field.name) === field);
  const fieldProblems = [
    ...REQUIRED_FIELDS.filter((name) => !firstOf.get(name)?.value).map((name) => ({ line: start, message: `${name} is missing or has no value` })),
    ...fields.filter((field) => KNOWN_FIELDS.includes(field.name)).filter((field) => firstOf.get(field.name) !== field).map((field) => ({ line: field.line, message: `${field.name} is written twice` })),
  ];
  problems.push(...strays);
  if (fieldProblems.length > 0) problems.push(...fieldProblems);
  // A real calendar date: rebuilt from its year, month and day, it reads the
  // same. 2026-02-30 rolls over to March and "10/10/2026" gives no date at all.
  const badDates = firstCopies
    .filter((field) => field.name === "Date")
    .filter((field) => field.value !== "")
    .filter((field) => String(new Date(Date.UTC(Number(field.value.slice(0, 4)), Number(field.value.slice(5, 7)) - 1, Number(field.value.slice(8, 10)))).toJSON()).slice(0, 10) !== field.value);
  if (badDates.length > 0) problems.push(...badDates.map((field) => ({ line: field.line, message: `the date ${field.value} is not a real date written YYYY-MM-DD` })));
  const replaces = firstCopies.filter((field) => field.name === "Replaces");
  const badReplaces = replaces.filter((field) => !ENTRY_ID.test(field.value));
  if (badReplaces.length > 0) problems.push(...badReplaces.map((field) => ({ line: field.line, message: `Replaces must name one id like D-0001, not ${field.value}` })));
  // The closest known name, case ignored: the nearest within the limit, the
  // known names' own order breaking a tie (Array.prototype.sort is stable).
  const unknown = fields.filter((field) => !KNOWN_FIELDS.includes(field.name));
  if (unknown.length > 0) {
    problems.push(
      ...unknown.map((field) => ({
        line: field.line,
        message: `${field.name} is not a field the log uses${KNOWN_FIELDS.filter((known) => editDistance(field.name.toLowerCase(), known.toLowerCase()) <= FIELD_SUGGESTION_LIMIT)
          .sort((first, second) => editDistance(field.name.toLowerCase(), first.toLowerCase()) - editDistance(field.name.toLowerCase(), second.toLowerCase()))
          .slice(0, 1)
          .map((known) => `; did you mean ${known}?`)
          .join("")}`,
      })),
    );
  }
  const tagsFields = firstCopies.filter((field) => field.name === "Tags").filter((field) => field.value !== "");
  const tags = tagsFields.flatMap((field) => field.value.split(",")).map((tag) => tag.trim().toLowerCase()).filter((tag) => tag !== "");
  const emptyTags = tagsFields.filter((field) => field.value.split(",").every((tag) => tag.trim() === ""));
  if (emptyTags.length > 0) problems.push(...emptyTags.map((field) => ({ line: field.line, message: "at least one tag is needed" })));
  if (problems.length > 0) return problems;
  const value = Object.fromEntries(firstCopies.map((field) => [field.name, field.value]));
  return {
    id,
    date: String(value["Date"]),
    decision: String(value["Decision"]),
    why: String(value["Why"]),
    decidedBy: String(value["Decided by"]),
    tags,
    ...replaces.map((field) => ({ replaces: field.value }))[0],
  };
}

// Our own design (log.md, entriesInForce): an entry named by any Replaces has
// been overturned, so only the rest hold today.
export function entriesInForce(entries: readonly Decision[]): Decision[] {
  const replaced = new Set(entries.map((entry) => entry.replaces));
  return entries.filter((entry) => !replaced.has(entry.id));
}
