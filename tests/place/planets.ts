// The planets a place is checked against, loaded the way the game's loader
// will: every file in planets/, each checked, the good ones handed in. The
// engine never reads planets/ itself (scope 002c, item 6).
import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { validatePlanet, type Planet } from "../../src/place/index.js";

export const planetsDir = resolve(import.meta.dirname, "../../planets");

export function readPlanetText(file: string): string {
  return readFileSync(resolve(planetsDir, file), "utf8");
}

export function planetFiles(): string[] {
  return readdirSync(planetsDir).filter((name) => name.endsWith(".json"));
}

export function goodPlanet(file: string): Planet {
  const checked = validatePlanet(file, readPlanetText(file));
  if (!checked.ok) throw new Error(checked.messages.join("\n"));
  return checked.value;
}

export function knownPlanets(): Planet[] {
  return planetFiles().map(goodPlanet);
}
