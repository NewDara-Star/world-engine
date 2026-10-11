# 44. Lagos, Nigeria: free data sources for the world engine

Researched 2026-10-11. Target areas:
- **Omole Phase 1 / Ojodu / Ikeja**, around 6.635N 3.365E. Suggested bake box: `3.345,6.620,3.385,6.655` (W,S,E,N).
- **Yaba**, around 6.51N 3.375E. Suggested box: `3.360,6.490,3.395,6.530`, which also takes in the Makoko lagoon edge.
- **Metro box** for anything coarse: `3.00,6.35,3.75,6.75`.

**Licence rule used here.** A source is only usable if it allows a commercial game to store derived data. CC0, CC-BY, ODbL, CDLA-Permissive, public domain and the Copernicus licence pass. CC BY-SA passes but makes derived data share-alike. Anything marked NC, "scientific use only" or proprietary fails.

**Not fetched (blocked by robots.txt), only named:** Nominatim, Overpass API, openstreetmap.org user and changeset pages, and the HOT Tasking Manager. Bulk OSM comes from Geofabrik instead.

---

## 1. Source table

| # | Source | What / detail | Licence (commercial game OK?) | Size for Lagos | How to fetch just the Lagos box | Host |
|---|---|---|---|---|---|---|
| 1 | **OpenStreetMap via Geofabrik** | Streets with names, BRT/rail relations, POIs, buildings (some with `building:levels`/`height`), water, landuse. Quality notes in section 2. | **ODbL, OK.** Needs attribution, and the derived database is share-alike. | Nigeria PBF is **677 MB** (data to 2026-10-09). Geofabrik defines **no sub-regions**, so there is no Lagos cut. A Lagos box is probably tens of MB; an Omole box is under 5 MB. | Download `nigeria-latest.osm.pbf`, then `osmium extract -b 3.345,6.620,3.385,6.655`. Do not use Overpass in bulk. | download.geofabrik.de |
| 2 | **Overture Maps buildings** (release 2026-09-23.1) | OSM conflated with Esri Community Maps, Microsoft ML, Google Open Buildings and others. Priority order: **OSM > community > ML**. Matches need IoU > 0.5 and merge their height attributes. Footprints that don't overlap are added hierarchically. Each feature carries `sources[]`, so you can see per building whether it came from OSM, Google or Microsoft. | **ODbL, OK** (the theme is ODbL because it contains OSM). | An Omole box is probably a few MB of GeoParquet/GeoJSON. Overture streams only the box. | `overturemaps download --bbox=3.345,6.620,3.385,6.655 --type=building -f geojson -o omole_bldg.geojson`, or DuckDB on `s3://overturemaps-us-west-2/release/<latest>/theme=buildings/type=building/*` filtered on `bbox.xmin/ymin`. Get `<latest>` from `stac.overturemaps.org/catalog.json`. | overturemaps-us-west-2 (S3), overturemapswestus2.blob.core.windows.net |
| 3 | **Overture places** | POIs. Sources: Meta (about 59M of 81M places), Microsoft, Foursquare, AllThePlaces, PinMeTo and others. Has a `confidence` (existence) score from 0 to 1 that is not calibrated across providers. **Contains no OSM.** | **CDLA-Permissive-2.0 / Apache-2.0 (Foursquare) / CC0 (AllThePlaces), OK.** Joining it to OSM may make the joined result ODbL. | Small, about 1 MB per neighbourhood. | DuckDB on `theme=places/type=place`, filtered on `bbox` and `names.primary ILIKE '%fasta%'` (and similar). | same as #2 |
| 4 | **Google Open Buildings v3 (polygons)** | ML footprints from 50 cm imagery, inference run May 2023. **Nigeria is in the country list.** Confidence runs 0.65–1.0. A per-S2-cell `score_thresholds_s2_level_4.csv` gives cutoffs for 80/85/90 % precision, and Google recommends the 90 % cutoff for OSM-style use. Weak spots: dense contiguous settlements, small buildings, and high-rise roofs offset by viewing angle. No heights. | **CC BY 4.0 or ODbL (your choice), OK.** | Sharded by S2 level-4 cell, up to **7.8 GB per gzipped CSV**. Lagos sits in one or two L4 cells, so expect several GB to stream for a few MB of output. | `gs://open-buildings-data/v3/polygons_s2_level_4_gzip/<token>_buildings.csv.gz`. The token comes from the tiles GeoJSON. Stream through `zcat`, filter on lat/lon to the box, then apply the cell's 85–90 % threshold. Overture already includes this data, so it is optional. | storage.googleapis.com/open-buildings-data |
| 5 | **Google Open Buildings 2.5D Temporal v1** | Annual rasters **2016–2023**. Bands: `building_height` (0–100 m above ground), `building_presence` (uncalibrated 0–1) and `building_fractional_count`. **Effective resolution about 4 m**, stored at 0.5 m. Covers Africa. Height MAE is 1.5 m, but it was **validated only in the Global North**, so Lagos accuracy is unknown and tall buildings are likely underestimated. Capped at 100 m. | **CC BY 4.0 or ODbL (your choice), OK.** Also subject to the Sentinel-2 legal notice (attribution). | Google says Nigeria in full can be **100–200 GB** per year. An Omole or Yaba box at 0.5 m for one year is probably tens of MB; resampling to 2–4 m shrinks it a lot. | **Not Earth Engine only.** (a) Earth Engine `GOOGLE/Research/open-buildings-temporal/v1`, which needs an account; free for non-commercial use, and commercial EE use needs a paid plan. (b) **Raw COG tiles in the GCS bucket `open-buildings-temporal-data/v1`** through Google's Colab notebook. (c) The community repo `github.com/saiga143/google-2.5d-bulk-download` has per-country `ISO3_YEAR.txt` lists of direct `.tif` URLs; pick only the tiles that cross the box. | storage.googleapis.com (bucket open-buildings-temporal-data) |
| 6 | **Microsoft Global ML Building Footprints** | Footprints with a `confidence` field and a `height` field (-1 where there is no estimate). Height coverage is mostly US and Europe (2023–2026 updates). **Nigeria heights: unconfirmed.** The May 2023 update added about 18M Nigerian footprints. | **CDLA-Permissive-2.0, OK.** | Partitioned by country and level-9 quadkey (about 78 km tiles). Lagos needs 1–3 files, probably tens of MB each. Files are `.csv.gz` but contain GeoJSONL. | Read `dataset-links.csv`, select the Nigeria rows whose quadkeys cross the box, then download. | bfppub.blob.core.windows.net (current); minedbuildings.z5.web.core.windows.net (old) |
| 6b | **Microsoft Kenya–Nigeria footprints** (older) | 35,767,509 Nigerian footprints from Maxar 2020–21 imagery. No heights stated. | **ODbL, OK.** | Single `nigeria.geojsonl.zip`, multi-GB. | Download and filter by box. Superseded by #6 and Overture. | minedbuildings.z5.web.core.windows.net |
| 7 | **GlobalBuildingAtlas (TUM)** | 2.75B polygons, a **3 m height raster** (PlanetScope), and LoD1 models. **No African training or validation data**; global LoD1 RMSE is 5.5 m. | **GBA.Height, GBA.Polygon and GBA.LoD1 are CC BY-NC 4.0: NOT OK.** Only **GBA.ODbLPolygon** is ODbL, and it has no heights beyond what OSM and Microsoft already give. | (not needed) | Hugging Face `zhu-xlab/GBA.ODbLPolygon`; heights on mediaTUM 1782307. | huggingface.co, mediatum.ub.tum.de |
| 8 | **3D-GloBFP** (Che et al., ESSD 2024) | Per-footprint heights on Microsoft footprints, shapefiles. **Africa RMSE 9.87 m** (3.86 m under 10 m tall; 25.5 m above 50 m). | **Licence unverified.** The Zenodo page was rate-limited. The article is CC BY 4.0, but that says nothing about the data. Check before use. | The Americas+Africa+Oceania record is very large. | Zenodo 10.5281/zenodo.11319912 | zenodo.org |
| 9 | **WSF 3D (DLR)** | **90 m** grid of average building height, building area, volume and fraction, in 1°×1° tiles. Released 2023-02. | **CC BY 4.0, OK.** | One 1° tile (N06 E003), a few MB. | `https://download.geoservice.dlr.de/WSF3D/files/` (take the tile covering lat 6–7 / lon 3–4). WMS also available. | download.geoservice.dlr.de |
| 10 | **GHSL GHS-BUILT-H R2023A** | **100 m** average net building height (ANBH), epoch 2018. Mollweide tiles. | **EC reuse: "reuse authorised with acknowledgment" (CC BY-equivalent), OK.** | One tile, a few MB. | GHSL download page (`ds=builtH`), pick the tile from the tiling shapefile; or Earth Engine `JRC/GHSL/P2023A/GHS_BUILT_H`. | human-settlement.emergency.copernicus.eu, jeodpp.jrc.ec.europa.eu |
| 11 | **Ecopia/Maxar "Digitize Africa"** footprints | High-quality 50 cm-derived footprints (2020/21). | **Proprietary: NOT OK.** Raw footprints are not openly distributed. WorldPop's Nigeria-derived 100 m rasters (NGA building class v1.0) are **CC BY-NC-SA: NOT OK**. | (none) | (none) | data.worldpop.org (derived only) |
| 12 | **GRID3 Nigeria** | Settlement Extents **v4.1** (Aug 2026; v4.0 is **CC BY-SA 4.0**). Building-height metrics in it come **from Google 2.5D**. Also: Roads v1.0 (Oct 2025), settlement names, boundaries, health facilities, state-level POI sets on open.africa (schools and mosques for other states seen). | Settlement extents are **CC BY-SA 4.0, OK but share-alike**. **Roads v1.0 and POIs: licence unverified** (the Columbia pages were bot-blocked). | GeoPackage per state or country; Lagos is MBs. | data.grid3.org (ArcGIS Hub), search `tags=NGA`; GRID3 GeoServer WFS filtered to state code LA. | data.grid3.org, open.africa |
| 13 | **OpenAerialMap** (searched the Yaba–Omole box) | **3 images:** (a) **Makoko UAV 2019-10-02, 5.4 cm GSD**, Uhurulabs, bbox 3.3849–3.3971 E / 6.4902–6.5054 N. (b) A second Makoko UAV image the same day, 6.4 cm. (c) **Maxar 2019 Lagos Mosaic, 50 cm**, covering the whole metro (3.08–3.75 E, 6.35–6.87 N). | (a) and (b) are **CC-BY 4.0, OK**. Good for texture or reference at Makoko, right next to Yaba. (c) is **CC BY-NC 4.0: NOT OK** for the game. It can be viewed for reference only and must not be stored or baked. | UAV COGs are probably hundreds of MB. | `api.openaerialmap.org/meta?bbox=3.30,6.45,3.42,6.68` returns COG URLs; fetch with a GDAL `/vsicurl/` window. | api.openaerialmap.org, oin-hotosm.s3.amazonaws.com |
| 14 | **Lagos State government GIS** (LAGIS, Lagos e-GIS Office, LASPPPA, Ministry of Physical Planning) | **Orthophotos and LiDAR of Lagos exist.** The state's digital mapping project is complete, and the LAGIS law was signed 2025-10-06. "Lagos Property Bank" was unveiled at Lagos GIS Day, Oct 2026. Eko 360 / Lagos Bureau of Statistics open-data agenda (2019–21) showed only a demo portal. | **No public or open licence found: treat as NOT available.** Could be asked for or licensed. | (none) | (none) | lagosstate.gov.ng (no open endpoint found) |
| 15 | **Copernicus DEM GLO-30** | 30 m **DSM** (includes buildings and trees), EGM2008 heights. **Tile `Copernicus_DSM_COG_10_N06_00_E003_00_DEM`** covers lat 6–7 / lon 3–4, which holds Omole, Ikeja, Yaba, Lagos Island, Victoria Island and the lagoon. Nigeria is public (only 2 countries are restricted). Ocean has no data (0). | **Copernicus licence: commercial use, modification and redistribution allowed.** Attribution: "produced using Copernicus WorldDEM-30 © DLR e.V. 2010-2014 and © Airbus Defence and Space GmbH 2014-2018 provided under COPERNICUS by the European Union and ESA; all rights reserved", plus the no-liability notice. | 1 tile, about 25–45 MB COG. | `s3://copernicus-dem-30m/Copernicus_DSM_COG_10_N06_00_E003_00_DEM/Copernicus_DSM_COG_10_N06_00_E003_00_DEM.tif` (anonymous, eu-central-1), or `/vsicurl/` window to the box. | copernicus-dem-30m.s3.eu-central-1.amazonaws.com |
| 15b | **DEM alternatives** | NASADEM 30 m. **AW3D30** (JAXA). **FABDEM** 30 m bare-earth (buildings and trees removed). TanDEM-X 30 m EDEM. TanDEM-X 12 m / WorldDEM. | NASADEM is **public domain, OK**. AW3D30: JAXA tags it **"Commercial Use Allowed (Free of charge)"**, so OK, but the attribution wording is unverified. **FABDEM is CC BY-NC-SA: NOT OK.** **TanDEM-X 30 m EDEM is scientific and non-commercial only, no redistribution: NOT OK.** TanDEM-X 12 m is commercial only through Airbus (paid). | 1 tile each | NASADEM: LP DAAC / OpenTopography. AW3D30: JAXA EORC (registration). | (various) |
| 16 | **Bathymetry** | GEBCO 2025 grid, about 450 m. Ocean only; the lagoon is almost certainly not resolved. Lagos lagoon: one single-beam echo-sounder survey (GEBCO Symposium 2019, Ayodeji); data not released. Ferry-route paper (NJTD 2017). NODC accession 7501146 "Water depth… from Lagos 1959–1960" (old; looks like a station record). | GEBCO is **public domain, commercial OK** with attribution. Others have no open data. | GEBCO box, under 1 MB. | GEBCO download app, subset by box. | gebco.net / download.gebco.net |
| 17 | **Transit: BRT, rail, danfo** | **No public GTFS for Lagos.** LUDI + WhereIsMyTransport + World Bank + LAMATA mapped **2,500+ danfo routes** in 2022 (GTFS made, **not public**; LUDI is not the custodian). The World Bank reproducibility package RR_NGA_2025_298 contains `danfo_wimt.shp` and `Lagos_GeoPackage_V2.gpkg` (WhereIsMyTransport routes, accessed Oct 2022). The package is BSD-3, but **no licence is stated for the route data**, and WIMT data was commercial. BRTData.org has indicators only (22 km, 28 stations). | **OSM route relations: ODbL, OK.** WIMT routes: **unclear, treat as NOT OK.** LAMATA fare data: custom licence, no redistribution. | (small) | Extract from #1: `route=bus` (BRT), `route=light_rail/train` (Blue Line opened 2023, Red Line 2024); use `osmium tags-filter`. | reproducibility.worldbank.org |
| 18 | **Street names** | OSM `name` on highways is the main source (completeness varies). GRID3 Roads v1.0 (licence unverified). GRID3 settlement and estate names. Overture transportation theme (it is OSM). | OSM/Overture: ODbL, OK. | in #1 | in #1 | (as above) |
| 19 | **Landmarks** (Fasta International School Omole; St Jude's Church Omole; Foursquare Gospel Church Omole) | **No open coordinates found by web search.** There are no Wikipedia or Wikidata articles for these three, and none appear on the Lagos Archdiocese parish pages found. They need a direct data query (see section 4). | Overture places (CDLA/Apache) or OSM (ODbL), OK. Google Maps/Places coordinates: **NOT OK** to store. | (none) | Overture places DuckDB name search in the Omole box; `osmium` + grep the Lagos extract for `name~Fasta|Jude|Foursquare`. | (as above) |

---

## 2. OSM coverage quality in Lagos

- **Completeness is improving quickly but uneven.** HeiGIT (Heidelberg) found that **Lagos had the largest building-completeness increase of any urban centre over 150 km² between Jan 2023 and May 2024**. Five of the top 20 such cities were Nigerian.
- A WorldPop comparison of Ecopia, Google v2, Microsoft and OSM found "big variations in coverage" across the four products in Lagos. It says the products "are not interchangeable" and gives no Lagos percentage.
- There is no published per-neighbourhood figure for Omole, Ojodu or Yaba. The OSM Nigeria wiki says west and north-west Lagos were missing roads visible on imagery (an old note).
- **HOT Tasking Manager:** changeset hashtags show **`#hotosm-project-11016 #Nigeria #Lagos #GRMI`**. GRMI probably means the GRID3 / Rapid Mapping Initiative, but that is not confirmed. Pages on tasks.hotosm.org and openstreetmap.org could not be read (robots.txt / fetch error), so this project's scope and area are unverified. Nigeria-wide HOT work (2024 floods, earlier Kano and northern Nigeria projects) is documented on the OSM wiki.
- **Communities:** OSM Nigeria (Facebook, @OSMNigeria), the **talk-ng** mailing list, **Unique Mappers Network** (Nigerian OSM NGO, YouthMappers-affiliated), and a 2017 "lagosmapper" mapping-party scene. No UNILAG YouthMappers chapter is listed on the wiki.
- **Practical expectation:** OSM roads and major POIs are good. Street names are patchy on minor estate streets. Buildings are partial, so **Overture's ML fill (Google/Microsoft) is needed** for complete footprints. OSM building heights are rare.

---

## 3. Recommended bake order for Lagos ("first best, from every source")

For each layer, take the first source that has data for a feature, then fall back down the list.

**A. Terrain (ground height)**
1. **Copernicus GLO-30 DSM**, tile N06 E003, cropped to the box. Because it is a DSM, filter it to bare earth: take a local minimum or percentile over a 100–150 m window, or mask cells where building presence from #5 or Overture footprints is above 0, then interpolate. Lagos is very flat (roughly 0–40 m), so a smoothed surface is fine.
2. Cross-check with **NASADEM** (public domain) where Copernicus shows artefacts.
3. Do **not** use FABDEM, TanDEM-X EDEM or the Lagos State LiDAR (licences don't allow it or the data is not public).

**B. Water and coastline**
1. **OSM** `natural=water`, `natural=coastline`, `waterway=*`, and the lagoon multipolygon.
2. Depth: **GEBCO** for the ocean. For the lagoon, use a **synthetic shallow profile** (about 1–3 m, deeper dredged channel; unverified) because no open lagoon bathymetry exists. Flag it as artistic.

**C. Streets and names**
1. **OSM** highways and names from the Geofabrik extract, cut with `osmium`.
2. Overture transportation, only as a cleaned copy of OSM (same data).
3. Rail and BRT from OSM route relations. There is no open danfo network; danfo routes would have to be hand-authored.

**D. Building footprints**
1. **OSM** buildings.
2. **Overture buildings**, which already conflate OSM > community > Microsoft/Google ML with IoU de-duplication. Use Overture as the main footprint layer and keep `sources[]` for each building.
3. Only if Overture has gaps in the box: **Google v3** at the 90 % precision cutoff for that S2 cell, then **Microsoft** with confidence ≥ 0.8.

**E. Building heights**, assigned per footprint in this order:
1. OSM `height` / `building:levels` × 3.2 m (rare in Lagos).
2. Overture `height` / `num_floors` where present.
3. **Google 2.5D Temporal, year 2023**: median (or 75th percentile) of `building_height` pixels inside the footprint, using only pixels with `building_presence` ≥ about 0.5. This is the best open height source by far, at 4 m effective resolution, CC BY/ODbL.
4. Microsoft `height` if not -1 (unlikely in Nigeria).
5. **WSF3D 90 m** average height for that cell (CC BY).
6. **GHSL 100 m ANBH 2018** for that cell.
7. A default by building type: house 6 m, `apartments` 12 m, church or school 8–10 m.

Clamp heights to 3–100 m. Lagos Island and Victoria Island towers above 100 m need hand overrides, because Google caps at 100 m and underestimates tall buildings.

**F. POIs and landmarks**
1. **OSM** named POIs.
2. **Overture places** with `confidence` > 0.8 for missing schools, churches and shops (CDLA; keep as a separate layer to avoid making it ODbL).
3. Manual placement from field knowledge for Fasta International School, St Jude's and Foursquare Omole if both sources lack them. Coordinates from Google Maps must not be stored.

**G. Imagery and reference**
OAM Makoko UAV (CC-BY) for local texture reference only. Do not bake the Maxar 2019 mosaic (NC).

**Attribution block to ship:**
- © OpenStreetMap contributors (ODbL)
- Overture Maps Foundation
- Google Open Buildings (CC BY 4.0)
- Microsoft Building Footprints (CDLA-P-2.0)
- Copernicus WorldDEM-30 notice
- DLR WSF3D (CC BY 4.0)
- © European Union GHSL
- GEBCO Compilation Group
- Uhurulabs/OAM (CC-BY 4.0) if used

---

## 4. Unknown / not verified

1. **Landmark coordinates** for Fasta International School, St Jude's Church Omole and Foursquare Gospel Church Omole. None were found on the web. They need a local Overture places / OSM extract query, which was not run (no data-tool access in this task). It is also unknown whether St Jude's is Catholic or Anglican.
2. **Actual building completeness** of OSM vs Overture in the Omole and Yaba boxes. It needs the boxes counted by source after download.
3. **HOT TM project 11016** ("Lagos GRMI"): scope, area and date. Its pages are robots-blocked. Whether other Lagos TM projects exist is also unknown.
4. **Google 2.5D height accuracy in Lagos.** It has not been validated in Africa. A spot check against known buildings is needed.
5. **The exact GCS tile URLs and per-tile size** for 2.5D Temporal around Lagos (the repo's URL lists were not opened), and the S2 level-4 token for the Google v3 polygon file covering Lagos.
6. **Microsoft heights in Nigeria.** The height-coverage GeoJSON was not checked.
7. **Overture height coverage in Lagos**, and whether Esri Community Maps contributes anything there (likely not).
8. **Licences not confirmed:** 3D-GloBFP (Zenodo rate-limited), GRID3 Roads v1.0 and GRID3 POI sets (Columbia pages bot-blocked), the exact AW3D30 attribution wording, the WhereIsMyTransport route data in the World Bank package, and BRTData terms.
9. **Lagos State LiDAR/orthophoto:** resolution, coverage and year, and whether it can be licensed or requested from LAGIS / the e-GIS office.
10. **Lagos lagoon depth:** no open grid exists. The depth range in section 3 is a working assumption, not sourced.
11. **WSF3D tile filename** for N06 E003 (the directory listing was not opened) and the GHSL tile ID for Lagos.
12. **Lagos GTFS:** whether LAMATA will ever publish the 2022 danfo GTFS, and whether any community GTFS (for example on Transitland) exists. None was found.

---

## Sources
- Overture buildings guide: https://docs.overturemaps.org/guides/buildings
- Overture places guide: https://docs.overturemaps.org/guides/places
- Overture getting data: https://docs.overturemaps.org/getting-data/
- Overture and Google Open Buildings blog: https://overturemaps.org/blog/2023/overture-buildings-theme-hits-2-3b-buildings-with-addition-of-google-open-buildings-data/
- Google Open Buildings v3: https://sites.research.google/gr/open-buildings/
- Google 2.5D Temporal: https://sites.research.google/gr/open-buildings/temporal
- Google 2.5D Temporal in Earth Engine: https://developers.google.com/earth-engine/datasets/catalog/GOOGLE_Research_open-buildings-temporal_v1
- 2.5D bulk download (article): https://sola.kau.se/deprimap/2025/07/15/google-25d-download/
- 2.5D bulk download (repo): https://github.com/saiga143/google-2.5d-bulk-download
- Microsoft Global ML Building Footprints: https://github.com/microsoft/GlobalMLBuildingFootprints
- Microsoft Kenya–Nigeria footprints: https://github.com/microsoft/KenyaNigeriaBuildingFootprints
- GlobalBuildingAtlas (article): https://essd.copernicus.org/articles/17/6647/2025/
- GlobalBuildingAtlas (repo): https://github.com/zhu-xlab/GlobalBuildingAtlas
- 3D-GloBFP: https://essd.copernicus.org/articles/16/5357/2024/
- WSF 3D: https://geoservice.dlr.de/web/datasets/wsf_3d
- GHSL built height: https://developers.google.com/earth-engine/datasets/catalog/JRC_GHSL_P2023A_GHS_BUILT_H
- GHSL download: https://human-settlement.emergency.copernicus.eu/download.php?ds=builtH
- WorldPop Nigeria building class: https://data.worldpop.org/repo/wopr/NGA/BuildingClass/v1.0/NGA_building_class_metrics_v1_0_readme.pdf
- WorldPop buildings v2.0: https://data.worldpop.org/repo/wopr/_MULT/buildings/v2.0/XXX_buildings_v2_0_README.pdf
- WorldPop Africa footprint comparison: https://data.worldpop.org/repo/prj/Resources/Posters/Africa_Building_Footprint_Comparison_poster.pdf
- GRID3 Nigeria settlement extents v4.0: https://ciesin.columbia.edu/news/new-data-release-grid3-nigeria-settlement-extents-v40
- GRID3 Nigeria data: https://grid3.org/geospatial-data-nigeria
- OpenAerialMap search: https://api.openaerialmap.org/meta?bbox=3.30,6.45,3.42,6.68
- Lagos digital mapping (Nairametrics): https://nairametrics.com/2026/10/08/lagos-turns-to-digital-mapping-to-take-control-of-its-growing-city/
- Lagos GIS, AI and LiDAR (ThisDay): https://www.thisdaylive.com/2026/10/09/lagos-deploys-gis-ai-lidar-to-tackle-land-planning-crisis/
- Lagos open data agenda: https://lagosmepb.org/lagos-launches-open-data-agenda-eko-360/
- Copernicus DEM on AWS: https://registry.opendata.aws/copernicus-dem/
- Copernicus DEM licence: https://documentation.dataspace.copernicus.eu/APIs/SentinelHub/Data/DEM/resources/license/License-COPDEM-30.pdf
- Copernicus DEM specs (Digital Earth Africa): https://docs.digitalearthafrica.org/en/latest/data_specs/COP_DEM_specs.html
- FABDEM: https://gee-community-catalog.org/projects/fabdem/
- TanDEM-X 30m EDEM licence: https://geoservice.dlr.de/resources/licenses/tdm30-edited/License_for_the_Utilization_of_TanDEM-X_30m-EDEM_DCM_for_Scientific_Use.pdf
- AW3D30: https://earth.jaxa.jp/en/data/2552/index.html
- GEBCO terms of use: https://pointcloud.ucsd.edu/Scale/sources/GEBCO_2020_27_Jun_2021/GEBCO_Grid_terms_of_use.pdf
- Lagos lagoon bathymetry (GEBCO Symposium 2019): https://www.gebco.net/sites/default/files/documents/gebco_sym19_ayodeji_lagos.pdf
- Danfo mapping (MIT Atlas of Popular Transport): https://atlasofpopulartransport.mit.edu/lagos
- World Bank reproducibility package: https://reproducibility.worldbank.org/catalog/326
- BRTData Lagos: https://brtdata.org/location/africa/nigeria/lagos
- HeiGIT OSM completeness: https://heigit.org/analysis-of-osm-building-data-completeness-using-new-data/
- OSM wiki, Nigeria: https://wiki.openstreetmap.org/wiki/Nigeria
- Lagos mapping diary (2017): https://www.openstreetmap.org/user/roikay/diary/40688
- Geofabrik Nigeria: https://download.geofabrik.de/africa/nigeria.html
