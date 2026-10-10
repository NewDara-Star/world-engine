// A tiny checker for JSON files. Each parser either returns the value with its
// proper type, or every problem found, each one naming the field it is about.
// Written from scratch (no library): the file formats are small, and the error
// text is part of the product, because a place file is edited by hand.

export type Parsed<T> = { ok: true; value: T } | { ok: false; errors: string[] };
export type Parser<T> = (value: unknown, path: string) => Parsed<T>;
export type Infer<P> = P extends Parser<infer T> ? T : never;

const MAX_SHOWN = 40;

function show(value: unknown): string {
  const json = JSON.stringify(value) ?? "nothing";
  return json.length > MAX_SHOWN ? `${json.slice(0, MAX_SHOWN)}…` : json;
}

function good<T>(value: T): Parsed<T> {
  return { ok: true, value };
}

function bad(path: string, wanted: string, got: unknown): Parsed<never> {
  return { ok: false, errors: [`${path}: must be ${wanted}, got ${show(got)}`] };
}

export function someText(): Parser<string> {
  return (value, path) =>
    typeof value === "string" && value.trim() !== "" ? good(value) : bad(path, "some text", value);
}

export function textMatching(pattern: RegExp, wanted: string): Parser<string> {
  return (value, path) =>
    typeof value === "string" && pattern.test(value) ? good(value) : bad(path, wanted, value);
}

export function numberBetween(min: number, max: number, unit: string): Parser<number> {
  return (value, path) => {
    const inRange = typeof value === "number" && Number.isFinite(value) && value >= min && value <= max;
    return inRange ? good(value) : bad(path, `a number from ${min} to ${max} ${unit}`.trim(), value);
  };
}

export function oneOf<const T extends string>(options: readonly T[]): Parser<T> {
  const isOption = (value: unknown): value is T => options.some((option) => option === value);
  return (value, path) =>
    isOption(value) ? good(value) : bad(path, `one of ${options.map((o) => `"${o}"`).join(", ")}`, value);
}

export function listOf<T>(item: Parser<T>, minLength: number): Parser<T[]> {
  return (value, path) => {
    if (!Array.isArray(value) || value.length < minLength) {
      return bad(path, `a list with at least ${minLength} item(s)`, value);
    }
    return collect(value.map((entry, index) => item(entry, `${path}[${index}]`)));
  };
}

function collect<T>(results: Parsed<T>[]): Parsed<T[]> {
  const errors = results.flatMap((result) => (result.ok ? [] : result.errors));
  if (errors.length > 0) return { ok: false, errors };
  return good(results.flatMap((result) => (result.ok ? [result.value] : [])));
}

type Shape = Record<string, Parser<unknown>>;
type Fields<S extends Shape> = { [K in keyof S]: Infer<S[K]> };

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function unknownKeyErrors(value: Record<string, unknown>, shape: Shape, path: string): string[] {
  const known = Object.keys(shape).join(", ");
  return Object.keys(value)
    .filter((key) => !(key in shape))
    .map((key) => `${join(path, key)}: is not a field here (the fields are ${known})`);
}

function join(path: string, key: string): string {
  return path === "" ? key : `${path}.${key}`;
}

export function object<S extends Shape>(shape: S): Parser<Fields<S>> {
  return (value, path) => {
    if (!isPlainObject(value)) return bad(path === "" ? "the file" : path, "an object { … }", value);
    const results = Object.entries(shape).map(([key, parser]) => ({
      key,
      result: parser(value[key], join(path, key)),
    }));
    const errors = [
      ...unknownKeyErrors(value, shape, path),
      ...results.flatMap(({ result }) => (result.ok ? [] : result.errors)),
    ];
    if (errors.length > 0) return { ok: false, errors };
    const entries = results.flatMap(({ key, result }) => (result.ok ? [[key, result.value]] : []));
    return good(Object.fromEntries(entries) as Fields<S>);
  };
}

// A rule that spans several fields. `problem` returns a sentence, or nothing if fine.
export function refine<T>(parser: Parser<T>, problem: (value: T) => string | undefined): Parser<T> {
  return (value, path) => {
    const parsed = parser(value, path);
    if (!parsed.ok) return parsed;
    const found = problem(parsed.value);
    return found === undefined ? parsed : { ok: false, errors: [`${path === "" ? "the file" : path}: ${found}`] };
  };
}

// A short lower-case name used to refer to a thing from other files.
export function shortId(): Parser<string> {
  return textMatching(/^[a-z][a-z0-9-]*$/, "a short lower-case id such as \"yaba\" (letters, digits, dashes)");
}
