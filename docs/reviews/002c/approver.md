# Approver report, scope 002c (planet ranges), designs at commit 2a8f44e

Delegated design approver, 2026-10-11. Worked only in `/home/claude/approver-copy`; the real repo was not touched. No code exists yet for 002c, so I judged the designs against the scope, the existing code they build on (`parse.ts`, `place.ts`, `closest-word.ts`), and runs of my own.

**Bottom line:** both ranges hold up: **gravity 9.76 to 9.84 m/s²** and **air density 0.56 to 1.84 kg/m³**. My own recalculation gives the same rounded numbers. All designs are approved. There are two small common-sense fixes (F1, F2) and some corrections to the research and source text (R1 to R4). Nothing needs escalating to the owner.

## 1. Sources

**I could not open any web page either.** Every fetch was refused by this session's network policy ("CONNECT tunnel failed, 403"), both with curl and with the WebFetch tool. That covered Wikipedia, NGA, ahrs.readthedocs.io, WMO, Britannica, Guinness, SMHI, EngineeringToolbox, MathWorks, SLB, wustl.edu and WorldAtlas. That also stopped me reading any robots.txt. I did not try to get around the block. Two other routes did work:

- **The PyPI package registry (allowed).** I downloaded `ahrs` 0.4.0 (MIT). Its source code holds the text that ahrs.readthedocs.io is built from, so this is the cited page's own words, read in full. I also downloaded `ambiance` 1.3.1 (Apache-2.0), an ISA 1976 / ISO 2533 standard-atmosphere library, to check pressures independently.
- **Web search.** This gives excerpts only, the same limit the design session had. I name these as excerpts below.

| Figure | Research says | What I found | Verdict |
| --- | --- | --- | --- |
| WGS84 a, 1/f, γe, γp, k, e² | 6378137; 298.257223563; 9.7803253359; 9.8321849379; 1.931852652458e-3; 6.69437999014e-3 | Same, in `ahrs/common/constants.py` (e² there to more digits: 6.6943799901414e-3) | **Confirmed** (source read) |
| Height series γ(h) = γ₀[1 − (2/a)(1+f+m−2f sin²φ)h + 3h²/a²] | as stated | Same, in `ahrs/utils/wgs84.py` ("Normal Gravity above the Surface") | **Confirmed** (source read) |
| m | 0.00344978650684, "from memory" | `NORMAL_GRAVITY_FORMULA = 3.449786506841e-3` (ω²a²b/GM) in `ahrs/common/constants.py` | **Confirmed**: it is now sourced, not from memory |
| Free-air gradient | about 3.086e-6 m/s² per m | My run: 3.0877e-6 at the equator, 3.0834e-6 at the pole | Our formula **confirmed**; SLB and wustl pages not opened |
| La Rinconada | 5,100 m | Search excerpts: Guinness 5,100 m (2018); Wikipedia 4,900 to 5,100 m; NASA about 5,000 m | **Confirmed by excerpt** |
| Dead Sea shore | about 430 m below sea level | Search excerpt (Wikipedia): **about 440 m below (2025)**; Guinness about 436 m (2022); falling about 1.1 m a year | **Differs** (R1). The rounded range does not change |
| Record sea-level pressure below 750 m | 1083.8 hPa, Agata, 1968 | Search excerpt of the WMO records table PDF (public.wmo.int, July 2025): 1,083.8 hPa, Agata, 261 m. MeteoSchweiz says 1083.3 | **Confirmed by excerpt** (WMO table) |
| Low-station cold | −67.8 °C, Verkhoyansk, 1892 | Excerpts: −67.8 or −67.7 °C (5 and 7 Feb 1892). The WMO's Northern Hemisphere record is now Greenland, −69.6 °C, but that was at about 3,100 m, so it does not raise the densest value | **Confirmed by excerpt** |
| Hottest | 56.7 °C, Furnace Creek, 1913 (contested) | Excerpts of the WMO page and archive: same, still listed, still disputed | **Confirmed by excerpt** |
| ISA pressure at 5,100 m | 53,302 Pa | `ambiance`: **53,331 Pa**. The research used geometric height where the ISO formula needs geopotential height. I reproduced 53,302 that way and 53,332 the right way | **Differs slightly** (R2). The rounded range does not change |
| ISA pressure at 5,000 m | 54,020 (ours), 54,050 (table) | `ambiance`: 54,048, which matches the table | Same cause as R2 |

**Sources I could not open (for the owner to open himself):** the Guinness page, Britannica "Dead Sea", WMO archive pages, SMHI, Wikipedia (Verkhoyansk, Pole of Cold, Dead Sea), SLB, wustl and NIMA TR8350.2 itself. robots.txt for each of these is also unread.

### Both ranges, recomputed (my Python; `ahrs`'s own `normal_gravity` gives the same to 5 decimals)

| Case | Result |
| --- | --- |
| 5,100 m at the equator (weakest gravity) | 9.76460 m/s² |
| 440 m below sea level at a pole (strongest gravity; the research used 430) | 9.83354 m/s² |
| Finglas / Yaba | 9.81369 / 9.78099 |
| Densest air: 1083.8 hPa at −67.8 °C (1.8378 if the 1083.3 figure is right) | 1.8386 kg/m³ |
| Thinnest air: ISA pressure at 5,100 m (53,331 Pa) at 56.7 °C | 0.5633 kg/m³ (0.5679 at 54.0 °C) |
| 5,100 m, 20 °C, dry / fully humid | 0.634 / 0.623 kg/m³ |
| How far below standard pressure 0.56 still allows at 5,100 m, 20 °C | 11.6 % |

Rounded outward, this gives **9.76 to 9.84** and **0.56 to 1.84**, unchanged. Both ranges pass the ten-times test (the top is less than 10 × the bottom).

## 2. Designs

| Design | Decision | Why / edge cases checked |
| --- | --- | --- |
| planet.md `requirePlanetRange` | APPROVE | A `unit` typed as `m/s2` gets "Did you mean `m/s²`?" (closestWord distance 1, limit 1). The `unit` field repeats the vocabulary, but the scope asks for it and the checker forces the two to match, so they can never disagree. A floor of 0 is right: the Moon's air density is about 0. |
| planet.md `minAboveMaxProblems` | APPROVE | Equal min and max are allowed. The message points at the right `min` by its line. |
| planet.md `validatePlanet` | APPROVE | Plain plumbing through `validateJsonFile`. |
| parse.md `requireNumberBetween` / `checkNumberInRange` | APPROVE | The two branches merge with no hint. Latitude 91 no longer gets "9.1?". `1e400` reads as Infinity and is refused by the "finite" test. |
| parse.md `requireNumberAtLeast` / `checkNumberAtLeast` | APPROVE | It lets 98 and 980 through to the planet check, which knows the right hint. Text `"9.8"` and −9.81 (the physics-engine sign habit) are refused with "at least 0 m/s²", which is clear enough. |
| parse.md `requireKnownId` | APPROVE | |
| parse.md `checkIsKnownId` | **FIX (F2)** | Run the id rule first, then check it is a known id: correct. `mars` gets no "Did you mean" against `earth` (too far apart), so it falls to the list: right. With exactly one planet, though, the message reads "The known planets are `earth`." F2: when one id is known, say "The only known planet is `earth`." |
| parse.md `rangeInWords` | APPROVE | Only the example changed. |
| place.md `decimalPointSlipHint` | **FIX (F1)**; two places **APPROVE** | See question 1 below. |
| place.md `planetRangeRule` | APPROVE | One rule per constant, so a broken air density never holds back gravity. |
| place.md `rangeProblemsOnPlanet` | APPROVE | A wrong `planet` makes the rule wait and adds "Fix these first", so gravity is never passed silently. The "fault in our code" stop cannot happen, because `planet` and the ranges are built from the same list. Duplicate planet ids are already in PARKING_LOT. |
| place.md `placeCheckerFor` | APPROVE | |
| place.md `validatePlace` | APPROVE | The planets are handed in, so the engine still names no planet (scope item 6). |
| check-file.md, json-text.md | APPROVE | Wording only; the flows are unchanged. |
| `planets/earth.json` values | APPROVE (`derived`) | Its source text needs R1 to R4. |

### The two questions the design session raised

1. **Should 980 get "Did you mean 9.8?" (moving the point two places)? Yes, approve.** The scope asks for it ("98 and 980 refused with the right hint"). 980 is also what someone writes when they use cm/s² (Gal), so 9.8 is the right answer either way. On Earth's ranges both moves can never land inside at once, because the top is less than 10 × the bottom. **F1 (common sense):** offer the hint only when *exactly one* of the two moves lands inside the range, and give no hint on a tie. This follows the rule `closestWord` already uses ("a wrong hint is worse than none"). It protects a future planet whose range is more than ten times wide, where the design's "one place first" would otherwise guess silently. Earth's behaviour does not change: 98 → 9.8, 980 → 9.8, 9800 → no hint; air density 11.67 → 1.167 and 116.7 → 1.167 (all run).
2. **The low air-density floor: keep 0.56 `derived`, decided, not escalated.** The floor only catches typos and nobody feels it in play. 0.5 or 0.56 both catch a value ten times too small (Yaba's 0.1167). Changing it to 0.5 would swap a figure worked out from real records for an invented one and gain nothing. 0.56 allows 5,100 m air on a 20 °C day with pressure 11.6 % below standard. From my own knowledge, not sourced: real pressure at that height in the tropics usually sits *above* standard, so this is a generous margin. A mountain-pass place above about 5,800 m is the only case it might refuse, and that should be a parking-lot line until such a place is planned.

### Research and source-text corrections (common sense, for the orchestrator)

- **R1.** Dead Sea: change "about 430 m" to "about 440 m below sea level (2025), falling about 1.1 m a year", in both the research file and `earth.json`. The gravity maximum becomes 9.8335 and the range stays 9.84. The 0.006 m/s² margin is about 2 km of further depth, so the falling lake never matters.
- **R2.** ISA pressure at 5,100 m is 53,331 Pa (geopotential height), not 53,302. The thinnest air becomes 0.5633; the range stays 0.56.
- **R3.** `m` is now sourced: `ahrs` 0.4.0 `constants.py`, `NORMAL_GRAVITY_FORMULA`. Remove "from memory" from the research file and `earth.json`.
- **R4.** In `earth.json` and the research file, add that the constants and the height formula were checked against the `ahrs` 0.4.0 source code (MIT, PyPI), and the ISA pressures against `ambiance` 1.3.1. Keep "web pages not opened" for everything else.

## What I tested and what I did not

**Tested:** both ranges recomputed (my own code, plus `ahrs`'s own function); ISA pressures (with `ambiance`); the decimal-point moves for 98, 980, 9800, 98.1, 981, 11.67 and 116.7; `closestWord` behaviour read from the code.

**Not tested:** no 002c code exists yet, so there are no generated flows to compare and `npm run check` was not run. No web page was opened. No robots.txt was read.

## Orchestrator follow-up (2026-10-11)

F1 and F2 drawn into the designs by the orchestrator. Sources opened by the
orchestrator's own web fetch on 2026-10-11 (Wikipedia), so these are now
read pages, not snippets: Dead Sea surface about 439.78 m below sea level
(2025), dropping more than 1 m a year; La Rinconada up to 5,100 m, "the
highest permanent settlement in the world"; Verkhoyansk −67.8 °C (1885 and
1892), elevation 127 m; highest sea-level-adjusted pressure below 750 m
1,083.8 hPa, Agata, 31 December 1968, 261 m; highest recognised air
temperature 56.7 °C, Furnace Creek, 10 July 1913, disputed but accepted by
the WMO. Session B applies R1 to R4 and cites these pages.
