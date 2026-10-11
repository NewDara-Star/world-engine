import { afterEach, describe, expect, it } from "vitest";
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { bash, blocked, removeRepo, runHook, writeFile } from "./harness.js";

// Each test starts Vitest a few times, so each may take several seconds.
const slow = { timeout: 60_000 };

// Each test gets a throwaway repo that runs the real Vitest (our pinned one,
// through a link to node_modules), with stand-in typecheck and lint scripts.
const here = dirname(fileURLToPath(import.meta.url));
const lockScript = resolve(here, "../../.claude/hooks/tests-lock.sh");
const repos: string[] = [];
afterEach(() => repos.splice(0).forEach(removeRepo));

interface Stubs {
  typecheck?: string;
  lint?: string;
}

function git(dir: string, ...args: string[]): string {
  return execFileSync("git", args, { cwd: dir, encoding: "utf8" }).trim();
}

function commitAll(dir: string, message: string): string {
  git(dir, "add", "-A");
  git(dir, "commit", "-q", "-m", message);
  return git(dir, "rev-parse", "HEAD");
}

function makeProject(stubs: Stubs = {}): { dir: string; base: string } {
  const dir = mkdtempSync(join(tmpdir(), "lock-test-"));
  repos.push(dir);
  symlinkSync(resolve(here, "../../node_modules"), join(dir, "node_modules"));
  const scripts = { typecheck: stubs.typecheck ?? "true", lint: stubs.lint ?? "true", test: "vitest run" };
  writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "fake", type: "module", scripts }));
  writeFileSync(join(dir, ".gitignore"), "node_modules\n");
  writeFile(dir, "vitest.config.ts", 'export default { test: { include: ["tests/**/*.test.ts"] } };\n');
  writeFile(dir, "src/add.ts", "export function add(a: number, b: number): number { return a + b; }\n");
  writeFile(dir, "tests/add.test.ts", 'import { expect, it } from "vitest";\nimport { add } from "../src/add.js";\nit("adds", () => { expect(add(1, 2)).toBe(3); });\n');
  git(dir, "init", "-q");
  git(dir, "config", "user.email", "t@example.com");
  git(dir, "config", "user.name", "t");
  return { dir, base: commitAll(dir, "start") };
}

const blindTest =
  'import { expect, it } from "vitest";\nimport { double } from "../src/double.js";\n' +
  'it("doubles a number", () => { expect(double(2)).toBe(4); });\n' +
  'it("doubles zero to zero", () => { expect(double(0)).toBe(0); });\n';
const code = "export function double(n: number): number { return n * 2; }\n";

function lock(dir: string, env: Record<string, string>, ...args: string[]) {
  const run = spawnSync("sh", [lockScript, ...args], {
    cwd: dir,
    env: { ...process.env, WE_ROLE: "", ...env, CLAUDE_PROJECT_DIR: dir },
    encoding: "utf8",
  });
  return { status: run.status, out: run.stdout + run.stderr };
}

// The test-writer's hand-over: blind tests written, recorded, committed.
function handedOver(stubs: Stubs = {}): { dir: string; base: string; locked: string } {
  const { dir, base } = makeProject(stubs);
  writeFile(dir, "tests/double.test.ts", blindTest);
  expect(lock(dir, { WE_ROLE: "test-writer", WE_BASE: base }, "record").status).toBe(0);
  return { dir, base, locked: commitAll(dir, "blind tests") };
}

describe("tests lock, happy path: blind tests fail first, then the code makes them pass", slow, () => {
  it("records each new test and why it fails first", () => {
    const { dir, base } = makeProject();
    writeFile(dir, "tests/double.test.ts", blindTest);
    const run = lock(dir, { WE_ROLE: "test-writer", WE_BASE: base }, "record");
    expect(run.status, run.out).toBe(0);
    const record = JSON.parse(readFileSync(join(dir, "tests/fails-first.json"), "utf8")) as {
      files: string[];
      tests: { reason: string }[];
    };
    expect(record.files).toEqual(["tests/double.test.ts"]);
    expect(record.tests[0]?.reason).toBe("the module does not exist yet");
  });

  it("lets the test-writer commit failing tests once they are recorded", () => {
    const { dir, base } = makeProject();
    writeFile(dir, "tests/double.test.ts", blindTest);
    lock(dir, { WE_ROLE: "test-writer", WE_BASE: base }, "record");
    const commit = runHook("checks-before-commit.sh", dir, bash("git commit -m tests"), { WE_ROLE: "test-writer", WE_BASE: base });
    expect(blocked(commit), commit.stderr).toBe(false);
  });

  it("lets the coder commit once the locked tests pass and are untouched", () => {
    const { dir, locked } = handedOver();
    writeFile(dir, "src/double.ts", code);
    const commit = runHook("checks-before-commit.sh", dir, bash("git commit -m code"), { WE_ROLE: "coder", WE_LOCK: locked });
    expect(blocked(commit), commit.stderr).toBe(false);
  });
});

describe("tests lock, sad path: tests that do not fail first, or that the coder changed", slow, () => {
  it("refuses a new test that already passes, because it does not test the new code", () => {
    const { dir, base } = makeProject();
    writeFile(dir, "tests/more.test.ts", 'import { expect, it } from "vitest";\nit("is true", () => { expect(1).toBe(1); });\n');
    const run = lock(dir, { WE_ROLE: "test-writer", WE_BASE: base }, "record");
    expect(run.status).not.toBe(0);
    expect(run.out).toContain("passed already");
    expect(existsSync(join(dir, "tests/fails-first.json"))).toBe(false);
  });

  it("refuses a test that fails because it is broken (a typo, an unknown name)", () => {
    const { dir, base } = makeProject();
    writeFile(dir, "tests/typo.test.ts", 'import { expect, it } from "vitest";\nit("x", () => { expect(1).toBe(1) ); });\n');
    expect(lock(dir, { WE_ROLE: "test-writer", WE_BASE: base }, "record").out).toContain("Transform failed");
    removeRepo(join(dir, "tests/typo.test.ts"));
    writeFile(dir, "tests/name.test.ts", 'import { expect, it } from "vitest";\nit("x", () => { expect(nothing).toBe(1); });\n');
    expect(lock(dir, { WE_ROLE: "test-writer", WE_BASE: base }, "record").out).toContain("ReferenceError");
  });

  it("refuses the coder's commit while a locked test still fails", () => {
    const { dir, locked } = handedOver();
    writeFile(dir, "src/double.ts", "export function double(n: number): number { return n + 2; }\n");
    const run = lock(dir, { WE_ROLE: "coder" }, "verify", locked);
    expect(run.status).not.toBe(0);
    expect(run.out).toContain("doubles zero to zero: failed");
  });

  it("refuses the coder's commit when a locked test changed, even if all pass", () => {
    const { dir, locked } = handedOver();
    writeFile(dir, "src/double.ts", code);
    writeFile(dir, "tests/double.test.ts", blindTest.replace("toBe(4)", "toBe(4) "));
    const run = lock(dir, { WE_ROLE: "coder" }, "verify", locked);
    expect(run.status).not.toBe(0);
    expect(run.out).toContain("tests/double.test.ts");
  });

  it("refuses a new helper file the coder adds under tests/", () => {
    const { dir, locked } = handedOver();
    writeFile(dir, "src/double.ts", code);
    writeFile(dir, "tests/helper.ts", "export const two = 2;\n");
    expect(lock(dir, { WE_ROLE: "coder" }, "verify", locked).out).toContain("tests/helper.ts");
  });

  it("refuses the test-writer's commit when the record is missing or out of date", () => {
    const { dir, base } = makeProject();
    writeFile(dir, "tests/double.test.ts", blindTest);
    const missing = runHook("checks-before-commit.sh", dir, bash("git commit -m t"), { WE_ROLE: "test-writer", WE_BASE: base });
    expect(missing.stderr).toContain("missing or out of date");
    lock(dir, { WE_ROLE: "test-writer", WE_BASE: base }, "record");
    writeFile(dir, "tests/triple.test.ts", blindTest.replace(/double/g, "triple"));
    const stale = runHook("checks-before-commit.sh", dir, bash("git commit -m t"), { WE_ROLE: "test-writer", WE_BASE: base });
    expect(stale.stderr).toContain("missing or out of date");
  });

  it("refuses the test-writer's commit when something outside tests/ changed", () => {
    const { dir, base } = makeProject();
    writeFile(dir, "tests/double.test.ts", blindTest);
    lock(dir, { WE_ROLE: "test-writer", WE_BASE: base }, "record");
    writeFile(dir, "docs/note.md", "a note\n");
    expect(lock(dir, { WE_ROLE: "test-writer", WE_BASE: base }, "hand-over").out).toContain("docs/note.md");
  });
});

describe("tests lock, idiot-proof: missing settings, wrong roles, tricks", slow, () => {
  it("says what is missing when the orchestrator did not set WE_BASE or WE_LOCK", () => {
    const { dir } = makeProject();
    expect(lock(dir, { WE_ROLE: "test-writer" }, "record").out).toContain("WE_BASE is not set");
    expect(lock(dir, { WE_ROLE: "coder" }, "verify").out).toContain("WE_LOCK is not set");
    expect(lock(dir, { WE_ROLE: "coder" }, "verify", "not-a-commit").out).toContain("is not a commit");
    const commit = runHook("checks-before-commit.sh", dir, bash("git commit -m x"), { WE_ROLE: "coder" });
    expect(blocked(commit)).toBe(true);
  });

  it("refuses the coder making its own record", () => {
    const { dir, base } = makeProject();
    writeFile(dir, "tests/double.test.ts", blindTest);
    expect(lock(dir, { WE_ROLE: "coder", WE_BASE: base }, "record").out).toContain("The coder may not");
  });

  it("refuses a test-writer that changes an old test instead of adding a new one", () => {
    const { dir, base } = makeProject();
    writeFile(dir, "tests/add.test.ts", blindTest);
    expect(lock(dir, { WE_ROLE: "test-writer", WE_BASE: base }, "record").out).toContain("existed before");
  });

  it("checks against the locked commit, not a record the coder rewrote", () => {
    const { dir, locked } = handedOver();
    writeFile(dir, "src/double.ts", code);
    writeFile(dir, "tests/fails-first.json", '{"files":[],"tests":[]}\n');
    expect(lock(dir, { WE_ROLE: "coder" }, "verify", locked).out).toContain("tests/fails-first.json");
  });

  it("refuses passing by not running: a locked file the config no longer includes", () => {
    const { dir, locked } = handedOver();
    writeFile(dir, "src/double.ts", code);
    writeFile(dir, "vitest.config.ts", 'export default { test: { include: ["tests/add.test.ts"] } };\n');
    expect(lock(dir, { WE_ROLE: "coder" }, "verify", locked).status).not.toBe(0);
  });

  it("refuses passing by skipping: a skip forced from outside the test files", () => {
    const { dir, locked } = handedOver();
    writeFile(dir, "src/double.ts", code);
    writeFile(dir, "vitest.config.ts", 'export default { test: { include: ["tests/**/*.test.ts"], testNamePattern: "^nothing$" } };\n');
    expect(lock(dir, { WE_ROLE: "coder" }, "verify", locked).out).toContain("skipped");
  });

  it("with no role, a commit with failing tests is blocked exactly as before", () => {
    const { dir } = makeProject();
    writeFile(dir, "tests/double.test.ts", blindTest);
    const commit = runHook("checks-before-commit.sh", dir, bash("git commit -m x"), { WE_ROLE: "" });
    expect(commit.stderr).toContain("Blocked: tests fail");
  });
});

describe("tests lock, tragedy: type errors, old failures, a long road from lock to code", slow, () => {
  const tscSays = (lines: string[]) => `printf '${lines.join("\\n")}\\n'; exit 2`;

  it("accepts type errors in the new tests that name code not written yet", () => {
    const { dir, base } = handedOver({ typecheck: tscSays(["tests/double.test.ts(2,24): error TS2307: Cannot find module."]) });
    expect(lock(dir, { WE_ROLE: "test-writer", WE_BASE: base }, "hand-over").status).toBe(0);
  });

  it("refuses a syntax error in a test, and any type error outside the new tests", () => {
    const syntax = handedOver({ typecheck: tscSays(["tests/double.test.ts(3,1): error TS1005: ; expected."]) });
    expect(lock(syntax.dir, { WE_ROLE: "test-writer", WE_BASE: syntax.base }, "hand-over").out).toContain("TS1005");
    const elsewhere = handedOver({ typecheck: tscSays(["src/add.ts(1,1): error TS2322: no."]) });
    expect(lock(elsewhere.dir, { WE_ROLE: "test-writer", WE_BASE: elsewhere.base }, "hand-over").out).toContain("src/add.ts");
  });

  it("refuses the hand-over when an older test now fails", () => {
    const { dir } = makeProject();
    writeFile(dir, "src/add.ts", "export function add(a: number, b: number): number { return a - b; }\n");
    commitAll(dir, "someone broke add");
    writeFile(dir, "tests/double.test.ts", blindTest);
    lock(dir, { WE_ROLE: "test-writer", WE_BASE: git(dir, "rev-parse", "HEAD") }, "record");
    expect(lock(dir, { WE_ROLE: "test-writer", WE_BASE: git(dir, "rev-parse", "HEAD") }, "hand-over").out).toContain("other than the new ones");
  });

  it("still verifies after many coder commits since the lock", () => {
    const { dir, locked } = handedOver();
    for (let i = 0; i < 5; i++) {
      writeFile(dir, `src/step${i}.ts`, `export const step = ${i};\n`);
      commitAll(dir, `step ${i}`);
    }
    writeFile(dir, "src/double.ts", code);
    const run = lock(dir, { WE_ROLE: "coder" }, "verify", locked);
    expect(run.status, run.out).toBe(0);
  });
});
