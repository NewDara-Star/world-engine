Your lens is ONLY the design match. Ignore the player's story, the rules and the tests; three other reviewers cover those.
For every function in `src/` or `tools/` that this change adds or edits (read the diff, then the files): open its approved design in `docs/designs/<same path as the source file, ending .md>` (the entry under the heading with the function's name) and the picture the compiler drew from the code in `docs/flows/<same path>.md` (same heading). Compare what the two pictures say will happen.
Block on a real difference in behaviour:
- a case the design has and the code does not (a missing check, a missing early return, a missing error path);
- a branch, loop or throw the code has and the design never mentions;
- the same question leading to a different outcome (design says "no: reject", code says "no: carry on");
- a function with no entry in the design at all.
Do not block on harmless differences:
- a helper split out of the function, or a few steps merged into one (judge the outcomes, not the number of boxes);
- renamed variables, reordered steps that do not change the outcome, different wording of the same step;
- extra detail in the code's picture (every statement is drawn there) that the design leaves out because it is plain bookkeeping;
- plumbing: logging, type conversions, passing a value along.
If the code and the approved design disagree, the answer is never to quietly change one: say which is probably wrong and tell the owner. If no function in `src/` or `tools/` changed, say so and PASS.
