# JSON paths to line numbers, and "did you mean" (scope 002b, item 2)

Written 2026-10-11 by Session A of scope 002b.

**Honest limit:** from this session the web is closed except the npm registry.
Wikipedia, GitHub and nist.gov all refused (WebFetch: "proxy refused the
connection" or HTTP 403; curl: "CONNECT tunnel failed, response 403"). So no
web page was read. What was opened: npm registry metadata (`npm view`), and
the published package files fetched with `npm pack` and read on disk
(README, LICENSE, `package.json`, source). TypeScript's own source was read
from our `node_modules/typescript` (6.0.3, already pinned). Each item says
which.

## The job

Item 2d: `validatePlace(fileName, text)` reads the raw text, keeps where each
field sits, and every message starts `yaba.json line 12:`. Invalid JSON is a
normal message with its line. The scope asks for an existing MIT or Apache way
to map JSON paths to lines before we write one.

## What we looked at

- **jsonc-parser** 3.3.1 (npm, MIT, "Copyright (c) Microsoft"; published
  2024-06-24; no dependencies. Opened: registry metadata, `LICENSE.md`,
  `README.md`, `lib/esm/main.d.ts`, `lib/esm/impl/parser.js`, and we ran it on
  test strings, below). `parseTree(text, errors, options)` gives a tree where
  every node has an `offset` and `length` in the text and a `parent`;
  `findNodeAtLocation(root, path)` finds the node for a path such as
  `["skyPosition", "lat"]` or `["dataSources", 0]`; `getNodeValue(node)`
  turns the tree back into plain values. Options `disallowComments: true` and
  `allowTrailingComma: false` make it strict. Errors come as a code (a
  `ParseErrorCode`, also given as a name by `printParseErrorCode`) and an
  offset. The repository is microsoft/node-jsonc-parser (from the registry; the
  GitHub page itself would not open).
- **@humanwhocodes/momoa** 3.3.13 (npm, Apache-2.0; published 2026-09-02.
  Opened: registry metadata, `package.json`, `README.md`). An ESTree-style
  JSON tree with `loc` line and column on every node, and modes `json`,
  `jsonc`, `json5`. Good, but a bigger tree than we need and no path lookup
  of its own: we would write the path walk ourselves.
- **json-source-map** 0.6.1 (npm, MIT; last published 2019-08-07. Opened:
  registry metadata, `package.json`, `README.md`). Parses JSON and returns a
  map from JSON pointer (`/skyPosition/lat`) to line and column. Exactly the
  shape we want, but unmaintained since 2019.

## What we ran (jsonc-parser 3.3.1, strict options, Node 22)

| Text | jsonc-parser | `JSON.parse` |
| --- | --- | --- |
| `{"a":01}` | error | error |
| `{"a":.5}`, `{"a":NaN}`, `{'a':1}` | error | error |
| a raw tab inside a string | error | error |
| a byte-order mark before `{` | error (InvalidSymbol at 0) | error |
| empty text | error (ValueExpected at 0) | error |
| `{"a":1} x` | error | error |
| `{"a":1,}` (trailing comma) | error | error |
| `{"a":1 // c` | error | error |
| `{"a":1e400}` | accepted, value Infinity | accepted, Infinity |

So with those two options it refused everything `JSON.parse` refused in our
list. Four more facts that shape the design:

1. `getNodeValue` builds objects with `Object.create(null)`, so a field named
   `__proto__` becomes an ordinary own field (we checked
   `Object.hasOwn(value, "__proto__")` is true). Item 2a needs exactly that.
2. Errors from `parseTree` carry the offset but **not** the line (the line is
   only given to the `visit` callback). So we turn offsets into lines
   ourselves.
3. Even with an error, `parseTree` returns a partial tree. We stop at the
   first syntax error and do not check fields of a broken file: later errors
   are usually knock-ons of the first.
4. **Duplicate field names:** both are kept in the tree. `findNodeAtLocation`
   finds the first; `getNodeValue` keeps the last (it assigns in order). So a
   problem in a duplicated field would point to the first line while the
   value checked is the second. Reporting a duplicated field is not in this
   scope; raised with the owner in the Session A report.

`ParseErrorCode` is a `const enum` in the `.d.ts`; with our
`verbatimModuleSyntax` the code should key the wording on the names from
`printParseErrorCode`, not the numbers.

## Offsets to lines

TypeScript does this in `computeLineStarts` and `computeLineOfPosition`
(`node_modules/typescript/lib/typescript.js`, Apache-2.0, read on disk): list
the offset where each line starts, once, then find a line by binary search.
Technique only. Counting from the start for every message would be slow on a
very large file with many problems (the tragedy test in item 4).

## "Did you mean": the closest word

- **TypeScript `getSpellingSuggestion` and `levenshteinWithMax`** (same file,
  Apache-2.0, read on disk). Plain Levenshtein (no swaps), a limit that grows
  with the word (`length * 0.4`), and a change of only upper/lower case costs
  0.1, so `Yaba` is very close to `yaba`. It skips candidates under 3
  letters unless only the case differs. Technique only.
- **talisman** 1.1.4 `metrics/damerau-levenshtein.js` (npm, MIT, Guillaume
  Plique; opened with `npm pack`). Its header names Wikipedia's
  "Damerau–Levenshtein distance" page as the reference and
  blog.softwx.net (2015) as the code it follows; that algorithm is the
  restricted kind, "optimal string alignment". We could not open either page.
- **damerau-levenshtein** 1.0.8 (npm, BSD-2-Clause; registry README only).
  Not used: BSD is not on our licence list.

**Definition we use** (scope item 2b): the *optimal string alignment*
distance, the restricted form of Damerau–Levenshtein: the fewest single-letter
inserts, deletes, replacements and swaps of two neighbouring letters that turn
one word into the other, where no part of the word is edited twice. `nmae` to
`name` is 1 (one swap); `rihgt` to `right` is 1. The original paper is F. J.
Damerau, "A technique for computer detection and correction of spelling
errors", Communications of the ACM 7(3), 1964. **We did not open that paper
or the Wikipedia page** (blocked); the definition above is from talisman's
source and its header, and our own working of the two examples. A later
session with web access should open the Wikipedia page and confirm the
"optimal string alignment" wording before the code cites it.

"Close" (scope 2b): distance at most 2, and at most a third of the length of
the word we would suggest, rounded down. So a word of 1 or 2 letters never
gets a hint; 3 to 5 letters allow 1 edit; 6 or more allow 2.

## Decision

- **Use jsonc-parser 3.3.1** (MIT, no dependencies, Microsoft), pinned exactly,
  as a runtime dependency of `src/place/`, with `disallowComments: true` and
  `allowTrailingComma: false`. It gives both the values (`getNodeValue`, which
  keeps `__proto__` as an own field) and the positions (`findNodeAtLocation`)
  from **one** tree, so the value checked and the line reported cannot come
  from two different reads. **Open question:** MIT asks that its copyright
  and licence notice go with every copy, and the browser bundle is a copy.
  CLAUDE.md puts every credit on the About page, built from the place files'
  `dataSources`, which is for data, not code. Where code licences go is for
  the owner to decide (raised in the Session A report).
- **Write ourselves** (small, cited to TypeScript's technique): line starts
  and line lookup; the optimal string alignment distance and the closest word.
- **Not used:** momoa (more than we need), json-source-map (unmaintained),
  damerau-levenshtein (BSD).
