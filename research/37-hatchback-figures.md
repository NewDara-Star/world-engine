# 37. Figures for a small petrol hatchback

Date: 2026-10-11. Research only, for the hatchback's vehicle file (plan in
`research/36-slice-1.md` section 7). JSON draft of the same figures:
`/tmp/claude-0/-home-claude-we-s1/f6487747-2d12-52a3-a706-dda7a378883b/scratchpad/hatchback-figures.json`.

## Read this first: nothing could be opened

This session's network is closed to every site I tried (the proxy answered
"403, policy denial" for Kia, Toyota, Volkswagen, Hyundai, Suzuki, ADAC,
Wikipedia, the EEA, OptimumG, Engineering Toolbox and every spec database).
Only the web **search** tool worked. So **every figure below comes from a
search-result snippet, not from a page I opened.** I never fetched any page,
so no robots.txt rule was at stake, but I could not read robots.txt either.

What that means for the data rule:

- Maker figures are still marked **official**, because the snippet is quoting
  the maker's own document, but each needs the owner (or a session with
  network) to open the document once and tick it off.
- Figures worked out from a real measurement (a brake test, a weighing) are
  **derived**, snippet-only.
- Textbook-style figures (rolling resistance, ride frequency, damping,
  drivetrain efficiency, centre-of-mass height, frontal-area factor, brake
  split) count as derived only when the source has been opened and quoted.
  None could be, so they are **owner-choice**: a proposed value, with the
  snippet that supports it named. Each becomes derived once someone opens
  the link and finds the sentence.

## Which car

**Drive-train car: Kia Rio (fourth generation, "YB", 2017), 1.25 MPI, 84 PS,
five-speed manual, Europe.** Chosen because Kia's own European technical
specification (February 2017) is indexed by the search engine, so its
numbers could be read from snippets: dimensions, mass, power, torque, gear
ratios, tyre size, turning circle, 0–100 km/h and top speed all come from the
same car and the same document. The same body was brake-tested by ADAC and
weighed axle by axle by auto motor und sport.

Comparison cars (same era, base petrol, manual): Suzuki Swift 1.2 Dualjet
(2017), Toyota Yaris 1.0 VVT-i (2017), Volkswagen Polo 1.0 MPI 80 PS (2017),
Hyundai i20 1.2 84 PS (2014, the Rio's sister car). I did not check how
common each is in Lagos; they are the brief's list.

The car names appear only here and in the vehicle file's sources, never in
the game (D-0017).

## Body

| Quantity | Value | Unit | Status | Source | Opened? |
|---|---|---|---|---|---|
| massKg | 1035 | kg | derived | Kia EU tech spec: curb weight 1,110 kg (1.25 MPI); ADAC's catalogue lists the same 1,110 kg as "Leergewicht (EU)", which is the EU mass in running order **including a 75 kg driver**. 1110 − 75 = 1035 kg without driver. https://press.kia.com/content/dam/kiapress/EU/download-files/New-Rio/Kia-Rio-Technical-Specification-3-Feb-2017.doc and https://www.adac.de/rund-ums-fahrzeug/autokatalog/marken-modelle/kia/rio/yb/268350/ | snippet |
| lengthM | 4.065 | m | official | Kia EU tech spec, 4,065 mm (same link) | snippet |
| widthM | 1.725 | m | official | Kia EU tech spec, 1,725 mm without mirrors | snippet |
| heightM | 1.450 | m | official | Kia EU tech spec, 1,450 mm | snippet |
| wheelbaseM | 2.580 | m | official | Kia EU tech spec, 2,580 mm | snippet |
| trackM | 1.518 | m | official | Kia EU tech spec, front 1,518 mm on 15-inch wheels; **rear differs: 1,524 mm** | snippet |
| centreOfMassHeightM | 0.53 | m | owner-choice | Snippet citing NHTSA measured data: sedans "about 0.5 m to 0.58 m", compact cars "mainly between 500 and 560mm". Dataset to open: https://eng.auburn.edu/~dmbevly/mech4420/vehicle_params.pdf | snippet |
| frontAxleLoadShare | 0.617 | 0..1 | derived | auto motor und sport weighed a Rio 1.0 T-GDI 120 GT-Line (same body, 2020 facelift): 61.7 % front / 38.3 % rear (a second car: 61.5 / 38.5). https://www.auto-motor-und-sport.de/test/kosten-realverbrauch-kia-rio-1-0-t-gdi-120-gt-line/technische-daten/ | snippet |

## Wheels

| Quantity | Value | Unit | Status | Source | Opened? |
|---|---|---|---|---|---|
| radiusM | 0.311 | m | official (worked from the official tyre size) | Kia EU tech spec: standard 185/65 R15. Working: rim 15 in × 25.4 = 381 mm; sidewall 0.65 × 185 = 120.25 mm; diameter 381 + 2 × 120.25 = 621.5 mm; radius **310.75 mm**. This is the unloaded radius; a loaded tyre sits a few percent lower. | snippet |
| turningCircleM | 10.2 | m | official | Kia EU tech spec and Irish launch release, 10.2 m. I did not see the words "kerb to kerb". https://press.kia.com/ie/en/home/media-resouces/press-releases/2017/KiaRio_pressrelease.html | snippet |
| suspensionTravelM | 0.15 | m | owner-choice | **No source found.** Proposed only. | — |
| rideFrequencyHz | 1.2 | Hz | owner-choice | OptimumG Springs & Dampers Tech Tip 1 (snippet): "0.5 - 1.5 Hz for passenger cars". https://optimumg.com/wp-content/uploads/2020/01/SpringsDampers_Tech_Tip_3.pdf (same series; Tech Tip 1 is at http://downloads.optimumg.com/Technical_Papers/Springs&Dampers_Tech_Tip_1.pdf) | snippet |
| dampingRatio | 0.3 | — | owner-choice | OptimumG "Of Springs and Dampers" (snippet): passenger cars about 0.3 when comfort is the priority. https://optimumg.com/of-springs-and-dampers/ | snippet |
| tyreFriction | 1.1 | — | derived | Worked from ADAC's measured stop (see Brakes): deceleration = 27.78² ÷ (2 × 35.5) = 10.87 m/s²; ÷ 9.781 = **1.11**. A car with ABS cannot stop harder than the tyre allows, so peak μ is at least this. https://www.adac.de/rund-ums-fahrzeug/autokatalog/marken-modelle/kia/kia-rio/ | snippet |
| rollingResistance | 0.012 | — | owner-choice | MATEC 2019 paper (snippet): car tyres on smooth asphalt "0.007 to 0.02", with 0.012 cited most often. Bosch Automotive Handbook via hpwizard (snippet): 0.013. https://www.matec-conferences.org/articles/matecconf/pdf/2019/03/matecconf_mms18_01005.pdf | snippet |

Note on tyre friction: literature snippets (hpwizard, an MDPI field study)
give 0.8–0.9 for dry asphalt. With μ = 0.9 the car would need about 44 m to
stop from 100 km/h, outside the ±15 % check against the measured 35.5 m. I
recommend 1.1, from the measurement.

## Engine

| Quantity | Value | Unit | Status | Source | Opened? |
|---|---|---|---|---|---|
| peakPowerKw | 62 | kW | official | Kia EU tech spec: 84 ps (62 kW) at 6,000 rpm | snippet |
| peakTorqueNm | 122 | N·m | official | Kia EU tech spec: 122 Nm at 4,000 rpm | snippet |
| forwardGearRatios | 3.545, 1.895, 1.192, 0.906, 0.719 | — | official | Kia EU tech spec. First three seen in three separate snippets. **4th and 5th from one garbled snippet only** ("roughly 0.906 … 0.719"); the 5th is backed by Carfolio's Hyundai i20 1.2 84 PS top gear 0.72. | snippet |
| reverseGearRatio | 3.636 | — | official | Kia Irish launch release. **Two snippets disagreed: 3.636 and 3.583.** Must be checked. | snippet |
| finalDriveRatio | 4.600 | — | official | Kia Irish launch release, 4.600 for the 1.25 MPI; Carfolio's i20 1.2 84 PS gives 4.60. https://www.carfolio.com/hyundai-i20-1.2-401984 | snippet |
| redlineRpm | 6500 | rpm | owner-choice | No maker figure. MotorBeam road test of a related 1.2 Kappa engine (snippet): "redlines just above 6500 RPM". https://motorbeam.com/2018-kia-rio-review-test-drive/2 | snippet |
| drivetrainEfficiency | 0.92 | 0..1 | owner-choice | MDPI World Electric Vehicle Journal paper (snippet): manual gearboxes 92–97 %, 0.92 used as worst case. National Academies report (snippet): manuals lose about 4 %. https://www.mdpi.com/2032-6653/14/12/342 | snippet |
| gearChangeS | 0.3 | s | owner-choice | Orchestrator decision E1(a): "the owner's choice, proposed 0.3 s". No source. | — |

## Air

| Quantity | Value | Unit | Status | Source | Opened? |
|---|---|---|---|---|---|
| dragCoefficient | 0.32 | — | derived | **No Kia figure found.** Median of three published values for this class: Suzuki Swift 2017 0.32 (Auto Express comparison, table order unclear), Hyundai i20 1.2 0.30 (Carfolio), Kia Rio 1.4 2017 0.32 (automobile-catalog's own estimate). https://www.autoexpress.co.uk/suzuki/swift/99516/suzuki-swift-vs-toyota-yaris-vs-skoda-fabia | snippet |
| frontalAreaM2 | 2.10 | m² | owner-choice | EcoModder wiki (snippet): frontal area ≈ width × height × 0.84. 0.84 × 1.725 × 1.450 = 2.10 m². A forum gives 0.81; a homework site 0.85. No textbook opened. https://ecomodder.com/wiki/Vehicle_Coefficient_of_Drag_List | snippet |

## Brakes

| Quantity | Value | Unit | Status | Source | Opened? |
|---|---|---|---|---|---|
| frontShare | 0.7 | 0..1 | owner-choice | University of Michigan traction/braking paper (snippet): best split "69/31 (front/rear) when µ = 0.85" on a dry road, for one vehicle model. https://huei.engin.umich.edu/wp-content/uploads/sites/186/2015/02/vehicle.pdf | snippet |
| testFromSpeedMs | 27.78 | m/s | official | ADAC brakes from 100 km/h | snippet |
| testStoppingDistanceM | 35.5 | m | derived | ADAC measured 35.5 m from 100 km/h for a Rio 1.0 T-GDI 100 (same body, **different engine**; ADAC did not test the 1.25 and says so). auto motor und sport: 37.1 m and 35.8 m on two 1.0 T-GDI 120 cars. https://www.adac.de/rund-ums-fahrzeug/autokatalog/marken-modelle/kia/kia-rio/ | snippet |

## Published performance

| Quantity | Value | Unit | Status | Source | Opened? |
|---|---|---|---|---|---|
| testToSpeedMs | 27.78 (100 km/h) | m/s | official | Kia EU tech spec quotes 0–100 km/h | snippet |
| testTimeS | 12.9 | s | official | Kia EU tech spec, 1.25 MPI; ADAC catalogue repeats it | snippet |
| topSpeedMs | 47.22 (170 km/h) | m/s | official | Kia EU tech spec and Irish release, 170 km/h. ADAC's German catalogue says 173 km/h. I took the lower, from Kia's own sheet. | snippet |

## The other cars, for comparison (all snippets)

| | Rio 1.25 (chosen) | Swift 1.2 Dualjet | Yaris 1.0 | Polo 1.0 MPI 80 | i20 1.2 84 |
|---|---|---|---|---|---|
| Power | 62 kW | 66 kW | 51 kW | 59 kW | 62 kW |
| Torque | 122 Nm | 120 Nm @ 4,400 | 95 Nm @ 4,300 | 93 Nm | — |
| Kerb mass | 1,110 kg (EU, with driver) | 900 kg (min, basis unclear) | 980–1,055 kg (sources differ) | 1,106 kg (basis unclear) | 1,055 kg |
| L × W × H (mm) | 4,065 × 1,725 × 1,450 | 3,840 × 1,735 × 1,495 | 3,945 × 1,695 × 1,510 | 4,053 × 1,751 × 1,461 | — |
| Wheelbase (mm) | 2,580 | 2,450 | 2,510 | 2,551–2,564 | — |
| Front track (mm) | 1,518 | — | 1,485 | 1,499 | — |
| Tyres | 185/65 R15 | not confirmed | 175/65 R15 | 185/65 R15 | — |
| 0–100 km/h | 12.9 s | 11.9 s | 15.3 s | 14.9 s | — |
| Top speed | 170 km/h | 180 km/h | 150–155 km/h | 170 km/h | — |
| Turning circle | 10.2 m | 9.8 m? (table order unclear) | 10.0 m | 10.6 m | — |
| Final / top gear | 4.600 / 0.719 | — / 0.717 (Japan spec) | — | — | 4.60 / 0.72 |
| Cd | — | 0.32 | — | — | 0.30 |

Rough medians of the group: power 62 kW, 0–100 km/h about 13–14 s, top
speed 170 km/h. The Rio sits in the middle of the group on nearly every
figure, which is why one car's self-consistent set is a fair stand-in.
Comparison sources: Swift
https://www.autoexpress.co.uk/suzuki/swift/98963/new-suzuki-swift-2017-review
and https://www.ultimatespecs.com/car-specs/Suzuki/109550/Suzuki-Swift-6-12-Dualjet.html;
Swift Japan-spec ratios https://spec.greeco-channel.com/en/swift-35_m/;
Yaris https://www.carfolio.com/toyota-yaris-1.0-vvt-i-557381;
Polo https://www.ultimatespecs.com/car-specs/Volkswagen/115488/Volkswagen-Polo-6-10-80HP.html
and https://www.carfolio.com/volkswagen-polo-1.0-534215;
i20 https://www.carfolio.com/hyundai-i20-1.2-401984.

## Sanity check (my arithmetic, Python)

- **First-gear pull at the wheels:** 122 × 3.545 × 4.600 × 0.92 ÷ 0.311 =
  **about 5,890 N**. On a 1,035 kg car that is 0.58 g. The front tyres can
  grip about 6,870 N at rest (61.7 % of the weight × μ 1.1), so the car can
  put this down. Plausible.
- **Power-limited top speed:** solving 62,000 × 0.92 = ½ × 1.167 × 0.32 ×
  2.10 × v³ + 0.012 × 1035 × 9.781 × v gives **v = 50.6 m/s = 182 km/h**
  (181 km/h with 0.90 efficiency, about the same with 1,110 kg).
  Published: 170 km/h. Difference **+7 %, inside the 10 % check.**
- Why physics comes out high: at 170 km/h in fifth (0.719) the engine turns
  only about 4,800 rpm, well below its 6,000 rpm power peak, so fifth is a
  cruising gear and the car cannot use its full 62 kW there. In fourth
  (0.906) 170 km/h is about 6,050 rpm, right at the peak. So the published
  170 km/h agrees with the gearing; the simple "full power" formula
  overestimates. The figure that looks least sure is the drag coefficient
  (not Kia's own number).
- **Braking:** with μ 1.1 and g 9.781 an ideal stop from 100 km/h is
  35.9 m, against 35.5 m measured.

## Weaknesses

- Every figure is from a search snippet; none was read on the page. The
  snippet tool sometimes garbled tables (two different reverse ratios; one
  snippet said the final drive was absent, another gave 4.600).
- 4th and 5th gear and reverse rest on one snippet each.
- Kerb mass: 75 kg taken off on the strength of ADAC's "(EU)" label; I did
  not see Kia's own definition.
- Brake distance, axle split and hence μ come from 1.0 T-GDI Rios (heavier
  turbo engine, later model year), not the 1.25.
- No Kia drag coefficient; 0.32 is a median of peers, one of them an
  estimate by the spec site itself.
- Turning circle: "kerb to kerb" not confirmed.
- Wheel radius is unloaded; the loaded radius is a few percent less.
- Suspension travel has no source at all.

## Could not open (the owner can open these himself)

All refused by this session's network proxy (403), not by robots.txt:

- Kia EU technical specification, Feb 2017 (the main source):
  https://press.kia.com/content/dam/kiapress/EU/download-files/New-Rio/Kia-Rio-Technical-Specification-3-Feb-2017.doc
  — check: kerb weight definition, 4th/5th/reverse/final drive for 1.25 MPI,
  turning-circle wording, any Cd.
- Kia Ireland launch release:
  https://press.kia.com/ie/en/home/media-resouces/press-releases/2017/KiaRio_pressrelease.html
  — check: reverse ratio (3.636 or 3.583), final drive 4.600.
- ADAC Kia Rio test page (brake 35.5 m):
  https://www.adac.de/rund-ums-fahrzeug/autokatalog/marken-modelle/kia/kia-rio/
- ADAC catalogue, Rio 1.2 (1,110 kg EU, 173 km/h):
  https://www.adac.de/rund-ums-fahrzeug/autokatalog/marken-modelle/kia/rio/yb/268350/
- auto motor und sport, Rio 1.0 T-GDI 120 (axle split 61.7/38.3, 37.1 m):
  https://www.auto-motor-und-sport.de/test/kosten-realverbrauch-kia-rio-1-0-t-gdi-120-gt-line/technische-daten/
- NHTSA inertial data (CoM height):
  https://eng.auburn.edu/~dmbevly/mech4420/vehicle_params.pdf
- OptimumG (ride frequency, damping):
  http://downloads.optimumg.com/Technical_Papers/Springs&Dampers_Tech_Tip_1.pdf
  and https://optimumg.com/of-springs-and-dampers/
- MATEC 2019 rolling resistance paper:
  https://www.matec-conferences.org/articles/matecconf/pdf/2019/03/matecconf_mms18_01005.pdf
- MDPI drivetrain efficiency paper: https://www.mdpi.com/2032-6653/14/12/342
- University of Michigan braking split paper:
  https://huei.engin.umich.edu/wp-content/uploads/sites/186/2015/02/vehicle.pdf
- EcoModder frontal-area factor: https://ecomodder.com/wiki/Vehicle_Coefficient_of_Drag_List
- MotorBeam road test (redline): https://motorbeam.com/2018-kia-rio-review-test-drive/2
- Auto Express Swift/Yaris/Fabia comparison (Cd):
  https://www.autoexpress.co.uk/suzuki/swift/99516/suzuki-swift-vs-toyota-yaris-vs-skoda-fabia
- Carfolio i20 1.2 (final drive 4.60, top gear 0.72, Cd 0.30):
  https://www.carfolio.com/hyundai-i20-1.2-401984
