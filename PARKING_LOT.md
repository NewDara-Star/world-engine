# Parking lot

Ideas that are not in the current scope. One line each. A new idea goes here,
never into the scope being built. Each is looked at when a scope is planned.

- Spacecraft and other planets (the place format already has `planet`, gravity
  and air density).
- Live racing against other players in real time.
- Weather.
- In-game radio.
- Real-money prizes (needs legal advice first; the server would still decide
  every payout).
- Math-shader hero assets (landmarks drawn by shader maths instead of meshes).
- Replace Yaba's derived air density (Infoclimat mean temperature, standard
  pressure) with the official NiMet or WMO 1991-2020 normal for Lagos, and add
  a pressure normal for Dublin and Lagos; open the Infoclimat page to confirm
  the 27.8 °C, which this network could not reach.
- Check the licences of the `n8ao` and `postprocessing` libraries before the
  clay look depends on them.
- Humidity-corrected air density (the place files use dry air).
- Game audio: sounds sourced from open libraries (for example Freesound,
  CC0 or CC-BY, credited on the About page) and generated sound effects,
  triggered by game events, loudness/clipping checked automatically, the
  owner's final listen. No field recording needed (owner, 2026-10-11).
- Diagram gate: also block a design entry whose function no longer exists, so
  dead designs are deleted in the same change.
- Gate and generator: draw a `finally` after returns and throws too, and run
  the designs through Mermaid's parser in the tests.
- Vehicle files: refuse controls that don't fit the class (a bike with a
  steering wheel), the same way a car that floats is refused.
- Keke (three-wheeler) and okada (motorbike taxi) as vehicle classes, for Lagos.
- Code licence notices (MIT/Apache libraries shipped to players, such as
  jsonc-parser) listed on the About page with the data credits.
- A planet's (and a place's) `id` must match its file name, so `planet: "earth"`
  always means `planets/earth.json`.
- "Did you mean" for a constant ten times too small (0.98 for 9.8 gravity).
- The planet loader refuses two planet files with the same `id`.
- A place on a mountain road above about 5,800 m: Earth's air-density floor
  (0.56 kg/m³) may refuse it; decide when such a place is planned (approver,
  scope 002c).
- Sat nav voice per place, set in the place file: a Dublin voice in Finglas, a
  Lagos voice in Omole, a calm mission-control radio voice on Mars. Generated
  voices are fine if the tool's licence allows commercial use in a game; the
  owner judges the accent by ear; never a copy of a real person's voice.
- Maths-shapes training (after Scope 003, only if it wins): train on every kind
  of asset we use (cars, buildings, props, landmarks), each family practised
  on its own, marked on the shape drawn, not on the maths numbers.
- Mutation testing (StrykerJS, Apache-2.0) to check the blind tests are strong, not just failing first (research/35-blind-tests.md).
- Terrain height for places (slice 1 drives on flat ground at 0 m).
