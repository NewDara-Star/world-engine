import { ESLint } from "eslint";
import { describe, expect, it } from "vitest";

async function rulesBrokenBy(code: string): Promise<string[]> {
  const eslint = new ESLint();
  const [result] = await eslint.lintText(code, { filePath: "src/example.ts" });
  return (result?.messages ?? []).map((message) => message.ruleId ?? "");
}

const branches = (count: number) =>
  Array.from({ length: count }, (_, i) => `  if (x === ${i}) return ${i};`).join("\n");

describe("lint measures complexity, not length (scope 001b)", () => {
  it("accepts a long, flat function", async () => {
    const lines = Array.from({ length: 60 }, (_, i) => `  total += ${i};`).join("\n");
    const code = `export function flat(): number {\n  let total = 0;\n${lines}\n  return total;\n}\n`;
    expect(await rulesBrokenBy(code)).toEqual([]);
  });

  it("refuses a function with too many paths", async () => {
    const code = `export function many(x: number): number {\n${branches(9)}\n  return -1;\n}\n`;
    expect(await rulesBrokenBy(code)).toEqual(["complexity"]);
  });

  it("accepts a function at the limit of 8 paths", async () => {
    const code = `export function edge(x: number): number {\n${branches(7)}\n  return -1;\n}\n`;
    expect(await rulesBrokenBy(code)).toEqual([]);
  });

  it("refuses blocks nested four deep", async () => {
    const code = "export function deep(a: boolean): void {\n  if (a) { if (a) { if (a) { if (a) { void 0; } } } }\n}\n";
    expect(await rulesBrokenBy(code)).toContain("max-depth");
  });

  it("still stops a pasted wall of code over the 120-line safety net", async () => {
    const lines = Array.from({ length: 130 }, (_, i) => `  total += ${i};`).join("\n");
    const code = `export function wall(): number {\n  let total = 0;\n${lines}\n  return total;\n}\n`;
    expect(await rulesBrokenBy(code)).toEqual(["max-lines-per-function"]);
  });
});
