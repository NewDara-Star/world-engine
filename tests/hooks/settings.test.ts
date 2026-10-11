import { describe, expect, it } from "vitest";
import { accessSync, constants, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "../..");
const settings = JSON.parse(readFileSync(resolve(root, ".claude/settings.json"), "utf8")) as {
  hooks: Record<string, { hooks: { command: string }[] }[]>;
};

function wiredScripts(): string[] {
  const groups = Object.values(settings.hooks).flat();
  const commands = groups.flatMap((group) => group.hooks.map((hook) => hook.command));
  return commands.map((command) => /hooks\/([\w-]+\.sh)/.exec(command)?.[1] ?? "");
}

describe("hook wiring", () => {
  it("wires every hook the rules promise, so none is written but switched off", () => {
    const expected = [
      "compiler-gate.sh",
      "compiled.sh",
      "checks-before-commit.sh",
      "checks-before-stop.sh",
      "story-before-commit.sh",
      "review-before-push.sh",
      "diagram-gate.sh",
    ];
    expect(wiredScripts().sort()).toEqual(expected.sort());
  });

  it("points only at scripts that exist and can run", () => {
    for (const script of wiredScripts()) {
      expect(() => accessSync(resolve(root, ".claude/hooks", script), constants.X_OK), script).not.toThrow();
    }
  });
});
