import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it, vi } from "vitest";
import { makeProject, removeProjects } from "./project.js";

// Each test starts the generator as a program, which takes a few seconds.
vi.setConfig({ testTimeout: 60_000 });

afterEach(removeProjects);

const repo = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const tsconfig = JSON.stringify({ compilerOptions: { module: "NodeNext", moduleResolution: "NodeNext", target: "ES2023" } });

function runDiagrams(root: string, out: string) {
  return spawnSync(join(repo, "node_modules/.bin/tsx"), [join(repo, "tools/diagrams/cli.ts"), "--root", root, "--out", out], { encoding: "utf8" });
}

function runRules(root: string) {
  const depcruise = join(repo, "node_modules/.bin/depcruise");
  const folders = ["src", "tools"].filter((folder) => existsSync(join(root, folder)));
  return spawnSync(depcruise, ["--config", join(repo, ".dependency-cruiser.js"), ...folders], { cwd: root, encoding: "utf8" });
}

describe("npm run diagrams (happy)", () => {
  it("writes one page per source file and the module map", () => {
    const root = makeProject({
      "tsconfig.json": tsconfig,
      "src/a.ts": 'import { b } from "./b.js"; export function a() { return b(); }',
      "src/b.ts": "export function b() { return 1; }",
    });
    const out = join(root, "docs/flows");
    expect(runDiagrams(root, out).status).toBe(0);
    expect(existsSync(join(out, "src/a.md"))).toBe(true);
    expect(readFileSync(join(out, "modules.md"), "utf8")).toContain("```mermaid");
    expect(readFileSync(join(out, "modules.md"), "utf8")).toContain("a.ts");
  });
});

describe("npm run diagrams (sad, tragedy)", () => {
  it("removes the page of a source file that no longer exists", () => {
    const root = makeProject({ "tsconfig.json": tsconfig, "src/a.ts": "export function a() {}" });
    const out = join(root, "docs/flows");
    mkdirSync(join(out, "src"), { recursive: true });
    writeFileSync(join(out, "src/gone.md"), "old");
    expect(runDiagrams(root, out).status).toBe(0);
    expect(existsSync(join(out, "src/gone.md"))).toBe(false);
  });

  it("leaves files it does not own in the output folder alone", () => {
    const root = makeProject({ "tsconfig.json": tsconfig, "src/a.ts": "export function a() {}" });
    const out = join(root, "docs/flows");
    mkdirSync(out, { recursive: true });
    writeFileSync(join(out, "notes.md"), "mine");
    runDiagrams(root, out);
    expect(readFileSync(join(out, "notes.md"), "utf8")).toBe("mine");
  });

  it("writes identical files the second time", () => {
    const root = makeProject({ "tsconfig.json": tsconfig, "src/a.ts": "export function a(x: number) { return x ? 1 : 2; }" });
    const out = join(root, "docs/flows");
    runDiagrams(root, out);
    const first = readFileSync(join(out, "src/a.md"), "utf8") + readFileSync(join(out, "modules.md"), "utf8");
    runDiagrams(root, out);
    expect(readFileSync(join(out, "src/a.md"), "utf8") + readFileSync(join(out, "modules.md"), "utf8")).toBe(first);
  });
});

describe("module rule: the engine knows no place (happy, sad, idiot-proof)", () => {
  it("passes when engine code reads no place data", () => {
    const root = makeProject({ "tsconfig.json": tsconfig, "src/a.ts": "export const a = 1;", "places/p.ts": "export const p = 1;" });
    expect(runRules(root).status).toBe(0);
  });

  it("fails when engine code imports place data", () => {
    const root = makeProject({ "tsconfig.json": tsconfig, "src/a.ts": 'import { p } from "../places/p.js"; export const a = p;', "places/p.ts": "export const p = 1;" });
    const run = runRules(root);
    expect(run.status).not.toBe(0);
    expect(run.stdout).toContain("engine-knows-no-place");
  });

  it("fails when a tool imports place data too", () => {
    const root = makeProject({ "tsconfig.json": tsconfig, "tools/t.ts": 'import { p } from "../places/p.js"; export const t = p;', "places/p.ts": "export const p = 1;" });
    expect(runRules(root).status).not.toBe(0);
  });

  it("fails when the import is a json place file", () => {
    const root = makeProject({
      "tsconfig.json": tsconfig,
      "src/a.ts": 'import yaba from "../places/yaba.json" with { type: "json" }; export const a = yaba;',
      "places/yaba.json": "{}",
    });
    expect(runRules(root).status).not.toBe(0);
  });
});
