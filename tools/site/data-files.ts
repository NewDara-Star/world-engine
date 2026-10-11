// Which repo files the built game carries: the game fetches its data (place,
// planet, car, map squares) as files at run time, so vite.config.ts copies the
// files this picks into the build. Every file the player needs and nothing
// private: never raw-data/, research or source. Paths are relative to the
// repo, with forward slashes. Design: docs/designs/tools/site/data-files.md.

// A file name the place checker would accept as an id (letters a to z and
// digits, single dashes between), so no path can climb out with "..".
const NAME = "[a-z0-9]+(?:-[a-z0-9]+)*";
const TOP_DATA_FILE = new RegExp(`^(?:planets|vehicles|places)/${NAME}\\.json$`);
// A chunk is named east_north, such as -14_14, a square's buildings
// buildings_east_north (scope 006), and the index is index.json.
const MAP_FILE = new RegExp(`^places/${NAME}/chunks/(?:index|(?:buildings_)?-?\\d+_-?\\d+)\\.json$`);
// The street names and centre lines for the small map (scope 005b).
const STREETS_FILE = new RegExp(`^places/${NAME}/streets\\.json$`);

export function isShippedDataFile(path: string): boolean {
  if (path === "start.json") return true;
  if (TOP_DATA_FILE.test(path)) return true;
  if (MAP_FILE.test(path)) return true;
  return STREETS_FILE.test(path);
}
