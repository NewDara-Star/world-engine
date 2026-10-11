# Porter stemmer for the clash check (scope 004, item 4)

Written 2026-10-11 by the coder session for the decision-log clash check.

The approved design (`docs/designs/tools/decisions/clash.md`) names the
stemmer to use; this note records it as found code, as the design asks.

## What we use

- **`stemmer` 2.0.1** (npm), by Titus Wormer, github.com/words/stemmer.
  **Licence: MIT** (read in `node_modules/stemmer/license` after
  `npm install --save-exact stemmer@2.0.1`). Used as a dependency, not
  copied. It reduces an English word to its stem, so "pushes" and "push", or
  "approvals" and "approve", count as the same word.
- **Algorithm:** M. F. Porter, "An algorithm for suffix stripping",
  *Program* 14(3), 1980, as the package's readme cites.

## What we checked on disk

Run with the installed package: approvals and approve both give `approv`;
pushes and push give `push`; designs gives `design`; pays and pay give
`pai`; delivery gives `deliveri`. Words with digits or accents ("3d",
"café", "ọmọlé") come back unchanged.

## Limits

- English only. A decision written in another language would be stemmed
  wrongly; today every entry in `docs/DECISIONS.md` is English.
- Stems are not always real words ("pai", "deliveri"). The clash check
  prints the shared stems as they are, so the reader sees what was compared.

## Credit

Developer tooling only, never shipped to players, so it has no line on the
game's About page (that page credits what the game ships). This note is its
credit.
