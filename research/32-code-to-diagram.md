# Code to diagram: what exists, and why we build the flow generator (scope 002)

Written 2026-10-10. **Honest limit:** every github.com page (and the Mermaid
docs site) refused to open from this session (WebFetch got HTTP 403 or "proxy
refused the connection"; `gh` had no access to those repos). So no GitHub page
below was read. What we did open: the npm registry entries (metadata and the
README text the registry serves), the PyPI entry for code2flow, and the
dependency-cruiser package installed in `node_modules/` (its `package.json`,
`LICENSE`, `README.md` and `depcruise --help`). Each item says which.

## What we looked at

- **js2flowchart** (npm `js2flowchart` 1.3.5, last published 2023-09-05, MIT;
  opened: npm registry metadata and README). Turns JavaScript into SVG
  flowcharts, one per piece of code, with "abstraction levels". Built on Babel
  (`@babel/parser`, `@babel/traverse`). JavaScript only, no TypeScript syntax
  out of the box, and the output is an SVG picture, not text we can diff or put
  on GitHub. Its idea that shapes the chart (a loop for `.map`, one shape for a
  block) is useful; its code is not what we need.
- **code2flow** (PyPI `code2flow` 2.5.1, MIT; opened: PyPI JSON and README
  text). Makes **call graphs** (who calls whom) for Python, JavaScript, Ruby
  and PHP, written as DOT. Its algorithm, in its own README: parse to ASTs,
  find all function definitions, find where they are called, connect them. No
  TypeScript, and a call graph is not a decision flow.
- **dependency-cruiser** (npm `dependency-cruiser` 18.5.0, MIT; opened:
  installed copy, `package.json`, `LICENSE`, `README.md`, `--help`). Validates
  and draws **which file imports which**, with rules that can forbid an import
  (`forbidden` in a config file). `--output-type mermaid` is listed in its
  help. It does not draw the inside of a function. **We reuse it** for the module
  map and for the rule "engine code never imports place data".
- **ts-morph** (npm `ts-morph` 28.0.0, MIT; opened: registry metadata and
  README). A friendlier wrapper around the TypeScript compiler API. Useful, but
  it is one more layer over `typescript`, which we already pin and already use
  for `npm run typecheck`. Not needed.
- **madge** (npm `madge` 8.0.0, MIT; opened: registry metadata only). Module
  dependency graphs. Same job as dependency-cruiser, with fewer rules. Not used.

## What we decided

- **Module map: reuse dependency-cruiser** (MIT, installed, pinned).
- **Per-function flow: build it ourselves**, on the TypeScript compiler API
  (`typescript`, Apache-2.0, already a dev dependency). Nothing we found does
  all of: TypeScript syntax, one chart per function, Mermaid text that GitHub
  draws, byte-identical output so a hook can compare it. js2flowchart is the
  closest idea, but it is JavaScript-only SVG.
- **Technique taken (idea only, no code copied from anyone):** the
  "AST, find the function definitions, find the calls" outline in code2flow's
  README, and a standard way to turn `a && b` / `a || b` into branches
  (short-circuit lowering as taught in any compiler text: test `a`, and only
  on the right outcome go on to test `b`). Our own design; the exact rules are
  in `docs/designs/tools/diagrams/`.
- **Mermaid:** the node and edge syntax used is the common `flowchart TD`
  syntax with quoted labels and `#quot;`-style entity codes. The Mermaid docs
  page could not be opened, so the syntax was not checked against it. Instead,
  once, outside the repository, every generated chart was run through the
  parser of the `mermaid` npm package (11.4.1, opened from the npm registry)
  in a Node/jsdom scratch folder: 119 of 119 parsed. That is not a GitHub
  render, which is still the real test. The generator's own tests check the
  shape (no raw `"`, `<`, `>` or backtick inside a label).
