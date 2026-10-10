// Runs a hook script the way Claude Code does: JSON on stdin, the project in
// CLAUDE_PROJECT_DIR. Each test gets its own throwaway git repo.
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, rmSync, utimesSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const hooksDir = resolve(dirname(fileURLToPath(import.meta.url)), "../../.claude/hooks");

export interface HookResult {
  status: number | null;
  stdout: string;
  stderr: string;
}

export function runHook(script: string, projectDir: string, input: object): HookResult {
  const run = spawnSync("sh", [join(hooksDir, script)], {
    input: JSON.stringify(input),
    env: { ...process.env, CLAUDE_PROJECT_DIR: projectDir },
    encoding: "utf8",
  });
  return { status: run.status, stdout: run.stdout, stderr: run.stderr };
}

export function bash(command: string) {
  return { tool_name: "Bash", tool_input: { command } };
}

function denies(stdout: string): boolean {
  if (stdout.trim() === "") return false;
  const decision = JSON.parse(stdout) as { hookSpecificOutput?: { permissionDecision?: string } };
  return decision.hookSpecificOutput?.permissionDecision === "deny";
}

// True when the hook refused: exit 2, or a PreToolUse "deny" decision.
export function blocked(result: HookResult): boolean {
  return result.status === 2 || denies(result.stdout);
}

export interface Checks {
  typecheck: boolean;
  lint: boolean;
  test: boolean;
}

const allPass: Checks = { typecheck: true, lint: true, test: true };

function stubScript(name: string, passes: boolean): string {
  return passes ? "true" : `echo ${name} is broken; exit 1`;
}

// A git repo with one commit and stand-in typecheck/lint/test scripts.
export function makeRepo(checks: Checks = allPass): string {
  const dir = mkdtempSync(join(tmpdir(), "hook-test-"));
  const scripts = {
    typecheck: stubScript("typecheck", checks.typecheck),
    lint: stubScript("lint", checks.lint),
    test: stubScript("test", checks.test),
  };
  writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "fake", scripts }));
  const git = (...args: string[]) => execFileSync("git", args, { cwd: dir, stdio: "ignore" });
  git("init", "-q");
  git("config", "user.email", "t@example.com");
  git("config", "user.name", "t");
  git("add", "-A");
  git("commit", "-q", "-m", "start");
  return dir;
}

export function writeFile(dir: string, path: string, text = "export {};\n"): string {
  const full = join(dir, path);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, text);
  return full;
}

export function setAge(file: string, secondsAgo: number): void {
  const when = new Date(Date.now() - secondsAgo * 1000);
  utimesSync(file, when, when);
}

export function removeRepo(dir: string): void {
  rmSync(dir, { recursive: true, force: true });
}
