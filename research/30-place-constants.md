# Place constants: gravity and air density (scopes 001b and 002)

Written 2026-10-10. **Honest limit:** this session's network blocked every
website (met.ie, NOAA, NGA, Wikipedia, ahrs.readthedocs.io all refused the
connection). So no page below was opened in a browser by us. Everything was read
from excerpts that a web search returned. Each item says which.

## Gravity (WGS84 normal gravity, Somigliana formula)

- Standard: NIMA TR8350.2, "Department of Defense World Geodetic System 1984"
  (2000). Named in the search excerpt of the pytcl gravity module's docs
  (https://pytcl.readthedocs.io/en/stable/_modules/pytcl/gravity/models.html).
  The TR8350.2 text was not opened.
- Constants as tabulated at https://ahrs.readthedocs.io/en/latest/constants.html
  (search excerpt): equatorial gravity 9.7803253359 m/s², Somigliana constant
  1.931852652458e-3, first eccentricity squared 6.69437999014e-3. A second
  excerpt (Wikipedia, "Theoretical gravity") agrees on the equatorial value and
  gives polar gravity as 9.8321849379 m/s².
- Check we ran ourselves: the formula at 53.396 N gives 9.8137 and at 6.51 N
  gives 9.7810, which are the stored values. A test repeats this.
- Status: derived (constants from a secondary table, not the standard).

## Air density

Formula: ideal gas law for dry air, rho = p / (R T), R = 287.05 J/(kg·K).
Pressure is ISO 2533 standard sea-level 101325 Pa (not a local normal).

- **Dublin / Finglas.** Met Éireann, Dublin Airport 1991–2020 averages,
  annual mean temperature 9.7 °C (monthly 5.2 … 15.4 °C):
  https://www.met.ie/cms/assets/uploads/2023/07/www_met_ie_dublin_9120-1.htm
  (search excerpt). Gives rho = 101325 / (287.05 × 282.85) = 1.248 kg/m³ (was
  1.247 from a guessed 10 °C). Station pressure normal: not found.
  Status: partly verified.
- **Lagos / Yaba (scope 002; was an unverified placeholder of 1.176).**
  Status: derived. Not an official NiMet figure.
  - Temperature: Lagos/Ikeja (WMO 65201), 1991–2020 mean 27.8 °C, station
    elevation 40 m, from Infoclimat
    (https://www.infoclimat.fr/climatologie/normales-records/1991-2020/lagos-ikeja/valeurs/65201.html),
    which computes its normals from the station's own METAR/SYNOP reports and
    warns its series may have gaps. **That page could not be opened** when this
    was written (the network refused it: "CONNECT tunnel failed, response 403");
    27.8 °C and the elevation are as given in `docs/scopes/002-diagram-tool.md`.
    Not read by us, so check it when the network allows.
  - Pressure at 40 m, ISO 2533 standard atmosphere, troposphere formula
    p = p0 · (1 − L·h/T0)^(g·M/(R·L)) with the standard's defining constants
    p0 = 101325 Pa, T0 = 288.15 K, L = 0.0065 K/m, g = 9.80665 m/s²,
    M = 0.0289644 kg/mol, R = 8.31446 J/(mol·K) (the ISO text itself was not
    opened; these are the standard values). Exponent = 5.2558;
    p = 101325 · (1 − 0.0065·40/288.15)^5.2558 = **100845 Pa**.
  - Density: rho = p / (R_dry · T) = 100845 / (287.05 × (27.8 + 273.15)) =
    100845 / 86384.8 = **1.1674 → 1.167 kg/m³**. (Sea-level pressure with the
    same temperature would give 1.173; the old placeholder 1.176 used 27 °C.)
  - Weaknesses: a derived mean temperature, not an official one; the pressure
    is a standard-atmosphere value, not a Lagos normal; dry air; the annual mean
    temperature is not the mean of density over the year. A test repeats the
    computation.
  - To do better: the NiMet or WMO 1991–2020 normal for the station, and a
    pressure normal (see PARKING_LOT.md).

Live weather is visual only and never feeds physics (see `src/place/place.ts`).
