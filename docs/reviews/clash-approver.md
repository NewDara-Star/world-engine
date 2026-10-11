# Approver report: clash-check designs (Scope 004, item 4)

Approver: delegated design approver (fresh session), 2026-10-11.
Judged: `docs/designs/tools/decisions/clash.md`, `cli.md`, `log.md` (all `Status: draft`).
No code exists yet (`tools/decisions/` is empty), so each design was judged against the scope, the rules and the real `docs/DECISIONS.md`. I tested the rules with a throwaway script in the scratchpad. Nothing in the repo was edited.

## Summary

| File | Function | Decision |
|---|---|---|
| clash | contentWords | **FIX** |
| clash | matchOf | APPROVE |
| clash | findClashes | APPROVE |
| cli | parseCheckArguments | **FIX** |
| cli | unknownTags | **FIX** |
| cli | describeMatch | APPROVE |
| cli | main | **FIX** (a real bug: it can wrongly say "no clash") |
| log | readDecisionLog | **FIX** |
| log | parseEntry | **FIX** |
| log | entriesInForce | APPROVE |

**Escalations: none.** The "two words" number goes in the design as a value, but it is a tuning choice inside a tool only the orchestrator uses. The player never sees it, and the trial below gives one clear answer, so I decided it rather than asking the owner.

All FIXes are common sense. Once they are made, the orchestrator can approve all ten with `Approved-by: reviewer (delegated by Daramola)` without sending them back to me, as long as the changes are exactly the ones below.

## Can the tool read every entry as written?

Yes. A parser following `log.md` read all 35 entries (D-0001 to D-0035) with no problems: every entry has the five required fields exactly once, every date is valid, no field is unknown, and no Replaces points at a missing entry (there are none yet). Things the coder must handle, which the FIXes below put in writing:

- A value can contain a colon (D-0015: `Push review: three Sonnet lenses…`). The field name ends at the **first** `: `.
- A field name can contain a space (`Decided by`).
- `Decided by` is free text (D-0030: `owner (on the orchestrator's recommendation)`). The design treats it as free text, which is correct.
- The introduction mentions `D-0001` and `Replaces: D-00xx` inside running text. Those lines don't start with `## D-`, so they are correctly ignored.

**Data observation (not a design change):** D-0024 is tagged `approval` and D-0029 `approvals`. A check with `--tags approval` misses D-0029 on its tag. The orchestrator should change D-0029's tag to `approval` in `docs/DECISIONS.md`. That is a correction to the log, not a new decision.

## The "two words in common" number: keep 2

I tried it on the real log with queries the orchestrator might plausibly run:

| Query | At 2 shared words, with the design as drafted | With the fixes below |
|---|---|---|
| "only the owner pushes" | finds D-0022 ✔ | finds D-0022 ✔ |
| "sessions may push to GitHub" | finds D-0022 ✔ (by luck: "sessions" matches) | ✔ |
| "use 3D Tiles for streaming" | **misses D-0008** ("3d" is dropped as short, so only "tiles" matches) | finds D-0008 ✔ |
| "approve designs without the owner" | **misses D-0024** ("approve" ≠ "approvals", "designs" ≠ "design") | finds D-0024, D-0029, D-0013 ✔ |
| "buy coins with real money" | D-0018 ✔ | D-0018 ✔ |
| "use GPL code for traffic" | D-0011 ✔ | D-0011 ✔ |
| "drop the diagram gate for tools" | D-0013 ✔ | D-0013 ✔ |
| "speed test with a 1 second limit" | misses D-0035 | finds D-0035 ✔ |
| "the phone decides the payout" | misses D-0004/D-0005 | still misses: no shared words. The tags `money,server` catch it. |

- **At 1 word** almost every query drags in 5 to 9 unrelated entries through "owner" or "real" (for example "approve designs without the owner" pulls in D-0003, the home street). That is too noisy.
- **At 3 words** "only the owner pushes" no longer finds D-0022. Too strict.
- **At 2 words**, comparing every Decision line with every other one, only 42 of 595 pairs match (7%), and most of those are real neighbours (D-0024/D-0029, D-0017/D-0031). Unrelated flags are rare, and the person reading the list can dismiss them in seconds.

So 2 is right. Two weaknesses matter more than the number itself: the design does no stemming (so plurals don't match) and it drops "3d". The contentWords FIX deals with both. Wording matches alone will never catch a clash said in different words; tags do that. The note-taker and orchestrator should always pass `--tags` (see the main FIX).

## Fixes, exact changes

### clash.md: header "Open choices" and contentWords

Replace the three "Open choices" bullets with:

> Settled by the delegated approver, 2026-10-11, after trying them on the real log:
> - "Close wording" means at least **2** content words in common between the query and the entry's Decision line.
> - Words are reduced to their stem with the Porter stemmer from the npm package `stemmer` 2.0.1 (MIT, github.com/words/stemmer; algorithm: M. F. Porter, "An algorithm for suffix stripping", *Program* 14(3), 1980), so "push" and "pushes", or "approve" and "approvals", count as the same word. Credit it in `research/` as found code.
> - The fixed list of common words to drop is our own choice: the, and, every, must, for, with, not, are, but, from, that, this, into, only, its, any, all, each, one, was, has, have, will, can, our, his, her, their, than, then, when, what, which, who, why, how, also, else, never, may, let, use, own, new, off, per, via, before, after, about, under, plus.

Why the list has to be written out: the test-writer never sees the code, so it can only pin a list it can read in the design. I checked that the package exists, is MIT, and stems as claimed (push/pushes → push, approve/approvals → approv).

contentWords flowchart, replace node `c` and add a stem step:

```
  c["drop the fixed list of common words, and words shorter than three characters unless they contain a digit (so 3d and 8 stay)"]
  c2["reduce each word to its stem with the Porter stemmer"]
  d(["return the remaining stems, each once"])
  ...
  b --> c
  c --> c2
  c2 --> d
```

Edge cases checked: accents stay inside a word (`[\p{L}\p{N}]+`), and "Push review:" and "a push review" give the same words. Dropping "never" and "only" is deliberate: "always push" and "never push" should match each other, because that is exactly the clash we want to find.

### cli.md: parseCheckArguments

Replace node `f` with:

```
  f{"was --tags given twice, or given with an empty value (--tags at the end, or --tags= with nothing after), or any other option given"}
```

Why: without this, `--tags=` quietly means "no tags", which is the "checks nothing and reports no clash" case the design itself warns about.

### cli.md: unknownTags

Replace node `b` with:

```
  b(["return the query tags not in that collection, each with the closest tag in use: one with the same Porter stem, else one at most two letter-changes away (edit distance ≤ 2), the first alphabetically on a tie; none if nothing is that close"])
```

Why: "when one is close" can't be tested blind unless it is a rule. This rule suggests `approval` for `approvals` and `money` for `monye`.

### cli.md: main (real bug)

findClashes returns "nothing to match against" when the text is all short or common words and there are no tags (for example `check "do it"`). main has no branch for that result, so it falls through to "no decision in force shares these tags or close wording" with exit code 0. That is a false all-clear. Add, between `j` and `k`:

```
  n{"findClashes said nothing to match against"}
  o(["print: the text has no words to compare (all short or common) and no tags were given, so nothing was checked; add --tags or more words; exit code 1"])
  j --> n
  n -->|"yes"| o
  n -->|"no"| k
```

Also replace node `d` with:

```
  d{"can docs/DECISIONS.md be read, found from this tool's own folder (two levels up), not from wherever the command was run"}
```

Why: `npm run` happens to start in the project folder, but running the file directly from elsewhere would otherwise report "not found" for a log that exists.

Print problems and errors to stderr and results to stdout. One sentence under "Exit codes" is enough.

### log.md: readDecisionLog

- Replace node `a` with: `a["drop a byte-order mark at the very start, then split the text into lines, treating Windows line ends the same as plain ones"]`
- Replace node `i` with: `i{"does any Replaces name an id that is not in the log, the entry itself, or an entry that comes after it"}`
- Replace node `j` with: `j["add a problem for each one: the line, the id it names, and which of the three it is"]`

Why: if an entry replaces itself, entriesInForce silently hides that entry, which is the "quietly skipped" failure this function exists to prevent.

### log.md: parseEntry

1. A bad heading must not stop the rest of the block from being checked (the same report-everything-in-one-pass spirit as D-0025). Change node `b` from a return to a step: `b["add a problem: line N, the heading is not an id like ## D-0001"]`, and send `a -->|"no"| b`, then `b --> c`. Trailing spaces after the id are allowed.
2. Replace node `c` with: `c["read every line of the form - Field: value, where the field name ends at the first colon-and-space (a value may itself contain colons); other non-empty lines are a problem: line N is not a field"]`
3. Replace node `d` with: `d{"are Date, Decision, Why, Decided by and Tags each there exactly once with a non-empty value, and Replaces at most once"}` and node `e` with: `e["add a problem for each one missing, empty, or written twice, at the heading's line (or at the second copy's line when written twice)"]`
4. After `f`/`g`, add a check: `r{"if Replaces is given, is it an id like D-0001"}` with a problem on "no": `line N, Replaces must name one id like D-0001`. Keep it to one id per Replaces for now; no entry needs more.
5. Node `i`: "the closest known name" uses the same closeness rule as unknownTags (edit distance ≤ 2, case ignored, so `decided By` or `Tag` gets a suggestion).
6. After `l`, add: `if Tags is left empty after dropping empty ones, that is a problem: line N, at least one tag is needed`. The problem check `j` must run after this.

## Approvals, with edge cases checked

- **matchOf**: correct, and its output (shared tags, shared words, strength) gives the orchestrator the "why it came up" sentence. Checked: an empty query word list with tags still matches on tags, and an entry with both kinds gets strength "both".
- **findClashes**: correct. Checked: duplicate and upper-case tags are normalised again here, which is harmless. Ties sort by id because every entry so far has one of only two dates. "Nothing to match against" stays a separate result from an empty list; that is what the main fix relies on.
- **describeMatch**: gives the owner the entry's own words, date, reason and who decided. Checked: Why entries that say "Not recorded in the handover." print as they are, which is honest.
- **entriesInForce**: correct. Checked: chains (C replaces B, B replaces A) leave only C. unknownTags still sees replaced entries' tags, which is right: an old tag is not a typo.

## What I tested and what I did not

- **Tested:** I parsed the real `docs/DECISIONS.md` with a script built from `log.md`'s rules (35 entries, 0 problems). I ran 16 trial queries at thresholds 1, 2 and 3, with and without stemming, and compared every pair of decisions for noise. I installed `stemmer@2.0.1` in the scratchpad and checked its licence and output.
- **Not tested:** any real TypeScript (none exists yet), the npm script wiring, or the generated flows in `docs/flows/` (none exist yet). The design-match check happens at push review, once the code is written.
