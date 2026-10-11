// start.json, at the top of the repo: which place and which vehicle the game
// opens with. It is data, so the engine never names a place; a link can ask
// for others with `?place=` and `?vehicle=` (scope 005 item 4).
// Design: docs/designs/src/place/start.md.
import { type FileCheck, validateJsonFile } from "./check-file.js";
import { type Infer, requireRecord, requireShortId } from "./parse.js";

const startChecker = requireRecord({
  place: requireShortId(),
  vehicle: requireShortId(),
});

export type StartChoice = Infer<typeof startChecker>;

// What the game opens, after the link has had its say.
export interface OpenChoice {
  placeId: string;
  vehicleId: string;
  notes: string[];
}

export function validateStartChoice(fileName: string, text: string): FileCheck<StartChoice> {
  return validateJsonFile(fileName, text, startChecker);
}

// A misspelt but well-formed id is caught by the file checks that follow (no
// such place file); here only the form is checked, so nothing but a short id
// ever reaches a file path. Query text is read with URLSearchParams (WHATWG
// URL Standard), which also decodes %20 and +.
export function startChoiceFromLink(start: StartChoice, query: string): OpenChoice {
  const asked = new URLSearchParams(query);
  const checkShortId = requireShortId();
  const chosen = { place: start.place, vehicle: start.vehicle };
  const notes: string[] = [];
  for (const field of ["place", "vehicle"] as const) {
    const fromLink = asked.get(field) ?? "";
    if (fromLink !== "" && checkShortId(fromLink, [field]).ok) {
      chosen[field] = fromLink;
    } else if (fromLink !== "") {
      notes.push(`The link asked for ${field} "${fromLink}", which is not a name the game can open, so it opened ${start[field]}.`);
    }
  }
  return { placeId: chosen.place, vehicleId: chosen.vehicle, notes };
}
