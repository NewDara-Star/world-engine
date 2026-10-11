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
- Game audio: real recordings (record Lagos sounds), triggered by game events,
  loudness/clipping checked automatically, human final listen.
- Diagram gate: also block a design entry whose function no longer exists, so
  dead designs are deleted in the same change.
- Gate and generator: draw a `finally` after returns and throws too, and run
  the designs through Mermaid's parser in the tests.
- Vehicle files: refuse controls that don't fit the class (a bike with a
  steering wheel), the same way a car that floats is refused.
- Keke (three-wheeler) and okada (motorbike taxi) as vehicle classes, for Lagos.
- Tighten gravity's allowed range (today 0 to 100 m/s²) to what real bodies
  have, so a slipped digit (98 for 9.8) is caught; owner's call.
- Code licence notices (MIT/Apache libraries shipped to players, such as
  jsonc-parser) listed on the About page with the data credits.
- "Did you mean" ten-times hint: with today's wide ranges it is often wrong
  (gravity 980 gives "Did you mean 98?", latitude 91 gives "9.1?"); offer it
  only when the tenth is near a typical value, or after the ranges tighten.
- A planet's (and a place's) `id` must match its file name, so `planet: "earth"`
  always means `planets/earth.json`.
- "Did you mean" for a constant ten times too small (0.98 for 9.8 gravity).
- The planet loader refuses two planet files with the same `id`.
