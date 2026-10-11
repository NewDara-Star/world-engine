// The game's dev server and build (Vite 8.3.4). The game fetches its data
// (place, planet, car, map squares) at run time, so the build copies the data
// files tools/site/data-files.ts picks into the output (Vite plugin API,
// `generateBundle` and `this.emitFile`). On the Wi-Fi the dev server would
// otherwise show every repo file to anyone on the network (approver's F24), so
// it refuses the private folders (`server.fs.deny`, added to Vite's own
// defaults). Design: docs/designs/tools/site/data-files.md.
import { readdirSync, readFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { defineConfig, type Plugin } from "vite";
import { isShippedDataFile } from "./tools/site/data-files.js";

// Where the data lives, relative to the repo.
const DATA_FOLDERS = ["planets", "vehicles", "places"];

// Every file under the data folders, plus start.json, relative to the repo
// with forward slashes (node:fs readdirSync with `recursive`, Node 22).
function dataFileCandidates(root: string): string[] {
  const found = DATA_FOLDERS.flatMap((folder) =>
    readdirSync(join(root, folder), { recursive: true, withFileTypes: true })
      .filter((entry) => entry.isFile())
      .map((entry) => relative(root, join(entry.parentPath, entry.name)).split(sep).join("/")),
  );
  return ["start.json", ...found].toSorted();
}

function shipDataFiles(): Plugin {
  return {
    name: "ship-data-files",
    apply: "build",
    generateBundle() {
      const root = process.cwd();
      for (const path of dataFileCandidates(root).filter(isShippedDataFile)) {
        this.emitFile({ type: "asset", fileName: path, source: readFileSync(join(root, path)) });
      }
    },
  };
}

export default defineConfig({
  // Relative links, so the built game works from any folder on any host.
  base: "./",
  plugins: [shipDataFiles()],
  server: {
    fs: {
      deny: [".env", ".env.*", "*.{crt,pem}", "**/.git/**", "**/raw-data/**", "**/research/**", "**/docs/**", "**/tests/**", "**/.claude/**", "**/CLAUDE.md"],
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
