// Builds decision-log text for the tests, in the format docs/DECISIONS.md
// describes at its top (docs/designs/tools/decisions/log.md).
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const repo = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
export const realLogPath = resolve(repo, "docs/DECISIONS.md");

export function realLogText(): string {
  return readFileSync(realLogPath, "utf8");
}

export type Fields = Record<string, string>;

export const goodFields: Fields = {
  Date: "2026-10-10",
  Decision: "Only the owner pushes; sessions never push.",
  Why: "The owner keeps control of what reaches GitHub.",
  "Decided by": "owner",
  Tags: "process",
};

// The good fields with one left out, for an entry that is missing it.
export function without(name: string): Fields {
  return Object.fromEntries(Object.entries(goodFields).filter(([field]) => field !== name));
}

// One block: the heading, a blank line, then one "- Field: value" line per field.
export function block(heading: string, fields: Fields): string {
  const lines = Object.entries(fields).map(([name, value]) => `- ${name}: ${value}`);
  return [heading, "", ...lines, ""].join("\n");
}

export function entry(id: string, fields: Partial<Fields> = {}): string {
  return block(`## ${id}`, { ...goodFields, ...fields } as Fields);
}

export const introduction = [
  "# Decisions",
  "",
  "Each entry has the same fields, such as D-0001 or Replaces: D-00xx.",
  "",
].join("\n");

export function logText(...blocks: string[]): string {
  return [introduction, ...blocks].join("\n");
}

// The 1-based number of the first line holding the needle, after the line
// numbered `after`, so a test never has to count lines by hand.
export function lineOf(text: string, needle: string, after = 0): number {
  const lines = text.split(/\r?\n/);
  const index = lines.findIndex((line, at) => at >= after && line.includes(needle));
  if (index < 0) throw new Error(`the test text has no line with ${needle}`);
  return index + 1;
}
