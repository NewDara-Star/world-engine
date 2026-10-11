# Scope 002b, Session A: what changed in the designs

For the approver. One row per design: old name, new name, and whether its flow
changed. "New" means there was no function before. Research behind the new
pieces: `research/33-json-lines.md`.

Everywhere, one change underneath: a check now returns **problems** (a field
path and a sentence) instead of finished text, and a failure can say that a
cross-check waited. The file name and line are added once, at the end
(`check-file.md`). Failure sentences now read "must be …; found …" instead of
"must be …, got …".

## parse.md

| Old | New | Flow changed? |
| --- | --- | --- |
| show | previewForError | No. |
| good | accept | No. |
| bad | reject | Yes: takes an optional hint and adds "Did you mean …?"; the label comes from labelForPath. |
| (none) | problemAt | New: a problem is a path and a sentence. |
| (none) | labelForPath | New: the one place that calls the top "the file" (2d). |
| join | pathToField | Yes: a path is now a list of names and positions, not dotted text. |
| someText | requireText | No. |
| someText > inner | checkTextIsNotBlank | No (now a top-level function: it needs nothing from requireText). |
| textMatching | requireTextMatching | Yes: also takes an optional suggester. |
| textMatching > inner | requireTextMatching > checkTextMatchesFormat | Yes: text vs not text split; offers the suggester's fix as a hint (2g). |
| numberBetween | requireNumberBetween | No. |
| numberBetween > inner | requireNumberBetween > checkNumberInRange | Yes: wrong kind vs out of range split; out of range adds the ten-times hint (2e). |
| (none) | rangeInWords | New: "a number from 1 to 30 m/s²" (2e). |
| (none) | tenTimesTooBigHint | New: "Did you mean 9.8?" only when a tenth fits (2e). |
| oneOf | requireOneOf | No. |
| oneOf > isOption | requireOneOf > isAllowedWord | No. |
| oneOf > inner | requireOneOf > checkIsAllowedWord | Yes: text gets the closest allowed word as a hint (2b). |
| listOf | requireListOf | No. |
| listOf > inner | requireListOf > checkEveryItemInList | Yes: "not a list" and "too short" split; too short says found vs needed (2e). |
| (none) | itemsInWords | New: "1 item", "3 items" (2e). |
| collect | gatherAllProblems | Yes: also carries "a cross-check waited". |
| collect > inner 1 | problemsFromOneCheck | No (now top-level). |
| collect > inner 2 | valueFromOneCheck | No (now top-level). |
| isPlainObject | isRecord | No. |
| (none) | missingFields | New: own fields only, `Object.hasOwn` (2a). |
| (none) | unknownFieldsWithGuesses | New: unknown own fields, including `constructor`, `__proto__` (2a), each with its closest missing field (2b). |
| unknownKeyErrors | problemsForUnknownFields | Yes: "Did you mean" when there is a guess; the full field list only when there is none (2b). |
| (none) | problemsForMissingFields | New: "`name` is missing", silent when a guess covers it (2b, 2c). |
| object | requireRecord | No. |
| object > inner 1 | requireRecord > checkRecord | Yes: missing and unknown worked out first; a field that is absent is never handed to its checker (2c). |
| object > inner 1 > inner 1 | problemsFromOneField | No (now top-level). |
| object > inner 1 > inner 2 | nameAndValueFromOneField | No (now top-level). |
| refine | addCrossFieldRules | Yes: takes the shape and the fields the rule reads, not a finished checker (2f). |
| refine > inner 1 | addCrossFieldRules > checkFieldsThenRules | Yes: the rule also runs when other fields are wrong, as long as its own fields are good; otherwise marks "waited" (2f). |
| (none) | valuesReadByRule | New: the rule's fields, only if all are present and good (2f). |
| shortId | requireShortId | Yes: new rule, letters and digits, single dashes between, at most 32; first character may now be a digit, as 2g reads (2g). |
| (none) | shortIdSuggestion | New: `Yaba` → `yaba`, `omole phase 1` → `omole-phase-1` (2g). |

## place.md

| Old | New | Flow changed? |
| --- | --- | --- |
| repeatedClass | firstRepeatedVehicleClass | No. |
| missingSource | sourceProblemsForConstants | Yes: returns every constant with none or more than one source, not the first with none (2f). |
| (none) | sourceProblemForOneConstant | New: none, one or more than one, for one constant (2f). |
| placeProblem | split: repeatedClassProblemsInPlace, plus sourceProblemsForConstants as its own rule | Yes: two rules, each run as soon as its own field is good, so a broken source list never holds back the class check (2f; orchestrator decision on session A's finding). |
| validatePlace | validatePlace | Yes: takes the file name and raw text, through validateJsonFile (2d). |

## vehicle.md

| Old | New | Flow changed? |
| --- | --- | --- |
| module > inner function 1 | movementProblemInVehicle | Yes (small): returns a list, and the problem now points at the `dynamics` line, not the whole file. |
| validateVehicle | validateVehicle | Yes: same shape as validatePlace (2h). |

## New design files

| File | Functions | Why |
| --- | --- | --- |
| `json-text.md` | readJsonText, lineStartOffsets, lineAtOffset, lineOfPath, syntaxProblemInWords | Reads the text with jsonc-parser 3.3.1 (MIT) and finds lines (2d). |
| `closest-word.md` | editDistance, editCostAt, closeEnoughLimit, closestWord | "Did you mean" for fields, allowed words (2b). |
| `check-file.md` | validateJsonFile, messageForProblem | One way to check a file, for places and vehicles: file and line on every message, and the "Fix these first" ending (2d, 2f, 2h). |

## For Session B

- A callback with a decision in it gets its own drawn flow as "inner function
  N", which has no design. Write such callbacks as named functions (the names
  above), or keep them free of decisions.
- `jsonc-parser` is not installed yet. It goes in `dependencies`, pinned
  exactly to `3.3.1`.

## Round 2: after the approver's report

Redrawn from `APPROVER-REPORT-002b.md`. Every FIX, plus E1 as the
orchestrator recommended (pending the owner). E2 is unchanged: found values
stay shown as JSON. Nothing the approver approved was redrawn except where a
fix reached it, as listed. jsonc-parser was run this time; the facts are in
`research/33-json-lines.md`, "Round 2 measurements".

| Design | Function | What changed | Why |
| --- | --- | --- | --- |
| parse.md | addCrossFieldRules | Takes a list of rules, each with the fields it reads. | F1: two rules on one object could not be drawn. |
| parse.md | checkFieldsThenRules | Runs the field checks once, then each rule through problemsFromOneRule, then puts everything together. | F1. |
| parse.md | addCrossFieldRules > problemsFromOneRule | New. One rule: runs on the checked object, or on its own good fields, or waits. The "run the rule" step is now drawn in both branches. | F1. |
| parse.md | checkEveryItemInList | A list that is too short still has every item checked; the count problem comes first, then the items' problems. | F2. |
| parse.md | previewForError | A number too big to hold shows as "a number too big to use", never `null`. | F3. |
| parse.md | requireShortId | Rule says "letters a to z" and "digits 0 to 9". | F4. |
| parse.md | shortIdSuggestion | No suggestion when a letter or digit other than a to z or 0 to 9 is left after taking accents off (`Ɗanbatta`, `ß`). | F4. |
| place.md | validatePlace | Passes a list of two rules to addCrossFieldRules. | F1. |
| json-text.md | readJsonText | A byte-order mark becomes a space; an empty or blank file gets its own kind; running out of room (deep nesting) gets its own kind; "made no tree" is not the same as a file that is just `null`. | F6, F7. |
| json-text.md | lineStartOffsets | `\r\n` is one break; `\r` or `\n` alone is one each. | F5. |
| json-text.md | lineOfPath | Finds its part with usedNodeAtPath. | E1: point at the copy that is used. |
| json-text.md | usedNodeAtPath | New. Walks a path taking the last copy of a repeated field. | E1. |
| json-text.md | problemsForRepeatedFields | New. Finds every field written twice, in every object. | E1. |
| json-text.md | problemForRepeatedField | New. "`name` is written twice, on lines 9 and 31; keep one." | E1. |
| json-text.md | syntaxProblemInWords | Subject from labelForPath ("the file"); full table of sentences written into the design. | F7 (and E3, for the owner). |
| closest-word.md | closestWord | Skips a word whose length differs by more than its limit before measuring. | F8. |
| check-file.md | validateJsonFile | Lists line starts first (the syntax error needs them too), and adds the repeated-field problems, first in the report. | E1. Approved as it stood in round 1; changed because E1 needs the tree, which only it holds. |

Not touched: `vehicle.md` (the approver said it needs no change for F1).

For Session B, in addition to the notes above: the "nested too deeply" depth
was measured at about 2,560 in Node 22, so a test with 20 000 levels is far
past it; and only a stack overflow (RangeError) becomes that message, any
other crash stays a crash.
