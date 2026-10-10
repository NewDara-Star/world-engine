import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { blocked, bash, makeRepo, removeRepo, runHook } from "./harness.js";

const awkScript = resolve(import.meta.dirname, "../../.claude/hooks/lib/runs-git.awk");

function runsGit(want: "commit" | "push", command: string): boolean {
  return spawnSync("awk", ["-v", `want=${want}`, "-f", awkScript], { input: command }).status === 0;
}

const heredocMentioning = (text: string) => `cat > notes.md <<'EOF'\nwe will ${text} later\nEOF\necho done`;

describe("real git commands (happy: the table from scope 001b)", () => {
  it.each([
    ['git commit -m "x"'],
    ['cd sub && git commit -m "x"'],
    ["git -C dir commit"],
    ["git -c user.name=a -C dir commit -m x"],
    ["FOO=1 git commit -m x"],
    ['bash -c "git commit"'],
    ["echo hi | git commit -F -"],
    ["git add -A; git commit -m x"],
    ["false || git commit -m x"],
    ["git add .\ngit commit -m x"],
    ["(cd sub; git commit -m x)"],
    ["/usr/bin/git commit -m x"],
  ])("sees a commit in %j", (command) => {
    expect(runsGit("commit", command)).toBe(true);
  });

  it("sees a push, and keeps commit and push apart", () => {
    expect(runsGit("push", "git push origin main")).toBe(true);
    expect(runsGit("commit", "git push origin main")).toBe(false);
    expect(runsGit("push", 'git commit -m "x"')).toBe(false);
  });
});

describe("text that only mentions git (sad: nothing runs)", () => {
  it.each([
    ['echo "git commit"'],
    ["echo 'git commit'"],
    [heredocMentioning("git commit")],
    ["git commit-tree abc123"],
    ["git log --grep commit"],
    ["git status"],
    ["ls"],
    [""],
    ["# git commit"],
    ["grep -r 'git commit' docs"],
  ])("does not see a commit in %j", (command) => {
    expect(runsGit("commit", command)).toBe(false);
  });

  it("ignores a push named inside a commit message", () => {
    expect(runsGit("push", 'git commit -m "then git push; git push"')).toBe(false);
  });
});

describe("odd but real commands (idiot-proof)", () => {
  it("still sees a commit that comes after a heredoc has closed", () => {
    expect(runsGit("commit", `${heredocMentioning("git push")}\ngit commit -m x`)).toBe(true);
  });

  it("skips a heredoc with an unquoted or tab-indented ending word", () => {
    expect(runsGit("commit", "cat <<-END\n\tgit commit\n\tEND\nls")).toBe(false);
  });

  it("sees a commit run through eval or sh -lc", () => {
    expect(runsGit("commit", 'eval "git commit -m x"')).toBe(true);
    expect(runsGit("commit", "sh -lc 'git commit -m x'")).toBe(true);
  });

  it("is not fooled by an escaped quote or an unclosed quote", () => {
    expect(runsGit("commit", 'echo \\" && git commit -m x')).toBe(true);
    expect(runsGit("commit", 'echo "git commit')).toBe(false);
  });

  it("sees a commit inside a command substitution", () => {
    expect(runsGit("commit", "echo $(git commit -m x)")).toBe(true);
  });

  it("does not take a here-string for a heredoc", () => {
    expect(runsGit("commit", "cat <<< word && git commit -m x")).toBe(true);
  });
});

describe("big and strange input (tragedy)", () => {
  it("handles a very long commit message and a 5000-line heredoc", () => {
    const body = "line of text mentioning git commit\n".repeat(5000);
    expect(runsGit("commit", `cat <<'EOF'\n${body}EOF\nls`)).toBe(false);
    expect(runsGit("commit", `git commit -m "${"word ".repeat(20000)}"`)).toBe(true);
  });

  it("treats a heredoc that never ends as swallowing the rest", () => {
    expect(runsGit("commit", "cat <<EOF\ngit commit\n")).toBe(false);
  });
});

describe("the hooks use it", () => {
  const quoted = bash('echo "git commit"');
  it("none of the commit hooks fire on text that mentions a commit", () => {
    const dir = makeRepo({ typecheck: false, lint: false, test: false });
    try {
      for (const hook of ["checks-before-commit.sh", "story-before-commit.sh", "review-before-push.sh"]) {
        expect(blocked(runHook(hook, dir, quoted)), hook).toBe(false);
      }
      expect(blocked(runHook("checks-before-commit.sh", dir, bash("cd . && git commit -m x")))).toBe(true);
    } finally {
      removeRepo(dir);
    }
  });
});
