# Place constants: gravity and air density (scope 001b)

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
- Status: partly verified (constants from a secondary table, not the standard).

## Air density

Formula: ideal gas law for dry air, rho = p / (R T), R = 287.05 J/(kg·K).
Pressure is ISO 2533 standard sea-level 101325 Pa (not a local normal).

- **Dublin / Finglas.** Met Éireann, Dublin Airport 1991–2020 averages,
  annual mean temperature 9.7 °C (monthly 5.2 … 15.4 °C):
  https://www.met.ie/cms/assets/uploads/2023/07/www_met_ie_dublin_9120-1.htm
  (search excerpt). Gives rho = 101325 / (287.05 × 282.85) = 1.248 kg/m³ (was
  1.247 from a guessed 10 °C). Station pressure normal: not found.
  Status: partly verified.
- **Lagos / Yaba.** Not verified. No NiMet, NOAA or WMO 1991–2020 normal for
  Lagos (Murtala Muhammed, WMO 65201, or Ikeja) could be read. WMO normals live
  at https://www.ncei.noaa.gov/products/wmo-climate-normals (found, not
  opened). A travel-weather site gave 27.45 °C with no named station; not used.
  The stored 1.176 kg/m³ (27 °C, rounded) stays as a flagged placeholder.
  Status: unverified. To fix: read the WMO 1991–2020 normal for station 65201.

Live weather is visual only and never feeds physics (see `src/place/place.ts`).
