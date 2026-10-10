import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const hooks = resolve(import.meta.dirname, "../../.claude/hooks");
const route = join(hooks, "lib/review-route.sh");
const riskFile = join(hooks, "review-risk-paths.txt");

interface Change {
  lines?: string;
  paths?: string[];
  message?: string;
  risk?: string;
}

function decide({ lines = "10", paths = ["src/car.ts"], message = "tune the car", risk = riskFile }: Change): string {
  const messageFile = join(mkdtempSync(join(tmpdir(), "route-")), "messages.txt");
  writeFileSync(messageFile, message);
  const run = spawnSync("sh", [route, lines, messageFile, risk], { input: paths.join("\n"), encoding: "utf8" });
  return run.stdout.trim();
}

const reviewer = (change: Change) => decide(change).split(" ")[0];

describe("review routing: who reviews a push (happy)", () => {
  it("sends a small src change to three Sonnet lenses", () => {
    expect(reviewer({ lines: "30", paths: ["src/driving/steer.ts", "tests/driving/steer.test.ts"] })).toBe("sonnet");
  });

  it("sends 401 changed lines to Opus", () => {
    expect(reviewer({ lines: "401" })).toBe("opus");
  });

  it("keeps exactly 400 changed lines with Sonnet", () => {
    expect(reviewer({ lines: "400" })).toBe("sonnet");
  });

  it("sends a hooks change to Opus", () => {
    expect(reviewer({ paths: [".claude/hooks/review-before-push.sh"] })).toBe("opus");
  });

  it("sends a Scope-complete: commit to Opus", () => {
    expect(reviewer({ message: "finish the street\n\nScope-complete: 003" })).toBe("opus");
  });

  it.each([["CLAUDE.md"], ["src/place/place.ts"], [".claude/settings.json"]])("sends a change to %s (the rules) to Opus", (path) => {
    expect(reviewer({ paths: ["src/car.ts", path] })).toBe("opus");
  });

  it.each([["src/server/rewards/pay.ts"], ["src/server/economy/prices.ts"], ["src/server/payments/stripe.ts"], ["src/server/anticheat/speed.ts"]])(
    "sends money and trust code (%s) to Opus",
    (path) => {
      expect(reviewer({ paths: [path] })).toBe("opus");
    },
  );

  it("says why, in plain words", () => {
    expect(decide({ lines: "500" })).toContain("500 lines");
    expect(decide({ paths: ["CLAUDE.md"] })).toContain("rules");
  });
});

describe("review routing when something is missing (sad)", () => {
  it("falls back to Opus when the risk paths file cannot be read", () => {
    expect(reviewer({ risk: "/nowhere/risk.txt" })).toBe("opus");
  });

  it("treats a change with no paths and no messages as small", () => {
    expect(reviewer({ paths: [], message: "" })).toBe("sonnet");
  });
});

describe("review routing with odd input (idiot-proof)", () => {
  it.each([[""], ["lots"], ["-5"], ["4e2"], ["12.5"]])("treats the line count %j as unknown and sends it to Opus", (lines) => {
    expect(reviewer({ lines })).toBe("opus");
  });

  it("does not match a path that only contains a risky name", () => {
    expect(reviewer({ paths: ["docs/notes-on-CLAUDE.md", "src/place-names/list.ts", "tests/src/place/x.ts"] })).toBe("sonnet");
  });

  it("ignores comment lines and blanks in the risk file", () => {
    const risk = join(mkdtempSync(join(tmpdir(), "route-")), "risk.txt");
    writeFileSync(risk, "# money src/car.ts\n\nmoney src/bank/\n");
    expect(reviewer({ risk, paths: ["src/car.ts"] })).toBe("sonnet");
    expect(reviewer({ risk, paths: ["src/bank/ledger.ts"] })).toBe("opus");
  });
});

describe("review routing at scale (tragedy)", () => {
  it("handles a 20,000-file change and finds the one risky path", () => {
    const paths = Array.from({ length: 20000 }, (_, i) => `src/city/block-${i}.ts`);
    expect(reviewer({ lines: "300", paths })).toBe("sonnet");
    expect(reviewer({ lines: "300", paths: [...paths, "CLAUDE.md"] })).toBe("opus");
  });

  it("copes with a line count too big for a 32-bit number", () => {
    expect(reviewer({ lines: "99999999999" })).toBe("opus");
  });
});
