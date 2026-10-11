# Approver report 3: Scope 002b, round 2 designs

Written 2026-10-11 by the delegated design approver (`docs/roles/approver.md`).
I judged only what round 2 redrew (`CHANGES-002b.md`, "Round 2") and
`check-file.md`. The owner's decisions are settled: the plural names
`addCrossFieldRules` and `checkFieldsThenRules`, and the field-written-twice
check (E1).

## What I ran, and what I only reasoned

**Ran** (jsonc-parser 3.3.1 with `npm i` in my scratch folder, Node 22.22, strict
options):

- A byte-order mark before `{` gives InvalidSymbol at 0. A space there is
  accepted. Swapping the mark for a space keeps the text the same length (14 → 14
  on a `\r\n` file), so the error offsets and line numbers stay the same.
- A file of only spaces and line breaks gives ValueExpected **at the end**, not
  at offset 0. A file holding only a mark gives InvalidSymbol plus ValueExpected.
- A field written twice: the value is the last copy's (`g: 98`), the tree holds
  both copies, and `findNodeAtLocation` finds the **first**. So `usedNodeAtPath`
  is needed.
- A tab inside text gives InvalidCharacter. A line break inside text gives
  UnexpectedEndOfString where the text starts. Both match the table.
- `-1e400` is read as -Infinity and `1e-400` as 0.
- **Nesting:** for lists, `parseTree` reads about 4,876 levels and
  `getNodeValue` about 2,561. For objects, `parseTree` reads about 2,558. The
  research note says `parseTree` throws at 2,563, but for lists it is really
  `getNodeValue` that throws there. The design's two guards (nodes `e` and `k`)
  cover both, so the design is right; only the note's wording is off.
- **A walk of the whole tree that calls itself** (my own sketch of
  `problemsForRepeatedFields`): written with `flatMap` it runs out of room at
  **2,255** list levels. That is below the 2,561 that the reader lets through.
  Written with a plain `for` loop it reaches 5,252. This led to finding N1.

**Reasoned only:** the parse.md, place.md and closest-word.md changes
(diagrams against the scope). The diagram gate's heading match: I read
`grep '^## '` in `diagram-gate.sh` and ran the same grep on `check-file.md`, but
I did not run the gate itself.

## Where the designer disagreed with me: who is right

| Point | Verdict |
| --- | --- |
| Byte-order mark replaced by a space (I said remove it) | **Designer.** Line starts are listed once from the original text (`validateJsonFile` node `l`). Removing the mark would put every reader offset one place off from that list, and a field at the start of a line could be named on the line above. A space keeps every offset in place. Tested above. |
| "the file" taken from `labelForPath` (I said write "the file is not valid JSON") | **Designer.** The words that come out are the same, and item 2d says "the file" is worked out in one place only. |
| Empty file (I said the reader gives line 1) | **Designer.** I was wrong for a file of blank lines: the reader names the last line. The design's own "empty" check before reading gives line 1, which is right. |
| Nesting depth (I said test 20,000 and catch any throw) | **Designer.** Catching only "out of room" is better: a real bug should stay a visible crash. 20,000 still triggers it. One gap remains (N1). |

## New findings

### N1. FIX: the repeated-field walk can crash on a file the reader accepted (json-text.md, check-file.md)

`problemsForRepeatedFields` calls itself once for every level of nesting, and
nothing guards it. A file nested about 2,300 lists deep gets through
`readJsonText`. The walk can then run out of room (measured at 2,255 with a
plain `flatMap` version), and the place-maker gets a crash instead of a message.
**Fix:** in `validateJsonFile`, if `problemsForRepeatedFields` runs out of room,
return the same "nested too deeply" message at line 1. Session B adds a test
just under the reader's limit (2,500 `[`). It must give a normal report or
"nested too deeply", never a crash.

### N2. FIX: check-file.md is broken text (check-file.md)

The opening paragraph is cut off mid-path and runs straight into
`## validateJsonFile`: "…will be in `docs/fl## validateJsonFile". After the
diagram there is a stray copy of its last lines and a stray ```` ``` ````. The
gate finds designs with `grep '^## '`, so it would see **no design for
`validateJsonFile`** and block the commit. The stray fence also breaks how the
page shows `messageForProblem`. **Fix:** put back the sentence ending
"`docs/flows/src/place/check-file.md`.", start the heading on its own line, and
delete the three stray lines.

### N3. Wording (common sense; decided, listed for the owner)

- ValueExpected reads "is not valid JSON **here**: a value is expected
  **here**: …". Drop the second "here": "…here: a value is expected: a number,
  …".

Seen and left as they are: `-1e400` is shown as "a number too big to use",
which still makes sense to a person. A file of only no-break spaces gets
InvalidSymbol on line 1, which is rare and still points at line 1. If Session B
writes the "only spaces" test with JavaScript's `\s`, that file becomes "empty",
which is fine too.

## Per function

| Design | Function | Decision | Why |
| --- | --- | --- | --- |
| parse.md | previewForError | APPROVE | F3 done: a number that is not finite is shown in words, never `null`. |
| parse.md | checkEveryItemInList | APPROVE | F2 done: items are checked even when the list is too short. The count comes first, and a waiting cross-check is carried up. |
| parse.md | addCrossFieldRules | APPROVE | F1 done: takes a list of rules and checks the fields once. |
| parse.md | checkFieldsThenRules | APPROVE | One plain run, then each rule. "Waited" if the plain result or any rule waited. |
| parse.md | problemsFromOneRule (new) | APPROVE | Both branches now draw "run the rule". Path put in front. A rule waits without stopping the others. |
| parse.md | requireShortId | APPROVE | "a to z", "0 to 9" (F4). |
| parse.md | shortIdSuggestion | APPROVE | `Ɗanbatta`, `ß` and `ı` get no hint. `Ọ̀yọ́` → `oyo` still works. |
| place.md | validatePlace | APPROVE | A list of two rules; fields checked once. |
| json-text.md | readJsonText | APPROVE | Mark → space, empty kind, out-of-room in both reading and value-building, `null` file reaches the checker. All tested. |
| json-text.md | lineStartOffsets | APPROVE | `\r\n` once, `\r` or `\n` alone once each. Leaving out U+2028 is reasoned and fair. |
| json-text.md | lineOfPath | APPROVE | Now uses the copy that is used. |
| json-text.md | usedNodeAtPath (new) | APPROVE | Needed: the library finds the first copy (tested). The loop has no recursion. |
| json-text.md | problemsForRepeatedFields (new) | **FIX** (N1) | Must not crash on a deep file the reader accepted. Otherwise right: looks in every object, including inside lists. |
| json-text.md | problemForRepeatedField (new) | APPROVE | "twice" or "N times", each line named once, "on line" or "on lines". The message sits on the used copy's line. |
| json-text.md | syntaxProblemInWords | APPROVE, with N3 | Subject from `labelForPath`. Full table; the rows I tried match the reader. The owner may read the table once (E3), but nothing in it needs a decision. |
| closest-word.md | closestWord | APPROVE | F8 done. Skipping by length cannot change the answer. |
| check-file.md | validateJsonFile | **FIX** (N2, N1) | The flow is right: line starts once, repeated fields first, "Fix these first" last. But the file text is broken, and it needs the N1 guard. |
| check-file.md | messageForProblem | APPROVE | Unchanged, but redraw it once N2 is fixed, so the page shows it. |

## Summary

| | Count |
| --- | --- |
| Functions judged | 18 |
| APPROVE | 16 |
| FIX | 2 (`problemsForRepeatedFields`, `validateJsonFile`) |
| ESCALATE | 0 |

Every round 1 FIX (F1 to F8) was done right. Two new fixes come before
`check-file.md` and `json-text.md` can be stamped. Both are common sense with
one answer each, so there is no question for the owner. `parse.md`,
`place.md` and `closest-word.md` can be approved now. The N3 wording change can
be made in the same redraw as N1.
