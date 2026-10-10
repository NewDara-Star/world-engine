import { afterEach, describe, expect, it } from "vitest";
import { blocked, bash, makeRepo, removeRepo, runHook, writeFile, type Checks } from "./harness.js";

const repos: string[] = [];
const commit = bash("git commit -m x");

function repoWith(checks: Partial<Checks> = {}): string {
  const dir = makeRepo({ typecheck: true, lint: true, test: true, ...checks });
  repos.push(dir);
  return dir;
}

afterEach(() => repos.splice(0).forEach(removeRepo));

describe("checks before commit", () => {
  it("lets a commit through when typecheck, lint and tests pass", () => {
    expect(blocked(runHook("checks-before-commit.sh", repoWith(), commit))).toBe(false);
  });

  it.each(["typecheck", "lint", "test"] as const)("blocks a commit when %s fails", (failing) => {
    const result = runHook("checks-before-commit.sh", repoWith({ [failing]: false }), commit);
    expect(blocked(result)).toBe(true);
    expect(result.stderr).toContain(`${failing} is broken`);
  });

  it("blocks a push when the checks fail", () => {
    const result = runHook("checks-before-commit.sh", repoWith({ test: false }), bash("git push origin main"));
    expect(blocked(result)).toBe(true);
  });

  it("does not run the checks for other commands, even when they would fail", () => {
    const result = runHook("checks-before-commit.sh", repoWith({ typecheck: false }), bash("ls"));
    expect(blocked(result)).toBe(false);
  });
});

describe("checks before stop", () => {
  const stop = { hook_event_name: "Stop" };

  it("sends Claude back when code changed and the checks fail", () => {
    const dir = repoWith({ test: false });
    writeFile(dir, "src/car.ts");
    expect(blocked(runHook("checks-before-stop.sh", dir, stop))).toBe(true);
  });

  it("lets Claude stop when code changed and the checks pass", () => {
    const dir = repoWith();
    writeFile(dir, "src/car.ts");
    expect(blocked(runHook("checks-before-stop.sh", dir, stop))).toBe(false);
  });

  it("does not run the checks when no code changed", () => {
    const dir = repoWith({ typecheck: false });
    writeFile(dir, "NOTES.md", "hello");
    expect(blocked(runHook("checks-before-stop.sh", dir, stop))).toBe(false);
  });

  it("lets Claude stop on the second try, so it can never loop", () => {
    const dir = repoWith({ typecheck: false });
    writeFile(dir, "src/car.ts");
    const again = { hook_event_name: "Stop", stop_hook_active: true };
    expect(blocked(runHook("checks-before-stop.sh", dir, again))).toBe(false);
  });
});
