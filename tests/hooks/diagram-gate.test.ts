// The diagram gate against throwaway repos that use the real generator, so a
// stale picture, a missing design and an unapproved design are really caught.
import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { blocked, bash, runHook } from "./harness.js";

// Every test starts the generator as a program (a few seconds each).
vi.setConfig({ testTimeout: 90_000 });

const repoRoot = resolve(import.meta.dirname, "../..");
const dirs: string[] = [];
afterEach(() => dirs.splice(0).forEach((dir) => rmSync(dir, { recursive: true, force: true })));

const commit = (message = "change") => bash(`git commit -m "${message}"`);
const APPROVED = "Approved-by: Daramola";
const DELEGATED = "Approved-by: reviewer (delegated by Daramola)";

function git(dir: string, ...args: string[]): string {
  return execFileSync("git", args, { cwd: dir, encoding: "utf8" });
}

function put(dir: string, path: string, text: string): void {
  mkdirSync(dirname(join(dir, path)), { recursive: true });
  writeFileSync(join(dir, path), text);
}

function designFor(names: string[]): string {
  return `# design\n\nStatus: draft\n\n${names.map((name) => `## ${name}\n\n\`\`\`mermaid\nflowchart TD\n  a --> b\n\`\`\`\n`).join("\n")}`;
}

function generate(dir: string): void {
  spawnSync("npm", ["run", "-s", "diagrams"], { cwd: dir });
}

// A repo whose src/a.ts has one function, current diagrams, and a design for it.
// `trailer`: the trailer the design's commit carried, if any.
function makeProject(trailer: string | undefined, source = "export function a(x: number) { return x ? 1 : 2; }\n"): string {
  const dir = mkdtempSync(join(tmpdir(), "gate-test-"));
  dirs.push(dir);
  const diagrams = `${join(repoRoot, "node_modules/.bin/tsx")} ${join(repoRoot, "tools/diagrams/cli.ts")}`;
  put(dir, "package.json", JSON.stringify({ name: "fake", scripts: { diagrams } }));
  put(dir, "tsconfig.json", JSON.stringify({ compilerOptions: { module: "NodeNext", moduleResolution: "NodeNext" } }));
  put(dir, "src/a.ts", source);
  git(dir, "init", "-q");
  git(dir, "config", "user.email", "t@example.com");
  git(dir, "config", "user.name", "t");
  generate(dir);
  put(dir, "docs/designs/src/a.md", designFor(["a"]));
  git(dir, "add", "-A");
  git(dir, ...(trailer === undefined ? ["commit", "-q", "-m", "start"] : ["commit", "-q", "-m", "start", "-m", trailer]));
  return dir;
}

const gate = (dir: string, command = commit()) => runHook("diagram-gate.sh", dir, command);

describe("diagram gate: lets a good commit through (happy)", () => {
  it("passes when the diagrams are current and every design is approved", () => {
    expect(blocked(gate(makeProject(APPROVED)))).toBe(false);
  });

  it("passes when this commit changes a design and carries the owner's trailer", () => {
    const dir = makeProject(undefined);
    put(dir, "docs/designs/src/a.md", designFor(["a"]) + "\nreviewed\n");
    const result = gate(dir, bash(`git commit -m "approve" -m "${APPROVED}"`));
    expect(blocked(result)).toBe(false);
  });

  it("passes a design whose last commit carries the delegated approver's trailer", () => {
    expect(blocked(gate(makeProject(DELEGATED)))).toBe(false);
  });

  it("passes when this commit changes a design and carries the delegated approver's trailer", () => {
    const dir = makeProject(undefined);
    put(dir, "docs/designs/src/a.md", designFor(["a"]) + "\nreviewed\n");
    const result = gate(dir, bash(`git commit -m "approve" -m "${DELEGATED}"`));
    expect(blocked(result)).toBe(false);
  });

  it("reads the trailer from a message file given with -F", () => {
    const dir = makeProject(undefined);
    put(dir, "docs/designs/src/a.md", designFor(["a"]) + "\nreviewed\n");
    writeFileSync(join(dir, "msg.txt"), `approve\n\n${APPROVED}\n`);
    expect(blocked(gate(dir, bash("git commit -F msg.txt")))).toBe(false);
  });
});

describe("diagram gate: blocks (sad)", () => {
  it("blocks a stale diagram and says to run npm run diagrams", () => {
    const dir = makeProject(APPROVED);
    put(dir, "src/a.ts", "export function a(x: number) { if (x) { return 1; } return 2; }\n");
    const result = gate(dir);
    expect(blocked(result)).toBe(true);
    expect(result.stderr).toContain("out of date");
    expect(result.stderr).toContain("npm run diagrams");
  });

  it("blocks a function with no design, naming the file and the function", () => {
    const dir = makeProject(APPROVED);
    put(dir, "src/a.ts", "export function a(x: number) { return x ? 1 : 2; }\nexport function brandNew() { return 1; }\n");
    generate(dir);
    const result = gate(dir);
    expect(blocked(result)).toBe(true);
    expect(result.stderr).toContain("src/a.ts: brandNew");
    expect(result.stderr).not.toContain("src/a.ts: a\n");
  });

  it("blocks a source file with no design file at all", () => {
    const dir = makeProject(APPROVED);
    put(dir, "tools/t.ts", "export function t() { return 1; }\n");
    generate(dir);
    const result = gate(dir);
    expect(blocked(result)).toBe(true);
    expect(result.stderr).toContain("tools/t.ts: t");
  });

  it("blocks a design that no commit with the owner's trailer has touched", () => {
    const dir = makeProject(undefined);
    const result = gate(dir);
    expect(blocked(result)).toBe(true);
    expect(result.stderr).toContain("not approved");
    expect(result.stderr).toContain("docs/designs/src/a.md");
  });

  it("blocks a design edited after its approval, until it is approved again", () => {
    const dir = makeProject(APPROVED);
    put(dir, "docs/designs/src/a.md", designFor(["a"]) + "\nedited\n");
    const result = gate(dir);
    expect(blocked(result)).toBe(true);
    expect(result.stderr).toContain("changed");
  });

  it("blocks with a plain message when the generator itself fails", () => {
    const dir = makeProject(APPROVED);
    put(dir, "package.json", JSON.stringify({ name: "fake", scripts: { diagrams: "echo broken; exit 1" } }));
    const result = gate(dir);
    expect(blocked(result)).toBe(true);
    expect(result.stderr).toContain("generator failed");
  });

  it("blocks when docs/flows was never generated", () => {
    const dir = makeProject(APPROVED);
    rmSync(join(dir, "docs/flows"), { recursive: true, force: true });
    expect(gate(dir).stderr).toContain("out of date");
  });
});

describe("diagram gate: odd input (idiot-proof)", () => {
  it("asks nobody when the command only mentions a commit", () => {
    const dir = makeProject(undefined);
    expect(blocked(gate(dir, bash('echo "git commit"')))).toBe(false);
  });

  it("does not take a trailer for someone else as the owner's approval", () => {
    const dir = makeProject(undefined);
    put(dir, "docs/designs/src/a.md", designFor(["a"]) + "\nreviewed\n");
    expect(blocked(gate(dir, bash('git commit -m "x" -m "Approved-by: Someone Else"')))).toBe(true);
  });

  // Each is one slip away from a real trailer; none of them is an approval.
  const nearMisses = [
    "Approved-by: reviewer",
    "Approved-by: Reviewer (delegated by Daramola)",
    "Approved-by: reviewer (delegated by daramola)",
    "Approved-by: reviewer (delegated by Daramola) for now",
    "Approved-by: reviewer delegated by Daramola",
    "Approved-by: Daramola, mostly",
    "Not Approved-by: Daramola",
    "Approved by: Daramola",
  ];

  it.each(nearMisses)("blocks a design whose last commit only says %s", (trailer) => {
    const result = gate(makeProject(trailer));
    expect(blocked(result)).toBe(true);
    expect(result.stderr).toContain("not approved");
  });

  it.each(nearMisses)("blocks a design changed in a commit that only says %s", (trailer) => {
    const dir = makeProject(undefined);
    put(dir, "docs/designs/src/a.md", designFor(["a"]) + "\nreviewed\n");
    writeFileSync(join(dir, "msg.txt"), `approve\n\n${trailer}\n`);
    expect(blocked(gate(dir, bash("git commit -F msg.txt")))).toBe(true);
  });

  it("blocks a trailer that is only part of a line on the command", () => {
    const dir = makeProject(undefined);
    put(dir, "docs/designs/src/a.md", designFor(["a"]) + "\nreviewed\n");
    expect(blocked(gate(dir, bash(`git commit -m "see ${APPROVED} later"`)))).toBe(true);
  });

  it("does not take a misspelt heading as the design of the function", () => {
    const dir = makeProject(APPROVED);
    put(dir, "docs/designs/src/a.md", designFor(["aa"]));
    git(dir, "add", "-A");
    git(dir, "commit", "-q", "-m", "wrong heading", "-m", APPROVED);
    const result = gate(dir);
    expect(blocked(result)).toBe(true);
    expect(result.stderr).toContain("src/a.ts: a");
  });

  it("passes a project with no TypeScript at all, such as one that only has shell hooks", () => {
    const dir = makeProject(APPROVED);
    rmSync(join(dir, "src"), { recursive: true });
    rmSync(join(dir, "docs"), { recursive: true });
    generate(dir);
    git(dir, "add", "-A");
    git(dir, "commit", "-q", "-m", "empty");
    expect(blocked(gate(dir))).toBe(false);
  });
});

describe("diagram gate: slow disasters (tragedy)", () => {
  it("keeps an old approval after later commits that do not touch the design", () => {
    const dir = makeProject(APPROVED);
    put(dir, "README.md", "hello");
    git(dir, "add", "-A");
    git(dir, "commit", "-q", "-m", "unrelated");
    expect(blocked(gate(dir))).toBe(false);
  });

  it("wants a design for every one of 150 functions, and names each missing one", () => {
    const names = Array.from({ length: 150 }, (_, i) => `f${i}`);
    const dir = makeProject(APPROVED, names.map((name) => `export function ${name}() { return 1; }`).join("\n"));
    put(dir, "docs/designs/src/a.md", designFor(names.slice(0, 149)));
    git(dir, "add", "-A");
    git(dir, "commit", "-q", "-m", "almost", "-m", APPROVED);
    const result = gate(dir);
    expect(blocked(result)).toBe(true);
    expect(result.stderr).toContain("src/a.ts: f149");
    expect(result.stderr).not.toContain("src/a.ts: f148");
  });

  it("notices a source file that was deleted but whose page was left behind", () => {
    const dir = makeProject(APPROVED);
    rmSync(join(dir, "src/a.ts"));
    expect(gate(dir).stderr).toContain("out of date");
  });
});
