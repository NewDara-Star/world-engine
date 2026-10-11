# Approver report 2: Scope 002b redrawn designs (`docs/designs/src/place/`)

Written 2026-10-11 by the delegated design approver (`docs/roles/approver.md`).
I wrote none of these designs.

## What I compared, and what I could not do

- Each design against `docs/scopes/002b-place-checker-fixes.md` (items 1 and 2),
  using `CHANGES-002b.md` as the guide and `research/33-json-lines.md` for the
  reader and the distance. I did not compare with code or `docs/flows/`, as asked.
  I read today's `src/place/*.ts` only to see what the old `refine` could compose.
- **Not run:** this sandbox refused `npm pack jsonc-parser@3.3.1`, so I could not
  run jsonc-parser. Where a finding depends on how jsonc-parser behaves, I say it
  comes from the research note or from my knowledge of its source, and Session B
  should confirm it with a test first.
- Owner decisions I treated as settled: every rename in item 1, all of items 2a
  to 2h, the split of `placeProblem` into two rules, and the "only ten times too
  big" hint rule.

Decisions use three words: **APPROVE**, **FIX** (wrong or incomplete against the
scope: the orchestrator fixes it, no owner question), **ESCALATE** (the owner has
not decided it).

---

## Blocking findings first

### F1. Two cross-field rules cannot be drawn with the current `addCrossFieldRules` (parse.md, place.md)

`validatePlace` says "the place's shape with two cross-field rules added", but
`addCrossFieldRules` takes **a shape**, one list of fields and **one** rule, and
returns a checker. A checker cannot be handed to a second `addCrossFieldRules`,
because that wants a shape. (The old `refine` took a checker, so nesting worked;
the redraw lost that.) Wrapping the shape twice would run every field check
twice and report every field mistake twice.

**Fix:** `addCrossFieldRules` takes the shape and a **list** of rules, each with
the fields it reads. `checkFieldsThenRules` runs the plain checker once, then for
each rule: if the plain check passed, run it on the checked object; otherwise
`valuesReadByRule` for that rule, and run it or mark "a cross-check waited".
Each rule's problems get the object's path in front. Draw a small helper for
"one rule's problems, or waiting" (for example `problemsFromOneRule`) so
`checkFieldsThenRules` stays under complexity 8. Also draw the "run the rule"
step in the failed-but-fields-good branch: today node `i` says "the rule's
problems" without drawing that the rule runs. `vehicle.md` then passes a list
with one rule.

### F2. A list that is too short hides its items' mistakes (parse.md, `checkEveryItemInList`)

When a list has fewer items than needed, the flow returns at once and never
checks the items it has. With `dataSources` needing 1, that cannot bite today,
but any list needing 2 or more would report "needs at least 2 items; found 1"
now, and the bad `url` in that one item on the next run. The scope's goal is
"catches every mistake in one pass".

**Fix:** when the list is too short, still check every item, and return the
count problem **plus** the items' problems (through `gatherAllProblems`, so a
waiting cross-check is still carried).

### F3. A number too big to read is shown as `null` (parse.md, `previewForError`)

The research shows `{"gravityMs2": 1e400}` is accepted by the reader as
Infinity. `checkNumberInRange` rightly refuses it, but `previewForError` writes
the value as JSON, and JSON writes Infinity as `null`. The message would say
"gravityMs2 must be a number from 0 to 100 m/s²; found null" about a line that
plainly has a number on it. That is a misleading message.

**Fix:** `previewForError` has a branch for a number that is not finite and
shows it in words ("a number too big to use"), never `null`.

### F4. `shortIdSuggestion` can suggest a wrong id for Nigerian names (parse.md)

Taking accents off works for Yoruba (`Ọ̀yọ́` → `oyo`), but Hausa's hooked letters
`ɓ ɗ ƙ ƴ` (and `ø`, `ß`, `ł`) have no accent to take off. If "not a letter or
digit" means "not a–z or 0–9", step b turns `Ɗanbatta` into `anbatta` and offers
it as the fix: a wrong id, one copy-and-paste away. If it means "any letter",
the result fails the id rule and there is simply no hint.

**Fix:** say "letters a to z" everywhere: in `requireShortId`'s rule (today
"lower-case letters" could be read as including `ọ`) and in step b. And add the
rule: if any letter other than a–z is left after taking accents off, return no
suggestion. A test: `Ɗanbatta` gets no "Did you mean".

### F5. Line breaks are not defined (json-text.md, `lineStartOffsets`)

"After every line break" does not say what a line break is. If `\r` and `\n` are
each counted, a file saved on Windows (`\r\n`) gets every line number doubled
from the first line on, and every message points at the wrong line. If only
`\n` is counted, a file with old Mac endings (`\r` alone) is all "line 1".

**Fix:** draw it as TypeScript's `computeLineStarts` (the technique the research
cites) does: `\r\n` is one break, and `\n` or `\r` alone is one break each. Test
with a `\r\n` file.

### F6. Three holes in `readJsonText` (json-text.md)

1. **Byte-order mark.** Windows Notepad and some editors put an invisible mark
   (U+FEFF) at the start. The research shows jsonc-parser refuses it. The same
   file would then **pass in the game but fail in the checker**: the browser's
   `fetch(...).text()` removes the mark, while Node's `readFileSync(..., "utf8")`
   keeps it. The place-maker would get "line 1: not valid JSON" with nothing
   visible to fix. JSON's standard allows readers to ignore the mark
   (RFC 8259, section 8.1, "MAY ignore the presence of a byte order mark rather
   than treating it as an error"; from my knowledge of the RFC, not opened
   this session). **Fix:** remove one mark at the very start before reading,
   and count offsets on the text without it.
2. **A file the reader cannot finish.** jsonc-parser reads nested brackets
   by calling itself, so a file nested thousands deep (`[[[[…`) can run out of
   stack and throw instead of returning an error. Not run here (see the top);
   Session B should test 20 000 levels. **Fix:** if the reader throws, return
   "not read" with a kind of its own ("nested too deeply"), so it becomes a
   normal message and never a crash. This matters more once partners or
   players send files.
3. **"Find nothing at all"** must mean the reader made no tree, not that the
   file is the JSON value `null`. A file that is just `null` should reach the
   checker and get "the file must be an object in curly brackets; found null".
   Say so in node `b`.

### F7. Syntax messages have no subject, and their wording is not on the page (json-text.md, `syntaxProblemInWords`)

`validateJsonFile` writes "file name, line, then `syntaxProblemInWords`", and
that returns "is not valid JSON, …". The result is
"yaba.json line 7: is not valid JSON, a comma is missing…": a sentence
with no subject. And the table only gives four examples, so the sentences
the place-maker will read are not in the design.

**Fix:** start the sentence "the file is not valid JSON here: …", and write the
**whole** table into the design: one plain sentence for each of jsonc-parser's
16 error kinds, plus an empty file ("the file is empty") and "nested too
deeply" (F6). One wording fact to build in: when a comma is missing at the end
of line 7, jsonc-parser reports the error where the next field starts, on
line 8 (from my knowledge of its parser, which flags the next token; not run
here). So the comma sentence should say "a comma is missing before this, at the
end of the line above or here", or the place-maker will stare at a correct
line 8. A missing closing bracket is reported at the end of the file, far from
the bracket that was left open, so its sentence should say "a `{` or `[` opened
earlier is never closed". Once the table is written, it is new wording for the
owner to see (see E3).

### F8. A huge typed value builds a huge table (closest-word.md, `closestWord`)

`checkIsAllowedWord` asks `closestWord` for any text, so a whole paragraph
pasted into `drivingSide` (say 5 MB) builds a table of 5 million rows for each
allowed word before throwing every word away for being too far. That is slow
and can run out of memory, which breaks the "very large file in under a
second" test.

**Fix:** in `closestWord`, before measuring, skip a word whose length differs
from what was typed by more than that word's `closeEnoughLimit`. This changes
no answer, because the distance is never smaller than the difference in length.

---

## Escalations for the owner

### E1. The same field written twice (json-text.md, `lineOfPath`; parse.md, `checkRecord`)

**Why the game needs to decide:** a place file with `"gravityMs2": 9.8` near
the top and `"gravityMs2": 98` further down is quietly read as **98**, the
last one, with no message. Worse, if 98 is then refused, the message points at
the **first** line, which says 9.8 and looks right. (Both facts are from the
research note's own tests of jsonc-parser.) It is like two players wearing the
same shirt number: the referee books the wrong one, and the one who fouled
plays on. Session A raised it; I found no decision on it.

**Recommendation:** add it to this scope as one more check: "`gravityMs2` is
written twice, on lines 9 and 31; keep one." The reader already has both copies
in its tree, so it is a small check, and without it the line numbers can lie,
which defeats item 2d. If the owner prefers to keep 002b tight, it goes to
`PARKING_LOT.md` instead, but then the duplicate case should at least have a
test that records today's behaviour.

### E2. How a found value is shown (parse.md, `reject`)

**Why it matters:** the scope's approved example reads
"found `rihgt`" (back-quotes). The design instead shows the value as it is
written in the file: found `"rihgt"` (with quote marks), so the text `"9.8"`
and the number `9.8` look different. That difference is real: a number typed
in quotes is a common slip, and "must be a number; found 9.8" would be
baffling.

**Recommendation:** keep the design: show the value exactly as it is written in
the file, quote marks included. It is what the place-maker sees on the line, so
they can find it with the editor's search. The owner only needs to agree that
the scope's example changes from `rihgt` to `"rihgt"`.

### E3. The plain sentences for broken JSON (after F7)

Once F7 writes the full table, those sentences are new wording a place-maker
reads ("a comma is missing…", "the file is empty"). The owner should see the
table once. **Recommendation:** approve it as a batch, with the comma and
missing-bracket sentences worded as in F7.

---

## Per design

### parse.md

| Function | Decision | Why, edge cases checked |
| --- | --- | --- |
| previewForError | **FIX** | F3: Infinity shown as `null`. Otherwise right: cut on long text; "nothing" for what JSON cannot write. |
| accept | APPROVE | Plumbing. |
| problemAt | APPROVE | Plumbing. A problem is a path and a sentence; the line is added later, once. |
| reject | APPROVE (wording in E2) | "must be …; found …", hint only when given. A missing field never reaches it (2c holds, see checkRecord). |
| labelForPath | APPROVE | The only place that says "the file" (2d). Checked nested paths in lists: `dataSources[0].url`. Small note: a field name that itself contains a dot or a back-quote would read oddly; harmless, it is reported as unknown anyway. |
| pathToField | APPROVE | List of names and positions, so lines can be found for list items. |
| requireText | APPROVE | Builder only. |
| checkTextIsNotBlank | APPROVE | Session B: "spaces" should mean any whitespace, including tabs, new lines and the no-break space; JavaScript's `\s` covers all three. |
| requireTextMatching | APPROVE | Builder only. |
| checkTextMatchesFormat | APPROVE | Not text → no hint; wrong form → hint from the suggester when there is one. |
| requireNumberBetween | APPROVE | Builder only; unit comes from the field's definition (2e). |
| checkNumberInRange | APPROVE | Not a number or not finite split from out of range. Text `"9.8"` is refused as not a number, and E2 makes that visible. |
| rangeInWords | APPROVE | With and without a unit. |
| tenTimesTooBigHint | APPROVE | Exactly the scope's rule. Note, already in the parking lot: with gravity's range 0 to 100, any value from 101 to 1000 gets a hint (150 → "Did you mean 15?"). The scope accepted this. |
| requireOneOf | APPROVE | Builder only. |
| isAllowedWord | APPROVE | Exact match only. |
| checkIsAllowedWord | APPROVE | `rihgt` → `right`. A tie between two allowed words gives no hint (closestWord). `LEFT` gets no hint (4 edits); fine, see the note under closestWord. |
| requireListOf | APPROVE | Builder only. |
| checkEveryItemInList | **FIX** | F2: too short stops the item checks. |
| itemsInWords | APPROVE | 0 → "0 items", 1 → "1 item". |
| gatherAllProblems | APPROVE | Carries "a cross-check waited" up from any item. Empty list → accept an empty list. |
| problemsFromOneCheck | APPROVE | Plumbing. |
| valueFromOneCheck | APPROVE | Plumbing. |
| isRecord | APPROVE | jsonc-parser makes objects with no prototype (`Object.create(null)`, per the research). This design does not ask about the prototype, so they pass. Session B: keep it that way and test it. |
| missingFields | APPROVE | Own fields only (`Object.hasOwn`), so `constructor` in the shape's lookup can never count as present (2a). |
| unknownFieldsWithGuesses | APPROVE | Own fields of the record that are not own fields of the shape, so `__proto__`, `constructor`, `toString` are reported (2a). Guesses only among **missing** fields, so `nam` next to a present `name` gets the full list, correctly. Two typos of the same field (`nmae`, `naem`) both get "Did you mean `name`?": acceptable. |
| problemsForUnknownFields | APPROVE | One message per unknown field; full list only with no guess (2b). Checked: a missing field plus an unknown field that is far from it gives two messages, "`title` is not a field here…" and "`name` is missing", which is right. |
| problemsForMissingFields | APPROVE | Silent when a guess covers it (2b), "is missing" otherwise (2c). Points at the object's path, so its line is where the object starts (2d). |
| requireRecord | APPROVE | Builder only. |
| checkRecord | APPROVE | Missing and unknown first, absent fields never handed to a checker (2c). Session B: walk the **shape's** fields and look each up in the record only if it is an own field; never look up `shape[key]` for a key from the file (that is how `constructor` slipped through before). Duplicates: E1. |
| problemsFromOneField | APPROVE | Plumbing. |
| nameAndValueFromOneField | APPROVE | Plumbing. |
| addCrossFieldRules | **FIX** | F1: must take a list of rules. |
| checkFieldsThenRules | **FIX** | F1: run the plain check once, then each rule runs or waits on its own; draw the "run the rule" step in node `i`'s branch. Checked: a rule whose field is **missing** waits, the missing field is reported, and the report ends "Fix these first" (2f). |
| valuesReadByRule | APPROVE | Per rule, own fields only, each re-checked by its own checker. Not a record → wait. Works unchanged once F1 calls it once per rule. |
| requireShortId | **FIX** (small, part of F4) | Rule matches 2g (`Yaba`, `yaba-`, `a--b`, 33 characters all refused; a leading digit allowed). Say "a to z", not "lower-case letters". |
| shortIdSuggestion | **FIX** | F4: Hausa letters must give no suggestion, never a wrong one. Checked: `Yaba` → `yaba`, `omole phase 1` → `omole-phase-1`, `yaba-` → `yaba`, `a--b` → `a-b`, `!!!` → nothing, still over 32 → nothing. |

### place.md

| Function | Decision | Why, edge cases checked |
| --- | --- | --- |
| firstRepeatedVehicleClass | APPROVE | Rename only. Only the first repeat is named; the scope kept that name, so it is decided. |
| sourceProblemForOneConstant | APPROVE | None / exactly one / more than one, the owner's data rule. With three sources: one problem at the second, saying three. A source item with a wrong `quantity` fails its own check, so the rule waits: right. |
| sourceProblemsForConstants | APPROVE | Every constant, put together (2f). |
| repeatedClassProblemsInPlace | APPROVE | Runs as soon as its own list is good (orchestrator decision). Note, not blocking: it points at the line of `allowedVehicleClasses`, while the source rule points at the exact item; pointing at the repeated item would be more useful in a long list. Parking-lot material. |
| validatePlace | **FIX** | F1: needs the list form of `addCrossFieldRules`. Otherwise matches 2d and 2f. |

### vehicle.md

| Function | Decision | Why, edge cases checked |
| --- | --- | --- |
| movementProblemInVehicle | APPROVE | Returns a list; points at `dynamics`. Runs only when `class` and `dynamics` are both good. |
| validateVehicle | APPROVE | Same shape as `validatePlace` (2h). With F1 it passes a list of one rule; the drawing does not need to change. |

### json-text.md

| Function | Decision | Why, edge cases checked |
| --- | --- | --- |
| readJsonText | **FIX** | F6: byte-order mark, a reader that throws, and `null` versus "nothing". Strict options and stopping at the first syntax error are right and are backed by the research. Empty and whitespace-only files give an error at offset 0 → line 1 (and F7's "the file is empty"). `__proto__` stays an own field (research tested this). |
| lineStartOffsets | **FIX** | F5: define a line break (`\r\n` counts once). Listing the starts once is right for a huge file. |
| lineAtOffset | APPROVE | Halving search, lines counted from 1. An offset past the end lands on the last line. |
| lineOfPath | APPROVE (duplicates in E1) | Field value → its name's line; list item → its own start; missing path → start of the file; empty path → the root's start. Nested paths in lists work (`["dataSources", 0, "url"]`). |
| syntaxProblemInWords | **FIX** | F7: sentence needs a subject; write the full table; word the comma and bracket cases for where the reader actually reports them. |

### closest-word.md

| Function | Decision | Why, edge cases checked |
| --- | --- | --- |
| editDistance | APPROVE | Table with the first row and column filled; empty words work (cost = the other's length). |
| editCostAt | APPROVE | Swap costs one more than the cell two back on both words: that is the optimal string alignment form the research names. `nmae`→`name` = 1, `rihgt`→`right` = 1. The research's honest limit stands: the Wikipedia page and Damerau's 1964 paper were not opened; Session B or a later session should confirm before the code cites them. |
| closeEnoughLimit | APPROVE | Smaller of 2 and a third of the suggested word's length, rounded down: 1–2 letters never, 3–5 letters one edit, 6+ two (2b). |
| closestWord | **FIX** | F8: skip by length first. Ties give no hint, which is right: a wrong hint is worse than none. Note for the parking lot, not this scope: `LEFT` or `YABA` get no hint because each capital is an edit; TypeScript's speller makes a change of case nearly free. |

### check-file.md

| Function | Decision | Why, edge cases checked |
| --- | --- | --- |
| validateJsonFile | APPROVE | One read, line starts listed once, every message by file and line, "Fix these first" line names the file only (as item 4 asks). Its syntax message gets its subject from F7. Two notes for the parking lot, not this scope: messages come in the order the checks ran, not by line, which is harder to work through top to bottom; and there is no cap, so a 50 000-item list with every item wrong gives 50 000 lines. |
| messageForProblem | APPROVE | `yaba.json line 12: …`, line from `lineOfPath`. |

## Edge cases asked for, and where they landed

| Edge case | Result |
| --- | --- |
| Empty file | Reader error at offset 0 → line 1. Needs its own sentence (F7). |
| Byte-order mark | Refused today, and the game and the checker would disagree (F6). |
| Huge file | Line starts once and halving search: fine. Pasted huge value: F8. Deep nesting: F6. Uncapped message count: note. |
| Duplicate keys | Last value wins silently, line points at the first (E1). |
| `__proto__`, `constructor` | Reported as unknown: own fields on both sides, and the reader keeps `__proto__` as a field. |
| Ties in closest word | No hint: correct. |
| Missing field plus a far unknown field | Two messages, both right. |
| Nested paths in lists | Labels and lines both work. |
| Windows line endings | Undefined today (F5). |
| Cross-check whose field is missing | Waits, missing field reported, report ends "Fix these first". Two rules on one object is broken (F1). |

## Summary

| Design | Function | Decision |
| --- | --- | --- |
| parse.md | previewForError | FIX (F3) |
| parse.md | accept | APPROVE |
| parse.md | problemAt | APPROVE |
| parse.md | reject | APPROVE (E2 wording) |
| parse.md | labelForPath | APPROVE |
| parse.md | pathToField | APPROVE |
| parse.md | requireText | APPROVE |
| parse.md | checkTextIsNotBlank | APPROVE |
| parse.md | requireTextMatching | APPROVE |
| parse.md | checkTextMatchesFormat | APPROVE |
| parse.md | requireNumberBetween | APPROVE |
| parse.md | checkNumberInRange | APPROVE |
| parse.md | rangeInWords | APPROVE |
| parse.md | tenTimesTooBigHint | APPROVE |
| parse.md | requireOneOf | APPROVE |
| parse.md | isAllowedWord | APPROVE |
| parse.md | checkIsAllowedWord | APPROVE |
| parse.md | requireListOf | APPROVE |
| parse.md | checkEveryItemInList | FIX (F2) |
| parse.md | itemsInWords | APPROVE |
| parse.md | gatherAllProblems | APPROVE |
| parse.md | problemsFromOneCheck | APPROVE |
| parse.md | valueFromOneCheck | APPROVE |
| parse.md | isRecord | APPROVE |
| parse.md | missingFields | APPROVE |
| parse.md | unknownFieldsWithGuesses | APPROVE |
| parse.md | problemsForUnknownFields | APPROVE |
| parse.md | problemsForMissingFields | APPROVE |
| parse.md | requireRecord | APPROVE |
| parse.md | checkRecord | APPROVE (E1 duplicates) |
| parse.md | problemsFromOneField | APPROVE |
| parse.md | nameAndValueFromOneField | APPROVE |
| parse.md | addCrossFieldRules | FIX (F1) |
| parse.md | checkFieldsThenRules | FIX (F1) |
| parse.md | valuesReadByRule | APPROVE |
| parse.md | requireShortId | FIX (F4, wording of the rule) |
| parse.md | shortIdSuggestion | FIX (F4) |
| place.md | firstRepeatedVehicleClass | APPROVE |
| place.md | sourceProblemForOneConstant | APPROVE |
| place.md | sourceProblemsForConstants | APPROVE |
| place.md | repeatedClassProblemsInPlace | APPROVE |
| place.md | validatePlace | FIX (F1) |
| vehicle.md | movementProblemInVehicle | APPROVE |
| vehicle.md | validateVehicle | APPROVE |
| json-text.md | readJsonText | FIX (F6) |
| json-text.md | lineStartOffsets | FIX (F5) |
| json-text.md | lineAtOffset | APPROVE |
| json-text.md | lineOfPath | APPROVE (E1 duplicates) |
| json-text.md | syntaxProblemInWords | FIX (F7), then E3 |
| closest-word.md | editDistance | APPROVE |
| closest-word.md | editCostAt | APPROVE |
| closest-word.md | closeEnoughLimit | APPROVE |
| closest-word.md | closestWord | FIX (F8) |
| check-file.md | validateJsonFile | APPROVE |
| check-file.md | messageForProblem | APPROVE |

Totals: 55 functions. **42 APPROVE, 13 FIX, 3 questions for the owner**
(E1 the same field written twice, E2 how a found value is shown, E3 the
broken-JSON sentences once written). Whole files: `vehicle.md` and
`check-file.md` can be approved as they stand. `parse.md`, `place.md`,
`json-text.md` and `closest-word.md` need their FIX items redrawn first. A
redrawn design is unapproved again, so the FIX functions come back to the
approver.

Parking-lot candidates (one line each, for the orchestrator): point the
repeated-class message at the repeated item; sort a report's messages by line;
cap a very long report; make a change of case nearly free in "Did you mean"
(`LEFT` → `left`).
