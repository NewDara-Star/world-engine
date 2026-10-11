// Puts the baked files on disk. A re-bake replaces the old map completely: a
// square that no longer has road must not linger and show a road that is
// gone. Node's fs/promises (rm, mkdir, readdir, rmdir, writeFile) is the only
// API used. Design: docs/designs/tools/bake/write.md.
import { mkdir, readdir, rm, rmdir, writeFile } from "node:fs/promises";
import { basename, dirname, join } from "node:path";
import { requireShortId } from "../../src/place/parse.js";
import type { BakedFile } from "./bake.js";

// The place id rule, the same as the place file's own id.
const checkPlaceId = requireShortId();

// Only places/<id>/chunks, so a typo cannot wipe another folder; only .json
// files are deleted, nothing else is touched.
export async function writeBakeFiles(folder: string, files: readonly BakedFile[]): Promise<number> {
  const placeFolder = dirname(folder);
  if (basename(folder) !== "chunks" || !isPlaceFolder(placeFolder)) {
    throw new Error(`the bake only writes to places/<id>/chunks, and ${folder} is not such a folder; nothing was written.`);
  }
  const old = await readdir(folder).catch(() => []);
  await Promise.all(old.filter((name) => name.endsWith(".json")).map((name) => rm(join(folder, name))));
  await rmdir(folder).catch(() => undefined);
  await mkdir(folder, { recursive: true });
  for (const file of files.toSorted((a, b) => Number(a.name > b.name) - Number(a.name < b.name))) {
    await writeFile(join(folder, file.name), file.text);
  }
  return files.length;
}

// places/<id>/streets.json, replaced whole (scope 005b). The same guard as the
// squares, so a typo cannot write anywhere else.
export async function writeStreetsFile(placeFolder: string, text: string): Promise<string> {
  if (!isPlaceFolder(placeFolder)) {
    throw new Error(`the bake only writes streets.json into places/<id>, and ${placeFolder} is not such a folder; nothing was written.`);
  }
  const path = join(placeFolder, "streets.json");
  await mkdir(placeFolder, { recursive: true });
  await writeFile(path, text);
  return path;
}

// A folder named like a place id, inside a folder named places.
export function isPlaceFolder(folder: string): boolean {
  return checkPlaceId(basename(folder), []).ok && basename(dirname(folder)) === "places";
}
