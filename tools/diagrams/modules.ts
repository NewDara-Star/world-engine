// The module map: which file uses which, drawn by dependency-cruiser (MIT,
// installed copy opened for research/32-code-to-diagram.md) as a Mermaid
// graph. The rule file `.dependency-cruiser.js` also forbids engine code from
// importing place data. Plumbing only: it runs the `depcruise` program.
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { SOURCE_FOLDERS, sourceFiles } from "./generate.js";

const NOTE =
  "Which file uses which, drawn by dependency-cruiser from the imports in the code (`npm run diagrams`). Do not edit by hand.";

// depcruise also stops with an error on a folder that is not there.
function foldersThatExist(root: string): string[] {
  return SOURCE_FOLDERS.filter((folder) => existsSync(join(root, folder)));
}

function wrap(picture: string): string {
  return `# Module map\n\n${NOTE}\n\n\`\`\`mermaid\n${picture.trim()}\n\`\`\`\n`;
}

export function generateModuleMap(root: string, toolRoot: string): string {
  const folders = foldersThatExist(root);
  // depcruise stops with an error when there is nothing to read.
  if (sourceFiles(root).length === 0) return wrap("flowchart LR");
  const depcruise = join(toolRoot, "node_modules", ".bin", "depcruise");
  const config = join(toolRoot, ".dependency-cruiser.js");
  const picture = execFileSync(depcruise, ["--config", config, "--output-type", "mermaid", ...folders], {
    cwd: root,
    encoding: "utf8",
  });
  return wrap(picture);
}
