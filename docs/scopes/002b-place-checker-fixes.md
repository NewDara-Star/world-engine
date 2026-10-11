# Scope 002b: place checker names, fixes and clearer messages

Status: approved by Daramola (owner) in chat, 2026-10-11 ("approve all 9"),
on top of his approvals of batches 1 and 2 (2026-10-10 and 2026-10-11).
Architecture: V5, "Place file format" and "Diagram first".

## Goal

The place and vehicle checker (`src/place/`) has names that say what each
function does, catches every mistake a place-maker can make in one pass, and
tells them where and how to fix it: file and line, a hint where the fix is
obvious, the unit, and what was found against what was needed. Its designs are
approved, so the diagram gate can be switched on.

## Why the game needs it

Adding a town is adding a file, not code. Whoever writes that file (Daramola,
later a partner or a player) is not a coder. The checker is the referee: it
must spot every foul in one inspection and say, in plain words, which line and
what to change. A mistake it misses (a misspelt field silently ignored) makes
cars float or drive on the wrong side.

## This scope runs in two sessions

**Session A (designs only, no code):** do items 1 and 2. Commit the designs
with `Status: draft` and no approval trailer. Stop and write a report.
The delegated approver (`docs/roles/approver.md`) then judges them, and the
owner hears about anything it escalates.

**Session B (code):** only after the orchestrator says the designs are
approved. Do items 3 to 6, with code that matches the approved designs.

## In scope

1. **Renames** (types first, then `npm run typecheck`, per CLAUDE.md). Old
   name → new name. "inner" means the function a builder returns.

   | Old | New |
   | --- | --- |
   | show | previewForError |
   | good | accept |
   | bad | reject |
   | someText | requireText |
   | someText > inner | checkTextIsNotBlank |
   | textMatching | requireTextMatching |
   | textMatching > inner | checkTextMatchesFormat |
   | numberBetween | requireNumberBetween |
   | numberBetween > inner | checkNumberInRange |
   | oneOf | requireOneOf |
   | oneOf > isOption | isAllowedWord |
   | oneOf > inner | checkIsAllowedWord |
   | listOf | requireListOf |
   | listOf > inner | checkEveryItemInList |
   | collect | gatherAllProblems |
   | collect > inner 1 | problemsFromOneCheck |
   | collect > inner 2 | valueFromOneCheck |
   | isPlainObject | isRecord |
   | unknownKeyErrors | problemsForUnknownFields |
   | join | pathToField |
   | object | requireRecord |
   | object > inner 1 | checkRecord |
   | object > inner 1 > inner 1 | problemsFromOneField |
   | object > inner 1 > inner 2 | nameAndValueFromOneField |
   | refine | addCrossFieldRules |
   | refine > inner 1 | checkFieldsThenRules |
   | shortId | requireShortId |
   | repeatedClass | firstRepeatedVehicleClass |
   | missingSource | sourceProblemsForConstants (now returns a list, item 2f) |
   | placeProblem | split into two rules, each run as soon as its own field is valid: the repeated-class rule and the source rule (Session A finding; orchestrator decision 2026-10-11) |
   | vehicle.ts module > inner 1 | movementProblemInVehicle |
   | validatePlace, validateVehicle | keep |

   Inner functions get these names by becoming named functions (a named
   `const` or `function`), so the flow generator draws them under the name.

2. **Behaviour changes the owner approved** (draw each in the designs first):
   a. **Prototype-name bug.** A field called `constructor`, `toString`,
      `__proto__`, `hasOwnProperty` or `valueOf` must be reported as unknown,
      never silently accepted. Use `Object.hasOwn`, and make sure `__proto__`
      in parsed JSON is seen as an own field.
   b. **One message for a misspelt field.** When an unknown field is close to
      an expected field that is missing (for example `nmae` and `name`),
      give one message: "`nmae` is not a field. Did you mean `name`?", and no
      separate "name is missing" for it. The full list of fields only when
      nothing is close. "Close" is a small edit distance (Damerau-Levenshtein,
      at most 2, or at most a third of the word's length, whichever is
      smaller; cite the definition you use). The same closest-word hint is used
      for allowed words ("drivingSide must be one of left, right; found
      `rihgt`. Did you mean `right`?").
   c. **"is missing".** A missing field says "`name` is missing", not "must be
      some text, got nothing".
   d. **File and line.** `validatePlace(fileName, text)` and
      `validateVehicle(fileName, text)` take the file's name and its raw text.
      They read the JSON themselves (invalid JSON becomes a normal message with
      its line), keep where each field sits, and every message starts
      `yaba.json line 12:`. For a missing field, the line is where its object
      starts. Find an existing MIT or Apache way to map JSON paths to lines
      (for example `jsonc-parser` from Microsoft, MIT) before writing one;
      record the choice in `research/`. "the file" is worked out in one place
      only.
   e. **Units and counts.** A number out of range names the unit from the
      field's definition ("gravity must be from 1 to 30 m/s², found 98").
      A list that is too short says how many were found and how many are
      needed. A hint where the fix is obvious ("did you mean 9.8?" for a value
      10 times too big that fits when divided by 10, and only then; gravity's
      current range is 0 to 100, so the gravity example cannot happen yet,
      see `PARKING_LOT.md`).
   f. **Every cross-field problem at once.** Each cross-field rule runs as soon
      as the fields it reads are valid, alongside the field checks, not after
      the whole file is valid. Every broken rule is listed, not just the first.
      `sourceProblemsForConstants` lists every constant with no source and
      every constant with more than one source (exactly one source each, the
      owner's data rule). When a rule cannot run because a field it needs is
      wrong, the report ends: "Fix these first; some cross-checks run after."
   g. **Ids.** `requireShortId`: lower-case letters and digits, single dashes
      between them, at most 32 characters. `Yaba` gets "did you mean `yaba`?",
      `omole phase 1` gets "did you mean `omole-phase-1`?".
   h. `validateVehicle` keeps the same shape as `validatePlace`.

3. **Code** for items 1 and 2, matching the approved designs exactly. Block
   references at the top of each block (CLAUDE.md). Complexity and depth
   rules unchanged.

4. **Tests**, four paths each, names saying the rule. At least: every
   prototype name is rejected (a test that fails before the fix); `nmae` gives
   one message; `rihgt` suggests `right`; `Yaba`, `yaba-`, `a--b` and a
   33-character id are refused; three mistakes in different places are all
   reported in one run; two sources for gravity is refused; invalid JSON names
   its line; every message about a field names the file and line (the closing
   "Fix these first" line names the file only); a very large place file
   (tragedy path) is still checked in under a second.

5. **Diagram gate accepts delegated approval.** `diagram-gate.sh` accepts a
   design as approved when its last commit has either trailer, as a whole
   line: `Approved-by: Daramola` or
   `Approved-by: reviewer (delegated by Daramola)`. Anything else, including
   `Approved-by: reviewer` alone, still blocks. Tests for both, and for the
   near misses. Update CLAUDE.md's "Diagram first" section to say who may add
   which trailer (owner decisions vs the approver's, `docs/roles/approver.md`).

6. `npm run diagrams`; `npm run check` passes. The orchestrator, not this
   session, records the approval stamps and commits the three held files that
   wire the gate in.

## Out of scope

New vehicle classes (keke, okada) and "controls must fit the class": both are
in `PARKING_LOT.md`. Any game code. Any change to the place file format other
than how it is read.

## Design diagram

The approvals doc (owner-approved batches 1 and 2, the approver's report and
the owner's "approve all 9"), and the redrawn designs Session A writes, once
approved.

## Done when

- Every function in `src/place/` has its new name, and a design under that
  name that matches its drawn flow.
- The tests above pass, and the prototype test failed before the fix.
- The gate accepts both trailers and blocks near misses, with tests.
- `npm run check` passes. Small commits, each in `src/` with a `Story:`
  paragraph. Do not push.

## References

- `docs/roles/approver.md`, and the approver's report (in the approvals doc).
- `research/30-place-constants.md` (units and sources of the constants).
- CLAUDE.md, all of it.
