// Checks one file from its name and raw text, the same way for places and
// vehicles, and turns every problem into a message that starts with the file
// and the line (scope 002b, 2d, 2f, 2h). Design:
// docs/designs/src/place/check-file.md.
import type { Node } from "jsonc-parser";
import {
  NESTED_TOO_DEEPLY,
  lineAtOffset,
  lineOfPath,
  lineStartOffsets,
  problemsForRepeatedFields,
  readJsonText,
  syntaxProblemInWords,
} from "./json-text.js";
import type { Parser, Problem } from "./parse.js";

export type FileCheck<T> = { ok: true; value: T } | { ok: false; messages: string[] };

// A field written twice is reported first: it explains which copy the other
// messages are about. The repeated-field walk calls itself once per level, so
// a file the reader just managed can still be too deep for it; running out of
// room (a RangeError) there gives the same "nested too deeply" message at line
// 1 as the reader's, never a crash (approver round 3, N1). Any other crash is a
// fault in our code and stays a crash, as in readJsonText.
export function validateJsonFile<T>(fileName: string, text: string, checker: Parser<T>): FileCheck<T> {
  const starts = lineStartOffsets(text);
  const json = readJsonText(text);
  if (!json.read) {
    return { ok: false, messages: [`${fileName} line ${lineAtOffset(starts, json.offset)}: ${syntaxProblemInWords(json.kind)}`] };
  }
  const checked = checker(json.values, []);
  let repeated: Problem[] = [];
  let tooDeep: string[] = [];
  try {
    repeated = problemsForRepeatedFields(json.tree, [], starts);
  } catch (error) {
    if (!(error instanceof RangeError)) throw error;
    tooDeep = [`${fileName} line 1: ${syntaxProblemInWords(NESTED_TOO_DEEPLY)}`];
  }
  if (checked.ok && repeated.length + tooDeep.length === 0) return { ok: true, value: checked.value };
  const problems = [...repeated, ...(checked.ok ? [] : checked.problems)];
  const messages = [...tooDeep, ...problems.map((problem) => messageForProblem(fileName, json.tree, starts, problem))];
  if (checked.crossCheckWaited) messages.push(`${fileName}: Fix these first; some cross-checks run after.`);
  return { ok: false, messages };
}

function messageForProblem(fileName: string, tree: Node, starts: readonly number[], problem: Problem): string {
  return `${fileName} line ${lineOfPath(tree, starts, problem.path)}: ${problem.sentence}`;
}
