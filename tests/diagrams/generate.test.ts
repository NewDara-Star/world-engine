import { afterEach, describe, expect, it } from "vitest";
import { generateFlowPages } from "../../tools/diagrams/generate.js";
import { makeProject, pictureOf, removeProjects } from "./project.js";

afterEach(removeProjects);

function pageFor(source: string, path = "src/a.ts"): string {
  const pages = generateFlowPages(makeProject({ [path]: source }));
  return pages.get(path.replace(/\.ts$/, ".md")) ?? "";
}

describe("flow generator: draws each kind of step (happy)", () => {
  it("draws an if/else as a yes/no question with two arrows out", () => {
    const picture = pictureOf(pageFor("export function f(x: number) { if (x > 1) { return 1; } else { return 2; } }"), "f");
    expect(picture).toContain('{"x #gt; 1"}');
    expect(picture).toMatch(/-->\|"yes"\|/);
    expect(picture).toMatch(/-->\|"no"\|/);
  });

  it("draws every return as its own end, so an early return is visible", () => {
    const picture = pictureOf(pageFor("export function f(x: number) { if (x) return 1; return 2; }"), "f");
    expect(picture.match(/\(\["return /g)).toHaveLength(2);
  });

  it("draws a throw in its own shape", () => {
    const picture = pictureOf(pageFor('export function f() { throw new Error("no"); }'), "f");
    expect(picture).toContain('{{"throw new Error(#quot;no#quot;);"}}');
  });

  it("draws && and || as one question per side, the right side only on the right answer", () => {
    const picture = pictureOf(pageFor("export function f(a: boolean, b: boolean) { if (a && b) return 1; return 0; }"), "f");
    expect(picture).toContain('{"a"}');
    expect(picture).toContain('{"b"}');
    expect(picture).toMatch(/n2 -->\|"yes"\| n3/);
  });

  it("draws a ternary and a ?? guard as questions inside a statement", () => {
    const picture = pictureOf(pageFor("export function f(a?: number, b?: number) { const c = a ?? 5; return b ? c : 0; }"), "f");
    expect(picture).toContain('{"a is missing?"}');
    expect(picture).toContain('{"b"}');
  });

  it("draws a switch with one arrow per case and one for default", () => {
    const source = 'export function f(k: string) { switch (k) { case "a": return 1; case "b": break; default: return 3; } return 0; }';
    const picture = pictureOf(pageFor(source), "f");
    expect(picture).toContain('-->|"case #quot;a#quot;"|');
    expect(picture).toContain('-->|"default"|');
    expect(picture).not.toContain("no case matches");
  });

  it("draws a switch without default with a 'no case matches' way out", () => {
    const picture = pictureOf(pageFor("export function f(k: number) { switch (k) { case 1: return 1; } }"), "f");
    expect(picture).toContain("no case matches");
  });

  it("draws loops with an arrow back to the test, and break and continue", () => {
    const source = "export function f(xs: number[]) { for (const x of xs) { if (x < 0) continue; if (x > 9) break; } while (xs.length) { xs.pop(); } }";
    const picture = pictureOf(pageFor(source), "f");
    expect(picture).toContain("for each const x of xs");
    expect(picture).toContain('"next item"');
    expect(picture).toContain('"done"');
    expect(picture).toContain('["continue"]');
    expect(picture).toContain('["break"]');
  });

  it("draws try, catch and finally", () => {
    const picture = pictureOf(pageFor("export function f() { try { g(); } catch (e) { h(e); } finally { k(); } } function g() {} function h(_e: unknown) {} function k() {}"), "f");
    expect(picture).toContain('"throws"');
    expect(picture).toContain("catch (e)");
  });

  it("marks a call to another of our functions", () => {
    const pages = generateFlowPages(
      makeProject({ "src/a.ts": 'import { b } from "./b.js"; export function a() { return b(); }', "src/b.ts": "export function b() { return 1; }" }),
    );
    expect(pictureOf(pages.get("src/a.md"), "a")).toContain("calls b");
  });

  it("does not mark a call to a library or a built-in", () => {
    const picture = pictureOf(pageFor("export function f(xs: number[]) { return Math.max(...xs); }"), "f");
    expect(picture).not.toContain("calls");
  });

  it("gives nested and nameless functions their own picture, named by where they sit", () => {
    const page = pageFor("export function outer() { function inner() { return 1; } return [1].map((n) => { return n + inner(); }); }");
    expect(page).toContain("## outer\n");
    expect(page).toContain("## outer > inner\n");
    expect(page).toContain("## outer > inner function 1\n");
  });

  it("names methods and arrow functions by the class or variable that holds them", () => {
    const page = pageFor("export const twice = (n: number) => n * 2; export class Car { drive() { return 1; } }");
    expect(page).toContain("## twice\n");
    expect(page).toContain("## Car.drive\n");
  });

  it("draws a one-line function as a single return", () => {
    expect(pictureOf(pageFor("export const twice = (n: number) => n * 2;"), "twice")).toContain('(["return n * 2"])');
  });
});

describe("flow generator: when there is nothing to draw (sad)", () => {
  it("makes no pages for a project with no src or tools folder", () => {
    expect(generateFlowPages(makeProject({ "README.md": "hi" })).size).toBe(0);
  });

  it("makes no page for a file with no functions", () => {
    expect(generateFlowPages(makeProject({ "src/types.ts": "export type A = string;" })).size).toBe(0);
  });

  it("skips a function that has no body (an overload or a declaration)", () => {
    const page = pageFor("export function f(a: string): void; export function f(a: number): void; export function f(a: unknown): void { void a; }");
    expect(page.match(/^## /gm)).toHaveLength(1);
  });

  it("does not stop on a file with a syntax error", () => {
    expect(() => pageFor("export function f( { return 1; }")).not.toThrow();
  });

  it("reads only src and tools, never tests or other folders", () => {
    const pages = generateFlowPages(makeProject({ "tests/a.ts": "export function t() {}", "places/b.ts": "export function p() {}", "tools/c.ts": "export function c() {}" }));
    expect([...pages.keys()]).toEqual(["tools/c.md"]);
  });
});

describe("flow generator: odd code (idiot-proof)", () => {
  it("escapes quotes, angle brackets, hashes and backticks so Mermaid cannot misread a label", () => {
    const picture = pictureOf(pageFor('export function f(a: string) { return `<b>"#${a}"</b>`; }'), "f");
    const label = /\(\["return (.*)"\]\)/.exec(picture)?.[1] ?? "";
    expect(label).not.toMatch(/["<>`]/);
    expect(label).toContain("#lt;b#gt;");
    expect(label).toContain("#35;");
  });

  it("gives two functions with the same name different headings", () => {
    const page = pageFor("export function a() { { const f = () => { return 1; }; f(); } { const f = () => { return 2; }; f(); } }");
    expect(page).toContain("## a > f\n");
    expect(page).toContain("## a > f (2)\n");
  });

  it("handles async functions, generators, getters and labelled breaks", () => {
    const source = "export async function* g() { outer: for (const a of [1]) { for (const b of [2]) { if (a === b) break outer; } } yield 1; } export const o = { get v() { return 1; } };";
    const page = pageFor(source);
    expect(page).toContain("break outer");
    expect(page).toContain("## v\n");
  });

  it("does not draw anything for an empty function except start and end", () => {
    const picture = pictureOf(pageFor("export function f() {}"), "f");
    expect(picture).toContain('n1(["f"])');
    expect(picture).toContain('n2(["end"])');
  });
});

describe("flow generator: scale and repeatability (tragedy)", () => {
  it("gives byte-identical pages when run twice on the same code", () => {
    const root = makeProject({ "src/a.ts": "export function f(x: number) { return x > 1 ? 1 : 2; }" });
    expect([...generateFlowPages(root)]).toEqual([...generateFlowPages(root)]);
  });

  it("gives the same page wherever the project sits on the disk", () => {
    const source = "export function f(x: number) { return x > 1 ? 1 : 2; }";
    expect(pageFor(source)).toBe(pageFor(source));
  });

  it("gives the same page for Windows and Unix line endings", () => {
    const unix = "export function f(x: number) {\n  if (x) {\n    return 1;\n  }\n  return 2;\n}\n";
    expect(pageFor(unix.replaceAll("\n", "\r\n"))).toBe(pageFor(unix));
  });

  it("draws a function with 300 decisions without trouble", () => {
    const body = Array.from({ length: 300 }, (_, i) => `if (x === ${i}) { y += ${i}; }`).join("\n");
    const picture = pictureOf(pageFor(`export function f(x: number) { let y = 0;\n${body}\nreturn y; }`), "f");
    expect(picture.match(/\{"x === /g)).toHaveLength(300);
  });

  it("keeps a very long line of code to one short box", () => {
    const picture = pictureOf(pageFor(`export function f() { return "${"x".repeat(5000)}"; }`), "f");
    expect(picture.length).toBeLessThan(400);
  });

  it("lists files and functions in the same order whatever order they were written", () => {
    const pages = generateFlowPages(makeProject({ "src/z.ts": "export function z() {}", "src/a.ts": "export function a() {}" }));
    expect([...pages.keys()]).toEqual(["src/a.md", "src/z.md"]);
  });
});
