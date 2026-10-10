// A throwaway project folder with the given files, for the diagram tests.
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

const made: string[] = [];

export function makeProject(files: Record<string, string>): string {
  const root = mkdtempSync(join(tmpdir(), "diagrams-test-"));
  made.push(root);
  for (const [path, text] of Object.entries(files)) {
    const full = join(root, path);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, text);
  }
  return root;
}

export function removeProjects(): void {
  for (const root of made.splice(0)) rmSync(root, { recursive: true, force: true });
}

// The picture text of one function in one page.
export function pictureOf(page: string | undefined, heading: string): string {
  const section = (page ?? "").split(/^## /m).find((part) => part.startsWith(`${heading}\n`));
  return section ?? "";
}
