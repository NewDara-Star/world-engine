# 43. Open-source 3D recreations of real cities: licence and provenance audit

Researched 2026-10-11 for the open-world real-map treasure-hunt game.

**Method.** I searched GitHub through the public search API (repositories, topics and keywords for about 40 place and engine terms). For each candidate I read the LICENSE file and README straight from `raw.githubusercontent.com`. "Size" is the GitHub repo size the API reports, so it includes git history. Because those numbers come from the search listing, round them. The other platforms were only partly reachable, so they are covered only in part:

- **GitLab:** blocked (robots and proxy). The two GitLab-hosted items below were found through links from GitHub.
- **Sketchfab:** blocked (robots and API).
- **Hugging Face:** API search only.
- **OpenGameArt:** search pages only.

**Licence rules applied:**
- **OSM-derived geometry.** This is ODbL 1.0. Using it commercially is allowed if you credit "© OpenStreetMap contributors". Rendered or game output counts as a "Produced Work". Baked meshes or tiles that still carry coordinates are safest treated as a *derivative database*: publish them under ODbL and keep the game code under your own licence.
- **Google Maps / Earth / Photorealistic 3D Tiles, Apple, or scraped Bing captures, and Street View tracing:** NOT USABLE.
- **No licence file:** NOT USABLE (all rights reserved).
- **GPL/AGPL code:** not usable as code. Running it as a standalone offline tool is fine, because its output is not covered by the GPL.
- **CC-BY-SA or GPL data:** usable only if we accept share-alike for those assets.
- **Rights-holder-published datasets made with Bing or Google imagery** (Microsoft GlobalMLBuildingFootprints, Google Open Buildings): I flag these separately. They are not scraped captures: the owner released them under an open licence. The caller decides.

---

## 1. Usable (data, models or baked city builds)

| Repo | Place | Contents | Format | Size | Licence (SPDX) | Provenance | Notes |
|---|---|---|---|---|---|---|---|
| [jeantimex/tokyo](https://github.com/jeantimex/tokyo) | Tokyo, Shiba, Shibuya, Fujinomiya (each about 3.4 x 2.8 km) | Full browser real-time city: three.js client plus a data pipeline that fetches raw data and bakes areas | Pipeline to browser tiles; built output 0.2 to 3.6 GB per area | ~463 MB repo | Code `MIT`. Data: PLATEAU (CC BY 4.0-compatible MLIT terms), OSM `ODbL-1.0`, GSI (CC BY 4.0-compatible) | Project PLATEAU CityGML (footprints, roofs, textures, street furniture), OSM roads and signs, GSI 5 m DEM and aerial photos | **Top pick.** The closest match to our engine. Any city PLATEAU covers (~300) is "one entry". Adverts and neon are invented. |
| [Project-PLATEAU/plateau2minecraft](https://github.com/Project-PLATEAU/plateau2minecraft) | Nishi-Shinjuku, Tokyo | Converter plus a baked `.mcworld` | Minecraft world | ~52 MB | `MIT` (MLIT and MIERUNE); data PLATEAU CC BY 4.0 | PLATEAU | Official MLIT repo. A good example of a stylised, voxel-style real city. |
| [Project-PLATEAU/PLATEAU-SDK-for-Unity](https://github.com/Project-PLATEAU/PLATEAU-SDK-for-Unity) (+ [Toolkits](https://github.com/Project-PLATEAU/PLATEAU-SDK-Toolkits-for-Unity)) | About 300 Japanese cities | Unity SDK that pulls CityGML from the PLATEAU server | Unity meshes | ~893 MB (toolkits) | `MIT` | PLATEAU | Official. |
| [shiena/godot-plateau](https://github.com/shiena/godot-plateau) | Japan (PLATEAU) | Godot 4 GDExtension importer | Godot scenes | ~77 MB | `MIT` | PLATEAU | |
| [MIERUNE/plateau-gis-converter](https://github.com/MIERUNE/plateau-gis-converter) | Japan | PLATEAU CityGML to 3D Tiles 1.1, MVT, GeoPackage | 3D Tiles / glTF | ~376 MB | `MIT` | PLATEAU | The fastest way to get PLATEAU into a three.js 3D Tiles renderer. |
| [pixelx-jp/plateau-bridge](https://github.com/pixelx-jp/plateau-bridge) | Japan | PLATEAU to buildings.parquet plus 3D Tiles, PMTiles, FlatGeobuf | parquet / 3D Tiles | ~13 MB | `MIT`; data CC BY 4.0 | PLATEAU | |
| [ualsg/hdb3d-data](https://github.com/ualsg/hdb3d-data) (+ [hdb3d-code](https://github.com/ualsg/hdb3d-code)) | Singapore (all public-housing HDB blocks) | Baked LoD1 building models | CityJSON, OBJ | ~28 MB | `MIT` (repo). The geometry is OSM footprints, so ODbL also applies | OSM footprints with HDB open data and OneMap storeys | Credit NUS UAL, HDB, OSM and OneMap. Covers HDB blocks only, not the whole city. |
| [tum-gis/tum2twin](https://github.com/tum-gis/tum2twin) (datasets on gitlab.lrz.de) | TU Munich central campus, Munich | LoD3 and textured LoD2 buildings, trees, OpenDRIVE roads | CityGML, SketchUp, OpenDRIVE | small repo; datasets on GitLab | `CC-BY-4.0` | TUM survey; LoD2 from the Bavarian state survey (open) | Very high detail, but only one campus. |
| [worldhood/worldhood](https://github.com/worldhood/worldhood) | Helsinki (Tampere in draft) | Browser city playground you can drive or walk, with bundled city data | three.js plus bundled runtime data | ~208 MB | Code `MIT`. Data mostly City of Helsinki CC BY 4.0 plus OSM `ODbL-1.0` | Helsinki open 3D model and imagery, OSM, reference photos | Very close to our game concept. Has a documented OSM to game-data pipeline (`npm run city:build`). Check each asset's licence file. |
| [AllStreets/Chicago-Open-World](https://github.com/AllStreets/Chicago-Open-World) | Chicago, 110 km² (Addison to 35th St) | Open-world 3D city: 105,971 buildings in streamed 500 m tiles, plus 44 or more hand-modelled landmarks | three.js tiles, Blender landmarks | ~961 MB | Code `MIT`. Data OSM `ODbL-1.0` plus City of Chicago open data (Cook County LiDAR) | OSM plus City of Chicago | **Caution:** landmarks were "modelled from photographs" and the photo sources aren't named. Trademarked buildings and brands (Apple, Trump) appear. Its streaming-tile architecture is worth reusing. |
| [madesh-ops/chennai-metro-3d](https://github.com/madesh-ops/chennai-metro-3d) | Chennai, India (all 5 metro lines and the surrounding city) | Streamed OSM world tiles, viaducts and stations | Next.js, R3F, JSON tiles | ~50 MB | Code `MIT`; OSM `ODbL-1.0` | OSM; some landmarks traced from "satellite views and photos supplied by the owner" | The best licensed Indian-city build I found. Train audio recordings are **not** licensed; leave them out. The satellite source isn't named, so redo those few landmarks ourselves. |
| [wcqqq1214/nanning-city-atlas](https://github.com/wcqqq1214/nanning-city-atlas) | Nanning, China | OSM city plus Blender landmark models | three.js, GLB, Draco | ~932 MB | Code `MIT`; data `ODbL-1.0` | OSM snapshot 2026-09-08 plus procedurally filled buildings (labelled as estimates) | Sister repo [gxu-campus-3d](https://github.com/wcqqq1214/gxu-campus-3d) is `NOASSERTION`, so don't use it. |
| [ss251/kesenmemento-v2](https://github.com/ss251/kesenmemento-v2) | Kesennuma, Japan | Anime-style explorable town | three.js / Bun | ~524 MB | `MIT` | OSM, GSI aerial photos, on-site structure-from-motion photos; README says web photos were used for reference only | Records a source for every value. A good model for provenance discipline. |
| [ekaterinburgdev/map](https://github.com/ekaterinburgdev/map) | Yekaterinburg, Russia | 3D city map with GeoJSON data layers | GeoJSON / web | ~55 MB | `MIT` (file named LICENCE) | City and open sources | Mostly data layers rather than meshes. |
| [JoeThunyathep/NYC3D_CesiumJS](https://github.com/JoeThunyathep/NYC3D_CesiumJS) | New York City | CesiumJS viewer with NYC 3D buildings | 3D Tiles / CZML | ~92 MB | `MIT` | NYC DoITT 3D Building Model (NYC Open Data) | Check that the bundled tiles come from DoITT and not Cesium ion. |
| [alen-smajic/3D-Public-Transport-Simulator](https://github.com/alen-smajic/3D-Public-Transport-Simulator) | Any OSM area (demo is a German city) | Unity project: OSM XML to 3D city plus transit | Unity, Blender assets | ~830 MB | `MIT` | OSM | |
| [LoanHerault/OSMCity](https://github.com/LoanHerault/OSMCity) | Any OSM area | Unity project that rebuilds a city from OSM | Unity | ~363 MB | `MIT` | OSM | The README is minimal. |
| [Amsterdam/3DAmsterdam](https://github.com/Amsterdam/3DAmsterdam) / [Netherlands3D/twin](https://github.com/Netherlands3D/twin) | Amsterdam / the Netherlands | Official city Unity viewer and digital twin | Unity, tiles | ~1.4 GB | `EUPL-1.2` (weak copyleft, so treat the code as **share-alike**) | City of Amsterdam open data, 3DBAG | Use the 3DBAG data directly (CC BY 4.0) rather than the code. |
| [AlexKorotkin-creator/CityGenerator](https://github.com/AlexKorotkin-creator/CityGenerator) | Any OSM area | UE5 city districts: freeways, traffic, crowds | UE5 / Houdini | ~0.7 MB | `MIT` | OSM, elevation, "a satellite image" (see NOTICE.md) | Needs a Houdini licence. Check the satellite source before using it. |
| FlightGear osm2city scenery, e.g. [FGMEMBERS-SCENERY/kathmandu-osm2city](https://github.com/FGMEMBERS-SCENERY), [nepal-osm2city](https://github.com/FGMEMBERS-SCENERY/nepal-osm2city), [LOWW Vienna](https://github.com/FGMEMBERS-SCENERY/LOWW-fg-CustomScenery) | Kathmandu, Nepal, Vienna airport, Faroe Islands | Baked OSM building and road scenery | AC3D / FlightGear STG | 1 MB to 54 MB | `GPL-2.0` | OSM | **Share-alike** (GPL on the assets). Low visual quality. |

### Datasets usable with a flag (released by the rights holder but made from Bing or Google imagery)

| Dataset | Coverage | Licence | Flag |
|---|---|---|---|
| [Google Open Buildings 2.5D Temporal](https://sites.research.google/open-buildings/) (used by Lahore and Ecuador projects) | Africa, South and Southeast Asia, Latin America: **Lagos, Mumbai, Delhi, Bengaluru, Nairobi** | `CC-BY-4.0` or `ODbL-1.0` (choose one) | Google built it from satellite imagery and **published it openly**. It is not a Maps or Earth capture, so the Maps terms don't apply. Footprints plus heights give LoD1 extrusions. **The only good height source for Lagos and Indian cities.** |
| [microsoft/GlobalMLBuildingFootprints](https://github.com/microsoft/GlobalMLBuildingFootprints) | 1.4 B footprints worldwide, 174 M with heights | `CDLA-Permissive-2.0` (repo LICENSE) | Made from Bing imagery but **licensed by Microsoft itself**, so it is not a scraped capture. |
| [Overture Maps buildings](https://overturemaps.org) | Global (OSM + Microsoft + Google + Esri merge) | `ODbL-1.0` | Easiest single global source; each feature carries a source tag. |
| [zhu-xlab/GlobalBuildingAtlas](https://github.com/zhu-xlab/GlobalBuildingAtlas) | 2.75 B buildings, LoD1 | Polygons part `ODbL-1.0`; LoD1 models and heights `CC-BY-NC-4.0`; code MIT + Commons Clause | **Only the ODbL polygons are usable.** The LoD1 models and heights are non-commercial. |

### Official open city models (from [OloOcki/awesome-citygml](https://github.com/OloOcki/awesome-citygml), MIT list). Confirm each licence on its portal before ingesting.

PLATEAU, Japan (~300 cities, CC BY 4.0-compatible) · 3DBAG, all of the Netherlands in LoD2.2 (`CC-BY-4.0`) · Helsinki semantic model and reality mesh (`CC-BY-4.0`) · Berlin LoD2 and mesh (dl-de-zero-2.0 / dl-de-by-2.0, to verify) · Hamburg, NRW, Bavaria, Baden-Württemberg and the other German states (dl-de-by-2.0 / zero) · Vienna LoD2 · Zurich · Lyon (Etalab Open Licence) · Montreal (CC BY 4.0) · Prague · Riga · Luxembourg · Estonia · Poland (~15.5 M buildings) · Barcelona · NYC DoITT 3D Building Model (NYC Open Data) · USA-wide LoD1 · Dublin (500 x 500 m CAD) · London (1 x 1 km CAD sample, terms to check). **There are no official open 3D models for Lagos, African cities or Indian cities.** Use OSM with Open Buildings 2.5D or Overture heights instead.

---

## 2. Not usable

| Repo | Place | Reason |
|---|---|---|
| [vvoovv/blosm](https://github.com/vvoovv/blosm) "Google 3D cities" import | Global | Imports **Google Photorealistic 3D Tiles**, whose terms forbid reuse. The OSM import path is fine (see the tools table). |
| [eliemichel/MapsModelsImporter](https://github.com/eliemichel/MapsModelsImporter) | Global | Rips **Google Maps / Google Earth** meshes through RenderDoc captures. Also `GPL-3.0`. |
| [hzxie/CityDreamer](https://github.com/hzxie/CityDreamer) | Generated cities | Trained on a **GoogleEarth** capture dataset. S-Lab Licence 1.0 is **non-commercial**. |
| [nulljosh/vancouvervice](https://github.com/nulljosh/vancouvervice) | Vancouver | Its Unreal build streams **Google's 3D scan**. Only the small OSM-extrusion "island" (Apache-2.0) is clean, and it isn't worth taking. |
| [rayidali/borough-drive](https://github.com/rayidali/borough-drive) | NYC East Village, 10 blocks | Code is MIT, but every frontage was transcribed through **Google Street View**, so the model content is derived from Google. |
| [fltman/wasteland-builder](https://github.com/fltman/wasteland-builder) demo city | Visby / Gotland | The baked demo city's facades were refined against **Google Street View** over 140+ rounds. The tool is MIT; see the tools table. |
| [cheeaun/photorealistic-3d-deckgl](https://github.com/cheeaun/photorealistic-3d-deckgl), [jalarrea/geospatial-sao-paulo](https://github.com/jalarrea/geospatial-sao-paulo), [tokyo-sounds/tokyo-sounds](https://github.com/tokyo-sounds/tokyo-sounds), [chadaewoon/virtual-fpv-flight-connector](https://github.com/chadaewoon/virtual-fpv-flight-connector), [rbwet/earth-drone](https://github.com/rbwet/earth-drone), [imran1721/Skybook](https://github.com/imran1721/Skybook), [davinci2083/cityos](https://github.com/davinci2083/cityos) | Various | Built on **Google Photorealistic 3D Tiles** or Google Maps. Also: the content is streamed at runtime, so there's nothing to bring in anyway. |
| [siddiqss/lahore-digital-twin](https://github.com/siddiqss/lahore-digital-twin) | Lahore (1.33 M buildings) | **No licence.** Its method (Open Buildings 2.5D + Overture + OSM to 3D Tiles) is a good recipe to reimplement for Lagos. |
| [TemiKayode/ghetto-lagos](https://github.com/TemiKayode/ghetto-lagos), [Lixzon/GTA-Lagos](https://github.com/Lixzon/GTA-Lagos), [okewunmi/lagos-3d](https://github.com/okewunmi/lagos-3d), [gift56/mini-lagos-3dmap](https://github.com/gift56/mini-lagos-3dmap), [AdetomiwaOgundiran/Ole-Game](https://github.com/AdetomiwaOgundiran/Ole-Game), [wendylorato-ai/naijalife](https://github.com/wendylorato-ai/naijalife), [Shadow-sama1/3DRefreshLagos](https://github.com/Shadow-sama1/3DRefreshLagos) | Lagos | **No licence.** |
| [Brankyscorer/lagos-life-3d-assets](https://github.com/Brankyscorer/lagos-life-3d-assets) | Lagos (fictional "Oloya Street" kit) | **No licence** on the original kit. Its third-party parts (Rocketbox MIT, Poly Haven CC0) can be fetched from their original sources. |
| [Khoo34/Nairobi3D](https://github.com/Khoo34/Nairobi3D), [Samuel-Kasusya/nairobi-3d-city](https://github.com/Samuel-Kasusya/nairobi-3d-city), [drwjkirkpatrick-web/ascii-city](https://github.com/drwjkirkpatrick-web/ascii-city) | Nairobi | **No licence.** |
| [revanks/silkboard-3d-digital-twin](https://github.com/revanks/silkboard-3d-digital-twin), [arjeetanand/bengaluru-traffic-digital-twin](https://github.com/arjeetanand/bengaluru-traffic-digital-twin), [SubuhanLathif/namma-metro-3d](https://github.com/SubuhanLathif/namma-metro-3d), [hrsvd/urbanlens](https://github.com/hrsvd/urbanlens) | Bengaluru | **No licence** (silkboard is OSM-based, so it could be rebuilt). |
| [fiona09-alt/CityTwin](https://github.com/fiona09-alt/CityTwin) (Nagpur), [itz-abhay/How-to-create-3d-Map-of-Indian-city-using-unity](https://github.com/itz-abhay/How-to-create-3d-Map-of-Indian-city-using-unity), [UD1416/Population-density-map](https://github.com/UD1416/Population-density-map) (Ahmedabad) | India | **No licence.** |
| [Aymanbalaa/grand-theft-poutine](https://github.com/Aymanbalaa/grand-theft-poutine) | Downtown Montréal | **No licence**, though the data is clean (OSM + HRDEM, OGL-Canada). A good pipeline design to copy the idea from: OSM to 256 m glTF tiles. |
| [workwithchris/godot-4-ktm-free-world](https://github.com/workwithchris/godot-4-ktm-free-world) | Kathmandu | **No licence.** |
| [egore/openstreetmap-racer](https://github.com/egore/openstreetmap-racer), [AbhayAnandUCSD/geo-reconstruct](https://github.com/AbhayAnandUCSD/geo-reconstruct), [coderbloke/godot-osm](https://github.com/coderbloke/godot-osm), [thinhvkit/3d-city-web](https://github.com/thinhvkit/3d-city-web), [LogixSolutions94/GTDZ](https://github.com/LogixSolutions94/GTDZ) (Algiers) | Various | **No licence.** |
| [tum-gis/3d-model-new-york-city](https://github.com/tum-gis/3d-model-new-york-city), [georocket/new-york-city-model-enhanced](https://github.com/georocket/new-york-city-model-enhanced), [i852870/SAP-NewYork-AR-Model](https://github.com/i852870/SAP-NewYork-AR-Model) | NYC | **No licence** on the repos. The underlying NYC DoITT model is open, so take it from NYC Open Data. |
| [webtrackerxy/3d-city-million-robots](https://github.com/webtrackerxy/3d-city-million-robots), [icomppower/london-drive](https://github.com/icomppower/london-drive), [pork1977/vantage-city-os](https://github.com/pork1977/vantage-city-os) | London | **No licence.** Vantage also uses OS Data Hub, which has its own terms. |
| [supakazes/turgot-threejs](https://github.com/supakazes/turgot-threejs) | Historic Paris (Turgot map) | **No licence.** |
| [Faezeh-Rezaei/City-Simulator](https://github.com/Faezeh-Rezaei/City-Simulator), [RaminM/City-Simulator](https://github.com/RaminM/City-Simulator), [ilshat-fatkhullin/MapVisualizer](https://github.com/ilshat-fatkhullin/MapVisualizer), [chiang9/CityMap](https://github.com/chiang9/CityMap), [Akshayykadam/OpenCity3D-Engine](https://github.com/Akshayykadam/OpenCity3D-Engine), [Healergrg/pokhara-city1](https://github.com/Healergrg/pokhara-city1), [postadelmaga/laspeza](https://github.com/postadelmaga/laspeza), [dannisliang/ActionStreetMap-framework](https://github.com/dannisliang/ActionStreetMap-framework), [sigon426/3D_cities](https://github.com/sigon426/3D_cities), [lucas-uk/UK-CityGML-Buildings](https://github.com/lucas-uk/UK-CityGML-Buildings), [saul-rodriguez/SWEDEN](https://github.com/saul-rodriguez/SWEDEN), [osm3d/osm3d](https://github.com/osm3d/osm3d), [Samuel-Kasusya](https://github.com/Samuel-Kasusya) | Various | **No licence.** |
| [bdon/tpe_buildings](https://github.com/bdon/tpe_buildings) | Taipei | No licence; its README says it is "blocked on licensing issues" (the upstream tpe3d data uses a custom licence). |
| [RRG314/WorldExplorer3D](https://github.com/RRG314/WorldExplorer3D) | Global sandbox | Custom **source-available** licence (LicenseRef), not open. |
| [Javiervinus/ecuador3d](https://github.com/Javiervinus/ecuador3d) | Guayaquil, Durán | Code `AGPL-3.0`; original content `CC-BY-SA-4.0` (share-alike). Its data sources (Overture, Open Buildings, OSM) are clean, so rebuild from those ourselves. |
| [jeiel85/gm-city](https://github.com/jeiel85/gm-city), [wcqqq1214/gxu-campus-3d](https://github.com/wcqqq1214/gxu-campus-3d), [ZTongci/navara-tokyo](https://github.com/ZTongci/navara-tokyo) (depends on `maplibre/navara`, which is `NOASSERTION`) | Gwangmyeong, Guangxi Univ., Tokyo | `NOASSERTION` or a custom licence that GitHub can't read. Read the licence by hand before use. |
| [BoDai/MatrixCity](https://huggingface.co/datasets/BoDai/MatrixCity) (HF) and most HF "city" datasets | Synthetic (Unreal) | Not a real place, and `CC-BY-NC-4.0`. |
| [Esri/cityengine_for_unreal](https://github.com/Esri/cityengine_for_unreal) | Procedural | Apache source, but **commercial use requires a CityEngine licence**. |
| [srizzon/git-city](https://github.com/srizzon/git-city) | Not a real place | `AGPL-3.0`, and the city is fictional anyway. |

---

## 3. OSM to 3D tools: licence and output terms

| Tool | Licence (SPDX) | What it outputs | Can we use the output commercially? |
|---|---|---|---|
| [OSM2World](https://github.com/tordanik/OSM2World) | `MIT` (current LICENSE.txt; older releases were LGPL) | glTF/GLB, OBJ, POV-Ray, 3D tiles for any OSM area. Also generates roofs, trees, street furniture | **Yes.** Output inherits ODbL from OSM: credit OSM, and offer baked geometry under ODbL. |
| [osm2streets](https://github.com/a-b-street/osm2streets) | `Apache-2.0` | Clean road, lane and intersection polygons from OSM (Rust, with WASM/JS bindings) | **Yes** (ODbL data). The best choice for road meshes. |
| [Streets GL](https://github.com/StrandedKitty/streets-gl) | `MIT` | Real-time WebGL2 renderer; nothing baked | Code yes. At runtime it pulls Overpass plus **Mapbox** elevation and vector tiles, which fall under the Mapbox ToS. Swap them for our own tiles (e.g. Planetiler + Terrarium DEM). |
| [OSMBuildings](https://github.com/OSMBuildings/OSMBuildings) | `BSD-2-Clause` | JS 2.5D/3D building layer | Library yes. Its hosted tile service needs a key and has its own terms; the data is ODbL. |
| [blosm / blender-osm](https://github.com/vvoovv/blosm) | `GPL-3.0` (code is on the `release` branch; free base version, paid Pro on Gumroad) | Blender meshes from OSM and terrain | **OSM imports: yes** (ODbL). Running the GPL tool doesn't infect what it outputs. **Google 3D Cities imports: NO.** |
| [BlenderGIS](https://github.com/domlysz/BlenderGIS) | `GPL-3.0` | Blender import of OSM, SHP, GeoTIFF DEM, basemaps | OSM and DEM output yes. **Don't bake its Google, Bing or Esri basemap imagery.** |
| [VTS geospatial stack](https://github.com/melowntech/vts-browser-js) ([mapproxy](https://github.com/melowntech/vts-mapproxy), [vtsd](https://github.com/melowntech/vts-vtsd)) | `BSD-2-Clause` | 3D map server and browser; you bring the data | Yes; the terms depend on your data. |
| [3DCityDB](https://github.com/3dcitydb/3dcitydb), [importer-exporter](https://github.com/3dcitydb/importer-exporter), [citydb-tool](https://github.com/3dcitydb/citydb-tool), [3dcitydb-web-map](https://github.com/3dcitydb/3dcitydb-web-map) | `Apache-2.0` (releases before 3.3.0 were LGPL-3.0) | CityGML database to KML, COLLADA, glTF and 3D Tiles | Yes; the terms depend on the input data. |
| [3dfier](https://github.com/tudelft3d/3dfier) | `GPL-3.0` | 2D footprints + LiDAR to OBJ, CityGML, CityJSON, STL | Fine as an offline tool. The output takes the input data's licence. |
| [cjio](https://github.com/cityjson/cjio) / [ninja](https://github.com/cityjson/ninja) / [citygml-tools](https://github.com/citygml4j/citygml-tools) | `MIT` / `Apache-2.0` / `Apache-2.0` | CityJSON and CityGML processing, conversion to glTF/OBJ | Yes |
| [tyler](https://github.com/3DGI/tyler) | `Apache-2.0` | CityJSON to 3D Tiles (GLB with per-object metadata) | Yes. The 3DBAG route. |
| [py3dtilers](https://github.com/Oslandia/py3dtilers) | `LGPL-2.1` | OBJ, GeoJSON, IFC, 3DCityDB to 3D Tiles | Yes. LGPL is fine for a standalone tool. |
| [PLATEAU SDK for Unity](https://github.com/Project-PLATEAU/PLATEAU-SDK-for-Unity) / [godot-plateau](https://github.com/shiena/godot-plateau) / [plateau-gis-converter](https://github.com/MIERUNE/plateau-gis-converter) | `MIT` | PLATEAU to engine meshes or 3D Tiles | Yes (credit PLATEAU, CC BY 4.0) |
| [Arnis](https://github.com/louis-e/arnis) | `Apache-2.0` | OSM + elevation to Minecraft worlds | Yes (ODbL data). Voxel-style. |
| [map3d](https://github.com/cartesiancs/map3d) | `MIT` | R3F tool: pick an area, export GLB | Yes (ODbL data) |
| [osm2threejs](https://github.com/YusufEminoglu/osm2threejs) / [osm_3d_model](https://github.com/YusufEminoglu/osm_3d_model) | `MIT` | Headless Python OSM to three.js, glTF/GLB, OBJ, 3D GeoJSON / QGIS plugin | Yes (ODbL data) |
| [godot-openstreetmap](https://github.com/RodZill4/godot-openstreetmap) | `MIT` | Godot OSM scene rendering | Yes |
| [vectiler](https://github.com/karimnaaji/vectiler) | `MIT` | Vector tiles to OBJ | Yes. Its default Mapzen tile source is defunct, so point it at your own MVT. |
| [osmwave](https://github.com/perliedman/osmwave) | `ISC` | OSM to OBJ | Yes |
| [osm_LoD1_3Dbuildings](https://github.com/AdrianKriger/osm_LoD1_3Dbuildings) | `MIT` | OSM to LoD1 CityJSON (notebook) | Yes |
| [VoxCity](https://github.com/kunifujiwara/VoxCity) | `MIT` | Global voxel city to OBJ, VOX, ENVI-met | Code yes. It picks data sources automatically, some of them restricted, so pin it to OSM, Overture or open DEM sources only. |
| [wasteland-builder](https://github.com/fltman/wasteland-builder) | `MIT` | OSM to Blender `city.blend` to three.js game | Tool yes. **Skip its Street View refinement skill.** |
| [osm2city (FlightGear)](https://gitlab.com/osm2city/osm2city) | `GPL-2.0` | OSM to FlightGear scenery | Data output ODbL; bundled textures are GPL (**share-alike**). |
| [ddd](https://github.com/jjmontesl/ddd) | `AGPL-3.0` | OSM to GLTF, FBX, OBJ scenes | Only as an isolated offline tool. Never link or ship it. |
| [Cesium for Unity](https://github.com/CesiumGS/cesium-unity) / [Unreal](https://github.com/CesiumGS/cesium-unreal) | `Apache-2.0` | 3D Tiles streaming | Plugin yes. **Cesium ion content has its own terms; Google tiles inside it are NOT usable.** Self-hosted tiles are fine. |
| [OpenMapTiles](https://github.com/openmaptiles/openmaptiles) | `BSD-3-Clause` code; schema CC-BY | OSM vector tiles (building height attributes) | Yes. Credit OpenMapTiles and OSM. |

---

## 4. Other platforms

- **Sketchfab:** the site and API both refuse automated access, so licences could not be verified. Candidates found by web search include a drone-scanned small town, a [Venlo city photogrammetry scan](https://sketchfab.com/3d-models/photogrammetry-3d-scan-city-of-venlo-c62fc4fc093d43248afd189ccf6f1f99), [Freeman Alley NYC](https://sketchfab.com/3d-models/freeman-alley-dataset-79e616eab10644f88cb772ddf71bfe0a) and [Calle del Barrio Húmedo, León](https://sketchfab.com/3d-models/calle-del-barrio-humedo-de-leon-photogrammetry-9d3cfa9ee9e14920bb1134c4f9544778). Check each by hand with the CC-BY or CC0 filter. Sketchfab's [CC0 cultural-heritage programme](https://sketchfab.com/blogs/community/sketchfab-launches-public-domain-dedication-for-3d-cultural-heritage/) is the best source for landmark models.
- **OpenGameArt:** only generic city kits (Kenney City Kit CC0, Retro Urban Kit); no real places. Useful for street furniture and filler buildings.
- **Hugging Face:** no real-city mesh datasets with commercial licences. MatrixCity is synthetic and NC. SensatUrban, Toronto-3D and UrbanScene3D are point clouds, mostly NC.
- **GitLab:** blocked here. Known items are osm2city (GPL-2.0) and tum2twin-datasets (CC BY 4.0, gitlab.lrz.de).
