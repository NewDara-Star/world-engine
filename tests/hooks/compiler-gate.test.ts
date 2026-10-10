import { afterEach, describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { blocked, bash, makeRepo, removeRepo, runHook, setAge, writeFile } from "./harness.js";

const grepTool = { tool_name: "Grep", tool_input: { pattern: "speed" } };
const repos: string[] = [];

function repoWithChangedCode(): string {
  const dir = makeRepo();
  repos.push(dir);
  setAge(writeFile(dir, "src/car.ts"), 10);
  return dir;
}

function stampTypecheck(dir: string, secondsAgo: number): void {
  setAge(writeFile(dir, ".claude/.state/compiled", ""), secondsAgo);
}

afterEach(() => repos.splice(0).forEach(removeRepo));

describe("compiler gate", () => {
  it("refuses the Grep tool while code has changed and no typecheck has run", () => {
    const dir = repoWithChangedCode();
    expect(blocked(runHook("compiler-gate.sh", dir, grepTool))).toBe(true);
  });

  it("refuses grep, rg and git grep in the shell too", () => {
    const dir = repoWithChangedCode();
    for (const command of ["grep -r speed src", "rg speed", "cd x && git grep speed", "cat a | grep b"]) {
      expect(blocked(runHook("compiler-gate.sh", dir, bash(command))), command).toBe(true);
    }
  });

  it("allows searching once the typecheck ran after the newest change", () => {
    const dir = repoWithChangedCode();
    stampTypecheck(dir, 1);
    expect(blocked(runHook("compiler-gate.sh", dir, grepTool))).toBe(false);
  });

  it("closes again when code is edited after the typecheck", () => {
    const dir = repoWithChangedCode();
    stampTypecheck(dir, 5);
    setAge(writeFile(dir, "src/car.ts", "export const a = 1;\n"), 1);
    expect(blocked(runHook("compiler-gate.sh", dir, grepTool))).toBe(true);
  });

  it("allows searching a clean tree, because reading code needs no compile", () => {
    const dir = makeRepo();
    repos.push(dir);
    expect(blocked(runHook("compiler-gate.sh", dir, grepTool))).toBe(false);
  });

  it("does not touch ordinary shell commands", () => {
    const dir = repoWithChangedCode();
    expect(blocked(runHook("compiler-gate.sh", dir, bash("ls -la")))).toBe(false);
    expect(blocked(runHook("compiler-gate.sh", dir, bash("git status")))).toBe(false);
  });

  it("does not gate on a changed notes file", () => {
    const dir = makeRepo();
    repos.push(dir);
    writeFile(dir, "NOTES.md", "hello");
    expect(blocked(runHook("compiler-gate.sh", dir, grepTool))).toBe(false);
  });
});

describe("compiled stamp", () => {
  it("is written after a typecheck and opens the gate", () => {
    const dir = repoWithChangedCode();
    runHook("compiled.sh", dir, bash("npm run typecheck"));
    expect(existsSync(join(dir, ".claude/.state/compiled"))).toBe(true);
    expect(blocked(runHook("compiler-gate.sh", dir, grepTool))).toBe(false);
  });

  it("is not written by other commands", () => {
    const dir = repoWithChangedCode();
    runHook("compiled.sh", dir, bash("ls"));
    expect(existsSync(join(dir, ".claude/.state/compiled"))).toBe(false);
  });
});
