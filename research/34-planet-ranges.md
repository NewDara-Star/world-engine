# Planet ranges: Earth's gravity and air density (scope 002c, item 1)

Written 2026-10-11 by scope 002c session A.

**Honest limit, read first.** The scope says "cite only pages actually
opened". On this network **no page could be opened**: every fetch (curl and the
fetch tool) was refused by the egress proxy with "CONNECT tunnel failed,
response 403" (en.wikipedia.org, earth-info.nga.mil, ahrs.readthedocs.io,
epsc.wustl.edu, glossary.slb.com, wmo.asu.edu, infoclimat.fr all tried). Only a
web search worked. So **every figure below comes from a search excerpt**, and
the page each excerpt names is listed so the owner (or a session with a working
network) can open it and confirm. Nothing here is presented as read from the
page itself. This is the same limit as `research/30-place-constants.md`.

What the ranges are for: a place's gravity and air density must sit inside
its planet's range, so a slipped decimal point (98 or 980 for 9.8) is refused
and the "Did you mean 9.8?" hint is right. A range is a referee's limit, not a
prediction: it must never refuse a real place, and it must be narrow enough
that a value ten times too big or too small is always outside it. That second
test means **the largest allowed value must be less than ten times the
smallest**; both ranges below pass it with room to spare.

## The heights a town can sit at

| Height | Place | Figure | Where it came from (search excerpt; page not opened) |
| --- | --- | --- | --- |
| Highest | La Rinconada, Puno, Peru (about 14.6° S) | 5,100 m (the town spans about 4,900 to 5,100 m; some sources say 5,000 m, WorldAtlas 5,130 m) | Guinness World Records, "Highest altitude permanent human settlement", https://www.guinnessworldrecords.com/world-records/546893-highest-altitude-permanent-human-settlement ; Wikipedia, "La Rinconada, Peru", https://en.wikipedia.org/wiki/La_Rinconada,_Peru |
| Lowest | The Dead Sea shore, the lowest dry land | about 430 m below sea level (mid-2010s; it falls about 1 m a year; 418 m in a 2019 figure) | Britannica, "Dead Sea", https://www.britannica.com/place/Dead-Sea ; WorldAtlas, https://www.worldatlas.com/geography/where-is-the-lowest-point-in-the-world.html |

Weaknesses: La Rinconada's height differs between sources by up to 130 m. No
excerpt named a *town* at the very lowest shore; 430 m below sea level is the
lowest land, which bounds any town below it. Roads go higher than towns (passes
near 5,800 m); the gravity range below still covers them (see the note there),
the air-density range does not claim to.

## Gravity

### Sources (excerpts only)

- Sea-level normal gravity, WGS84, Somigliana formula, and its constants
  (equatorial 9.7803253359 m/s², polar 9.8321849379 m/s², k =
  1.931852652458e-3, e² = 6.69437999014e-3): as in
  `research/30-place-constants.md`, from excerpts of
  https://ahrs.readthedocs.io/en/latest/constants.html and Wikipedia
  "Theoretical gravity". Standard: NIMA TR8350.2 (2000), not opened.
- Height: normal gravity at height h above the ellipsoid, the truncated series
  in TR8350.2 (as shown in the excerpt of
  https://ahrs.readthedocs.io/en/latest/wgs84.html, equation numbered 4-5 there):
  γ(h) = γ₀ · [1 − (2/a)(1 + f + m − 2f·sin²φ)·h + 3h²/a²], with
  a = 6378137 m, f = 1/298.257223563, m = 0.00344978650684. The excerpt did not
  define m; the value used is the WGS84 ratio of centrifugal to gravitational
  acceleration at the equator **from our own knowledge, not from an opened
  page**. MathWorks's excerpt
  (https://ch.mathworks.com/help/aerotbx/ug/gravitywgs84.html) says this series
  is good near the surface, which is where towns are.
- Free-air gradient cross-check: about 0.3086 mGal per metre
  (3.086 × 10⁻⁶ m/s² per metre), from excerpts of the SLB Energy Glossary
  (https://glossary.slb.com/terms/f/free-air_correction) and a Washington
  University course page (https://epsc.wustl.edu/~epsc454/grav-corrections.html).
  Our formula gives 3.088 × 10⁻⁶ at the equator and 3.083 × 10⁻⁶ at the pole:
  the same within 0.1 %.

### Working (run by us, Python, same formula as the place files)

| Case | Latitude | Height | Normal gravity |
| --- | --- | --- | --- |
| Lowest possible: highest town, put at the equator (the weakest sea-level gravity) | 0° | +5,100 m | 9.76460 m/s² |
| (La Rinconada at its real latitude, for comparison) | 14.63° S | +5,100 m | 9.76789 m/s² |
| Highest possible: lowest land, put at a pole (the strongest sea-level gravity) | 90° | −430 m | 9.83351 m/s² |
| Finglas (check) | 53.396° N | 0 | 9.81369 |
| Yaba (check) | 6.51° N | 0 | 9.78099 |

The worst cases join latitudes and heights no real town has together, so the
range is wider than any real town needs, never narrower.

### Proposed range: **9.76 to 9.84 m/s²**, status `derived`

Rounded outward to two decimals from 9.7646 and 9.8335. The rounding leaves
about 0.004 m/s² below and 0.006 m/s² above, which:

- covers a road up to about 6,700 m at the equator
  ((9.7803 − 9.76) / 3.088e-6), higher than any road;
- covers local gravity anomalies, if a place file ever uses measured gravity
  instead of normal gravity. The size of real anomalies (a few hundred mGal,
  a few thousandths of a m/s²) is **from our own knowledge, not sourced**; it is
  not what the range rests on.

Ten-times test: 9.84 < 10 × 9.76. A tenth or ten times any allowed value is
far outside. 98 and 980 are refused.

Weaknesses: constants and the height series come from secondary pages read
only as search excerpts; m is from memory; TR8350.2 itself was not opened.

## Air density

Dry air, ideal gas, ρ = p / (R·T), R = 287.05 J/(kg·K), as in
`research/30-place-constants.md`. Pressure with height from the ISO 2533
standard atmosphere troposphere formula and its defining constants, as there.

### Sources (excerpts only)

| Figure | Value | Excerpt source (not opened) | Weakness |
| --- | --- | --- | --- |
| Highest air pressure, reduced to sea level, station below 750 m | 1083.8 hPa, Agata, Siberia, 31 Dec 1968 | SMHI, https://www.smhi.se/kunskapsbanken/meteorologi/lufttryck/extrema-lufttryck ; the divulgameteo PDF says the WMO lists it | Other excerpts give 1083.3 and 1083.6 hPa; the WMO archive page itself was not reached. |
| Coldest temperature at a low station in the inhabited north | −67.8 °C, Verkhoyansk, Feb 1892 (Oymyakon, 750 m: −67.7 or −67.8 °C, 1933) | Wikipedia, "Verkhoyansk" and "Pole of Cold", https://en.wikipedia.org/wiki/Pole_of_Cold | Verkhoyansk's station height was not in the excerpt. Colder readings exist (Greenland summit −69.6 °C, Vostok −89.2 °C) but at about 3,000 m and more, where the air is far thinner, so they give lower density, not higher. |
| Hottest temperature recorded | 56.7 °C, Furnace Creek, Death Valley, 10 Jul 1913 (WMO archive; contested) | WMO, https://wmo.int/news/media-centre/wmo-verifies-3rd-and-4th-hottest-temperature-recorded-earth | Contested; if removed the record is 54.0 °C, which would raise our minimum slightly (safe direction). |
| Standard pressure at 5,100 m | 53,302 Pa, computed by us with the ISO 2533 formula; a table excerpt (EngineeringToolbox, https://www.engineeringtoolbox.com/international-standard-atmosphere-d_985.html) gives 54,050 Pa at 5,000 m where our formula gives 54,020 Pa | ISO 2533 text not opened | Standard, not a measured mean at La Rinconada. |

### Working (run by us)

- **Densest:** the record high pressure with the record low-station cold, which
  never happened together: 108,380 / (287.05 × 205.35 K) = **1.8386 kg/m³**.
- **Thinnest:** standard pressure at the highest town with the hottest
  temperature ever recorded anywhere, which can never happen at 5,100 m:
  53,302 / (287.05 × 329.85 K) = **0.5629 kg/m³**. A warm day there (20 °C,
  our assumption, not sourced) would give 0.634; so 0.563 also leaves room for
  pressure at that height running about 11 % below standard on a bad day. How
  far real pressure there falls below standard was **not sourced**.
- Checks: Finglas 1.248 and Yaba 1.167 sit inside.

### Proposed range: **0.56 to 1.84 kg/m³**, status `derived`

Rounded outward to two decimals. Ten-times test: 1.84 < 10 × 0.56 (5.6), so a
value ten times too big or too small is always outside: Yaba's 11.67 and 0.1167
are both refused.

Weaknesses: each end joins extremes that never happen together, which makes
the range safely wide but not "real"; dry air (humid air is slightly lighter,
which would lower the minimum a little; humidity correction is already in
`PARKING_LOT.md`); all inputs are excerpts; the pressure scatter at altitude is
not sourced (see above).

## What could not be sourced, for the owner

1. **None of the pages could be opened.** Every number rests on search
   excerpts. Please open at least: Guinness (La Rinconada), Britannica (Dead
   Sea), the ahrs.readthedocs.io WGS84 page (the height series and m), SMHI or
   the WMO archive (1083.8 hPa), Wikipedia "Verkhoyansk", and the WMO page for
   56.7 °C. If any figure differs, the ranges are recomputed from the working
   above.
2. **m = 0.00344978650684** in the height series is from memory, not an
   opened page or an excerpt. It changes gravity at 5,100 m by under
   0.0001 m/s²; it cannot move the rounded range.
3. **How far air pressure at 5,100 m falls below standard** on a real day:
   not found. The minimum air density leans on the impossible 56.7 °C at
   5,100 m to cover it. If the owner wants a firmer floor, the owner may set
   one (`owner-choice`), for example 0.5.
4. **Whether places on roads above the highest town** (mountain passes) should
   be allowed: the gravity range already allows them; the air-density floor
   (0.56) would allow a pass at 5,800 m only on a day colder than about 28 °C
   at standard pressure (our arithmetic). Owner's call if a pass place is ever
   made.
