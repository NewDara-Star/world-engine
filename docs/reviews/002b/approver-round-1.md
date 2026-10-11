# Design approver report: src/place (batch 2)

Date: 2026-10-11. Role: delegated design approver (docs/roles/approver.md).
Judged: 17 designs. 11 sections of `docs/designs/src/place/parse.md` (from
`collect > inner function 2` to the end), all 4 in `place.md`, both in
`vehicle.md`. Each one was compared with its code in `src/place/` and its drawn
flow in `docs/flows/src/place/`.

**Result: 8 APPROVE, 9 ESCALATE.**

## How I checked, and what I did not do

- I read every design next to its code and its drawn flow, branch by branch.
  Every design matches its code: same decisions, same exits. The drawn flows
  only add the small branches inside `a && b` and `x ?? y`. No design is
  wrong about what the code does.
- I traced the edge cases below by reading the code. I could not run anything:
  running node from the scratchpad needs permission I was not given. So the
  edge cases are reasoned from the code, not run. The `constructor` / `toString`
  bug (finding A) follows directly from how JavaScript's `in` works on an object
  literal, and I am confident of it, but it has no test yet.
- No web search was needed. These are plain JavaScript questions, not ones of
  fact.
- No repo file was edited.

## Findings that apply to several designs

**A. A misspelt field can slip through silently (bug).** `unknownKeyErrors`
tests `key in shape`. The shape is an ordinary object, so `in` also sees names
it inherits from JavaScript: `constructor`, `toString`, `hasOwnProperty`,
`valueOf`, `__proto__` and others. A place file with a field called
`"constructor"` or `"toString"` is accepted with no error, and the field is
ignored. That is unlikely in practice, but it breaks the promise "every field
we do not know is reported". The fix is one word (`Object.hasOwn(shape, key)`)
plus a test. This is why `unknownKeyErrors` is escalated and not approved.

**B. The approved message upgrades cannot all be done with this design.** The
owner approved three upgrades to every message: name the file and line, give a
hint ("did you mean …"), and include the unit. But `validatePlace` and
`validateVehicle` receive JSON that has *already been read*, so the line
numbers are gone before checking starts, and no function knows the file name.
Messages say "the file", not `yaba.json line 12`. None of the designs in this
batch shows the hint or the line. So the upgrades need a design change at the
entry points: take the file name and raw text, keep where each field sits,
then check. That is a product decision (what the place-maker sees) and a
change of design, so it goes to the owner.

**C. "Every problem found" is not quite true.** The cross-field rules
(`refine`) only run once every single field is valid. And `placeProblem`
returns only the *first* rule broken. Example: a place file with a typo
`"nmae"`, the vehicle class `car` listed twice, and no air-density source. The
place-maker sees the typo only. Fix it, then they see "car twice". Fix that,
then they see "no source for airDensity". Three rounds for three mistakes.

**D. "the file" is worked out in two places** (`object`'s checker and
`refine`'s checker both write `path === "" ? "the file" : path`). CLAUDE.md
says one source of truth. Small, but if the file name arrives (finding B),
both must change together. It is best done as one small function, as part of
finding B.

## Per design

### 1. `collect > inner function 2` → `valueFromOneCheck`
- **Decision: APPROVE (delegated).**
- Why: it takes one check's value (or nothing) so the list of values can be
  built. The design matches the code and the flow exactly.
- Edge cases: a failed result gives an empty list, which is fine because
  `collect` has already returned the failure before that point. A value that
  is itself a list stays one item (`[value]`), so nothing gets flattened by
  accident. Name is good, and pairs with inner function 1.

### 2. `isPlainObject` → `isRecord`
- **Decision: APPROVE (delegated).**
- Why: correct and complete for anything JSON can produce: null and lists are
  turned away, objects are let through.
- Edge cases: things JSON never makes (dates, maps) would pass, but they cannot
  come from a file. `isRecord` is a fair name and matches `requireRecord`.

### 3. `unknownKeyErrors` → `problemsForUnknownFields`
- **Decision: ESCALATE.**
- Why: the flow matches the code, but it has the inherited-name bug (finding A),
  and it is the message a place-maker sees most often when they make a typo.
- Edge cases: `"constructor"`, `"toString"` and `"__proto__"` pass silently
  (bug). A typo `"nmae"` gives *two* separate messages: "nmae is not a field
  here (the fields are id, name, planet, … 15 names)" and "name: must be some
  text, got nothing". Nothing links them. That is exactly where "did you mean
  name?" was promised.
- **Question for the owner:** when someone misspells a field, should the game
  give one message, "`nmae` is not a field. Did you mean `name`?", in place of
  both messages and the list of all 15 fields? Think of a referee who says
  "offside, number 9" and not "someone on your team broke a rule; here is the
  squad list".
- **Recommendation:** yes. One message with the closest real field name, and
  the full list only when nothing is close. Also fix finding A in the same
  change, with a test.

### 4. `join` → `pathToField`
- **Decision: APPROVE (delegated).**
- Why: it adds a field name to a path, with no dot at the top level. Correct.
- Edge cases: after a list item it gives `dataSources[0].url`, which is right.
  `pathToField` says what it returns. Good name.

### 5. `object` → `requireRecord`
- **Decision: APPROVE (delegated).**
- Why: it only builds the checker. One step, matches the code.
- Note: the name follows the owner's `requireX` pattern. The message the player
  sees says "an object { … }", not "record". That is fine, because the name is
  for coders and the message is for place-makers.

### 6. `object > inner function 1` → `checkRecord`
- **Decision: ESCALATE.**
- Why: the design matches the code. But its messages are the ones the three
  upgrades were for, and they are not in the design (finding B). The flow also
  carries finding A.
- Edge cases checked: a list or `null` in place of the whole file gives "the
  file: must be an object { … }, got []". That is clear, but it has no line. A
  missing field says "got nothing", where "is missing" would be plainer. The
  design draws "check fields" before "add unknown-field errors", but the code
  lists the unknown-field errors *first*. Same branches, different order of
  messages; harmless, but the design should say which order is meant.
- **Question for the owner:** should a missing field say "`name` is missing"
  (with the line of the object it belongs in), and not "must be some text, got
  nothing"?
- **Recommendation:** yes, together with finding B. Then redraw this design.

### 7. `object > inner function 1 > inner function 1` → `problemsFromOneField`
- **Decision: APPROVE (delegated).**
- Why: it picks the errors out of one field result. Matches the code exactly.
  Clear name.
- Edge cases: a passed field gives no errors. Nothing else is possible.

### 8. `object > inner function 1 > inner function 2` → proposed `labelAndValueFromOneField`
- **Decision: ESCALATE (name only; the flow itself is correct).**
- Why: the flow is right. But "label" is the wrong word: what it returns is the
  field's *name* (its key) with its value. Nothing in the code is called a
  label, and a reader will look for one.
- **Question for the owner:** use `nameAndValueFromOneField`?
- **Recommendation:** `nameAndValueFromOneField`. It matches "field name",
  which the rest of the designs already use.

### 9. `refine` → proposed `addCrossFieldRule`
- **Decision: APPROVE (delegated)** for the flow (one step: build the checker).
- Name: `refine` is library jargon. `addCrossFieldRule` says what it does: it
  adds a rule that looks at several fields together. The checker is item 10.

### 10. `refine > inner function 1` → proposed `checkFieldsThenRule`
- **Decision: ESCALATE.**
- Why: correct to its design, but its behaviour is a product choice
  (finding C). The rule is skipped while any field is wrong, so place-makers
  fix their file in rounds.
- Edge cases: when the rule fails, it reports at "the file" (finding D), with no
  line. When the plain check fails, that failure is returned unchanged, which
  is correct.
- **Question for the owner:** should a place-maker see every mistake in one go
  where possible? Like a coach giving the whole half-time team talk, not one
  player at a time per match.
- **Recommendation:** keep "rules wait for the fields". A rule cannot judge
  broken fields, so this is the honest choice. But change the cross-field rules
  to report *all* their problems (see item 13), and add a line at the end of a
  failed check: "fix these first; some cross-checks run after".

### 11. `shortId` → proposed `requireShortId`
- **Decision: ESCALATE.**
- Why: the flow is right. But "short" is promised and not checked, and the
  pattern lets through ids a place-maker will regret.
- Edge cases: `yaba-` (ends with a dash) and `a--b` (two dashes) both pass. An
  id 200 letters long passes. The message says "letters" but means *lower-case*
  letters. "Yaba" fails, and the message does not say why (a capital Y). The
  approved "did you mean" upgrade fits here exactly: "did you mean `yaba`?"
- **Question for the owner:** what may an id look like? Ids are how files point
  at each other (`planet`, `roadRuleSetId`), and they likely end up in links
  and save files. That makes them hard to change later, like a squad number
  printed on shirts.
- **Recommendation:** lower-case letters and digits, single dashes between
  them, at most 32 characters. Where the fix is obvious, the hint should
  suggest it ("Yaba" → "did you mean `yaba`?").

### 12. `repeatedClass` → proposed `firstRepeatedVehicleClass`
- **Decision: APPROVE (delegated).**
- Why: it returns the first class listed twice, or nothing. Correct, and it
  matches the flow.
- Edge cases: an empty list cannot reach it (the list must have at least 1
  item). `car, car, car` reports `car` once. The new name says it is the first
  one, and that it is a *vehicle* class.

### 13. `missingSource` → proposed `firstConstantWithoutSource`
- **Decision: ESCALATE.**
- Why: this is the data rule ("never a silent guess") for physics values, gravity
  and air density, so it touches trust and physics.
- Edge cases: it finds a missing source. It does not notice *two* sources for
  gravity that might disagree (for example one `official`, one `owner-choice`).
  Then nobody knows which one the number in the file comes from. It also
  stops at the first missing constant (finding C).
- **Question for the owner:** should a place file be allowed to give gravity two
  sources? Like two referees for one match: who has the final word?
- **Recommendation:** exactly one source per constant. Report every missing
  constant and every repeated one in one go.

### 14. `placeProblem` → proposed `crossFieldProblemsInPlace`
- **Decision: ESCALATE.**
- Why: it returns only the first broken rule, so the place-maker learns about
  mistakes one at a time (finding C). Its messages also lack file and line
  (finding B).
- **Question for the owner:** same as item 10. Should all broken cross-field
  rules be listed together?
- **Recommendation:** yes. Return a list of problems, not one, and rename it to
  the plural. `refine` would then accept a list. That is a small change to item
  10's design.

### 15. `validatePlace` (name is fine; keep it)
- **Decision: ESCALATE.**
- Why: its design promises "failure with every problem found", which is not true
  (finding C). And it is where the file name and line must come in for the
  approved upgrade (finding B). Its input is already-read JSON, so as designed,
  "say the file and line" cannot be done.
- **Question for the owner:** the owner approved "say the file and line". That
  means the checker must receive the file's *text*, not the already-read data.
  OK to change this entry point to take the file name and text?
- **Recommendation:** yes. `validatePlace(fileName, text)`, which also turns
  "this is not valid JSON at line N" into a proper message, where today that is
  someone else's job.

### 16. `vehicle.ts module > inner function 1` → proposed `movementProblemInVehicle`
- **Decision: ESCALATE.**
- Why: the flow is right, but this is a rule about what vehicles are, which is
  product. The message goes to a place-maker.
- Edge cases: "a car cannot move as "hull" (it can be: wheeled)" is clear. But
  the rule checks only class against movement. A car with `steering: "yoke"`
  and `wheelPosition: "none"`, or a bike with a steering wheel, passes. For
  Lagos, there is also no class for a keke (three-wheeler) or an okada. Both
  are improvement ideas, so they go to the parking lot, not this scope.
- **Question for the owner:** should the vehicle file also refuse controls that
  don't fit the class (a bike with a steering wheel), the same way it refuses a
  car that floats?
- **Recommendation:** approve this rule as it is, with the new name. Park
  "controls must fit the class" and "keke / okada classes" as two lines in
  `PARKING_LOT.md`.

### 17. `validateVehicle` (name is fine; keep it)
- **Decision: APPROVE (delegated)**, with the condition that it follows
  whatever the owner decides for `validatePlace` (item 15). The two must stay
  the same shape.
- Why: one step, matches the code. Its "every problem found" claim has the same
  catch as item 15, but a vehicle has only one cross-field rule, so the catch
  barely bites here.

## Summary table

| # | Function | New name | Decision |
|---|---|---|---|
| 1 | collect > inner 2 | valueFromOneCheck | APPROVE |
| 2 | isPlainObject | isRecord | APPROVE |
| 3 | unknownKeyErrors | problemsForUnknownFields | ESCALATE |
| 4 | join | pathToField | APPROVE |
| 5 | object | requireRecord | APPROVE |
| 6 | object > inner 1 | checkRecord | ESCALATE |
| 7 | object > inner 1 > inner 1 | problemsFromOneField | APPROVE |
| 8 | object > inner 1 > inner 2 | nameAndValueFromOneField (not labelAnd…) | ESCALATE |
| 9 | refine | addCrossFieldRule | APPROVE |
| 10 | refine > inner 1 | checkFieldsThenRule | ESCALATE |
| 11 | shortId | requireShortId | ESCALATE |
| 12 | repeatedClass | firstRepeatedVehicleClass | APPROVE |
| 13 | missingSource | firstConstantWithoutSource | ESCALATE |
| 14 | placeProblem | crossFieldProblemsInPlace | ESCALATE |
| 15 | validatePlace | (keep) | ESCALATE |
| 16 | vehicle inner 1 | movementProblemInVehicle | ESCALATE |
| 17 | validateVehicle | (keep) | APPROVE |

Note for the orchestrator: a delegated approval covers the flow as drawn. Where
an approved design's function is renamed, the rename changes the design's
heading, and that makes it unapproved again until it is re-recorded.
