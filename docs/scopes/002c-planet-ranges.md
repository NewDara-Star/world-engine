# Scope 002c: sensible ranges per planet

Status: approved by Daramola (owner) in chat, 2026-10-11 ("go with your
recommendation": ranges per planet, in a small scope).
Architecture: V5, "Place file format"; CLAUDE.md "The engine knows no place".

## Goal

A place's gravity and air density are checked against what is real for the
planet the place is on, so a slipped digit (98 or 980 for 9.8) is caught and
the "did you mean 9.8?" hint is right when it speaks.

## Why the game needs it

Today gravity may be anything from 0 to 100 m/s², so a typo of 98 passes and
cars in that town barely leave the ground. Earth's own range is about 9.78 to
9.83. A planet's real range is the referee's rulebook: Earth's rules for Lagos
and Dublin, Mars's rules later for a Mars town, without loosening Earth's.

## In scope

1. **Planet files** in a new `planets/` folder, one per planet, data not code,
   the same way places are: `planets/earth.json` now. Each gives its id, name,
   and for each constant a plausible range (minimum, maximum, unit) for any
   place on its surface, each with a source and `status` (official, derived,
   owner-choice), following the data rule. Research first into
   `research/34-planet-ranges.md`:
   - Earth gravity: the WGS84 normal-gravity formula already cited in
     `research/30-place-constants.md` gives the sea-level range from equator
     to pole; add the height range a town can sit at (state the heights used
     and their source, for example the highest and lowest inhabited places)
     and the free-air correction.
   - Earth air density: from the standard atmosphere and real temperature
     extremes over the heights above; name the sources.
   Cite only pages actually opened. If a number cannot be sourced, say so and
   leave it for the owner.
2. **Planet checker** (`validatePlanet(fileName, text)`), built from the
   existing checker pieces, with the same file-and-line messages.
3. **Place checked against its planet.** A place's `planet` must name a planet
   file that exists ("`planet` is `eart`; there is no such planet. Did you mean
   `earth`?"). Its gravity and air density must sit inside that planet's
   ranges, and the message names the planet and the unit: "`gravityMs2` must be
   from 9.76 to 9.84 m/s² on earth; found 98. Did you mean 9.8?".
4. **The ten-times hint only where it makes sense.** It is offered only for
   fields that are physics constants, never for latitude, longitude or other
   numbers (today a latitude of 91 gets "did you mean 9.1?", which is wrong).
5. Designs first for every new or changed function (the diagram gate blocks
   otherwise); the delegated approver judges them; then tests (four paths;
   Yaba and Finglas still pass; 98 and 980 refused with the right hint; an
   unknown planet; a planet file with a broken range, min above max) and code.
6. The engine still knows no planet: nothing about Earth in `src/`.

## Out of scope

Other planets' files (Mars, Moon) until a place needs one: park it. Vehicle
ranges. Any physics code that uses the values.

## Done when

- Yaba and Finglas validate against `planets/earth.json`.
- 98 and 980 for gravity are refused with a correct hint, latitude 91 gets no
  ten-times hint, and an unknown planet gets "did you mean".
- `npm run check` passes; designs approved; small commits with `Story:`. Do
  not push.

## References

- `research/30-place-constants.md`, `docs/reviews/002b/`, CLAUDE.md.
