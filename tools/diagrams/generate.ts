// Reads every TypeScript file under src/ and tools/ and writes one Markdown
// page per file, with one Mermaid picture per function. Same code in, same
// bytes out: files and functions are in sorted/source order, and nothing in
// the text comes from the clock or the machine. Reference: TypeScript compiler
// API (`ts.createProgram`, `getTypeChecker`); the Markdown/Mermaid page shape
// is the one GitHub draws (```mermaid fences). Our own design, written in
// docs/designs/tools/diagrams/generate.md.
import { readdirSync, statSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";
import ts from "typescript";
import { buildFlow, type Project } from "./flow.js";
import { renderMermaid } from "./flow-model.js";
import { listFunctions } from "./functions.js";

export const SOURCE_FOLDERS = ["src", "tools"] as const;

const COMPILER_OPTIONS: ts.CompilerOptions = {
  target: ts.ScriptTarget.ES2023,
  module: ts.ModuleKind.NodeNext,
  moduleResolution: ts.ModuleResolutionKind.NodeNext,
  strict: true,
  skipLibCheck: true,
  noEmit: true,
};

function toSlashes(path: string): string {
  return path.split(sep).join("/");
}

function typescriptFilesIn(folder: string): string[] {
  let entries: string[];
  try {
    entries = readdirSync(folder, { recursive: true, encoding: "utf8" });
  } catch {
    return [];
  }
  return entries
    .filter((entry) => entry.endsWith(".ts") && !entry.endsWith(".d.ts"))
    .map((entry) => join(folder, entry))
    .filter((path) => statSync(path).isFile());
}

// Every source file of ours, as paths relative to the root, sorted.
export function sourceFiles(root: string): string[] {
  const found = SOURCE_FOLDERS.flatMap((folder) => typescriptFilesIn(join(root, folder)));
  return found.map((path) => toSlashes(relative(root, path))).sort();
}

const NOTE =
  "Drawn from the code by `npm run diagrams` (TypeScript compiler, no AI). Do not edit by hand: change the code, then run it again.";

function pageFor(project: Project, file: ts.SourceFile, relativePath: string): string | undefined {
  const entries = listFunctions(file);
  if (entries.length === 0) return undefined;
  const sections = entries.map((entry) => {
    const picture = renderMermaid(buildFlow(project, file, entry));
    return `## ${entry.name}\n\n\`\`\`mermaid\n${picture}\n\`\`\`\n`;
  });
  return `# ${relativePath}\n\n${NOTE}\n\n${sections.join("\n")}`;
}

// Returns a map from page path (e.g. "src/place/parse.md") to its text.
export function generateFlowPages(root: string): Map<string, string> {
  const relativePaths = sourceFiles(root);
  const absolute = relativePaths.map((path) => toSlashes(resolve(root, path)));
  const program = ts.createProgram(absolute, COMPILER_OPTIONS);
  const project: Project = { checker: program.getTypeChecker(), ourFiles: new Set(absolute) };
  const pages = new Map<string, string>();
  relativePaths.forEach((relativePath, index) => {
    const file = program.getSourceFile(absolute[index] ?? "");
    const page = file === undefined ? undefined : pageFor(project, file, relativePath);
    if (page !== undefined) pages.set(relativePath.replace(/\.ts$/, ".md"), page);
  });
  return pages;
}
