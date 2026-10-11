import { afterEach, describe, expect, it } from "vitest";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { bash, blocked, removeRepo, runHook } from "./harness.js";

// The role guard reads only its input and the environment, so a plain folder
// stands in for the project.
const dirs: string[] = [];
afterEach(() => dirs.splice(0).forEach(removeRepo));

function project(name = "project-"): string {
  const dir = mkdtempSync(join(tmpdir(), name));
  dirs.push(dir);
  return dir;
}

function refused(role: string, input: object, dir = project()): boolean {
  return blocked(runHook("role-guard.sh", dir, input, { WE_ROLE: role }));
}

const read = (path: string) => ({ tool_name: "Read", tool_input: { file_path: path } });
const write = (path: string) => ({ tool_name: "Write", tool_input: { file_path: path, content: "x" } });
const edit = (path: string) => ({ tool_name: "Edit", tool_input: { file_path: path, old_string: "a", new_string: "b" } });
const grep = (path?: string) => ({ tool_name: "Grep", tool_input: path === undefined ? { pattern: "x" } : { pattern: "x", path } });
const glob = (pattern: string, path?: string) => ({ tool_name: "Glob", tool_input: path === undefined ? { pattern } : { pattern, path } });

describe("role guard, happy path: each role can do its job", () => {
  it("lets the test-writer read the scope and the designs, and write tests", () => {
    const dir = project();
    for (const input of [
      read(join(dir, "docs/scopes/004.md")),
      read(join(dir, "docs/designs/src/decisions/check.md")),
      read(join(dir, "CLAUDE.md")),
      write(join(dir, "tests/decisions/check.test.ts")),
      grep(join(dir, "tests")),
      glob("**/*.md", join(dir, "docs/designs")),
      glob("docs/designs/**/*.md"),
    ]) {
      expect(refused("test-writer", input, dir), JSON.stringify(input)).toBe(false);
    }
  });

  it("lets the test-writer run the tests, look around, and commit", () => {
    for (const command of [
      "npm test",
      "npm run -s test 2>&1 | tail -20",
      "npx vitest run tests/decisions/check.test.ts",
      "npm run typecheck",
      "ls docs/designs/src",
      "cat docs/scopes/004-test-first-and-decision-log.md",
      "mkdir -p tests/decisions",
      "git status && git add tests/decisions && git commit -m 'Blind tests for src/decisions/check.ts'",
      "git log --oneline -5",
      "git diff -- tests/",
      "sh .claude/hooks/tests-lock.sh record",
      "git commit -F - <<'EOF'\nTests for $thing in `src/`\n\nCo-Authored-By: x\nEOF",
    ]) {
      expect(refused("test-writer", bash(command)), command).toBe(false);
    }
  });

  it("lets the coder write code, read the tests and run them", () => {
    const dir = project();
    for (const input of [
      write(join(dir, "src/decisions/check.ts")),
      read(join(dir, "tests/decisions/check.test.ts")),
      bash("npx vitest run tests/decisions/check.test.ts"),
      bash("cat tests/decisions/check.test.ts | head -40"),
      bash("rm -f src/old.ts && npm run check"),
    ]) {
      expect(refused("coder", input, dir), JSON.stringify(input)).toBe(false);
    }
  });
});

describe("role guard, sad path: what each role must not do is refused", () => {
  it("refuses the test-writer reading, searching or listing src/", () => {
    const dir = project();
    for (const input of [
      read(join(dir, "src/place/parse.ts")),
      read("src/place/parse.ts"),
      grep(),
      grep(dir),
      grep(join(dir, "src")),
      glob("**/*.ts"),
      glob("src/**"),
      glob("*.ts", join(dir, "src/place")),
    ]) {
      expect(refused("test-writer", input, dir), JSON.stringify(input)).toBe(true);
    }
  });

  it("refuses the test-writer the pictures drawn from the code, docs/flows/", () => {
    const dir = project();
    expect(refused("test-writer", read(join(dir, "docs/flows/src/place/parse.md")), dir)).toBe(true);
    expect(refused("test-writer", grep(join(dir, "docs")), dir)).toBe(true);
    expect(refused("test-writer", bash("cat docs/flows/modules.md"))).toBe(true);
  });

  it("refuses the test-writer every shell route into src/", () => {
    for (const command of [
      "cat src/place/parse.ts",
      "head -50 ./src/place/parse.ts",
      "ls src",
      "ls -R",
      "ls -laR docs",
      "grep -r validate .",
      "find . -name '*.ts'",
      "git show HEAD:src/place/parse.ts",
      "git log -p",
      "git diff HEAD~3",
      "git ls-files",
      "node -e \"console.log(require('fs').readFileSync('src/place/parse.ts','utf8'))\"",
      "npx tsx -e 'x'",
      "npm run diagrams",
      "cd src && cat parse.ts",
    ]) {
      expect(refused("test-writer", bash(command)), command).toBe(true);
    }
  });

  it("refuses the test-writer writing outside tests/", () => {
    const dir = project();
    expect(refused("test-writer", write(join(dir, "src/decisions/check.ts")), dir)).toBe(true);
    expect(refused("test-writer", edit(join(dir, "docs/designs/src/place/parse.md")), dir)).toBe(true);
    expect(refused("test-writer", bash("echo x > docs/note.md"))).toBe(true);
    expect(refused("test-writer", bash("mkdir docs/new"))).toBe(true);
  });

  it("refuses the coder changing, deleting or adding anything under tests/", () => {
    const dir = project();
    expect(refused("coder", write(join(dir, "tests/decisions/check.test.ts")), dir)).toBe(true);
    expect(refused("coder", edit(join(dir, "tests/decisions/check.test.ts")), dir)).toBe(true);
    expect(refused("coder", write(join(dir, "tests/decisions/helper.ts")), dir)).toBe(true);
    for (const command of [
      "rm tests/decisions/check.test.ts",
      "sed -i 's/toBe(2)/toBe(3)/' tests/decisions/check.test.ts",
      "echo '' > tests/decisions/check.test.ts",
      "cat a >> ./tests/x.ts",
      "git checkout HEAD~1 -- tests/",
      "mv tests/a.test.ts tests/a.test.ts.off",
      "node -e \"require('fs').writeFileSync('tests/a.test.ts','')\"",
    ]) {
      expect(refused("coder", bash(command)), command).toBe(true);
    }
  });
});

describe("role guard, idiot-proof: a session cannot change its own role", () => {
  it("refuses every tool under a misspelt role, so a typo fails safe", () => {
    expect(refused("testwriter", read("README.md"))).toBe(true);
    expect(refused("Coder", bash("ls"))).toBe(true);
  });

  it("refuses changing the hooks, the settings, the rules or the role files, under any role", () => {
    const dir = project();
    for (const role of ["test-writer", "coder"]) {
      for (const input of [
        write(join(dir, ".claude/settings.local.json")),
        edit(join(dir, ".claude/hooks/role-guard.sh")),
        write(join(dir, "CLAUDE.md")),
        edit(join(dir, "docs/roles/coder.md")),
        write("/root/.claude/settings.json"),
        write(join(dir, ".git/hooks/pre-commit")),
      ]) {
        expect(refused(role, input, dir), `${role} ${JSON.stringify(input)}`).toBe(true);
      }
    }
  });

  it("refuses shell routes to the settings, and starting a claude without the role", () => {
    for (const role of ["test-writer", "coder"]) {
      for (const command of [
        "echo '{\"env\":{\"WE_ROLE\":\"\"}}' > .claude/settings.local.json",
        "sed -i '/role-guard/d' .claude/settings.json",
        "rm .claude/hooks/role-guard.sh",
        "claude -p 'edit the tests'",
        "WE_ROLE= claude -p hi",
        "env -u WE_ROLE /usr/local/bin/claude",
        "bash -c 'claude -p hi'",
        "npx @anthropic-ai/claude-code -p hi",
      ]) {
        expect(refused(role, bash(command)), `${role}: ${command}`).toBe(true);
      }
    }
  });

  it("ignores a role the session tries to set in its own shell", () => {
    // The hook sees the environment the orchestrator started the session
    // with; `export` inside a command never reaches it.
    expect(refused("test-writer", bash("export WE_ROLE=coder && cat src/a.ts"))).toBe(true);
    expect(refused("test-writer", bash("WE_ROLE= cat src/a.ts"))).toBe(true);
  });

  it("refuses paths that climb out, hide behind quotes, or are built at run time", () => {
    const dir = project();
    expect(refused("test-writer", read(join(dir, "tests/../src/a.ts")), dir)).toBe(true);
    expect(refused("coder", write(join(dir, "src/../tests/a.test.ts")), dir)).toBe(true);
    for (const command of [
      "cat tests/../src/a.ts",
      "cat \"src/a.ts\"",
      "cat 's'rc/a.ts",
      "cat sr\\c/a.ts",
      "cat $(echo src/a.ts)",
      "cat `echo src/a.ts`",
      "X=src; cat $X/a.ts",
      "cat ~/world-engine/src/a.ts",
      "cat /home/claude/world-engine/src/a.ts",
      "cat */*.ts",
      "cat < src/a.ts",
      "(cat src/a.ts)",
      "cat 'unclosed",
    ]) {
      expect(refused("test-writer", bash(command)), command).toBe(true);
    }
  });
});

describe("role guard, tragedy: scale, odd places, and the old behaviour", () => {
  it("changes nothing when no role is set, empty or absent", () => {
    const dir = project();
    const inputs = [read(join(dir, "src/a.ts")), write(join(dir, "tests/a.test.ts")), bash("cat src/a.ts > tests/x"), grep()];
    for (const input of inputs) {
      expect(blocked(runHook("role-guard.sh", dir, input, { WE_ROLE: "" })), JSON.stringify(input)).toBe(false);
      const unset = runHook("role-guard.sh", dir, input, {});
      expect(unset.status).toBe(0);
      expect(unset.stdout).toBe("");
    }
  });

  it("still guards a project whose folder name has spaces", () => {
    const dir = project("my project ");
    expect(refused("test-writer", read(join(dir, "src/a.ts")), dir)).toBe(true);
    expect(refused("test-writer", write(join(dir, "tests/a.test.ts")), dir)).toBe(false);
  });

  it("judges a very long command quickly and still finds the bad part at the end", () => {
    const long = Array.from({ length: 2000 }, (_, i) => `echo step${i}`).join(" && ");
    const started = Date.now();
    expect(refused("test-writer", bash(`${long} && cat src/a.ts`))).toBe(true);
    expect(refused("test-writer", bash(long))).toBe(false);
    expect(Date.now() - started).toBeLessThan(10_000);
  });

  it("lets other tools through untouched (web search, tasks)", () => {
    expect(refused("test-writer", { tool_name: "WebSearch", tool_input: { query: "vitest" } })).toBe(false);
    expect(refused("coder", { tool_name: "TodoWrite", tool_input: { todos: [] } })).toBe(false);
  });
});
