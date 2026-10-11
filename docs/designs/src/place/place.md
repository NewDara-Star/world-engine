# src/place/place.ts

Status: draft

The design for each function, written in plain words. The pictures drawn from the code are in `docs/flows/src/place/place.md`.

Redrawn for scope 002b: new names (item 1) and the new behaviour (items 2d and 2f). What changed is in `docs/reviews/002b/CHANGES.md`. The place's fields and their checkers are unchanged; only how the file is read and reported changes.

Changed for scope 002c (item 3): a place is checked against its planet. What changed is in `docs/reviews/002c/CHANGES.md`. In plain words:

- `validatePlace` is now handed the planets, already checked by `validatePlanet` (`planet.md`). The engine never reads `planets/` itself and never names a planet: whoever loads the files (the game's loader, the tests) reads every planet file, checks it, and hands the good ones in. So a Mars town later needs a `planets/mars.json`, never a code change.
- `planet` must be the id of one of those planets (`requireKnownId`, `parse.md`): "`planet` is `eart`; there is no such planet. Did you mean `earth`?".
- `gravityMs2` and `airDensityKgM3` on their own only need to be a number of at least 0 in their unit (`requireNumberAtLeast`); the old 0 to 100 limit, which let 98 through, is gone. Their real range is the planet's, checked by one rule per constant (`planetRangeRule`). A table in the file says which place field holds which constant (`gravity` in `gravityMs2`, `airDensity` in `airDensityKgM3`); units come from the vocabulary's one table of units, the same one the planet file is checked against.
- When `planet` is wrong, the range rules wait (there is no range to check against), and the report ends with "Fix these first; some cross-checks run after.", as for any waiting rule, so gravity is never silently passed.

## firstRepeatedVehicleClass

Why the game needs it: a vehicle class listed twice is a slip in the file, so we point at it.

```mermaid
flowchart TD
  s(["firstRepeatedVehicleClass in the allowed vehicle classes"])
  a(["return the first class that also appears earlier in the list, or nothing"])
  s --> a
```

## sourceProblemForOneConstant

Why the game needs it: the owner's data rule says each physical constant has exactly one source, so nobody has to guess which one the number came from.

```mermaid
flowchart TD
  s(["sourceProblemForOneConstant: one constant, such as gravity, and the list of sources"])
  a["count the sources that name this constant"]
  b{"how many"}
  c(["return a problem at constantsSources: has no source for the constant"])
  d(["return no problem"])
  e(["return a problem at the second source that names it: constantsSources has that many sources for the constant; each constant needs exactly one"])
  s --> a
  a --> b
  b -->|"none"| c
  b -->|"exactly one"| d
  b -->|"more than one"| e
```

## sourceProblemsForConstants

Why the game needs it: every constant with no source and every constant with more than one is listed in the same report, not just the first.

```mermaid
flowchart TD
  s(["sourceProblemsForConstants in the list of sources"])
  a(["return sourceProblemForOneConstant for every constant the place file must state (gravity, air density), put together"])
  s --> a
```

## repeatedClassProblemsInPlace

Why the game needs it: a vehicle class listed twice is reported in the same pass as every other mistake, as soon as the class list itself is good, whatever else in the file is wrong.

```mermaid
flowchart TD
  s(["repeatedClassProblemsInPlace with the allowed vehicle classes, once that list is good"])
  a["find firstRepeatedVehicleClass"]
  b{"is there one"}
  c(["return a problem at allowedVehicleClasses: lists that class twice"])
  d(["return no problems"])
  s --> a
  a --> b
  b -->|"yes"| c
  b -->|"no"| d
```

## decimalPointSlipHint

Why the game needs it: 98 for gravity is 9.8 with the point one place off, and 980 is 9.8 with it two places off; the scope asks for a correct hint for both. We say "Did you mean 9.8?" only when moving the point gives a value inside the planet's range, so the hint is right whenever it speaks. It is used only for physics constants checked against their planet, never for latitude or other numbers (scope 002c, item 4). The point is moved in the number's own text, not by dividing in binary, as before: dividing in binary prints 1.1 ÷ 10 as 0.11000000000000001, while `"1.1e-1"` reads as exactly 0.11 (run by us in Node 22).

```mermaid
flowchart TD
  s(["decimalPointSlipHint for a number outside the range, with the range's min and max"])
  a["move the point one place left, written without rounding noise"]
  b{"is that at least min and at most max"}
  c(["return that number as the hint"])
  d["move the point two places left instead, written without rounding noise"]
  e{"is that at least min and at most max"}
  f(["return that number as the hint"])
  g(["return nothing: no hint"])
  s --> a
  a --> b
  b -->|"yes"| c
  b -->|"no"| d
  d --> e
  e -->|"yes"| f
  e -->|"no"| g
```

A value too small (0.98 for 9.8) gets no hint in this scope.

## planetRangeRule

Why the game needs it: each constant a place states is checked against its own planet's range, one rule per constant, so a broken air density never holds back the gravity check, and each message points at its own line.

```mermaid
flowchart TD
  s(["planetRangeRule with the planets and one constant, such as gravity"])
  a["find the place field that holds the constant, from the table: gravityMs2 for gravity"]
  b(["return a rule reading planet and that field, whose problems are rangeProblemsOnPlanet"])
  s --> a
  a --> b
```

## planetRangeRule > rangeProblemsOnPlanet

Why the game needs it: says the planet's range, the planet and the unit in one sentence, with the hint only when it is right: "`gravityMs2` must be from 9.76 to 9.84 m/s² on earth; found 98. Did you mean 9.8?".

```mermaid
flowchart TD
  s(["rangeProblemsOnPlanet with the place's planet and the field's value, once both are good"])
  a["find the planet with that id among the planets"]
  b{"is it there"}
  x(["stop with a fault in our code: the planet field passed only because the id is one of these planets"])
  c["take that planet's range for the constant"]
  d{"is the value at least min and at most max"}
  e(["return no problems"])
  f["the sentence: labelForPath of the field, must be from min to max, the unit, on, the planet's id; found, the value."]
  g["find decimalPointSlipHint for the value and the range"]
  h{"is there a hint"}
  i["add: Did you mean, the hint, question mark"]
  j(["return one problem at the field with that sentence"])
  s --> a
  a --> b
  b -->|"no"| x
  b -->|"yes"| c
  c --> d
  d -->|"yes"| e
  d -->|"no"| f
  f --> g
  g --> h
  h -->|"yes"| i
  h -->|"no"| j
  i --> j
```

If two planet files share an id, the first one handed in is used; catching that is the loader's job (see the report for scope 002c).

## placeCheckerFor

Why the game needs it: the place checker depends on which planets exist, which only the loader knows, so it is built from the planets each time a place is checked. Everything else in it is as before.

```mermaid
flowchart TD
  s(["placeCheckerFor the planets"])
  a["the place's shape, as before, with planet checked by requireKnownId, kind planet and planets, among the planets' ids"]
  b["the rules: repeatedClassProblemsInPlace reading allowedVehicleClasses; sourceProblemsForConstants reading constantsSources; and planetRangeRule for every constant in the vocabulary"]
  c(["return addCrossFieldRules with that shape and those rules; the fields are checked once, and no rule waits for another"])
  s --> a
  a --> b
  b --> c
```

## validatePlace

Why the game needs it: adding a town is adding a file; this is the referee that checks it, by file name and line, against the planet it is on.

```mermaid
flowchart TD
  s(["validatePlace with the file's name, its text, and the planets already checked"])
  a(["return validateJsonFile with the name, the text, and placeCheckerFor the planets"])
  s --> a
```
