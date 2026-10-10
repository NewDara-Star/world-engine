// The push hook with a stand-in `claude` on the PATH, so no model is called.
// This checks the plumbing (who is asked, what blocks, what is remembered),
// not the models' judgement.
import { execFileSync } from "node:child_process";
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { blocked, bash, makeRepo, removeRepo, runHook, writeFile } from "./harness.js";

const dirs: string[] = [];
afterEach(() => dirs.splice(0).forEach(removeRepo));

// A repo whose origin/main is the starting commit, plus one new local commit.
function repoAhead(changedPath: string, bigLines = 1): string {
  const dir = makeRepo();
  dirs.push(dir);
  writeFile(dir, "CLAUDE.md", "rules\n");
  const origin = mkdtempSync(join(tmpdir(), "origin-"));
  dirs.push(origin);
  const git = (...args: string[]) => execFileSync("git", args, { cwd: dir, stdio: "ignore" });
  execFileSync("git", ["init", "-q", "--bare", origin], { stdio: "ignore" });
  git("remote", "add", "origin", origin);
  git("add", "-A");
  git("commit", "-q", "-m", "base");
  git("push", "-q", "origin", "HEAD:main");
  writeFile(dir, changedPath, "line\n".repeat(bigLines));
  git("add", "-A");
  git("commit", "-q", "-m", "change");
  return dir;
}

// A fake claude: logs which model and lens it was asked as, answers per `answers`.
function fakeClaude(answers: Record<string, string>): { path: string; log: string } {
  const bin = mkdtempSync(join(tmpdir(), "fakebin-"));
  dirs.push(bin);
  const log = join(bin, "calls.log");
  const cases = Object.entries(answers)
    .map(([lens, verdict]) => `  *"${lens}"*) echo "${verdict}" ;;`)
    .join("\n");
  const script = `#!/bin/sh
model=$3
prompt=$(cat)
case "$prompt" in
  *"Your lens is ONLY the player"*) lens=story ;;
  *"Your lens is ONLY the rules"*) lens=rules ;;
  *"Your lens is ONLY tests"*) lens=tests ;;
  *"Your lens is ONLY the design"*) lens=design ;;
  *) lens=all ;;
esac
echo "$model $lens" >> "${log}"
case "$lens" in
${cases}
  *) echo "VERDICT: PASS" ;;
esac
`;
  mkdirSync(bin, { recursive: true });
  writeFileSync(join(bin, "claude"), script);
  chmodSync(join(bin, "claude"), 0o755);
  return { path: `${bin}:${process.env.PATH ?? ""}`, log };
}

const push = bash("git push origin main");
const calls = (log: string) => (existsSync(log) ? readFileSync(log, "utf8").trim().split("\n").sort() : []);

describe("review before push: who is asked (happy)", () => {
  it("asks four Sonnet lenses (story, rules, tests, design) for a small change, and lets the push through", () => {
    const fake = fakeClaude({});
    const result = runHook("review-before-push.sh", repoAhead("src/car.ts"), push, { PATH: fake.path });
    expect(blocked(result)).toBe(false);
    expect(calls(fake.log)).toEqual(["sonnet design", "sonnet rules", "sonnet story", "sonnet tests"]);
  });

  it("asks one Opus review for a change to the rules", () => {
    const fake = fakeClaude({});
    const result = runHook("review-before-push.sh", repoAhead(".claude/hooks/new.sh"), push, { PATH: fake.path });
    expect(blocked(result)).toBe(false);
    expect(calls(fake.log)).toEqual(["opus all"]);
  });

  it("asks the design-match lens even for a change that touches no code", () => {
    const fake = fakeClaude({});
    runHook("review-before-push.sh", repoAhead("docs/notes.md"), push, { PATH: fake.path });
    expect(calls(fake.log)).toContain("sonnet design");
  });

  it("asks one Opus review when the change is over 400 lines", () => {
    const fake = fakeClaude({});
    runHook("review-before-push.sh", repoAhead("src/big.ts", 401), push, { PATH: fake.path });
    expect(calls(fake.log)).toEqual(["opus all"]);
  });
});

describe("review before push: blocking (sad)", () => {
  it("blocks with every finding when any one lens blocks", () => {
    const fake = fakeClaude({ rules: "- [rules] x.ts: bad. Fix: y.\nVERDICT: BLOCK", tests: "- [tests] z: none.\nVERDICT: BLOCK" });
    const result = runHook("review-before-push.sh", repoAhead("src/car.ts"), push, { PATH: fake.path });
    expect(blocked(result)).toBe(true);
    expect(result.stderr).toContain("rules reviewer");
    expect(result.stderr).toContain("tests reviewer");
    expect(result.stderr).not.toContain("story reviewer");
  });

  it("blocks when the design-match lens finds the code and its approved design disagree", () => {
    const fake = fakeClaude({ design: "- [design] src/a.ts f: design has an error path the code lacks. Fix: add it.\nVERDICT: BLOCK" });
    const result = runHook("review-before-push.sh", repoAhead("src/car.ts"), push, { PATH: fake.path });
    expect(blocked(result)).toBe(true);
    expect(result.stderr).toContain("design reviewer");
    expect(result.stderr).not.toContain("rules reviewer");
  });

  it("blocks when a reviewer gives no verdict (it could not run)", () => {
    const fake = fakeClaude({ story: "I am confused" });
    const result = runHook("review-before-push.sh", repoAhead("src/car.ts"), push, { PATH: fake.path });
    expect(blocked(result)).toBe(true);
    expect(result.stderr).toContain("couldn't run");
  });

  it("blocks when the claude program is missing", () => {
    const empty = mkdtempSync(join(tmpdir(), "nobin-"));
    dirs.push(empty);
    const result = runHook("review-before-push.sh", repoAhead("src/car.ts"), push, { PATH: `${empty}:/usr/bin:/bin` });
    expect(blocked(result)).toBe(true);
  });
});

describe("review before push: odd input and repeats (idiot-proof, tragedy)", () => {
  it("remembers a pass, so pushing the same commit again asks nobody", () => {
    const fake = fakeClaude({});
    const dir = repoAhead("src/car.ts");
    runHook("review-before-push.sh", dir, push, { PATH: fake.path });
    runHook("review-before-push.sh", dir, push, { PATH: fake.path });
    expect(calls(fake.log)).toHaveLength(4);
  });

  it("does not remember a block", () => {
    const fake = fakeClaude({ story: "VERDICT: BLOCK" });
    const dir = repoAhead("src/car.ts");
    runHook("review-before-push.sh", dir, push, { PATH: fake.path });
    expect(blocked(runHook("review-before-push.sh", dir, push, { PATH: fake.path }))).toBe(true);
    expect(calls(fake.log)).toHaveLength(8);
  });

  it("asks nobody when the command only mentions a push", () => {
    const fake = fakeClaude({});
    const result = runHook("review-before-push.sh", repoAhead("src/car.ts"), bash('echo "git push"'), { PATH: fake.path });
    expect(blocked(result)).toBe(false);
    expect(calls(fake.log)).toEqual([]);
  });

  it("does not choke on a finding with backslashes and percent signs", () => {
    const fake = fakeClaude({ rules: "- [rules] a\\\\nb 100%s: bad.\nVERDICT: BLOCK" });
    const result = runHook("review-before-push.sh", repoAhead("src/car.ts"), push, { PATH: fake.path });
    expect(blocked(result)).toBe(true);
    expect(result.stderr).toContain("100%s");
  });
});

describe("the design-match lens prompt (idiot-proof)", () => {
  const read = (file: string) => readFileSync(join(import.meta.dirname, "../../.claude/hooks/review", file), "utf8");

  it("says what to block on and what to let through, with examples", () => {
    const lens = read("lens-design.md");
    expect(lens).toContain("Block on a real difference");
    expect(lens).toContain("a case the design has and the code does not");
    expect(lens).toContain("Do not block on harmless differences");
    expect(lens).toContain("a helper split out");
    expect(lens).toContain("renamed variables");
  });

  it("is also part of the single Opus review", () => {
    expect(read("all-lenses.md")).toContain("Design match");
  });
});
