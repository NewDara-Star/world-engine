// `npm run bake -- --place places/omole.json --extract raw-data/omole/omole-highways.opl`:
// makes the map from an OSM extract (cut beforehand with osmium; README), prints
// what it did, and leaves the old map untouched if anything is wrong. Exit
// code 0 when the map was written, 1 otherwise. Run from the top of the repo,
// where planets/ is.
// Plumbing: node:fs/promises, node:path, node:url and process (Node.js 22 API).
// Design: docs/designs/tools/bake/cli.md.
import { readdir, readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { type FileCheck, type Planet, validatePlanet } from "../../src/place/index.js";
import { bakePlace } from "./bake.js";
import { writeBakeFiles } from "./write.js";

const USAGE = "usage: npm run bake -- --place places/<id>.json --extract raw-data/<extract>.opl";
const PLANETS_FOLDER = "planets";

export type BakeArguments = { ok: true; placePath: string; extractPath: string } | { ok: false; problem: string };

// --place and --extract each given once, each followed by a value that is not
// another option, and nothing else.
export function readBakeArguments(words: readonly string[]): BakeArguments {
  const placePath = words[words.indexOf("--place") + 1];
  const extractPath = words[words.indexOf("--extract") + 1];
  const optionCount = words.filter((word) => word.startsWith("--")).length;
  if (optionCount !== 2 || words.length !== 4 || placePath === undefined || extractPath === undefined || placePath.startsWith("--") || extractPath.startsWith("--")) {
    return { ok: false, problem: `${USAGE}\nGive --place and --extract once each, each followed by a file.` };
  }
  return { ok: true, placePath, extractPath };
}

// Nothing is written unless every file was read and the bake found no problem.
export async function runBake(words: readonly string[]): Promise<number> {
  const args = readBakeArguments(words);
  if (!args.ok) {
    console.error(args.problem);
    return 1;
  }
  let texts: { place: string; extract: string; planets: { name: string; text: string }[] };
  try {
    const planetNames = (await readdir(PLANETS_FOLDER)).filter((name) => name.endsWith(".json")).toSorted();
    texts = {
      place: await readFile(args.placePath, "utf8"),
      extract: await readFile(args.extractPath, "utf8"),
      planets: await Promise.all(planetNames.map(async (name) => ({ name, text: await readFile(join(PLANETS_FOLDER, name), "utf8") }))),
    };
  } catch (error) {
    console.error(`A file could not be read: ${String(error)}`);
    return 1;
  }
  const planets = texts.planets.map((planet) => validatePlanet(planet.name, planet.text));
  const goodPlanets = planets.filter((checked): checked is Extract<FileCheck<Planet>, { ok: true }> => checked.ok).map((checked) => checked.value);
  const planetProblems = planets.filter((checked): checked is Extract<FileCheck<Planet>, { ok: false }> => !checked.ok).flatMap((checked) => checked.messages);
  const baked = bakePlace(args.placePath, texts.place, goodPlanets, texts.extract);
  if (!baked.ok || planetProblems.length > 0) {
    console.error([...planetProblems, ...(baked.ok ? [] : baked.problems), "Nothing was written."].join("\n"));
    return 1;
  }
  const folder = join(dirname(args.placePath), baked.placeId, "chunks");
  const written = await writeBakeFiles(folder, baked.files);
  console.log(`Baked ${baked.roadCount} roads into ${written - 1} squares in ${folder}, plus index.json.`);
  console.log(`The car starts ${baked.start.eastM.toFixed(2)} m east and ${baked.start.northM.toFixed(2)} m north of the centre, heading ${baked.start.headingDeg.toFixed(0)}°, on a ${baked.start.roadWidthM} m ${baked.start.oneWay ? "one-way" : "two-way"} road.`);
  for (const note of baked.notes) console.log(`Note: ${note}`);
  return 0;
}

// Run only as a command, not when a test imports readBakeArguments.
if (process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = await runBake(process.argv.slice(2));
}
