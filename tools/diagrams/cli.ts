// `npm run diagrams`: writes docs/flows/ (one page per source file, plus the
// module map). `--root <dir>` reads another project; `--out <dir>` writes
// somewhere else (the commit gate compares a fresh copy in a temp folder).
// Plumbing: node:fs and node:path only.
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { generateFlowPages, SOURCE_FOLDERS } from "./generate.js";
import { generateModuleMap } from "./modules.js";

const toolRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

function optionValue(args: readonly string[], name: string): string | undefined {
  const at = args.indexOf(name);
  return at === -1 ? undefined : args[at + 1];
}

// Old pages for deleted source files must not linger, so the folders we own are emptied first.
function clearOwnedFolders(out: string): void {
  for (const folder of SOURCE_FOLDERS) rmSync(join(out, folder), { recursive: true, force: true });
  rmSync(join(out, "modules.md"), { force: true });
}

function writePage(out: string, path: string, text: string): void {
  const full = join(out, path);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, text);
}

function main(args: readonly string[]): void {
  const root = resolve(optionValue(args, "--root") ?? process.cwd());
  const out = resolve(optionValue(args, "--out") ?? join(root, "docs", "flows"));
  clearOwnedFolders(out);
  for (const [path, text] of generateFlowPages(root)) writePage(out, path, text);
  writePage(out, "modules.md", generateModuleMap(root, toolRoot));
}

main(process.argv.slice(2));
