import { afterEach, describe, expect, it } from "vitest";
import { blocked, bash, makeRepo, removeRepo, runHook, writeFile } from "./harness.js";

const repos: string[] = [];

function repoWithGameChange(): string {
  const dir = makeRepo();
  repos.push(dir);
  writeFile(dir, "src/car.ts");
  return dir;
}

afterEach(() => repos.splice(0).forEach(removeRepo));

describe("story before commit", () => {
  it("blocks a commit that changes src/ and has no Story paragraph", () => {
    const result = runHook("story-before-commit.sh", repoWithGameChange(), bash('git commit -m "add car"'));
    expect(blocked(result)).toBe(true);
    expect(result.stderr).toContain("Story:");
  });

  it("lets the commit through when the message has a Story paragraph", () => {
    const command = 'git commit -m "add car\n\nStory: the player presses up and the car moves."';
    expect(blocked(runHook("story-before-commit.sh", repoWithGameChange(), bash(command)))).toBe(false);
  });

  it("reads the Story from a message file given with -F", () => {
    const dir = repoWithGameChange();
    const withStory = writeFile(dir, "msg-ok.txt", "add car\n\nStory: the car moves.\n");
    const without = writeFile(dir, "msg-bad.txt", "add car\n");
    expect(blocked(runHook("story-before-commit.sh", dir, bash(`git commit -F ${withStory}`)))).toBe(false);
    expect(blocked(runHook("story-before-commit.sh", dir, bash(`git commit -F ${without}`)))).toBe(true);
  });

  it("does not ask for a Story when nothing under src/ changed", () => {
    const dir = makeRepo();
    repos.push(dir);
    writeFile(dir, "README.md", "hello");
    expect(blocked(runHook("story-before-commit.sh", dir, bash('git commit -m "docs"')))).toBe(false);
  });

  it("ignores commands that are not commits", () => {
    expect(blocked(runHook("story-before-commit.sh", repoWithGameChange(), bash("git status")))).toBe(false);
  });
});

describe("review before push", () => {
  it("skips anything that is not a push, without calling a model", () => {
    const dir = repoWithGameChange();
    for (const command of ["git commit -m x", "git status", "ls", "npm run check"]) {
      const result = runHook("review-before-push.sh", dir, bash(command));
      expect(result.status, command).toBe(0);
      expect(result.stderr, command).toBe("");
    }
  });
});
