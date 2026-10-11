// Tests for tools/decisions/cli.ts, written blind from the approved design
// docs/designs/tools/decisions/cli.md (parseCheckArguments, unknownTags,
// describeMatch, main). The command is run as a program, the way the
// orchestrator and the note-taker run it, against the real docs/DECISIONS.md;
// its exit code and what it prints are the design's promises.
import { spawnSync } from "node:child_process";
import { readFileSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { realLogPath, realLogText, repo } from "./log-text.js";

// Each test starts the command as a program, which takes a second or two.
vi.setConfig({ testTimeout: 60_000 });

const cli = join(repo, "tools/decisions/cli.ts");

// Runs the file directly from a folder outside the project, so the log must
// be found from the tool's own folder, not from where the command was run.
function check(...words: string[]) {
  const run = spawnSync(join(repo, "node_modules/.bin/tsx"), [cli, ...words], { cwd: tmpdir(), encoding: "utf8" });
  return { status: run.status, stdout: run.stdout ?? "", stderr: run.stderr ?? "", all: (run.stdout ?? "") + (run.stderr ?? "") };
}

function expectRefused(run: ReturnType<typeof check>, ...said: RegExp[]) {
  expect(run.status).toBe(1);
  expect(run.stdout.trim()).toBe("");
  for (const pattern of said) expect(run.stderr).toMatch(pattern);
}

// The ids of the real log's entries carrying a tag, newest date first and
// then the higher id first: the order the design promises.
function idsTagged(tag: string): string[] {
  const blocks = realLogText().split(/\n(?=## D-)/).slice(1);
  const tagged = blocks.filter((text) => /^- Tags: (.*)$/m.exec(text)?.[1]?.split(",").map((word) => word.trim().toLowerCase()).includes(tag));
  const keyed = tagged.map((text) => ({ id: text.slice(3, 9), date: /^- Date: (.*)$/m.exec(text)?.[1] ?? "" }));
  keyed.sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
  return keyed.map((key) => key.id);
}

function linesOf(text: string): string[] {
  return text.split("\n");
}

describe("decisions check: happy path", () => {
  it("finds D-0022 for only the owner pushes, with its date, who decided, the decision and why", () => {
    const run = check("check", "only the owner pushes");
    expect(run.status).toBe(0);
    const first = linesOf(run.stdout).find((line) => line.includes("D-0022")) ?? "";
    expect(first).toContain("2026-10-10");
    expect(first).toContain("owner");
    expect(first).toContain("Only the owner pushes; sessions never push.");
    expect(run.stdout).toContain("The owner keeps control of what reaches GitHub; the cloud sessions also have no push access.");
  });

  it("says what matched: the shared words", () => {
    const run = check("check", "only the owner pushes");
    const lines = linesOf(run.stdout);
    const at = lines.findIndex((line) => line.includes("D-0022"));
    const rest = lines.slice(at + 1).join("\n").split("\n\n")[0] ?? "";
    expect(rest).toMatch(/owner/);
    expect(rest).toMatch(/push/);
  });

  it("runs the same through npm run decisions", () => {
    const run = spawnSync("npm", ["run", "-s", "decisions", "--", "check", "only the owner pushes"], { cwd: repo, encoding: "utf8" });
    expect(run.status).toBe(0);
    expect(run.stdout).toContain("D-0022");
  });

  it("lists every decision sharing a tag, says how many, newest and then highest id first, a blank line between", () => {
    const expected = idsTagged("legal");
    expect(expected.length).toBeGreaterThan(1);
    const run = check("check", "zzz qqq", "--tags", "legal");
    expect(run.status).toBe(0);
    expect(run.stdout).toContain(String(expected.length));
    const order = expected.map((id) => run.stdout.indexOf(id));
    expect(order.every((at) => at >= 0)).toBe(true);
    expect(order).toEqual([...order].sort((a, b) => a - b));
    expect(run.stdout.split("\n\n").length).toBeGreaterThanOrEqual(expected.length);
  });

  it("names the shared tag as what matched", () => {
    const run = check("check", "zzz qqq", "--tags", "legal");
    const lines = linesOf(run.stdout);
    const at = lines.findIndex((line) => line.includes("D-0012"));
    expect(lines.slice(at + 1).join("\n").split("\n\n")[0]).toMatch(/legal/);
  });

  it("takes --tags=a,b the same as --tags a,b", () => {
    const spaced = check("check", "the phone decides the payout", "--tags", "money,server");
    const joined = check("check", "the phone decides the payout", "--tags=money,server");
    expect(spaced.status).toBe(0);
    expect(joined.stdout).toBe(spaced.stdout);
    expect(spaced.stdout).toContain("D-0004");
    expect(spaced.stdout).toContain("D-0005");
  });

  it("takes the tags before the text too", () => {
    const after = check("check", "the phone decides the payout", "--tags", "money");
    const before = check("check", "--tags", "money", "the phone decides the payout");
    expect(before.status).toBe(0);
    expect(before.stdout).toBe(after.stdout);
  });

  it("says plainly when no decision in force shares the tags or wording, and that is not a failure", () => {
    const run = check("check", "purple elephants dancing");
    expect(run.status).toBe(0);
    expect(run.stdout.trim()).not.toBe("");
    expect(run.stdout).not.toContain("D-0");
  });
});

describe("decisions check: sad path", () => {
  it("refuses with the usage line when the first word is not check", () => {
    expectRefused(check(), /check/);
    expectRefused(check("lookup", "only the owner pushes"), /check/);
    expectRefused(check("only the owner pushes"), /check/);
  });

  it("refuses when there is no text to check", () => {
    expectRefused(check("check"), /text/, /check/);
    expectRefused(check("check", "--tags", "money"), /text/);
  });

  it("refuses a blank text", () => {
    expectRefused(check("check", "   "), /text/);
  });

  it("refuses text not in quotes, which arrives as more than one text", () => {
    expectRefused(check("check", "only", "the", "owner"), /quote/);
  });

  it("refuses to say all clear when the text is all short or common words and no tags are given", () => {
    for (const text of ["do it", "the and every", "!!!"]) {
      const run = check("check", text);
      expectRefused(run, /--tags/);
      expect(run.all).not.toMatch(/no decision in force/i);
    }
  });

  it("puts errors on stderr and nothing on stdout", () => {
    const run = check("check");
    expect(run.stderr).toMatch(/text/);
    expect(run.stdout).toBe("");
  });
});

describe("decisions check: idiot-proof path", () => {
  it("refuses --tags with nothing after it", () => {
    expectRefused(check("check", "only the owner pushes", "--tags"), /--tags/);
  });

  it("refuses --tags= with nothing after the equals sign, instead of checking with no tags", () => {
    expectRefused(check("check", "only the owner pushes", "--tags="), /--tags/);
  });

  it("refuses --tags given twice", () => {
    expectRefused(check("check", "only the owner pushes", "--tags", "money", "--tags", "server"), /--tags/);
  });

  it("refuses an option it does not know, naming it", () => {
    expectRefused(check("check", "only the owner pushes", "--verbose"), /--verbose/);
    expectRefused(check("check", "only the owner pushes", "--tag=money"), /--tag\b/);
  });

  it("reads tags in any capitals, with spaces and empty ones between commas", () => {
    const messy = check("check", "the phone decides the payout", "--tags", " Money , ,SERVER ");
    const clean = check("check", "the phone decides the payout", "--tags", "money,server");
    expect(messy.status).toBe(0);
    expect(messy.stdout).toBe(clean.stdout);
  });

  it("warns about a misspelt tag, naming the tag in use it is closest to, and still runs", () => {
    const run = check("check", "only the owner pushes", "--tags", "monye");
    expect(run.status).toBe(0);
    const warning = linesOf(run.all).find((line) => line.includes("monye")) ?? "";
    expect(warning).toContain("money");
    expect(run.stdout).toContain("D-0022");
  });

  it("suggests the tag with the same stem first: test for tests", () => {
    const run = check("check", "only the owner pushes", "--tags", "test");
    expect(run.status).toBe(0);
    const warning = linesOf(run.all).find((line) => /\btest\b/.test(line) && !line.includes("D-0")) ?? "";
    expect(warning).toContain("tests");
  });

  it("on a tie between two close tags, suggests the first alphabetically: ard gives ads, not art", () => {
    const run = check("check", "only the owner pushes", "--tags", "ard");
    const warning = linesOf(run.all).find((line) => /\bard\b/.test(line) && !line.includes("D-0")) ?? "";
    expect(warning).toContain("ads");
    expect(warning).not.toContain("art");
  });

  it("warns about a tag nobody uses with no suggestion when none is close", () => {
    const run = check("check", "only the owner pushes", "--tags", "zzzzzz");
    expect(run.status).toBe(0);
    expect(run.all).toContain("zzzzzz");
  });

  it("does not warn about a tag that is in use", () => {
    const run = check("check", "only the owner pushes", "--tags", "process");
    expect(run.status).toBe(0);
    expect(run.stderr.trim()).toBe("");
  });
});

describe("decisions check: tragedy path", () => {
  it("never changes the decision log", () => {
    const before = readFileSync(realLogPath);
    const touched = statSync(realLogPath).mtimeMs;
    expect(check("check", "only the owner pushes", "--tags", "process,monye").stdout).toContain("D-0022");
    expectRefused(check("check"), /text/);
    expect(readFileSync(realLogPath).equals(before)).toBe(true);
    expect(statSync(realLogPath).mtimeMs).toBe(touched);
  });

  it("checks a pasted wall of text and still answers", () => {
    // About 100 kB, under the 128 kB Linux allows for one command-line word.
    const run = check("check", "only the owner pushes to GitHub. ".repeat(3_000));
    expect(run.status).toBe(0);
    expect(run.stdout).toContain("D-0022");
  });
});
