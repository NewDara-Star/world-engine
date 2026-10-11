// A tiny checker for JSON values. Each checker either returns the value with
// its proper type, or every problem found, each one naming the field it is
// about by its path. The file name and line are added later, in one place
// (check-file.ts), because only the whole file knows its lines. Written from
// scratch (no library): the error text is part of the product, because a place
// file is edited by hand. Designs: docs/designs/src/place/parse.md.
import { closestWord } from "./closest-word.js";

// A field path: field names and list positions, such as ["dataSources", 0, "url"].
// The top of the file is the empty path.
export type FieldPath = readonly (string | number)[];

export interface Problem {
  path: FieldPath;
  sentence: string;
}

// A failure also says whether a cross-check waited because a field it reads is
// wrong, so the report can end "Fix these first". A success never has one waiting.
export type Parsed<T> =
  | { ok: true; value: T; crossCheckWaited: false }
  | { ok: false; problems: Problem[]; crossCheckWaited: boolean };
export type Parser<T> = (value: unknown, path: FieldPath) => Parsed<T>;
export type Infer<P> = P extends Parser<infer T> ? T : never;

const MAX_SHOWN = 40;

// A value shown as it is written in JSON (so the text "9.8" and the number 9.8
// look different), cut short so a pasted paragraph does not fill the screen.
// JSON writes Infinity as null, which would look like an empty field, so a
// number too big to hold (1e400 is read as Infinity) is named in words.
// Reference: ECMAScript JSON.stringify (ECMA-262, section 25.5.2).
function previewForError(value: unknown): string {
  if (typeof value === "number" && !Number.isFinite(value)) return "a number too big to use";
  const json = JSON.stringify(value) ?? "nothing";
  return json.length > MAX_SHOWN ? `${json.slice(0, MAX_SHOWN)}…` : json;
}

function accept<T>(value: T): Parsed<T> {
  return { ok: true, value, crossCheckWaited: false };
}

export function problemAt(path: FieldPath, sentence: string): Problem {
  return { path, sentence };
}

// "must be …; found …", with "Did you mean …?" only when the fix is obvious.
function reject(value: unknown, path: FieldPath, wanted: string, hint?: string): Parsed<never> {
  let sentence = `${labelForPath(path)} must be ${wanted}; found ${previewForError(value)}.`;
  if (hint !== undefined) sentence += ` Did you mean ${hint}?`;
  return { ok: false, problems: [problemAt(path, sentence)], crossCheckWaited: false };
}

// The one place that calls the top of the file "the file" (scope 002b, 2d).
export function labelForPath(path: FieldPath): string {
  if (path.length === 0) return "the file";
  let written = "";
  for (const step of path) written += typeof step === "number" ? `[${step}]` : `.${step}`;
  return `\`${written.replace(/^\./, "")}\``;
}

export function pathToField(path: FieldPath, step: string | number): FieldPath {
  return [...path, step];
}

export function requireText(): Parser<string> {
  return checkTextIsNotBlank;
}

// `trim` takes off every kind of white space, tabs and no-break spaces too
// (ECMA-262, String.prototype.trim).
function checkTextIsNotBlank(value: unknown, path: FieldPath): Parsed<string> {
  if (typeof value === "string" && value.trim() !== "") return accept(value);
  return reject(value, path, "some text");
}

// `suggest` offers a fixed version of text that does not match, when the fix is obvious.
export function requireTextMatching(pattern: RegExp, wanted: string, suggest?: (text: string) => string | undefined): Parser<string> {
  function checkTextMatchesFormat(value: unknown, path: FieldPath): Parsed<string> {
    if (typeof value !== "string") return reject(value, path, wanted);
    if (pattern.test(value)) return accept(value);
    const fixed = suggest?.(value);
    return reject(value, path, wanted, fixed === undefined ? undefined : `\`${fixed}\``);
  }
  return checkTextMatchesFormat;
}

export function requireNumberBetween(min: number, max: number, unit?: string): Parser<number> {
  function checkNumberInRange(value: unknown, path: FieldPath): Parsed<number> {
    if (typeof value !== "number" || !Number.isFinite(value)) return reject(value, path, rangeInWords(min, max, unit));
    if (value >= min && value <= max) return accept(value);
    return reject(value, path, rangeInWords(min, max, unit), tenTimesTooBigHint(value, min, max));
  }
  return checkNumberInRange;
}

function rangeInWords(min: number, max: number, unit: string | undefined): string {
  if (unit !== undefined) return `a number from ${min} to ${max} ${unit}`;
  return `a number from ${min} to ${max}`;
}

// 98 for gravity is almost always 9.8 with the point in the wrong place (scope
// 002b, 2e: hint only when a tenth fits). Dividing in binary would print 9.78
// as 0.9780000000000001, so the decimal point is moved in the number's own
// text instead: "97.8e-1" reads as exactly 9.78 (ECMA-262, StringToNumber).
function tenTimesTooBigHint(value: number, min: number, max: number): string | undefined {
  const tenth = Number(`${value}e-1`);
  if (tenth >= min && tenth <= max) return String(tenth);
  return undefined;
}

export function requireOneOf<const T extends string>(options: readonly T[]): Parser<T> {
  function isAllowedWord(value: unknown): value is T {
    return options.some((option) => option === value);
  }
  function checkIsAllowedWord(value: unknown, path: FieldPath): Parsed<T> {
    if (isAllowedWord(value)) return accept(value);
    const wanted = `one of ${options.map((option) => `\`${option}\``).join(", ")}`;
    if (typeof value !== "string") return reject(value, path, wanted);
    const guess = closestWord(value, options);
    return reject(value, path, wanted, guess === undefined ? undefined : `\`${guess}\``);
  }
  return checkIsAllowedWord;
}

// Items of a list that is too short are still checked, so a bad item is
// reported in the same run, not the next one (approver round 2, F2).
export function requireListOf<T>(item: Parser<T>, smallest: number): Parser<T[]> {
  function checkEveryItemInList(value: unknown, path: FieldPath): Parsed<T[]> {
    if (!Array.isArray(value)) return reject(value, path, "a list in square brackets");
    const gathered = gatherAllProblems(value.map((entry, index) => item(entry, pathToField(path, index))));
    if (value.length >= smallest) return gathered;
    const tooShort = `${labelForPath(path)} needs at least ${itemsInWords(smallest)}; found ${itemsInWords(value.length)}.`;
    return {
      ok: false,
      problems: [problemAt(path, tooShort), ...problemsFromOneCheck(gathered)],
      crossCheckWaited: gathered.crossCheckWaited,
    };
  }
  return checkEveryItemInList;
}

function itemsInWords(count: number): string {
  if (count === 1) return "1 item";
  return `${count} items`;
}

function gatherAllProblems<T>(results: Parsed<T>[]): Parsed<T[]> {
  const problems = results.flatMap(problemsFromOneCheck);
  if (problems.length > 0) {
    return { ok: false, problems, crossCheckWaited: results.some((result) => result.crossCheckWaited) };
  }
  return accept(results.flatMap(valueFromOneCheck));
}

function problemsFromOneCheck<T>(result: Parsed<T>): Problem[] {
  return result.ok ? [] : result.problems;
}

function valueFromOneCheck<T>(result: Parsed<T>): T[] {
  return result.ok ? [result.value] : [];
}

type Shape = Record<string, Parser<unknown>>;
export type Fields<S extends Shape> = { [K in keyof S]: Infer<S[K]> };

// One field's result, kept with its name.
interface FieldResult {
  name: string;
  result: Parsed<unknown>;
}

// An unknown field, and the missing field it was most likely meant to be.
interface UnknownField {
  name: string;
  guess: string | undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// Own fields only (Object.hasOwn, ECMA-262): `in` would also see names every
// object inherits, such as `constructor`, and take them as present (scope 002b, 2a).
function missingFields(record: Record<string, unknown>, shape: Shape): string[] {
  return Object.keys(shape).filter((name) => !Object.hasOwn(record, name));
}

// The file's values come from jsonc-parser's getNodeValue, which builds objects
// with no prototype, so a field called __proto__ is an own field here, and is
// reported (research/33-json-lines.md).
function unknownFieldsWithGuesses(record: Record<string, unknown>, shape: Shape, missing: readonly string[]): UnknownField[] {
  return Object.keys(record)
    .filter((name) => !Object.hasOwn(shape, name))
    .map((name) => ({ name, guess: closestWord(name, missing) }));
}

function problemsForUnknownFields(unknowns: readonly UnknownField[], shape: Shape, path: FieldPath): Problem[] {
  const fields = Object.keys(shape).map((name) => `\`${name}\``).join(", ");
  const problems: Problem[] = [];
  for (const unknown of unknowns) {
    const fieldPath = pathToField(path, unknown.name);
    const label = labelForPath(fieldPath);
    if (unknown.guess !== undefined) {
      problems.push(problemAt(fieldPath, `${label} is not a field. Did you mean \`${unknown.guess}\`?`));
    } else {
      problems.push(problemAt(fieldPath, `${label} is not a field here; the fields are ${fields}.`));
    }
  }
  return problems;
}

// A missing field that some unknown field was guessed to be is already covered
// by that "Did you mean" (scope 002b, 2b), so it gets no message of its own.
function problemsForMissingFields(missing: readonly string[], unknowns: readonly UnknownField[], path: FieldPath): Problem[] {
  const guessed = new Set(unknowns.map((unknown) => unknown.guess));
  return missing
    .filter((name) => !guessed.has(name))
    .map((name) => problemAt(path, `${labelForPath(pathToField(path, name))} is missing.`));
}

export function requireRecord<S extends Shape>(shape: S): Parser<Fields<S>> {
  // The shape's own fields are walked, and each is looked up in the record only
  // if the record has it as its own field, so a name from the file is never
  // used to look up a checker (approver round 2, checkRecord).
  function checkRecord(value: unknown, path: FieldPath): Parsed<Fields<S>> {
    if (!isRecord(value)) return reject(value, path, "an object in curly brackets");
    const missing = missingFields(value, shape);
    const unknowns = unknownFieldsWithGuesses(value, shape, missing);
    const checked: FieldResult[] = Object.entries(shape)
      .filter(([name]) => Object.hasOwn(value, name))
      .map(([name, checker]) => ({ name, result: checker(value[name], pathToField(path, name)) }));
    const problems = [
      ...problemsForUnknownFields(unknowns, shape, path),
      ...problemsForMissingFields(missing, unknowns, path),
      ...checked.flatMap(problemsFromOneField),
    ];
    if (problems.length > 0) {
      return { ok: false, problems, crossCheckWaited: checked.some((field) => field.result.crossCheckWaited) };
    }
    return accept(Object.fromEntries(checked.flatMap(nameAndValueFromOneField)) as Fields<S>);
  }
  return checkRecord;
}

function problemsFromOneField(field: FieldResult): Problem[] {
  return field.result.ok ? [] : field.result.problems;
}

function nameAndValueFromOneField(field: FieldResult): [string, unknown][] {
  return field.result.ok ? [[field.name, field.result.value]] : [];
}

// A rule reading several fields of one object, such as "a boat cannot have
// wheels". It is given only the fields it reads, once each is good, and returns
// its problems with paths inside the object.
export interface CrossFieldRule<F, K extends keyof F = keyof F> {
  reads: readonly (K & string)[];
  problems: (fields: Pick<F, K>) => Problem[];
}

// One rule's problems, or a note that it waited for a broken field.
interface RuleOutcome {
  problems: Problem[];
  waited: boolean;
}

// The fields are checked once; each rule then runs as soon as the fields it
// reads are good, so every broken rule is listed in one report and a rule
// waiting for its fields never holds back another (scope 002b, 2f; approver
// round 2, F1).
export function addCrossFieldRules<S extends Shape>(shape: S, rules: readonly CrossFieldRule<Fields<S>>[]): Parser<Fields<S>> {
  const checkPlainRecord = requireRecord(shape);
  function checkFieldsThenRules(value: unknown, path: FieldPath): Parsed<Fields<S>> {
    const plain = checkPlainRecord(value, path);
    const outcomes = rules.map((rule) => problemsFromOneRule(rule, plain, value, path));
    const problems = [...problemsFromOneCheck(plain), ...outcomes.flatMap((outcome) => outcome.problems)];
    if (problems.length === 0) return plain;
    return { ok: false, problems, crossCheckWaited: plain.crossCheckWaited || outcomes.some((outcome) => outcome.waited) };
  }
  function problemsFromOneRule(rule: CrossFieldRule<Fields<S>>, plain: Parsed<Fields<S>>, value: unknown, path: FieldPath): RuleOutcome {
    if (plain.ok) {
      const found = rule.problems(plain.value);
      return { problems: found.map((problem) => problemAt([...path, ...problem.path], problem.sentence)), waited: false };
    }
    const fields = valuesReadByRule(value, shape, rule.reads, path);
    if (fields === undefined) return { problems: [], waited: true };
    // Safe: valuesReadByRule returns every field the rule reads, each checked
    // by its own checker, and the rule reads no other.
    const found = rule.problems(fields as Fields<S>);
    return { problems: found.map((problem) => problemAt([...path, ...problem.path], problem.sentence)), waited: false };
  }
  return checkFieldsThenRules;
}

// The fields a rule reads, each checked by its own checker; nothing if any is
// missing or wrong, so the rule never trips over a broken value.
function valuesReadByRule(value: unknown, shape: Shape, reads: readonly string[], path: FieldPath): Record<string, unknown> | undefined {
  if (!isRecord(value)) return undefined;
  const checked: FieldResult[] = Object.entries(shape)
    .filter(([name]) => reads.includes(name))
    .filter(([name]) => Object.hasOwn(value, name))
    .map(([name, checker]) => ({ name, result: checker(value[name], pathToField(path, name)) }));
  const good = checked.flatMap(nameAndValueFromOneField);
  if (good.length !== reads.length) return undefined;
  return Object.fromEntries(good);
}

// The id rule decided by the owner (scope 002b, 2g): letters a to z and digits,
// single dashes only between them, at most 32 characters. Ids join files
// together, so they are written one way only.
const SHORT_ID = /^(?=.{1,32}$)[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function requireShortId(): Parser<string> {
  return requireTextMatching(
    SHORT_ID,
    "an id: letters a to z in lower case and digits 0 to 9, with single dashes only between them, at most 32 characters, such as `yaba`",
    shortIdSuggestion,
  );
}

// `Yaba` → `yaba`, `omole phase 1` → `omole-phase-1`, `Ọ̀yọ́` → `oyo`. Accents are
// taken off by splitting each letter from its marks (Unicode normalization form
// NFD, UAX #15) and dropping the marks (\p{M}, ECMA-262 Unicode property
// escapes). A letter with no plain a to z form (Hausa `ɗ`, `ß`) means no
// suggestion: dropping it would offer a wrong id (approver round 2, F4).
function shortIdSuggestion(text: string): string | undefined {
  const plain = text.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");
  if (/(?![a-z0-9])[\p{L}\p{N}]/u.test(plain)) return undefined;
  const dashed = plain.replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  if (SHORT_ID.test(dashed) && dashed !== text) return dashed;
  return undefined;
}
