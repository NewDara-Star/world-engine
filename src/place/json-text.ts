// Reads the raw text of a place or vehicle file once, and keeps where every
// field sits so each message can name its line (scope 002b, 2d). Designs:
// docs/designs/src/place/json-text.md. The reader is jsonc-parser 3.3.1 (MIT,
// Microsoft); why it, and what it does with odd input, was run and written
// down in research/33-json-lines.md.
import { getNodeValue, parseTree, printParseErrorCode, type Node, type ParseError } from "jsonc-parser";
import { type FieldPath, type Problem, labelForPath, pathToField, problemAt } from "./parse.js";

export type JsonText = { read: true; tree: Node; values: unknown } | { read: false; kind: string; offset: number };

// Strict JSON: no comments, no trailing commas (jsonc-parser ParseOptions).
const STRICT = { disallowComments: true, allowTrailingComma: false } as const;

export const NESTED_TOO_DEEPLY = "nested too deeply";

// A reader that made no tree and gave no error has no kind; printParseErrorCode
// names this code 0 "<unknown ParseErrorCode>", which is not in our table, so
// the place-maker reads "the file is not valid JSON here." at line 1.
const NO_TREE: ParseError = { error: 0 as ParseError["error"], offset: 0, length: 0 };

// A byte-order mark becomes a space, not nothing, so every offset the reader
// gives still matches the line starts listed from the original text. The
// browser drops the mark when it reads a file, so the checker must accept it
// too (RFC 8259, section 8.1, lets a reader ignore it). Only running out of
// room (a RangeError: the reader calls itself once per bracket) becomes the
// "nested too deeply" message; any other crash is a fault in our code and
// stays a crash. jsonc-parser's parseTree and getNodeValue (MIT).
export function readJsonText(text: string): JsonText {
  const readable = text.replace(/^\uFEFF/, " ");
  if (/^[ \t\r\n]*$/.test(readable)) return { read: false, kind: "empty", offset: 0 };
  const errors: ParseError[] = [];
  try {
    const tree = parseTree(readable, errors, STRICT);
    const first = errors[0] ?? NO_TREE;
    if (errors.length > 0 || tree === undefined) return { read: false, kind: printParseErrorCode(first.error), offset: first.offset };
    return { read: true, tree, values: getNodeValue(tree) };
  } catch (error) {
    if (error instanceof RangeError) return { read: false, kind: NESTED_TOO_DEEPLY, offset: 0 };
    throw error;
  }
}

// \r\n is one line break; \r or \n alone is one each, as the place-maker's
// editor shows them. Technique from TypeScript's computeLineStarts
// (typescript/lib/typescript.js, Apache-2.0), without its two rare Unicode
// breaks, which common editors keep on one line.
export function lineStartOffsets(text: string): number[] {
  const starts = [0];
  for (let at = 0; at < text.length; at++) {
    const character = text[at];
    if (character === "\r") {
      if (text[at + 1] === "\n") at++;
      starts.push(at + 1);
    } else if (character === "\n") {
      starts.push(at + 1);
    }
  }
  return starts;
}

// Halving search for the last line starting at or before the offset, counting
// lines from 1. Technique from TypeScript's computeLineOfPosition (Apache-2.0).
export function lineAtOffset(starts: readonly number[], offset: number): number {
  let low = 0;
  let high = starts.length - 1;
  while (low < high) {
    const middle = Math.ceil((low + high) / 2);
    if (Number(starts[middle]) <= offset) low = middle;
    else high = middle - 1;
  }
  return low + 1;
}

// A field's value points at the line of the field's name; anything else, such
// as an item in a list, at its own start; a path not in the file, at its start.
export function lineOfPath(tree: Node, starts: readonly number[], path: FieldPath): number {
  const node = usedNodeAtPath(tree, path);
  let offset: number;
  if (node === undefined) offset = 0;
  else if (node.parent?.type === "property") offset = node.parent.offset;
  else offset = node.offset;
  return lineAtOffset(starts, offset);
}

// The same walk as jsonc-parser's findNodeAtLocation (MIT), technique only, but
// taking the last copy of a field written twice: the reader keeps the last
// copy's value, so the line named must be the last copy's too.
export function usedNodeAtPath(tree: Node, path: FieldPath): Node | undefined {
  let node: Node | undefined = tree;
  for (const step of path) {
    if (node === undefined) return undefined;
    const children: Node[] = node.children ?? [];
    if (node.type === "object" && typeof step === "string") {
      // A property's children are its name, then its value.
      node = children
        .filter((property) => property.children?.[0]?.value === step)
        .map((property) => property.children?.[1])
        .at(-1);
    } else if (node.type === "array" && typeof step === "number") {
      node = children[step];
    } else {
      return undefined;
    }
  }
  return node;
}

// Every field written more than once, in every object, objects in lists too.
// Lists are walked with a plain loop, not flatMap, so the walk goes deeper
// before it runs out of room (approver round 3, N1: flatMap gave out at 2,255
// levels); validateJsonFile still catches it if it does.
export function problemsForRepeatedFields(node: Node, path: FieldPath, starts: readonly number[]): Problem[] {
  const children = node.children ?? [];
  if (node.type === "object") {
    // A property's children are its name, then its value. Each name gets an
    // empty group, then every copy goes into its name's group in order, so a
    // huge object is still read in one pass.
    const named = children.map((property) => ({ name: String(property.children?.[0]?.value), property }));
    const copiesByName = new Map<string, Node[]>(named.map((entry) => [entry.name, []]));
    for (const entry of named) copiesByName.get(entry.name)?.push(entry.property);
    const groups = [...copiesByName];
    const problems = groups
      .filter(([, copies]) => copies.length > 1)
      .map(([name, copies]) => problemForRepeatedField(name, copies, path, starts));
    // The copy that is used is the last one.
    const usedValues = groups
      .map(([name, copies]) => ({ name, value: copies.at(-1)?.children?.[1] }))
      .filter((used): used is { name: string; value: Node } => used.value !== undefined);
    for (const used of usedValues) problems.push(...problemsForRepeatedFields(used.value, pathToField(path, used.name), starts));
    return problems;
  }
  if (node.type === "array") {
    const problems: Problem[] = [];
    for (const [index, item] of children.entries()) problems.push(...problemsForRepeatedFields(item, pathToField(path, index), starts));
    return problems;
  }
  return [];
}

// "`gravityMs2` is written twice, on lines 9 and 31; keep one." The problem
// sits on the field's own path, so its line is the copy that is used.
function problemForRepeatedField(name: string, copies: readonly Node[], objectPath: FieldPath, starts: readonly number[]): Problem {
  const lines = [...new Set(copies.map((copy) => lineAtOffset(starts, copy.offset)))];
  let count: string;
  if (copies.length === 2) count = "twice";
  else count = `${copies.length} times`;
  const fieldPath = pathToField(objectPath, name);
  let sentence: string;
  if (lines.length === 1) sentence = `${labelForPath(fieldPath)} is written ${count}, on line ${lines.join("")}; keep one.`;
  else sentence = `${labelForPath(fieldPath)} is written ${count}, on lines ${lines.slice(0, -1).join(", ")} and ${lines.at(-1)}; keep one.`;
  return problemAt(fieldPath, sentence);
}

// The table of plain sentences in docs/designs/src/place/json-text.md, keyed by
// jsonc-parser's error names (printParseErrorCode), plus our own two kinds.
// Each was tried on jsonc-parser 3.3.1 (research/33-json-lines.md, "Round 2
// measurements"); the reader often notices a mistake only after it, so some
// sentences say where else to look.
const SENTENCES = new Map<string, string>([
  [
    "CommaExpected",
    "is not valid JSON here: a comma is missing before this point, at the end of the line above or earlier on this line. A number that starts with 0, such as `01`, or a list opened with `[` and not closed with `]`, also causes this.",
  ],
  ["ColonExpected", "is not valid JSON here: a colon `:` is missing between a field's name and its value."],
  [
    "PropertyNameExpected",
    "is not valid JSON here: a field name in double quotes is expected here. If a comma just before this has no field after it, take that comma away.",
  ],
  [
    "ValueExpected",
    "is not valid JSON here: a value is expected: a number, text in double quotes, `true`, `false`, `null`, a list in `[ ]` or an object in `{ }`. If a comma just before this has nothing after it, take that comma away.",
  ],
  [
    "InvalidSymbol",
    "is not valid JSON here: something here is not allowed in JSON. Names and text need straight double quotes, `\"like this\"`, not single quotes or curly “ ” quotes; `true`, `false` and `null` are written in lower case; a number is plain digits, such as `9.8` or `0.5`.",
  ],
  ["InvalidNumberFormat", "is not valid JSON here: this number cannot be read; write it in plain digits, such as `9.8`."],
  [
    "UnexpectedEndOfNumber",
    "is not valid JSON here: this number stops too soon, such as `1.` or `1e`; finish it (`1.5`) or take off the last character (`1`).",
  ],
  [
    "UnexpectedEndOfString",
    'is not valid JSON here: text that starts here is never closed with a `"`. Text must start and end with a double quote on the same line.',
  ],
  [
    "InvalidCharacter",
    "is not valid JSON here: this text holds a tab or another invisible character that is not allowed between quote marks; delete it (write a tab as `\\t` if you need one).",
  ],
  [
    "InvalidEscapeCharacter",
    "is not valid JSON here: a backslash `\\` in this text is followed by a letter JSON does not know. To write a backslash itself, write two: `\\\\`.",
  ],
  [
    "InvalidUnicode",
    "is not valid JSON here: a `\\u` code in this text needs exactly four characters from 0 to 9 and a to f, such as `\\u00e9`; or type the letter itself, such as `é`.",
  ],
  [
    "CloseBraceExpected",
    "is not valid JSON here: a `{` opened earlier is never closed with `}`. This is only noticed at the end of the file, so the missing `}` can be anywhere above; check that every `{` has its `}`.",
  ],
  [
    "CloseBracketExpected",
    "is not valid JSON here: a list opened earlier with `[` is never closed with `]`. This is only noticed at the end of the file, so the missing `]` can be anywhere above; check that every `[` has its `]`.",
  ],
  [
    "EndOfFileExpected",
    "is not valid JSON here: the file should end before this. A file holds one object, from its first `{` to its matching `}`, and something comes after it, such as an extra `}` or a second object.",
  ],
  ["InvalidCommentToken", "is not valid JSON here: comments (`//` or `/* */`) are not allowed in this file; take the comment out."],
  ["UnexpectedEndOfComment", "is not valid JSON here: a comment `/*` is never closed, and comments are not allowed in this file; take it out."],
  ["empty", "is empty. A place or vehicle file starts with `{` and ends with `}`."],
  [
    NESTED_TOO_DEEPLY,
    "has brackets nested too deeply to read: thousands of `{` or `[` inside one another. A place or vehicle file needs only a few levels.",
  ],
]);

export function syntaxProblemInWords(kind: string): string {
  const subject = labelForPath([]);
  const words = SENTENCES.get(kind);
  if (words !== undefined) return `${subject} ${words}`;
  return `${subject} is not valid JSON here.`;
}
