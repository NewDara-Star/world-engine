# Scope 002c, Session A: what changed in the designs

For the approver. One row per design that is new or changed: old name, new
name, and whether its flow changed and how. "New" means there was no function
before; "Removed" means the function goes. Research behind the ranges:
`research/34-planet-ranges.md`. The draft planet file: `planets/earth.json`.

Underneath, one data change, not a function: the vocabulary
(`src/place/vocabulary.ts`) gains one table giving each constant its unit
(`gravity` m/s², `airDensity` kg/m³), typed so every constant in
`CONSTANT_QUANTITIES` has exactly one unit. The planet file's `unit` fields and
the place's messages both read it, so they cannot disagree. `place.ts` gains
one table giving the place field for each constant (`gravity` in `gravityMs2`,
`airDensity` in `airDensityKgM3`). `index.ts` also exports `validatePlanet` and
the `Planet` type.

## planet.md (new file, `src/place/planet.ts`)

| Old | New | Flow changed? |
| --- | --- | --- |
| (none) | requirePlanetRange | New: one constant's range: `min`, `max`, `unit` (must be that constant's unit), `source`, `url`, `status`, plus the rule below (item 1). |
| (none) | minAboveMaxProblems | New: a range with `min` above `max` is refused at the `min` line; equal is allowed (item 5, "a planet file with a broken range"). |
| (none) | validatePlanet | New: checks a planet file by file name and line, through `validateJsonFile` (item 2). |

## parse.md

| Old | New | Flow changed? |
| --- | --- | --- |
| requireNumberBetween | requireNumberBetween | No (only the "why" line: it is now for numbers with fixed limits, such as latitude). |
| requireNumberBetween > checkNumberInRange | requireNumberBetween > checkNumberInRange | Yes: the ten-times hint is gone; "not a number" and "out of range" join into one branch, both with no hint (item 4: latitude 91 no longer gets "Did you mean 9.1?"). |
| tenTimesTooBigHint | (moved) place.md decimalPointSlipHint | Removed from parse.md; see place.md. |
| (none) | requireNumberAtLeast | New: a number with a floor only, in a unit (a place's gravity and air density; a range's `min` and `max`). |
| (none) | requireNumberAtLeast > checkNumberAtLeast | New: "must be a number of at least 0 m/s²; found …", no hint. |
| (none) | requireKnownId | New: an id that must name a file we know, with the kind in words (`planet`, `planets`) (item 3). |
| (none) | requireKnownId > checkIsKnownId | New: the id rule first; then "`planet` is `eart`; there is no such planet. Did you mean `earth`?", or the list of known ids, or "no planet file was found" when none (item 3). |
| rangeInWords | rangeInWords | No (example in the "why" line changed to degrees). |

## place.md

| Old | New | Flow changed? |
| --- | --- | --- |
| (parse.md) tenTimesTooBigHint | decimalPointSlipHint | Yes: moved here, the only place it is used; tries the point one place left, then two places left, and offers the first that lands inside the planet's range (so 98 and 980 both get "Did you mean 9.8?"). |
| (none) | planetRangeRule | New: one cross-field rule per constant, reading `planet` and the place field for that constant (item 3). |
| (none) | planetRangeRule > rangeProblemsOnPlanet | New: "`gravityMs2` must be from 9.76 to 9.84 m/s² on earth; found 98. Did you mean 9.8?"; a planet id not in the list is a fault in our code, never a silent pass (item 3). |
| (none) | placeCheckerFor | New: builds the place checker from the planets handed in: `planet` by `requireKnownId`; the two old rules plus `planetRangeRule` for each constant. Replaces the fixed `placeChecker` value. |
| validatePlace | validatePlace | Yes: takes the checked planets as a third input and uses `placeCheckerFor` them (item 3). |
| firstRepeatedVehicleClass, sourceProblemForOneConstant, sourceProblemsForConstants, repeatedClassProblemsInPlace | same | No. |

Not a function, but a behaviour change the approver should see: in the place's
shape, `gravityMs2` and `airDensityKgM3` change from `requireNumberBetween(0,
100, unit)` to `requireNumberAtLeast(0, unit)`, and `planet` from
`requireShortId()` to `requireKnownId(…)`.

## check-file.md and json-text.md

| Old | New | Flow changed? |
| --- | --- | --- |
| validateJsonFile | validateJsonFile | No. One node's words: "the checked place, vehicle or planet". |
| syntaxProblemInWords (its table) | same | No. Two sentences now say "A place, vehicle or planet file …" (rows "empty" and "nested too deeply"). |

## vehicle.md, closest-word.md

Unchanged.
