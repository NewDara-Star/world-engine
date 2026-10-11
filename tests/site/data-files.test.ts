// What the built game ships and what the dev server shows on the Wi-Fi:
// every data file the player needs, nothing private. Design:
// tools/site/data-files.md (approver's F24); README steps from
// tools/bake/cli.md (approver's F18) and scope 005 item 8.
import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { isShippedDataFile } from "../../tools/site/data-files.js";

const repoRoot = resolve(import.meta.dirname, "../..");

describe("shipped data files: happy path", () => {
  it.each([
    "start.json",
    "planets/earth.json",
    "vehicles/hatchback.json",
    "places/omole.json",
    "places/omole/chunks/index.json",
    "places/omole/chunks/3_-2.json",
    "places/omole/chunks/-14_14.json",
  ])("ships %s", (path) => {
    expect(isShippedDataFile(path)).toBe(true);
  });
});

describe("shipped data files: nothing private", () => {
  it.each([
    "raw-data/omole/omole-highways.opl",
    "raw-data/omole.json",
    "research/36-slice-1.md",
    "docs/DECISIONS.md",
    "src/game/main.ts",
    "tools/bake/bake.ts",
    "tests/bake/fixtures/tiny-place.json",
    "CLAUDE.md",
    ".claude/settings.json",
    "package.json",
    "places/omole/notes.md",
    "places/omole/chunks/index.json.bak",
    "places/omole/chunks/old/3_-2.json",
    "places/omole/raw.json",
    "planets/earth.json.bak",
    "vehicles/drafts/hatchback.json",
  ])("does not ship %s", (path) => {
    expect(isShippedDataFile(path)).toBe(false);
  });
});

describe("shipped data files: idiot-proof path (paths that try to climb out)", () => {
  it.each(["places/../raw-data/x.json", "places/omole/chunks/../../../raw-data/x.json", "../start.json", "/start.json", "./start.json", "places\\omole.json", ""])(
    "does not ship %s",
    (path) => {
      expect(isShippedDataFile(path)).toBe(false);
    },
  );
});

describe("the dev server on the home Wi-Fi", () => {
  it("refuses raw-data, research, docs, tests, .claude and CLAUDE.md", async () => {
    const config = (await import("../../vite.config.js")).default;
    const deny = config.server?.fs?.deny ?? [];
    for (const privateThing of ["raw-data", "research", "docs", "tests", ".claude", "CLAUDE.md"]) {
      expect(
        deny.some((pattern: string) => pattern.includes(privateThing)),
        privateThing,
      ).toBe(true);
    }
  });
});

describe("the README tells the owner how to run it and how to make the map", () => {
  function readme(): string {
    expect(existsSync(resolve(repoRoot, "README.md"))).toBe(true);
    return readFileSync(resolve(repoRoot, "README.md"), "utf8");
  }

  it("says npm run dev gives a link for the phone, on a home network only", () => {
    expect(readme()).toContain("npm run dev");
    expect(readme()).toMatch(/home (Wi-Fi|network)/i);
  });

  it("cuts the extract with osmium add-locations-to-ways, so the nodes have positions", () => {
    expect(readme()).toContain("osmium add-locations-to-ways");
    expect(readme()).toContain("npm run bake");
  });
});
