# Scope 002: diagram tool and diagram gate

Status: approved by Daramola (owner) in chat, 2026-10-10.
Approved-by: Daramola
Design diagram: V5 doc, section "Scope 002: diagram tool".

## Goal

Every function gets a flow diagram drawn by the TypeScript compiler (no AI),
saved where the owner can read it on GitHub, and no commit lands unless those
diagrams are current and every function has a design the owner approved. This
lets the owner, a designer, follow every piece of logic without reading code.

## In scope

1. **Research first** (`research/32-code-to-diagram.md`): existing tools that
   turn TypeScript/JavaScript into flowcharts or call graphs (e.g. js2flowchart,
   code2flow, dependency-cruiser, ts-morph based tools), what each does, its
   licence, why we build or reuse. Techniques only; MIT/Apache to reuse.
2. **Flow generator** (`tools/diagrams/`, TypeScript, run with
   `npm run diagrams`): uses the TypeScript compiler API to read every function
   in `src/` and `tools/` and write one Mermaid flowchart per function: each
   decision (if, switch, ternary, `&&`/`||` guards), loop, early return, throw,
   and call to another of our functions. Labels in plain words taken from the
   code (condition text, function names). Output: one Markdown file per source
   file in `docs/flows/` mirroring the source path, each function under its own
   heading with a ```mermaid block, so GitHub draws them as pictures.
   Deterministic: same code, byte-identical output.
3. **Module map:** dependency-cruiser (MIT) writes `docs/flows/modules.md` (a
   Mermaid graph of which file uses which) and gets a rule config forbidding
   engine code from importing place-specific data.
4. **Designs** live in `docs/designs/`, mirroring source paths, one Mermaid
   flowchart per function, written before the code. A design is approved when
   the commit that last changed it has the trailer `Approved-by: Daramola`.
   The orchestrating session adds that trailer only after the owner approves
   in chat (a hook cannot prove who typed it; say so in CLAUDE.md).
5. **Diagram gate** (`.claude/hooks/diagram-gate.sh`, on real `git commit`,
   using the existing real-command detection):
   - Regenerate flows into a temp folder; if they differ from `docs/flows/`,
     block: "diagrams out of date, run npm run diagrams".
   - Every function in `src/` and `tools/` must have a design file entry; a
     missing one blocks, naming the function.
   - Every design must be approved (trailer check above); unapproved blocks.
   - Shell hooks are not TypeScript and are exempt; say so.
6. **Design match at push:** add a fourth review lens to
   `review-before-push.sh` that always runs (Sonnet, or inside the Opus review
   when routed there): compare each changed function's approved design with
   its generated flow and block on real differences (a missing case, an extra
   branch, a different outcome), not harmless ones (a helper split out,
   renamed variables). Prompt says which is which, with examples.
7. **Backfill:** draft designs for every existing function (place validator,
   hook helpers in TypeScript, the generator itself). Commit them WITHOUT the
   approval trailer and list them in the final report; the orchestrating
   session will show them to the owner for approval. Until approved, the gate
   reports them as unapproved: that is expected and correct.
8. **Yaba air density:** change to 1.167 kg/m³ with status "derived": from
   Lagos/Ikeja (WMO 65201) 1991–2020 mean temperature 27.8 °C at 40 m station
   elevation, Infoclimat
   (https://www.infoclimat.fr/climatologie/normales-records/1991-2020/lagos-ikeja/valeurs/65201.html),
   computed by Infoclimat from the station's own METAR/SYNOP reports; not an
   official NiMet figure; Infoclimat warns its series may have gaps. Pressure
   from the ISO 2533 standard atmosphere at 40 m; dry air. Show the working in
   `research/30-place-constants.md`. Recompute and test.
9. **Data rule in CLAUDE.md:** (1) an official figure when one exists; (2)
   otherwise a figure derived from real measurements, with the source and its
   weaknesses named; (3) otherwise the owner's creative call, recorded as his;
   never a silent guess. Add a `status` vocabulary to match: official,
   derived, owner-choice (keep existing values working or migrate them).
10. **Parking lot:** add "Game audio: real recordings (record Lagos sounds),
    triggered by game events, loudness/clipping checked automatically, human
    final listen."

## Out of scope

Any game code. Approving the backfilled designs (the owner does that).

## Done when

- `npm run diagrams` draws every function; running it twice gives identical
  files; `docs/flows/` opens as pictures on GitHub.
- Gate tests prove it blocks: a stale diagram, a function with no design, an
  unapproved design; and passes when all three are fine.
- The push review has the design-match lens, tested with a stand-in model.
- Yaba validates with the derived value; the data rule is in CLAUDE.md.
- Small commits; `npm run check` passes. Do not push. Final report in plain
  words, listing the backfilled designs awaiting approval.
