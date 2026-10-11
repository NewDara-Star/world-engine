# Planet ranges: Earth's gravity and air density (scope 002c, item 1)

Written 2026-10-11 by scope 002c session A. Corrected the same day by
session B with the approver's R1 to R4 (`docs/reviews/002c/approver.md`) and
the five Wikipedia pages the orchestrator opened.

**Update, 2026-10-11 (session B).** Since this file was first written:

- **Five Wikipedia pages were opened and read** by the orchestrating session's
  own web fetch on 2026-10-11 (recorded in `docs/reviews/002c/approver.md`,
  "Orchestrator follow-up"). They are cited as read pages in the tables below,
  marked *read 2026-10-11*:
  - "Dead Sea", https://en.wikipedia.org/wiki/Dead_Sea : surface about
    439.78 m below sea level (2025), dropping more than 1 m a year.
  - "La Rinconada, Peru", https://en.wikipedia.org/wiki/La_Rinconada,_Peru :
    up to 5,100 m, "the highest permanent settlement in the world".
  - "Verkhoyansk", https://en.wikipedia.org/wiki/Verkhoyansk : −67.8 °C (1885
    and 1892); elevation 127 m.
  - "Atmospheric pressure", https://en.wikipedia.org/wiki/Atmospheric_pressure :
    highest sea-level-adjusted pressure at a station below 750 m, 1,083.8 hPa,
    Agata, 31 December 1968, station at 261 m.
  - "Highest temperature recorded on Earth",
    https://en.wikipedia.org/wiki/Highest_temperature_recorded_on_Earth :
    56.7 °C, Furnace Creek, 10 July 1913; disputed, but accepted by the WMO.

  **Limit:** the follow-up records what each page said, not each page's title
  or address. "Dead Sea", "La Rinconada, Peru" and "Verkhoyansk" are named by
  the place itself; the titles of the pressure and temperature pages above are
  this session's reading of which Wikipedia page holds those records, not a
  record of the address that was opened. This session could not open any page
  to confirm (every fetch refused by the network, as before).
- **Two source packages were read in full** by the approver from the PyPI
  registry: `ahrs` 0.4.0 (MIT), whose source holds the text that
  ahrs.readthedocs.io is built from (the WGS84 constants in
  `ahrs/common/constants.py`, the height series in `ahrs/utils/wgs84.py`), and
  `ambiance` 1.3.1 (Apache-2.0), an ISA 1976 / ISO 2533 standard-atmosphere
  library used to check the pressures. Techniques and figures only; no code
  from either is in the game.
- Every other page named below is still **not opened**: its figure rests on
  a search excerpt, as the paragraph that follows says.

**Honest limit, as first written by session A (still true for every source
not marked read above).** The scope says "cite only pages actually
opened". On this network **no page could be opened**: every fetch (curl and the
fetch tool) was refused by the egress proxy with "CONNECT tunnel failed,
response 403" (en.wikipedia.org, earth-info.nga.mil, ahrs.readthedocs.io,
epsc.wustl.edu, glossary.slb.com, wmo.asu.edu, infoclimat.fr all tried). Only a
web search worked. So **every figure below not marked read came from a search excerpt**, and
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
| Highest | La Rinconada, Puno, Peru (about 14.6° S) | 5,100 m (the town spans about 4,900 to 5,100 m; some sources say 5,000 m, WorldAtlas 5,130 m) | **Read 2026-10-11:** Wikipedia, "La Rinconada, Peru" (up to 5,100 m, "the highest permanent settlement in the world"). Excerpts only: Guinness World Records, "Highest altitude permanent human settlement", https://www.guinnessworldrecords.com/world-records/546893-highest-altitude-permanent-human-settlement ; Wikipedia, "La Rinconada, Peru", https://en.wikipedia.org/wiki/La_Rinconada,_Peru |
| Lowest | The Dead Sea shore, the lowest dry land | about 440 m below sea level (2025: 439.78 m), falling about 1.1 m a year (approver, R1) | **Read 2026-10-11:** Wikipedia, "Dead Sea" (about 439.78 m below sea level in 2025, dropping more than 1 m a year). Excerpts only: Guinness (about 436 m, 2022), Britannica, "Dead Sea", https://www.britannica.com/place/Dead-Sea ; WorldAtlas, https://www.worldatlas.com/geography/where-is-the-lowest-point-in-the-world.html |

Weaknesses: La Rinconada's height differs between sources by up to 130 m. No
excerpt named a *town* at the very lowest shore; 440 m below sea level is the
lowest land, which bounds any town below it. Roads go higher than towns (passes
near 5,800 m); the gravity range below still covers them (see the note there),
the air-density range does not claim to.

## Gravity

### Sources

- Sea-level normal gravity, WGS84, Somigliana formula, and its constants
  (equatorial 9.7803253359 m/s², polar 9.8321849379 m/s², k =
  1.931852652458e-3, e² = 6.69437999014e-3): as in
  `research/30-place-constants.md`, from excerpts of
  https://ahrs.readthedocs.io/en/latest/constants.html and Wikipedia
  "Theoretical gravity". **Checked by the approver against the `ahrs` 0.4.0
  source (MIT, PyPI), `ahrs/common/constants.py`: all the same** (e² there to
  more digits, 6.6943799901414e-3). Standard: NIMA TR8350.2 (2000), not opened.
- Height: normal gravity at height h above the ellipsoid, the truncated series
  in TR8350.2 (as shown in the excerpt of
  https://ahrs.readthedocs.io/en/latest/wgs84.html, equation numbered 4-5 there):
  γ(h) = γ₀ · [1 − (2/a)(1 + f + m − 2f·sin²φ)·h + 3h²/a²], with
  a = 6378137 m, f = 1/298.257223563, m = 0.00344978650684. **Checked by the
  approver against the `ahrs` 0.4.0 source:** the series is in
  `ahrs/utils/wgs84.py` ("Normal Gravity above the Surface"), and m is
  `NORMAL_GRAVITY_FORMULA = 3.449786506841e-3` (ω²a²b/GM) in
  `ahrs/common/constants.py` (approver, R3). MathWorks's excerpt
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
| Highest possible: lowest land, put at a pole (the strongest sea-level gravity) | 90° | −440 m | 9.83354 m/s² (9.83351 with the earlier −430 m) |
| Finglas (check) | 53.396° N | 0 | 9.81369 |
| Yaba (check) | 6.51° N | 0 | 9.78099 |

The worst cases join latitudes and heights no real town has together, so the
range is wider than any real town needs, never narrower.

### Proposed range: **9.76 to 9.84 m/s²**, status `derived`

Rounded outward to two decimals from 9.7646 and 9.8335 (recomputed by the
approver with `ahrs`'s own `normal_gravity`: the same to 5 decimals). The
rounding leaves about 0.004 m/s² below and 0.006 m/s² above, which:

- covers a road up to about 6,700 m at the equator
  ((9.7803 − 9.76) / 3.088e-6), higher than any road;
- covers the Dead Sea falling for a long time yet: 0.006 m/s² is about 2 km
  of further depth (approver, R1);
- covers local gravity anomalies, if a place file ever uses measured gravity
  instead of normal gravity. The size of real anomalies (a few hundred mGal,
  a few thousandths of a m/s²) is **from our own knowledge, not sourced**; it is
  not what the range rests on.

Ten-times test: 9.84 < 10 × 9.76. A tenth or ten times any allowed value is
far outside. 98 and 980 are refused.

Weaknesses: the constants, the height series and m were checked against the
`ahrs` 0.4.0 source code, not against the standard; TR8350.2 itself was not
opened.

## Air density

Dry air, ideal gas, ρ = p / (R·T), R = 287.05 J/(kg·K), as in
`research/30-place-constants.md`. Pressure with height from the ISO 2533
standard atmosphere troposphere formula and its defining constants, as there.

### Sources

| Figure | Value | Source | Weakness |
| --- | --- | --- | --- |
| Highest air pressure, reduced to sea level, station below 750 m | 1083.8 hPa, Agata, Siberia, 31 Dec 1968 (station at 261 m) | **Read 2026-10-11:** Wikipedia, "Atmospheric pressure" (1,083.8 hPa, Agata, 31 December 1968, 261 m). Excerpts only: the WMO records table (public.wmo.int, July 2025), SMHI, https://www.smhi.se/kunskapsbanken/meteorologi/lufttryck/extrema-lufttryck ; the divulgameteo PDF says the WMO lists it | Other excerpts give 1083.3 and 1083.6 hPa; the WMO archive page itself was not reached. |
| Coldest temperature at a low station in the inhabited north | −67.8 °C, Verkhoyansk, 1885 and Feb 1892 (Oymyakon, 750 m: −67.7 or −67.8 °C, 1933) | **Read 2026-10-11:** Wikipedia, "Verkhoyansk" (−67.8 °C, 1885 and 1892; elevation 127 m). Excerpt only: Wikipedia, "Pole of Cold", https://en.wikipedia.org/wiki/Pole_of_Cold | Verkhoyansk is at 127 m, so its cold is low-station cold. Colder readings exist (Greenland summit −69.6 °C, Vostok −89.2 °C) but at about 3,000 m and more, where the air is far thinner, so they give lower density, not higher. |
| Hottest temperature recorded | 56.7 °C, Furnace Creek, Death Valley, 10 Jul 1913 (WMO archive; contested) | **Read 2026-10-11:** Wikipedia, "Highest temperature recorded on Earth" (56.7 °C, Furnace Creek, 10 July 1913; disputed, accepted by the WMO). Excerpt only: WMO, https://wmo.int/news/media-centre/wmo-verifies-3rd-and-4th-hottest-temperature-recorded-earth | Contested; if removed the record is 54.0 °C, which would raise our minimum slightly (safe direction). |
| Standard pressure at 5,100 m | 53,331 Pa (approver, R2): the ISO 2533 formula takes geopotential height, and 5,100 m geometric is about 5,096 m geopotential. Session A's 53,302 Pa used geometric height. Checked with `ambiance` 1.3.1 (Apache-2.0, PyPI), which also gives 54,048 Pa at 5,000 m, matching the EngineeringToolbox table excerpt (54,050 Pa, https://www.engineeringtoolbox.com/international-standard-atmosphere-d_985.html) | ISO 2533 text not opened | Standard, not a measured mean at La Rinconada. |

### Working (run by us)

- **Densest:** the record high pressure with the record low-station cold, which
  never happened together: 108,380 / (287.05 × 205.35 K) = **1.8386 kg/m³**.
- **Thinnest:** standard pressure at the highest town with the hottest
  temperature ever recorded anywhere, which can never happen at 5,100 m:
  53,331 / (287.05 × 329.85 K) = **0.5633 kg/m³** (0.5629 with the earlier
  53,302 Pa; 0.5679 if the disputed 56.7 °C is replaced by 54.0 °C). A warm day there (20 °C,
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
`PARKING_LOT.md`); the three record figures rest on Wikipedia pages read
2026-10-11, not on the WMO archive itself; the pressure scatter at altitude is
not sourced (see above).

## What could not be sourced, for the owner

1. **Partly answered.** Five Wikipedia pages were read on 2026-10-11 (see
   the update at the top), and the WGS84 figures and ISA pressures were
   checked against the `ahrs` and `ambiance` source code. Still not opened:
   Guinness, Britannica, the WMO archive itself, SMHI, SLB, wustl and NIMA
   TR8350.2. The titles of the pressure and temperature Wikipedia pages are
   inferred (see the limit at the top); the orchestrator can confirm them.
2. **m** is now sourced (R3): `ahrs` 0.4.0, `NORMAL_GRAVITY_FORMULA`.
3. **How far air pressure at 5,100 m falls below standard** on a real day:
   not found. The minimum air density leans on the impossible 56.7 °C at
   5,100 m to cover it. If the owner wants a firmer floor, the owner may set
   one (`owner-choice`), for example 0.5.
4. **Whether places on roads above the highest town** (mountain passes) should
   be allowed: the gravity range already allows them; the air-density floor
   (0.56) would allow a pass at 5,800 m only on a day colder than about 28 °C
   at standard pressure (our arithmetic). Owner's call if a pass place is ever
   made.
