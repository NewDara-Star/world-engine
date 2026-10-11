# 41. Free global geodata sources for a real-world driving game

Researched 2026-10-11. Each licence claim cites the page it was checked on. Where a source page could not be read, or a detail comes from general knowledge and was not confirmed on the page, it is marked **(unverified)**.

**What we can use:** CC0, PDDL, public domain, MIT, Apache, CDLA-Permissive, CC-BY, ODbL, open-government and similar attribution-only licences, plus the Copernicus "free, full and open" terms.
**UNUSABLE:** anything NC (non-commercial), ND (no-derivatives) or GPL, and Google Photorealistic 3D Tiles.

**ODbL and the game:** under the OSMF Produced Work guideline, rendered visuals are a "Produced Work" and need attribution only. Shipping processed vector tiles or geometry that people can extract data from is a "Derivative Database", so those tiles stay under ODbL and the source must be offered (https://osmfoundation.org/wiki/Licence/Community_Guidelines/Produced_Work_-_Guideline). Plan to (a) show "© OpenStreetMap contributors" plus the other credits on a credits screen, and (b) publish the processed tile data under ODbL. This is fine for a game, but it is not legal advice.

---

## 1. Roads, paths and rail

| Source | What | Coverage | Detail | Licence (usable?) | Size | How to get one area | Host |
|---|---|---|---|---|---|---|---|
| OpenStreetMap planet | All OSM: roads, paths, rail, buildings, landuse, water, POIs and names | Global | Full vector, community-mapped | **ODbL 1.0, usable** (share-alike on the database, attribution). https://www.openstreetmap.org/copyright | PBF about 88.5 GB (2026-10-01); weekly dumps, plus minutely/hourly/daily diffs (https://wiki.openstreetmap.org/wiki/Planet.osm) | Planet is too big for one area. Use a Geofabrik extract, then `osmium extract -b minlon,minlat,maxlon,maxlat`. | planet.openstreetmap.org (robots disallows bots, so link only); mirrors include ftp5.gwdg.de, ftp.fau.de, ftpmirror.your.org, mirror.init7.net, download.bbbike.org, downloads.opencagedata.com; AWS bucket `osm-pds` (us-east-1, ORC+PBF) (https://docs.opendata.aws/osm-pds/readme.html) |
| Geofabrik extracts | OSM PBF cut by continent, country and region | Global, hierarchical | Same as OSM | **ODbL 1.0, usable.** Extracts leave out user names and IDs. https://download.geofabrik.de/ | Europe 32.8 GB; countries from MB to a few GB | Download `https://download.geofabrik.de/<continent>/<country>-latest.osm.pbf`, then osmium-clip to a bbox. Updated daily. | download.geofabrik.de |
| BBBike extracts | Custom-bbox OSM extracts (PBF and other formats) | Global | Same as OSM | ODbL, usable | Per request | Web form, any bbox **(unverified, detail not checked)** | extract.bbbike.org, download.bbbike.org |
| Overpass API | Live OSM queries by bbox | Global | Same as OSM | ODbL | n/a | `https://overpass-api.de/api/interpreter` (robots disallow, so not fetched). Fine for small runtime queries but rate-limited; don't build a pipeline on it. | overpass-api.de |
| Overture Maps `transportation` | `segment` (LineString) and `connector` (Point). Road classes motorway…footway/steps/cycleway; rail classes (standard_gauge, subway, tram, light_rail, funicular…); water (ferry). Speed limits, access, surface, width, turn restrictions, linear referencing. https://docs.overturemaps.org/guides/transportation/ | Global, monthly | OSM plus TomTom and authoritative sources | **ODbL, usable** (https://docs.overturemaps.org/attribution/) | About 59 GB (July 2024 release, https://tech.marksblogg.com/overture-2024-revisit.html) | `overturemaps download --bbox=W,S,E,N -f geojson --type=segment -o roads.geojson`, or DuckDB `read_parquet('s3://overturemaps-us-west-2/release/2026-09-23.1/theme=transportation/type=segment/*')` with `WHERE bbox.xmin>…` (https://docs.overturemaps.org/getting-data/) | overturemaps-us-west-2 S3 (us-west-2); Azure `overturemapswestus2.blob.core.windows.net`; STAC `stac.overturemaps.org` |

**Latest Overture release** is `2026-09-23.1`, per the `latest` field at https://stac.overturemaps.org/catalog.json.

---

## 2. Buildings: footprints and heights

| Source | What | Coverage | Detail | Licence (usable?) | Size | How to get one area | Host |
|---|---|---|---|---|---|---|---|
| **Overture `buildings`** (`building` + `building_part`) | Conflated footprints: OSM first, then Esri Community Maps, Spain IGN, Vancouver, then Microsoft, Google Open Buildings and East-Asia ML roofprints. Has `height`, `has_parts`; building_part comes only from OSM. https://docs.overturemaps.org/guides/buildings/ | Global, "2.5 billion buildings and counting" | Height merged where available (IoU>0.5); coverage % not stated | **ODbL, usable.** Component credits: Esri CC BY 4.0, Google CC BY 4.0, MS ML (https://docs.overturemaps.org/attribution/) | About 213–363 GB (July 2024; the blog gives both figures) | `overturemaps download --bbox=… --type=building`, or DuckDB bbox filter on `theme=buildings/type=building/*` | same as Overture above |
| OSM buildings | Footprints with `height`, `building:levels`, `roof:shape` tags | Global, uneven | Best in Europe/Japan/US cities | ODbL, usable | In the planet | Geofabrik + osmium | as OSM |
| Google Open Buildings v3 | 1.8 B footprint polygons with confidence and area. **No height.** | About 58 M km²: Africa, S & SE Asia, Latin America & Caribbean | From high-res imagery | **CC BY 4.0 or ODbL 1.0 (your choice), usable** (https://sites.research.google/gr/open-buildings/) | 178 GB (polygons) | One CSV per **S2 level-4 cell** (up to 7.8 GB each). Look up the cell in `tiles.geojson`, then download `gs://open-buildings-data/v3/polygons_s2_level_4_gzip/<cell>_buildings.csv.gz`. Also on Earth Engine and HDX. | openbuildings-public-dot-gweb-research.uw.r.appspot.com (tiles.geojson); storage.googleapis.com (bucket `open-buildings-data`) |
| Google Open Buildings 2.5D Temporal v1 | Rasters with building presence, **building height** (above ground, capped 100 m, MAE 1.5 m) and fractional count. Yearly 2016–2023. | Same 58 M km² Global-South footprint, about 130 countries | About 4 m effective, served at 50 cm | **CC BY 4.0 or ODbL 1.0, usable** (https://sites.research.google/gr/open-buildings/temporal/) | Not stated (large) | Colab `open_buildings_temporal_download_region_geotiffs.ipynb` exports a region. GCS `open-buildings-temporal-data/v1`; EE `GOOGLE/Research/open-buildings-temporal/v1`. To get per-building heights, sample it under Overture/Google polygons. | storage.googleapis.com (bucket `open-buildings-temporal-data`); Earth Engine |
| Microsoft Global ML Building Footprints | About 1.4 B footprints from Bing imagery (2014–2024). **Per-building height in m** where estimated (−1 = none). | 225 regions, 30,340 tiles (2026-08-13 update) | ML, varies | **CDLA-Permissive 2.0, usable** per the repo README (https://github.com/microsoft/GlobalMLBuildingFootprints). Note: older releases were ODbL, and Overture still lists it under ODbL. | Many GB; over 19k country+quadkey files | Read `https://bfppub.blob.core.windows.net/%24web/2026-08-13/dataset-links.csv`, pick rows by **level-9 quadkey** for your bbox, download the `.csv.gz` (line-delimited GeoJSON) | bfppub.blob.core.windows.net (new); minedbuildings.z5.web.core.windows.net (old and coverage files) |
| GlobalBuildingAtlas (TUM, 2025) | Global polygons + heights + LoD1 models | Global | 5°×5° tiles, EPSG:3857 / 4326 | **Mixed.** `GBA.ODbLPolygon` = ODbL, **usable**, but it is just OSM+Microsoft polygons with **no heights**, 462 GB. `GBA.Polygon`, `GBA.LoD1`, `GBA.Height` = **CC BY-NC 4.0, UNUSABLE**. Code is MIT + Commons Clause, **UNUSABLE**. (https://github.com/zhu-xlab/GlobalBuildingAtlas, https://huggingface.co/datasets/zhu-xlab/GBA.ODbLPolygon) | 462 GB (ODbL polygons) | Index files `lod1.geojson` / `height_*.geojson` give tile names; download from HF | huggingface.co; mediatum.ub.tum.de |
| 3D-GloBFP (Che et al. 2024) | Global footprints (from Microsoft + East Asia) with **XGBoost heights** for 2020. Global RMSE 6.14 m; poor for high-rise. | Global with gaps | Per building, shapefiles | **Licence not verified.** Zenodo rate-limited me; the ESSD article itself is CC BY 4.0 (https://essd.copernicus.org/articles/16/5357/2024/index.html). Check Zenodo before use. | Large (3 regional records) | Zenodo records 11319912 (Americas/Africa/Oceania), 11397014 (Asia), 11391076 (Europe); R package `gloBFPr` | zenodo.org (maybe figshare.com) |
| UT-GLOBUS | Building heights + urban canopy parameters for major cities | City subset, not global | Per building (GPKG, UTM) | **CC BY 4.0, usable** (https://zenodo.org/records/11156602) | 53.5 GB | Download a regional zip from Zenodo | zenodo.org |
| EUBUCCO v0.2 | 322 M+ buildings with height, type and construction year | EU-27 + UK, NO, CH | Height on every building (official / merged / ML, with `_confidence`) | **ODbL, usable** for the main set. Prague is CC BY-SA (separate file); **Abruzzo is CC BY-NC, UNUSABLE**; Wallonie, Malta and Mecklenburg-Vorpommern are not redistributed (https://www.nature.com/articles/s41597-023-02040-2, https://source.coop/abry-tudelft/eubucco) | Regional Parquet; lat/lon index 15 GB | Per-region Parquet via S3 or DuckDB (https://eubucco.com/data/download) | s3.eubucco.com; eubucco.com; source.coop / data.source.coop |
| GHSL GHS-BUILT-H R2023A | Raster of average building height, from AW3D30+SRTM+Sentinel-2 (2018) | Global | 100 m **(unverified on product page)** | **CC BY 4.0, usable** (https://human-settlement.emergency.copernicus.eu/GHSLhowToCite.php) | Tiled | Tile picker on download page; tiles under `jeodpp.jrc.ec.europa.eu/ftp/jrc-opendata/GHSL/…` | jeodpp.jrc.ec.europa.eu; human-settlement.emergency.copernicus.eu; ghsl.jrc.ec.europa.eu |
| WSF 3D (DLR) | Average building height, built volume, area and fraction rasters; also vector tiles | Global | About 90 m (2.8″), 1°×1° tiles | **CC BY 4.0, usable** (https://geoservice.dlr.de/web/datasets/wsf_3d) | Not stated | 1×1° tile from `download.geoservice.dlr.de/WSF3D/files/` | download.geoservice.dlr.de; geoservice.dlr.de |

---

## 3. Terrain (DEM) and bathymetry

| Source | What | Coverage | Detail | Licence (usable?) | Size | How to get one area | Host |
|---|---|---|---|---|---|---|---|
| **Copernicus DEM GLO-30** | DSM (surface incl. buildings and trees) | Global except a few unreleased tiles (reportedly Armenia/Azerbaijan, **unverified**). Ocean has no tiles (= 0). | 1″ (about 30 m), 1°×1° COG, 3600 px | **Copernicus DEM licence: free, worldwide, may adapt, modify and redistribute**. Needs the notice "© DLR e.V. 2010-2014 and © Airbus Defence and Space GmbH 2014-2018 provided under COPERNICUS by the European Union and ESA; all rights reserved", prefixed with "produced using Copernicus WorldDEM-30" if modified. No endorsement claims; pass terms downstream. **Usable.** (https://documentation.dataspace.copernicus.eu/APIs/SentinelHub/Data/DEM/resources/license/License-COPDEM-30.pdf) | About 26k tiles, DEFLATE float32 | By name: `https://copernicus-dem-30m.s3.amazonaws.com/Copernicus_DSM_COG_10_N53_00_W007_00_DEM/Copernicus_DSM_COG_10_N53_00_W007_00_DEM.tif` (name = SW corner; `_10_` = 1″). Folder pattern confirmed at https://copernicus-dem-30m.s3.amazonaws.com/readme.html; the HTTPS form is inferred. Range-read with GDAL `/vsicurl/`. | copernicus-dem-30m.s3.amazonaws.com (eu-central-1) |
| Copernicus DEM GLO-90 | Same, coarser | Global | 3″ (about 90 m), `_30_` in name, 1200 px | Same, usable | small | `copernicus-dem-90m` bucket, same naming | copernicus-dem-90m.s3.amazonaws.com |
| NASADEM | Reprocessed SRTM | 60°N–56°S | 1″, 1°×1° `.hgt` (e.g. `s01w047`) | "openly shared, without restriction" under EOSDIS data use policy (https://www.earthdata.nasa.gov/data/catalog/lpcloud-nasadem-hgt-001). **Usable.** | — | Needs a **NASA Earthdata Login** (https://grass.osgeo.org/grass8/manuals/addons/r.in.nasadem.html) | e4ftl01.cr.usgs.gov, urs.earthdata.nasa.gov, data.lpdaac.earthdatacloud.nasa.gov |
| SRTM (v3 1″/3″) | Original shuttle radar DEM | 60°N–56°S | 30/90 m | Public domain (USGS), per joerd attribution (https://github.com/tilezen/joerd/blob/master/docs/attribution.md). **Usable.** | — | Earthdata login (LP DAAC), or via AWS Terrain Tiles below | as NASADEM |
| ALOS AW3D30 v4.1 (JAXA) | DSM | Global | About 30 m, 1°×1° (23,993 tiles) | "Any of the commercial and non-commercial purposes can be used free of charge" (https://www.eorc.jaxa.jp/ALOS/en/dataset/aw3d30/aw3d30_e.htm). Full JAXA terms at https://earth.jaxa.jp/policy/en.html, which I could not render, so redistribution terms are **unverified**. **Probably usable.** | — | Free registration, then pick tiles | www.eorc.jaxa.jp |
| FABDEM (Fathom/Bristol) | Bare-earth Copernicus DEM (buildings and forest removed) | Global | 30 m | **CC BY-NC-SA 4.0, UNUSABLE** (https://zenodo.org/records/7875856 says the underlying FABDEM V1-0 is CC BY-NC-SA 4.0) | — | — | data.bris.ac.uk |
| FathomDEM v1-0 | FABDEM successor | Global (two records) | 30 m | **CC BY-NC-SA 4.0, UNUSABLE**; access by request (https://zenodo.org/records/14511570) | 66.5 TB | — | zenodo.org |
| MERIT DEM | Error-removed DEM | 90°N–60°S | 3″ (90 m), 5°×5° tiles | Dual **CC BY-NC 4.0 or ODbL 1.0**. The ODbL option is **usable** for commercial use with share-alike on derived data. Redistributing the full original needs written permission. (https://global-hydrodynamics.github.io/MERIT_DEM/) | — | Google-form registration, then password, then Dropbox | global-hydrodynamics.github.io; dropbox.com |
| AWS Terrain Tiles (Mapzen/joerd) | Pre-tiled bare-earth heights: terrarium/normal PNG, GeoTIFF, skadi `.hgt` | Global | Up to about z15; SRTM, GMTED, ETOPO1, 3DEP, national LiDAR | All sources public domain or attribution licences; no NC listed (https://github.com/tilezen/joerd/blob/master/docs/attribution.md, https://registry.opendata.aws/terrain-tiles/). **Usable.** | — | `https://elevation-tiles-prod.s3.amazonaws.com/terrarium/{z}/{x}/{y}.png` (path inferred, **unverified**) | elevation-tiles-prod.s3.amazonaws.com (us-east-1); `elevation-tiles-prod-eu` (eu-central-1) |
| **Mapterhorn** | Terrarium-encoded terrain RGB, WebP 512 px, in PMTiles. Global base is Copernicus GLO-30 plus national LiDAR (down to 0.25 m in places). | Global 30 m; higher in parts of Europe, Japan, etc. | z0–12 planet, z13–17 regional | Code BSD-3. Data: every source listed is CC BY / CC0 / open-government / Copernicus, no NC/ND seen (https://download.mapterhorn.com/attribution.json, list truncated, so recheck). **Usable.** | Not stated | `pmtiles extract https://download.mapterhorn.com/<file>.pmtiles out.pmtiles --bbox=…`, or XYZ `https://tiles.mapterhorn.com/{z}/{x}/{y}.webp` (https://mapterhorn.com/data-access/) | tiles.mapterhorn.com; download.mapterhorn.com |
| GEBCO_2026 Grid | Global ocean + land elevation | Global | 15″ (about 450 m) | **Public domain**: may commercially exploit, copy, distribute and adapt. Must acknowledge, and must not imply official status or endorsement. (https://www.gebco.net/data-products/gridded-bathymetry/terms-of-use) | About 4 GB compressed, 7 GB GeoTIFF | Pick an area in the download app (netCDF/GeoTIFF), or OPeNDAP subset (https://www.gebco.net/data-products/gridded-bathymetry-data) | download.gebco.net; dap.ceda.ac.uk; data.ceda.ac.uk |
| EMODnet Bathymetry DTM 2024 | European seas DTM (LAT and MSL) | 36W–43E, 15N–90N; plus part of the Caribbean | 1/16′ (about 115 m) | **CC BY 4.0, usable.** "DO NOT USE FOR NAVIGATION". (https://sextant.ifremer.fr/record/18ff0d48-b203-4a65-94a9-5fd8b0ec35f6, DTM 2018 record; assume the same for 2024) | Tiles | Products Catalogue / Map Viewer tile download (https://emodnet.ec.europa.eu/en/bathymetry) | emodnet.ec.europa.eu; tiles.emodnet-bathymetry.eu (WMTS) |
| Overture `base/bathymetry` | Bathymetry polygons from ETOPO1 + GLOBathy | Global | Coarse | ODbL (GLOBathy CC0 "assumed"), usable | small | DuckDB bbox | Overture hosts |

---

## 4. Coastline and water

| Source | What | Coverage | Detail | Licence (usable?) | Size | How to get one area | Host |
|---|---|---|---|---|---|---|---|
| **OSM land/water polygons** (osmdata.openstreetmap.de) | Ready-made land polygons and ocean water polygons from the OSM coastline; complete or split; WGS84 or Mercator; simplified versions for z0–9 | Global | OSM detail | **ODbL, usable** (https://osmdata.openstreetmap.de/data/land-polygons.html) | Few hundred MB to about 1 GB **(sizes not stated)** | Download e.g. `https://osmdata.openstreetmap.de/download/water-polygons-split-4326.zip`, then clip with ogr2ogr `-clipsrc` | osmdata.openstreetmap.de |
| OSM inland water / waterways | `natural=water`, `waterway=*` | Global | Vector | ODbL | in planet | Geofabrik | as OSM |
| Overture `base/water` and `base/land` | OSM-derived water and land | Global | Vector | ODbL, usable | part of base (143 GB in July 2024) | DuckDB bbox | Overture hosts |
| JRC Global Surface Water | Occurrence, change, seasonality, recurrence, transitions, max extent, 1984–2021/2024 | Global | 30 m, 10°×10° tiles | "free of charge, without restriction of use"; cite Pekel et al. 2016; credit "Source: EC JRC/Google" (https://global-surface-water.appspot.com/download). **Usable.** | Not stated | Pick a 10° tile, download the `.tif` (e.g. `storage.googleapis.com/global-surface-water/downloads2021/occurrence/occurrence_10W_60Nv1_4_2021.tif`, path **unverified**); XYZ `https://storage.googleapis.com/global-surface-water/tiles2021/<layer>/{z}/{x}/{y}.png` | storage.googleapis.com (buckets global-surface-water, water-world); s3.waw4-1.cloudferro.com |
| HydroLAKES | 1.4 M lakes/reservoirs ≥10 ha | Global | Polygons | **CC BY 4.0, usable** (https://www.hydrosheds.org/products/hydrolakes) | 820 MB shp | Download global or regional, then clip | data.hydrosheds.org |
| HydroRIVERS | River network with flow attributes | Global | 15″ derived lines | **Custom HydroSHEDS v1 licence**: free for commercial use, can go into derivative works distributed to end users, but **not as a stand-alone product**; attribution "incorporates data from the HydroSHEDS version 1 database". (https://www.hydrosheds.org/products/hydrorivers, https://data.hydrosheds.org/file/technical-documentation/HydroSHEDS_TechDoc_v1_4.pdf) **Usable with care**: don't ship raw river files as downloadable data. | 544 MB shp | Global or regional download | data.hydrosheds.org |

---

## 5. Land cover

| Source | What | Coverage | Detail | Licence (usable?) | Size | How to get one area | Host |
|---|---|---|---|---|---|---|---|
| **ESA WorldCover 2020 (v100) / 2021 (v200)** | 11 classes (tree, shrub, grass, crop, built, bare, snow, water, wetland, mangrove, moss) + InputQuality | Global | 10 m, 3°×3° tiles (2,651) | **CC BY 4.0, usable**, "free of charge, without restriction of use"; map credit with year (https://esa-worldcover.org/en/data-access) | Map about 117 GB | `https://esa-worldcover.s3.eu-central-1.amazonaws.com/v200/2021/map/ESA_WorldCover_10m_2021_v200_N51W009_Map.tif` (tile name = SW corner, multiple of 3) | esa-worldcover.s3.eu-central-1.amazonaws.com; esa-worldcover.org; terrascope.be (WMTS) |
| Dynamic World V1 | Near-real-time 9-class probabilities + label from each Sentinel-2 scene, 2015 to now | Global | 10 m | **CC BY 4.0, usable** for the data. Credit: "Dynamic World Project, Google, NGS, WRI" and "Contains modified Copernicus Sentinel data". **Access is Earth Engine only**, and EE is free only for research/education/nonprofit; commercial EE needs a paid licence. (https://developers.google.com/earth-engine/datasets/catalog/GOOGLE_DYNAMICWORLD_V1) | huge | EE export of a region | earthengine.googleapis.com |
| Copernicus Land Monitoring Service (CORINE, HRL tree cover/imperviousness, Global Land Cover 100 m, Urban Atlas) | Various land layers, mostly Europe; some global | Europe / global | 10–100 m | "full, open and free access": state source, flag modifications, no EU endorsement; you own rights in your products (https://land.copernicus.eu/en/data-policy). **Usable.** | varies | CLMS portal download by AOI | land.copernicus.eu |
| Overture `base/land_cover`, `land_use` | WorldCover-derived polygons; OSM landuse | Global | Vector | ODbL (WorldCover CC BY), usable | in base | DuckDB bbox | Overture hosts |
| OSM landuse/natural | Forests, parks, farmland and so on | Global | Vector | ODbL | — | Geofabrik | as OSM |

---

## 6. Trees and canopy height

| Source | What | Coverage | Detail | Licence (usable?) | Size | How to get one area | Host |
|---|---|---|---|---|---|---|---|
| **Meta/WRI CHM v2** (DINOv3, 2025/26) | Canopy height (m, uint8) | Global | About 1.19 m pixels, EPSG:3857, zoom-10 quadkey tiles (213,109) | **CC BY 4.0, usable.** Cite Tolan et al. 2024 and Brandt et al. 2026 (https://registry.opendata.aws/dataforgood-fb-forestsv2, https://data.source.coop/tge-labs/meta-chm-v2/README.md) | About 23.8 TB | DuckDB on `https://data.source.coop/tge-labs/meta-chm-v2/tiles.parquet` filtered by bbox, then range-read the `cog_url` COG (CORS mirror). The GeoZarr pyramid has a 9.6 m level. | data.source.coop (S3 `us-west-2.opendata.source.coop`); original `dataforgood-fb-data` S3 us-east-1 (`forests/v2/global/dinov3_global_chm_v2_ml3/`) |
| Meta/WRI CHM v1 | Earlier 1 m canopy height (`alsgedi_global_v6_float`) | Global | About 1 m | CC BY 4.0, usable (https://registry.opendata.aws/dataforgood-fb-forests/) | TBs | `aws s3 ls --no-sign-request s3://dataforgood-fb-data/forests/v1/alsgedi_global_v6_float/` | dataforgood-fb-data.s3.amazonaws.com |
| ETH Global Canopy Height 2020 (Lang et al.) | Canopy height + std dev | Global | 10 m | **CC BY 4.0, usable** (https://research-collection.ethz.ch/handle/20.500.11850/636572) | About 3°×3° tiles **(unverified)** | Tile download; also in the EE community catalog | libdrive.ethz.ch **(unverified)**; research-collection.ethz.ch |
| OSM trees | `natural=tree` points, `natural=wood` / `landuse=forest` | Global, sparse | Points/polygons | ODbL | — | Geofabrik | as OSM |

---

## 7. Place names, admin areas, POIs

| Source | What | Coverage | Detail | Licence (usable?) | Size | How to get one area | Host |
|---|---|---|---|---|---|---|---|
| **Overture `divisions`** | `division` (points), `division_area` (polygons, land/territorial), `division_boundary`; country down to microhood; GERS IDs | Global, monthly | Vector | **ODbL** (OSM + geoBoundaries CC BY + Esri + LINZ), usable (https://docs.overturemaps.org/guides/divisions/) | About 3–4 GB | DuckDB bbox on `theme=divisions/type=division_area/*` | Overture S3 / `overturemapswestus2.blob.core.windows.net` |
| **Overture `places`** | POIs with names and categories (Meta, Microsoft, Foursquare, AllThePlaces) | Global | Points | Per source: **CDLA-Permissive 2.0, Apache 2.0** (Foursquare, NOTICE.txt required), **CC0**. All usable (https://docs.overturemaps.org/attribution/) | About 5 GB | DuckDB bbox `theme=places/type=place/*` | Overture hosts |
| Overture `addresses` | Address points | Partial, growing | Points | Mixed permissive per source, check per country | 6.5 GB | DuckDB bbox | Overture hosts |
| GeoNames | 25 M names, 12 M features (4.8 M populated places), 16 M alternate names | Global | Points | **CC BY 4.0, usable**; credit GeoNames with a link (https://www.geonames.org/about.html, https://www.geonames.org/export/) | allCountries.zip a few hundred MB **(unverified)** | Per-country file `https://download.geonames.org/export/dump/<CC>.zip`, then filter by bbox | download.geonames.org |
| Who's On First | Gazetteer with polygons, hierarchy, concordances, multilingual names | Global | Polygons/points | Who's On First licence: original work + mix of CC0/CC BY sources. Credit recommended, link to licence required. **Usable** (attribution) (https://whosonfirst.org/docs/licenses/) | SQLite .db.bz2 (size not stated) | Per-country SQLite or shapefile from data.geocode.earth (https://whosonfirst.org/download/) | data.geocode.earth; github.com/whosonfirst-data |
| Natural Earth | Small-scale countries, coastlines, populated places, rivers (1:10m/50m/110m) | Global | Coarse | **Public domain**; commercial OK, no credit needed (https://www.naturalearthdata.com/about/terms-of-use/) | Small | Download a theme zip | naturalearthdata.com; naciscdn.org **(unverified)** |
| Nominatim | Geocoding over OSM | Global | — | ODbL; strict usage policy, not for bulk use | — | robots disallow, so not fetched: https://nominatim.openstreetmap.org | nominatim.openstreetmap.org |

---

## 8. Imagery and street-level photos

| Source | What | Coverage | Detail | Licence (usable?) | Size | How to get one area | Host |
|---|---|---|---|---|---|---|---|
| EOX Sentinel-2 cloudless **2016** | Cloud-free RGB mosaic | Global | 10 m | **CC BY 4.0, usable** (https://cloudless.eox.at/license-non-commercial) | — | WMTS/WMS (4096 px max per request) | tiles.maps.eox.at **(unverified)**; cloudless.eox.at |
| EOX Sentinel-2 cloudless **2018–2025** | Same, newer | Global | 10 m | **CC BY-NC-SA 4.0, UNUSABLE** (same page; commercial use needs paid EOxCloudless) | — | — | — |
| Sentinel-2 L2A (raw scenes) | Multispectral scenes. Build your own cloud-free mosaic for terrain/ground texture. | Global, 5-day revisit | 10 m | Copernicus Sentinel data terms, "free, full and open"; commercial OK with credit "Contains modified Copernicus Sentinel data [year]". **Usable.** (https://registry.opendata.aws/sentinel-2-l2a-cogs/) | PBs | STAC search at `https://earth-search.aws.element84.com/v1` (collection `sentinel-2-l2a`) by bbox/date, then range-read COGs | earth-search.aws.element84.com; sentinel-cogs.s3.us-west-2.amazonaws.com |
| NAIP (USDA) | Aerial orthophoto RGB(+NIR) | **US lower 48 only** | 1 m (to 2017), 0.6 m (2018+), 0.3 m some coastal states | **Public domain, usable** (https://www.usgs.gov/centers/eros/science/usgs-eros-archive-aerial-photography-national-agriculture-imagery-program-naip) | huge | EarthExplorer; also Microsoft Planetary Computer STAC **(unverified)** | earthexplorer.usgs.gov; planetarycomputer.microsoft.com / *.blob.core.windows.net |
| Mapillary | Street-level photos + detections | Global, crowd | Photos | Images **CC BY-SA 4.0**, usable with share-alike on adapted images (https://help.mapillary.com/hc/en-us/articles/115001770409-Licenses). Licence of derived map features not stated. API needs a token **(unverified)**. | — | Graph API by bbox | graph.mapillary.com, *.fbcdn.net **(unverified)** |
| Google Photorealistic 3D Tiles / Google, Bing or Esri satellite basemaps | 3D mesh / imagery | Global | High | **UNUSABLE**: proprietary terms forbid caching or baking | — | — | — |

---

## 9. Free tile services and pre-built tilesets

| Service | What | Licence | Host / access |
|---|---|---|---|
| Protomaps daily planet PMTiles | OSM vector basemap z0–15, about 120 GB; `pmtiles extract … --maxzoom` to cut an area | ODbL Produced Work, OSM attribution (https://docs.protomaps.com/basemaps/downloads) | maps.protomaps.com/builds (copy to your own storage, don't hotlink) |
| OpenFreeMap | Free OSM vector tiles, no limits or keys; weekly planet downloads (Btrfs/MBTiles) | MIT code, OSM attribution required (https://openfreemap.org/) | tiles.openfreemap.org **(unverified)** |
| Mapterhorn | Terrain RGB XYZ + PMTiles | see §3 | tiles.mapterhorn.com, download.mapterhorn.com |
| AWS Terrain Tiles | terrarium/normal/GeoTIFF/skadi | see §3 | elevation-tiles-prod.s3.amazonaws.com |
| JRC GSW XYZ | Water occurrence PNG tiles | see §4 | storage.googleapis.com/global-surface-water/tiles2021/… |
| ESA WorldCover WMTS | Land cover tiles | CC BY 4.0 | services.terrascope.be **(unverified)** |
| tile.openstreetmap.org | Raster OSM | Usage policy forbids heavy or app use. **Don't use in a game.** | tile.openstreetmap.org |

---

## Best pick per category

- **Roads, paths, rail:** **Overture transportation** for one-call bbox queries (clean segment/connector graph, speed limits, rail and ferry). Fall back to **Geofabrik PBF + osmium** when you need raw OSM tags such as lanes, `bridge`/`tunnel` and `layer`, which Overture flattens. Both are ODbL.
- **Buildings:** **Overture buildings** as the base. It already merges OSM, Microsoft, Google and Esri footprints, and carries OSM/MS heights and OSM `building_part`. Fill missing heights with, in order:
  1. EUBUCCO in Europe (ODbL, height on every building)
  2. Microsoft ML per-building height (CDLA-Permissive)
  3. Google 2.5D Temporal raster (CC BY) for the Global South
  4. GHSL BUILT-H 100 m or WSF3D 90 m (CC BY) as a coarse fallback

  Avoid the GlobalBuildingAtlas height and LoD1 data (NC). Check the 3D-GloBFP licence before use.
- **Terrain:** **Copernicus GLO-30** COGs by tile name: global, 30 m, commercial OK with the fixed notice. Note it is a surface model, so flatten under building footprints and roads. **Mapterhorn** is the easiest drop-in (terrarium PMTiles, GLO-30 plus high-res LiDAR where available). Avoid FABDEM and FathomDEM (NC); MERIT only under its ODbL option.
- **Bathymetry:** **GEBCO_2026** globally (public domain); **EMODnet** in Europe (CC BY, 115 m).
- **Coastline and water:** **OSM water/land polygons** from osmdata.openstreetmap.de for the sea, OSM/Overture water for lakes and rivers. HydroLAKES (CC BY) as a fallback. JRC GSW for shoreline realism.
- **Land cover:** **ESA WorldCover 2021 v200** (10 m, CC BY, plain S3 tiles), with OSM landuse for crisp polygons. Dynamic World is legally fine as data, but it is tied to Earth Engine, whose commercial use is paid.
- **Trees:** **Meta CHM v2** (1.2 m, CC BY, CORS-friendly COGs on source.coop) for tree placement and height. ETH 10 m as a lighter fallback.
- **Names:** **Overture divisions + places** (ODbL/CDLA/Apache/CC0, same pipeline as everything else). Add **GeoNames** (CC BY) for alternate and multilingual names.
- **Ground imagery:** only **EOX cloudless 2016** (CC BY) or your own Sentinel-2 L2A mosaic (Copernicus terms). NAIP for the US. Never use EOX 2018+ or Google/Esri/Bing imagery.

## Pages that could not be read

- zenodo.org (3D-GloBFP licence): rate-limited (HTTP 429).
- planet.openstreetmap.org: robots disallow.
- earth.jaxa.jp/policy (JAXA terms): content did not render.
- hydrosheds.org licence page: fetch error (the TechDoc PDF was used instead).
- planetarycomputer.microsoft.com: needs JavaScript.
