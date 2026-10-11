# 42. Official open 3D city / country building models: usable in a commercial browser game

Researched 2026-10-11 with WebSearch and WebFetch only. Licences were checked on the publisher's own page or official metadata record (GDI-DE geodatenkatalog, INSPIRE catalogues, national data portals) wherever robots.txt allowed it.

**Verification key (V column)**
- **P**: read on the publisher's own page or document.
- **M**: read in an official metadata record (GDI-DE, INSPIRE, CKAN of a government portal).
- **S**: the publisher page was robots-blocked or would not load. The licence comes from a secondary source (an official statewide licence for the same agency's data, or a reputable licence summary). Re-check by hand before shipping.

**Licence shorthand**
- **dl-de/zero-2-0** (Datenlizenz Deutschland Zero 2.0): any use, no conditions, no attribution required.
- **dl-de/by-2-0** (Datenlizenz Deutschland Namensnennung 2.0): any use including commercial. Attribution and a licence link are required, and changes must be noted.
- **LO 2.0** (Licence Ouverte / Etalab 2.0, France): CC BY-equivalent, commercial use OK.
- **ODbL**: commercial use OK with attribution. Share-alike applies to a *derived database* you distribute, not to rendered game visuals ("produced work"). If you ship the converted building database itself to clients, treat that database as ODbL.

For game use generally: every licence below except CC0/PDDL/zero/public domain requires a visible credit line (an in-game credits/attribution screen is fine). Most also require noting that you modified the data, for example "converted to glTF".

---

## 1. USABLE models (CC0 / PDDL / public domain / CC BY / ODbL / open government licences)

### 1a. National or state-wide coverage

| # | Place | Publisher | What | Format(s) | Licence (exact) | Commercial | Attribution text | Size / scale | Download URL | Host domain(s) | V |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | **Japan, 306 locations** (PLATEAU; counter dated 2026-05-11; target ~500 cities by FY2027) | MLIT Japan (Project PLATEAU); copyright held by each municipality | LoD1 everywhere, LoD2 roofs in many cities (with `_appearance` textures), LoD3 in some districts. Also roads, terrain, land use, bridges, urban furniture, flood zones | CityGML (standard, nationwide); FBX, OBJ, 3D Tiles, MVT, GeoJSON/FGDB in some cities (converted from CityGML) | Public Data License 1.0 (公共データ利用規約 第1.0版), compatible with CC BY 4.0. Users may alternatively use the data under ODC-BY or ODbL. FAQ: "PLATEAUが提供する3D都市モデル…はすべてCC BY4.0等のオープンライセンス" | Yes (FAQ explicit) | e.g. "出典：国土交通省 PLATEAU（URL）" plus a note that you edited it (e.g. "国土交通省 PLATEAU のデータを加工して作成"). Credit the municipality too | 306 municipality datasets; multi-GB per large city | https://www.geospatial.jp/ckan/dataset/plateau ; list: https://www.mlit.go.jp/plateau/open-data/ | geospatial.jp, www.mlit.go.jp | P |
| 2 | **Netherlands, nationwide** (3DBAG) | TU Delft 3D geoinformation group + 3DGI (from the official BAG + AHN) | LoD1.2, LoD1.3 and LoD2.2 for every building (~10 M) | CityJSON, OBJ, GeoPackage; WMS/WFS; 3D Tiles viewer | CC BY 4.0 | Yes ("free to copy, distribute, and adapt") | "© 3DBAG by tudelft3d and 3DGI", linking to https://docs.3dbag.nl/en/copyright. On maps, place the credit bottom-right | Whole country, tiled | https://3dbag.nl/en/download | 3dbag.nl, docs.3dbag.nl | P |
| 3 | **Netherlands, nationwide** (3D Basisvoorziening) | Kadaster (national mapping agency) | LoD2.2 buildings (LoD1.3 where no AHN), terrain, DTM (quantized mesh), DSM point clouds | CityJSON, 3D Tiles (buildings and terrain), GeoPackage, quantized-mesh, LAZ | CC BY 4.0 (stated on the API landing page) | Yes | "Kadaster / 3D Basisvoorziening" (CC BY 4.0) | Whole country. 3D Tiles only on request via the contact form | https://api.pdok.nl/kadaster/3d-basisvoorziening/ogc/v1 | api.pdok.nl, 3d.kadaster.nl | P |
| 4 | **Switzerland and Liechtenstein, nationwide** (swissBUILDINGS3D 3.0 Beta / 2.0) | swisstopo (Federal Office of Topography) | 3.0: solid LoD2-type buildings with roofs as separate objects; roof details and dormers mostly not modelled; ±30–50 cm. 2.0: footprints, facades, overhangs, roof shapes; no textures | 3.0: DWG, ESRI FGDB, CityGML 2.0 (EGID buildings only). 2.0: FGDB/DXF, plus SHP/CityGML/KML/OBJ by email | swisstopo OGD terms: "may be enriched and processed and also used commercially"; source reference mandatory | Yes | "© swisstopo" or "Federal Office of Topography swisstopo" ("derived from …" allowed for derived data) | FGDB ≈55 GB, DWG ≈160 GB for the whole country | https://www.swisstopo.admin.ch/en/landscape-model-swissbuildings3d-3-0-beta → https://ogd.swisstopo.admin.ch | swisstopo.admin.ch, ogd.swisstopo.admin.ch | P |
| 5 | **Estonia, nationwide** | Estonian Land and Spatial Development Board (Maa- ja Ruumiamet) | LoD2 buildings (856,360), LoD1 (917,882), roofed areas, transport LoD1, greenhouses, vegetation LoD0 | OBJ, CityGML, GDB; by country, county or municipality | Estonian Land Board open-data licence: free, "for commercial or non-commercial purposes", derivatives allowed | Yes | "Building 3D model data: Republic of Estonia Land and Spatial Development Board <year>". When redistributing the data itself, attach the licence link https://geoportaal.maaruum.ee/opendata-licence | Whole country | https://geoportaal.maaamet.ee/eng/Download-3D-data-p837.html | geoportaal.maaamet.ee | P |
| 6 | **Luxembourg, nationwide** | Administration du cadastre et de la topographie (ACT) | LoD1 national (2013); LoD2.3 samples (Diekirch/Bastendorf); national "bâtiments 3D 2023" database | CityGML | CC0 1.0 (LoD1 and LoD2.3 records). 2023 national dataset assumed CC0 like the others; page robots-blocked | Yes | None required (credit "ACT Luxembourg" is courteous) | LoD1 whole country in one zip | https://download.data.public.lu/resources/batiments-3d-lod-1-level-of-detail-1-1/20190528-082153/lod1-par-pays.zip | data.public.lu, download.data.public.lu, catalog.inspire.geoportail.lu | M |
| 7 | **Poland, nationwide** | GUGiK (Head Office of Geodesy and Cartography) | LoD1 nationwide (2019, 2021, 2022, 2024 editions; height = LiDAR median); LoD2 for 236 powiats in 10 voivodeships (2017). Also 3D tree models in some counties | CityGML 2.0, one package per powiat | "dostępne bezpłatnie i możliwe do dowolnego wykorzystania" (free, may be used for any purpose). No named licence | Yes per "any use" (not spelled out) | "Źródło: GUGiK" recommended | Whole country (LoD1) | https://www.geoportal.gov.pl/pl/dane/inne-dane/modele-3d-budynkow/ (module "Pobierz dane") | geoportal.gov.pl, mapy.geoportal.gov.pl | P |
| 8 | **France, nationwide** (BD TOPO®) | IGN | 3D vector topographic database; buildings carry altitudes and heights (extrudable to LoD1) | Shapefile/GeoPackage; WMS/WFS | Licence Ouverte / Open Licence 2.0 | Yes | "IGN – BD TOPO®" | Whole country, by département | https://www.data.gouv.fr/datasets/bd-topo-r → cartes.gouv.fr | data.gouv.fr, cartes.gouv.fr | P |
| 9 | **France, nationwide** (BDNB) | CSTB | 32 M building identity records cross-referenced from ~50 public databases (heights not confirmed) | CSV, GeoPackage, PostgreSQL dump | Licence Ouverte 2.0 | Yes | "CSTB – BDNB" | GPKG 47.5 GB | https://www.data.gouv.fr/fr/datasets/base-de-donnees-nationale-des-batiments/ | data.gouv.fr | P |
| 10 | **Spain, nationwide** except Basque Country/Navarre (Catastro INSPIRE Buildings) | Dirección General del Catastro | 2D buildings and building parts with floor counts (extrudable to LoD1) | INSPIRE GML via ATOM by municipality; WFS | Catastro "licencia de cesión de derechos": public use "incluido el comercial" of **transformed** data. Raw data may not be redistributed or sold, and products may not be called "cartografía/información catastral" | Yes, with conditions (a game mesh is a transformed work) | None specified ("Dirección General del Catastro" recommended) | Whole country | https://www.catastro.hacienda.gob.es/webinspire/index.html (ES.SDGC.BU.atom.xml) | catastro.hacienda.gob.es | P |
| 11 | **Belgium, Flanders** (3D GRB) | Digitaal Vlaanderen | LoD1 blocks from GRB footprints + DHMV heights | SHP (PolygonZM), KML 1×1 km tiles; WMS | Open data, free; attribution is the only condition (licence name not given on the page) | Yes | "Bron: Grootschalig Referentie Bestand Vlaanderen, Digitaal Vlaanderen" | Whole region | https://www.vlaanderen.be/digitaal-vlaanderen/onze-diensten-en-platformen/basiskaart-vlaanderen-grb/3d-grb (download.vlaanderen.be; login required) | vlaanderen.be, download.vlaanderen.be, geo.api.vlaanderen.be | P |
| 12 | **Belgium, Brussels-Capital Region** (UrbIS 3D Constructions) | Paradigm.brussels (Brussels regional IT/GIS) | LoD2 buildings and engineering structures, whole region | SHP (multipatch), SketchUp, DWG, GeoPackage (no 3D classes) | **CC0 1.0** ("no conditions for reuse, the data is in the public domain") | Yes | None required | Whole region | https://urbisdownload.datastore.brussels/atomfeed/e9ec2aa4-cffd-11ee-bccc-00090ffe0001-en.xml | datastore.brussels, urbisdownload.datastore.brussels, geobru-geonetwork.irisnet.be | M |
| 13 | **USA, nationwide** (3DEP lidar; terrain and point clouds only, no building meshes) | USGS | LAZ point clouds, 1 m and 1/3″ DEMs; building heights can be derived | LAZ, GeoTIFF | US public domain ("USGS-authored or produced data … U.S. Public Domain") | Yes | Requested: "Credit: U.S. Geological Survey" | Most of the US | The National Map (apps.nationalmap.gov) | usgs.gov, nationalmap.gov | P |

#### Germany: all 16 Länder publish LoD1 and LoD2 (AdV-CityGML) as open data

dl-de/by-2-0 and CC BY 4.0 both allow commercial use with attribution.

| # | Land | Publisher | What | Format | Licence | Attribution text | Scale | Download | Host | V |
|---|---|---|---|---|---|---|---|---|---|---|
| 14 | Nordrhein-Westfalen | Geobasis NRW (Bez.-Reg. Köln) | LoD1 + LoD2 (standard roof shapes, ±1 m), statewide | CityGML 1×1 km tiles; LoD2 also SLPK; OGC API 3D Tiles | **dl-de/zero-2-0**: "Jede Nutzung ist ohne Einschränkungen oder Bedingungen zulässig" | None required ("© Geobasis NRW" recommended) | ~11.6 M buildings | https://www.opengeodata.nrw.de/produkte/geobasis/3dg/ (lod1_gml, lod2_gml, lod2_slpk) | opengeodata.nrw.de | P |
| 15 | Bayern | Bayerische Vermessungsverwaltung (LDBV) | LoD2 statewide (LoD1 also exists) | CityGML 1.0 | **CC BY 4.0** | "Bayerische Vermessungsverwaltung – www.geodaten.bayern.de" | ~9.8 M objects | https://geodaten.bayern.de/opengeodata/OpenDataDetail.html?pn=lod2 | geodaten.bayern.de | P |
| 16 | Berlin | SenStadt Berlin | LoD1 + LoD2 statewide | CityGML via ATOM | **dl-de/zero-2-0** | None required ("© Geoportal Berlin" recommended) | Whole city | https://gdi.berlin.de/data/a_lod2/atom/ | gdi.berlin.de | M |
| 17 | Brandenburg | LGB | LoD1 + LoD2 statewide | GML tiles | **dl-de/by-2-0** | "© GeoBasis-DE/LGB, dl-de/by-2-0, (Daten geändert)" | Statewide | https://data.geobasis-bb.de/geobasis/daten/3d_gebaeude/ | data.geobasis-bb.de | P+M |
| 18 | Hamburg | LGV Hamburg | LoD1 + LoD2 (LoD2-DE) | CityGML | **dl-de/by-2-0** (applies to all LGV open geodata; robots blocked the 3D page) | "Freie und Hansestadt Hamburg, Landesbetrieb Geoinformation und Vermessung (LGV)" | Whole city | https://suche.transparenz.hamburg.de/dataset/3d-stadtmodell-lod2-de-hamburg2 | transparenz.hamburg.de, geodienste.hamburg.de | M/S |
| 19 | Sachsen | GeoSN | LoD1 + LoD2, plus bridges, walls, towers, wind turbines (since 2021) | CityGML, 3D-DXF, 3D-Shape; 2×2 km tiles; batch by Landkreis/Gemeinde | **dl-de/by-2-0** (GDI-DE record "Digitales 3D-Stadtmodell, Freistaat Sachsen") | "GeoSN, dl-de/by-2-0" | Statewide | https://www.geodaten.sachsen.de/downloadbereich-digitale-3d-stadtmodelle-4875.html | geodaten.sachsen.de, geoviewer.sachsen.de | M |
| 20 | Thüringen | TLBG / GDI-Th | LoD1 + LoD2 | CityGML | **dl-de/by-2-0** (TLBG open-geodata licence per GDI-DE; download page behind CAPTCHA) | "© GDI-Th (<Jahr>), dl-de/by-2-0" | Statewide | https://geoportal.thueringen.de/gdi-th/download-offene-geodaten/download-3d-gebaeudedaten | geoportal.thueringen.de | S |
| 21 | Hessen | HVBG | LoD2 free self-service download (LoD1 on request for a fee) | CityGML 1.0 | dl-de/zero-2-0 (HVBG open data per licence summary; product sheet names no licence) | Optional: "© HVBG" | Statewide | https://gds.hessen.de (Downloadcenter Geodaten) | gds.hessen.de | S |
| 22 | Baden-Württemberg | LGL BW | LoD1 + LoD2 (released as open data in 2024) | CityGML | **dl-de/by-2-0** (LGL open-data licence per GDI-DE records) | "LGL-BW (<Jahr>) Datenlizenz Deutschland - Namensnennung - Version 2.0, www.lgl-bw.de" | Statewide | https://opengeodata.lgl-bw.de/#/(sidenav:product/12) | opengeodata.lgl-bw.de | M/S |
| 23 | Niedersachsen | LGLN | LoD1 + LoD2 | AdV-CityGML 1.0 | **CC BY 4.0** | "LGLN (<Jahr>) Creative Commons Namensnennung – 4.0 International (CC BY 4.0)" | Statewide | https://ni-lgln-opengeodata.hub.arcgis.com/apps/lgln-opengeodata::3d-gebäudemodell-lod2/about ; https://opengeodata.lgln.niedersachsen.de/#lod2 | ni-lgln-opengeodata.hub.arcgis.com, opengeodata.lgln.niedersachsen.de | M |
| 24 | Sachsen-Anhalt | LVermGeo ST | LoD1 + LoD2 | CityGML | **dl-de/by-2-0** | "© GeoBasis-DE/LVermGeo ST" (+ "Daten geändert") | Statewide | https://www.lvermgeo.sachsen-anhalt.de/de/gdp-download-lod2.html | lvermgeo.sachsen-anhalt.de, geodatenportal.sachsen-anhalt.de | P (open-data leaflet) |
| 25 | Schleswig-Holstein | LVermGeo SH | LoD1 + LoD2 | CityGML | CC BY 4.0 (from licence summary; publisher site robots-blocked) | "© GeoBasis-DE/LVermGeo SH/CC BY 4.0" | Statewide | https://geodaten.schleswig-holstein.de/gaialight-sh/_apps/dladownload/dl-lod2.html | geodaten.schleswig-holstein.de | S |
| 26 | Mecklenburg-Vorpommern | LAiV M-V | LoD2 | CityGML zip, 2×2 km tiles via ATOM | **CC BY 4.0** | "© GeoBasis-DE/M-V <Jahr der letzten Datenlieferung>", clearly visible | Statewide | https://www.geodaten-mv.de/dienste/gebaeude_atom | geodaten-mv.de, laiv-mv.de | P (product description) |
| 27 | Rheinland-Pfalz | LVermGeo RP | LoD2 tiles (directory verified) | GML (+ txt) | dl-de/by-2-0 (from licence summary) | "© GeoBasis-DE/LVermGeoRP (<Jahr>), dl-de/by-2-0, www.lvermgeo.rlp.de" | Statewide | https://geobasis-rlp.de/data/geb3dlo/current/gml/ | geobasis-rlp.de | S |
| 28 | Saarland | LVGL | LoD2 (INSPIRE Buildings 3D) | GML 3.2.1 (INSPIRE); CityGML/SHP via the LVGL shop (restricted) | **dl-de/by-2-0** (INSPIRE LoD2 records) | "© GeoBasis DE/LVGL-SL (<Jahr>)" | Statewide | via Geoportal Saarland (geoportal.saarland.de) | geoportal.saarland.de | M |
| 29 | Bremen | LGeoInfo Bremen | LoD1 + LoD2 | CityGML | CC BY 4.0 (from licence summary; product page did not load) | "© Landesamt GeoInformation Bremen (CC BY 4.0)" | Bremen + Bremerhaven | https://www.geo.bremen.de/produkte/3d-produkte/3d-gebaeudemodelle-11892 | geo.bremen.de | S |

Also open in Germany: city LoD2 models (Leipzig, Potsdam, Hannover, Freiburg, Köln, Gelsenkirchen). These duplicate the state data. Leipzig's page states no licence, so use the GeoSN state data instead.

### 1b. City / metro coverage

| # | Place | Publisher | What | Format(s) | Licence (exact) | Commercial | Attribution | Size / scale | Download URL | Host | V |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 30 | **Strasbourg Eurométropole** (photomesh 2018) | Ville et Eurométropole de Strasbourg | **Textured photomesh** of the whole territory (5 cm, ~10 cm accuracy) | OBJ and **3D Tiles**, ~6,000 tiles of 250 m | Licence Ouverte (LO/OL) | Yes | "Ville et Eurométropole de Strasbourg" (mandatory) | **~2 TB** | https://www.sig.strasbourg.eu/datastrasbourg/3d_fiches_metadonnees_pdf/ (open data portal data.strasbourg.eu) | sig.strasbourg.eu, data.strasbourg.eu | P |
| 31 | **Lyon Métropole** (photomesh 2023) | Métropole de Lyon | **Textured 3D photomesh** of the whole metropolis, 5.5 cm imagery (Jul–Aug 2023) | **3D Tiles** | Licence Ouverte 2.0 | Yes | "Métropole de Lyon" | Whole metro (59 communes) | https://www.data.gouv.fr/datasets/6752312729bbdda4ba8f637f (data.grandlyon.com) | data.gouv.fr, data.grandlyon.com | P |
| 32 | Lyon Métropole (textured LoD2 2009/2012/2015/2018; roof volumes 2018) | Métropole de Lyon | Textured CityGML buildings + textured TIN terrain, bridges, water; roof-volume objects | CityGML; roof volumes as GeoJSON/CSV/SHP (99.9 MB) | Licence Ouverte 2.0 | Yes | "Métropole de Lyon" | Whole metro | https://www.data.gouv.fr/datasets/611621d83eed0bb631f343d0 ; https://data.grandlyon.com | data.gouv.fr, data.grandlyon.com | P |
| 33 | Paris (Volumes bâtis) | Ville de Paris (Direction de l'Urbanisme) | Detailed building volumes by height and projecting/recessed parts (2.5D, extrudable) | SHP, GeoJSON, CSV | **ODbL** | Yes | "Ville de Paris" | ZIP 9.7 MB | https://www.data.gouv.fr/datasets/volumes-batis | data.gouv.fr, opendata.paris.fr | P |
| 34 | Rennes Métropole | Rennes Métropole | **Textured** 3D buildings by vintage | CityJSON; tiled pyramid (3D tiles) | **ODbL** | Yes | "Rennes Métropole" | Metro | https://www.data.gouv.fr/datasets/batiments-3d-millesimes-textures-en-cityjson ; …-en-tuiles | data.gouv.fr, data.rennes-metropole.fr | P |
| 35 | Vienna | Stadt Wien (MA 41) | Building model LoD1.4; generalized roof model **LoD2.1**; LoD0.4 footprints | CityGML, DXF triangulation (500 m tiles), GPKG/SHP | **CC BY 4.0** | Yes | "Datenquelle: Stadt Wien - data.wien.gv.at" | Whole city | https://www.wien.gv.at/stadtentwicklung/stadtvermessung/geodaten/viewer/geodatendownload.html | wien.gv.at, data.wien.gv.at | P |
| 36 | **Helsinki** | City of Helsinki | Semantic CityGML LoD1/LoD2 (LoD2 also **textured**) + terrain; **reality mesh** of the whole city (2015, 2017; 7.5 cm) and Kalasatama | CityGML 2.0 (4 km² sheets), WFS; mesh OBJ (Kalasatama also FBX, DAE, 3D Tiles, 3MX) | **CC BY 4.0** (hel.fi says so for both mesh and CityGML) | Yes | "Helsingin kaupunki / City of Helsinki, CC BY 4.0" | Whole city | https://kartta.hel.fi/3d/ ; http://3d.hel.ninja/data/citygml/ ; 3d.hel.ninja/data/mesh/ | kartta.hel.fi, 3d.hel.ninja, hri.fi | P |
| 37 | Espoo (+ Kauniainen) | City of Espoo | CityGML LoD1/LoD2 via WFS; **reality mesh** (2017) | CityGML/GML WFS; SketchUp; mesh OBJ/COLLADA 2×2 km tiles | **CC BY 4.0** | Yes | "City of Espoo, city model data, MM/YYYY" | Whole city | https://kartat.espoo.fi/3d/services_en.html ; https://hri.fi/data/en/dataset/espoon-verkkomalli | kartat.espoo.fi, hri.fi | P |
| 38 | Zürich (city) | Stadt Zürich GIS-Zentrum | 3D roof model LoD2 (2011–2018 vintages), block model | per portal | opendata.swiss "terms_open" (open use) | Yes | Optional: "Stadt Zürich" | Whole city | https://data.stadt-zuerich.ch/dataset?tags=3d-stadtmodell ; https://ckan.opendata.swiss/dataset/3d-dachmodell-lod2-jahresstand-2018-3d | data.stadt-zuerich.ch, opendata.swiss | M |
| 39 | Riga | Riga City Council (GeoRiga) | LoD2 buildings by neighbourhood (2021/2022 ALS) | GDB, SKP, **OBJ**, 3DS, CityGML | **CC BY 4.0** | Yes | "Rīgas valstspilsētas pašvaldība / GeoRiga, CC BY 4.0" | Whole city | https://georiga.eu/en/atvertie-dati/lod2/ | georiga.eu | P |
| 40 | Prague (3D model of buildings and bridges) | IPR Praha | 3D buildings and bridges (≥0.5 m accuracy), DSM, DTM | multipatch, CityGML, polygonZ; whole city or by sheet | CC BY 4.0 (IPR open data: "without restriction under CC BY licence") | Yes | "data base © IPR Praha" | Whole city | https://geoportalpraha.cz/en/data-and-services/open-data | geoportalpraha.cz | P |
| 41 | Rotterdam (Rotterdam 3D) | Gemeente Rotterdam | CityGML buildings, 3D Tiles, **textured mesh** | CityGML, 3D Tiles, mesh | **Public Domain Mark 1.0** ("Publiek domein") | Yes | None required | Whole city | https://www.3drotterdam.nl/#/export ; https://www.rotterdam.nl/werken-leren/3d/ | 3drotterdam.nl, rotterdam.nl | M |
| 42 | **Hong Kong, whole territory** (3D Spatial Data 3D-BIT00) | Lands Department, HKSAR | **Textured** 3D buildings, infrastructure and terrain models | MAX, 3DS, FBX, VRML; plus **Cesium 3D Tiles** API (free key) | DATA.GOV.HK / CSDI terms: "browse, download, distribute, reproduce … for commercial and non-commercial purposes, free of charge", with conditions; Government keeps IP | Yes | Must "identify clearly the Government and this website as the source" and acknowledge Government IP ownership | Whole HK | https://data.gov.hk/en-data/dataset/hk-landsd-openmap-development-hkms-digital-3d-bit00 ; https://portal.csdi.gov.hk/csdi-webpage/apidoc/3d-spatial-data-api | data.gov.hk, portal.csdi.gov.hk, static.csdi.gov.hk | P |
| 43 | New York City | NYC OTI (ex-DoITT) / Dept of City Planning | Every building present in 2014: mostly LoD1.5, ~100 icons at LoD2 (~1 M buildings) | CityGML (GML), ESRI multipatch, DGN; DCP version .3dm by community district | No named licence. NYC Open Data / NYC.gov Terms of Use ("public dataset … for informational purposes", as-is) | Not expressly addressed. Widely reused; treat as permissive, no warranty | Not required ("Source: City of New York") | Whole city | https://s-media.nyc.gov/agencies/oti/DA_WISE_GML.zip (also _Multipatch, _DGN) | s-media.nyc.gov, nyc.gov, catalog.data.gov | P (metadata PDF) |
| 44 | Boston | Boston Planning & Development Agency | 3D Smart Model: terrain, groundplan, 3D buildings by tile | Open formats + SketchUp per tile | **ODC PDDL** (public domain) | Yes | None required | Whole city, tiled | http://www.bostonplans.org/3d-data-maps/3d-smart-model/3d-data-download | bostonplans.org | P |
| 45 | Washington DC | DC OCTO / Office of Planning (CyberCity3D) | 3D buildings with facades and detailed roofs (2005/2010/2013 imagery; >99% of buildings); 2022 lidar scene | ESRI multipatch; I3S scene layer (2022) | **CC BY 4.0** | Yes | "District of Columbia Office of Planning / OCTO" | Whole district | https://opendata.dc.gov (Buildings 3D) ; https://opendata.dc.gov/maps/DCGIS::buildings-3d-scene-2022 | opendata.dc.gov, maps2.dcgis.dc.gov, tiles.arcgis.com | P (ArcGIS item info) |
| 46 | Montréal (2016 and 2013/2009 maquettes) | Ville de Montréal | **Textured LoD2** buildings for six central boroughs (Ville-Marie, Plateau, Sud-Ouest, CDN-NDG, Outremont, Verdun) | CityGML (textured), 3DM, FGDB; DWG untextured | **CC BY 4.0** | Yes | "Ville de Montréal, CC BY 4.0" | Six boroughs | https://www.donneesquebec.ca/recherche/dataset/vmtl-batiment-3d-2016-maquette-citygml-lod2-avec-textures2 | donneesquebec.ca, donnees.montreal.ca | P |
| 47 | Adelaide (+ North Adelaide) | City of Adelaide | Textured and untextured city 3D model (2016), **Unreal-ready** version | FBX, Blender, multipatch, SketchUp (zips) | **CC BY 4.0** | Yes | "City of Adelaide, CC BY 4.0" | CBD + North Adelaide | https://data.sa.gov.au/data/dataset/3d-model | data.sa.gov.au | P |
| 48 | Melbourne (Development Activity Model massing) | City of Melbourne | Massing model of the municipality (development status layers) | SketchUp .skp (138 MB), CSV/JSON/KML | **CC BY 4.0** | Yes | "City of Melbourne, CC BY 4.0" | Municipality | https://discover.data.vic.gov.au/dataset/development-activity-model-sketchup-massing | discover.data.vic.gov.au, data.gov.au | P |
| 49 | Glasgow | Glasgow City Council + Urban Big Data Centre, Univ. of Glasgow | LoD1 + LoD2 buildings, footprints, DTM/DSM 0.5 m, tree canopy (2020–21 lidar) | OBJ, SHP, CityJSON (v4), GeoTIFF | **CC BY 4.0** | Yes | Cite Li, Zhao et al. (UBDC), Zenodo record 15000747 | ~1.3 GB (LoD2 926 MB) | https://zenodo.org/records/15000747 | zenodo.org | P |

### 1c. University-built models from official/open sources (usable, but not government-published)

| # | Place | Publisher | What | Format | Licence | Size | URL | Host | V |
|---|---|---|---|---|---|---|---|---|---|
| 50 | USA, all 50 states + DC (OpenCityModel) | BuildZero.org (from Microsoft footprints + OSM + LARIAC) | ~125 M LoD1 buildings, heights measured or estimated | CityGML, CityJSON, Parquet | **ODbL** | CA ≈3.6 GB (GML) | https://github.com/opencitymodel/opencitymodel | github.com (+ its S3 links) | P |
| 51 | Singapore HDB (HDB3D) | NUS Urban Analytics Lab | 12,119 HDB blocks LoD1 | CityJSON, OBJ | MIT (repo). Derived from OSM, so ODbL obligations apply. Credit NUS UAL, HDB, OSM contributors, OneMap | small | https://github.com/ualsg/hdb3d-data | github.com | P |
| 52 | Munich TUM campus (tum2twin) | TU Munich | LoD2 (textured), LoD3 buildings, LoD3 trees, OpenDRIVE | CityGML, SketchUp | **CC BY 4.0** | small | https://github.com/tum-gis/tum2twin | github.com | P |
| 53 | Ingolstadt inner city | TUM / SAVeNoW | LoD3 buildings (CC BY-SA 4.0), LoD2 tiles (CC BY 4.0). Road network is CC BY-NC-SA, **not usable** | CityGML 2.0/3.0, SketchUp | mixed (see left) | small | https://github.com/savein/lod3-road-space-models | github.com | P |

---

## 2. NOT USABLE (or not usable until clarified)

| Place / dataset | Publisher | Reason | V |
|---|---|---|---|
| Dublin Docklands SDZ 3D model (LoD2/LoD3, FBX/MAX + textures) | Smart Dublin / Dublin City Council | **CC BY-NC 4.0** (non-commercial) | P |
| Ireland, national | — | No official open 3D building model found | — |
| UK, national (OS MasterMap Building Height Attribute / OS NGD buildings) | Ordnance Survey | Premium, paid data. No OS open 3D buildings. (Glasgow above is the exception.) | P (OS docs) |
| London | — | No official open 3D model. The awesome-citygml entry is a Google Poly CAD model, not official | — |
| Wallonia (SPW 3D/PICC data) | Service public de Wallonie | SPW licence "Type C" **forbids modifying the data** ("Il est interdit à l'Utilisateur de modifier les Données") and sale must relate to processing | P |
| Namur LoD2.2 textured CityGML/SketchUp | Ville de Namur | Licence page would not render; unclear | unclear |
| Bordeaux Métropole bati3d (textured LoD2 2012, 3DS) | Bordeaux Métropole | Licence not shown, API robots-blocked; unclear (portal historically ODbL) | unclear |
| Berlin 3D textured mesh (2023/2025 aerial, OBJ tiles) | Senate Dept for Economy / Business Location Center | "Free via Berlin Open Data Initiative" but no licence named on portal or metadata. Ask before use. (Berlin LoD2 CityGML is dl-de/zero and fine) | M |
| Prague photorealistic 3D mesh | IPR Praha | Not open yet. Parts given "free of charge on request" with no licence; planned OBJ open release | P |
| Wallonia national LoD2 / Liège etc. | — | Not found under open terms | — |
| Hessen LoD1 | HVBG | Fee-based on request (LoD2 is free, see #21) | P |
| Saarland CityGML/Shape LoD2 product | LVGL | Via shop, access "Restricted". Use the INSPIRE LoD2 (dl-de/by) instead | M |
| Victoria, Australia (Vicmap Buildings LoD1/LoD2) | DTP Victoria | Includes data "licensed from commercial providers". Access by request, not open | P |
| Melbourne textured photomesh 2018/2020 | City of Melbourne | Listed on data.gov.au but pages would not load; licence unverified (CoM usually CC BY 4.0, so likely usable after checking) | unclear |
| Calgary 3D Buildings – Citywide (LoD2 CAD/GDB) | City of Calgary | Page would not render; licence (Open Government Licence – City of Calgary?) unverified | unclear |
| Toronto 3D Massing | City of Toronto | Dataset marked **Retired**, no resources (licence OGL-Toronto would be fine) | P |
| Philadelphia Building 3D Models 2015 | City of Philadelphia (PASDA) | Licence/use constraints not stated | P |
| Cambridge MA 3D data (SKP/OBJ/SLPK) | City of Cambridge | Only a disclaimer; no licence stated | P |
| Leipzig 3D-Stadtmodell LoD2 | Stadt Leipzig | No licence on page. Use Saxony GeoSN data (dl-de/by) instead | P |
| Singapore OneMap3D | SLA | View-only, cannot be downloaded | P (via NUS guide) |
| Denmark (national / Copenhagen) | SDFI / Københavns Kommune | No official open 3D building model found (DHM terrain is open but has no buildings) | — |
| Norway / Sweden | Kartverket / Lantmäteriet / Oslo / Stockholm | No official open 3D building download found (FKB is restricted; Malmö page failed) | — |
| South Korea (V-World 3D buildings) | MOLIT / NGII | data.go.kr robots-blocked; licence (공공누리 type) unverified | unclear |
| Taiwan (NLSC 三維建物模型) | MOI / NLSC | data.gov.tw robots-blocked; unverified | unclear |
| China (GABLE etc.) | academic | No official open 3D city model. GABLE is a research dataset with unclear licence | — |
| São Paulo GeoSampa | Prefeitura de São Paulo | Only LiDAR LAZ (MDS/MDT), not building models. Site says "Creative Commons" without version; unclear | P |
| Mexico City (CityJSON/OBJ) | TU Delft (Ken Arroyo Ohori) from INEGI data | University-built, model licence not stated (site CC0 "except where otherwise noted"). Probably fine but unconfirmed | P |
| Cape Town, Nigeria/Lagos, Nairobi, Kigali, rest of Africa | — | No official open 3D building model found | — |
| India (Survey of India / Smart Cities) | — | Research CityGML projects only; no official open download | — |
| Dubai | Dubai Municipality | Open data has building floor/usage tables only, no 3D models | P |
| Israel (Tel Aviv / Jerusalem), Turkey (Istanbul İBB) | — | No official open 3D model download found | — |
| Ingolstadt road network (OpenDRIVE/CityGML) | TUM/3D Mapping Solutions | CC BY-NC-SA 4.0 | P |
| Dublin "LoD2" in awesome-citygml (Google Poly) | — | Not official; Poly is defunct | — |
| China / Las Vegas / Washington streetspace (TUM) | academic | Research samples, not official, small | — |

---

## 3. Host domains needed (for an allowlist or CDN mirroring)

Japan: `geospatial.jp`, `www.mlit.go.jp`
Netherlands: `3dbag.nl`, `docs.3dbag.nl`, `api.pdok.nl`, `3d.kadaster.nl`, `3drotterdam.nl`, `rotterdam.nl`
Switzerland: `www.swisstopo.admin.ch`, `ogd.swisstopo.admin.ch`, `data.stadt-zuerich.ch`, `ckan.opendata.swiss`
Germany: `www.opengeodata.nrw.de`, `geodaten.bayern.de`, `gdi.berlin.de`, `data.geobasis-bb.de`, `transparenz.hamburg.de`, `geodienste.hamburg.de`, `www.geodaten.sachsen.de`, `geoviewer.sachsen.de`, `geoportal.thueringen.de`, `gds.hessen.de`, `opengeodata.lgl-bw.de`, `opengeodata.lgln.niedersachsen.de`, `ni-lgln-opengeodata.hub.arcgis.com`, `www.lvermgeo.sachsen-anhalt.de`, `geodaten.schleswig-holstein.de`, `www.geodaten-mv.de`, `geobasis-rlp.de`, `geoportal.saarland.de`, `www.geo.bremen.de`, `gdk.gdi-de.org` (metadata)
Austria: `www.wien.gv.at`, `data.wien.gv.at`
Finland: `kartta.hel.fi`, `3d.hel.ninja`, `hri.fi`, `kartat.espoo.fi`
Estonia: `geoportaal.maaamet.ee`
Latvia: `georiga.eu`
Poland: `www.geoportal.gov.pl`, `mapy.geoportal.gov.pl`
Czechia: `geoportalpraha.cz`
France: `www.data.gouv.fr`, `cartes.gouv.fr`, `data.grandlyon.com`, `www.sig.strasbourg.eu`, `data.strasbourg.eu`, `data.rennes-metropole.fr`, `opendata.paris.fr`
Belgium: `urbisdownload.datastore.brussels`, `datastore.brussels`, `download.vlaanderen.be`, `geo.api.vlaanderen.be`
Luxembourg: `data.public.lu`, `download.data.public.lu`
Spain: `www.catastro.hacienda.gob.es`
UK: `zenodo.org`
USA: `s-media.nyc.gov`, `www.nyc.gov`, `www.bostonplans.org`, `opendata.dc.gov`, `maps2.dcgis.dc.gov`, `tiles.arcgis.com`, `apps.nationalmap.gov` / `usgs.gov`, `github.com` (OpenCityModel)
Canada: `www.donneesquebec.ca`, `donnees.montreal.ca`
Australia: `data.sa.gov.au`, `discover.data.vic.gov.au`, `data.gov.au`
Hong Kong: `data.gov.hk`, `portal.csdi.gov.hk`, `static.csdi.gov.hk`
Singapore (academic): `github.com/ualsg`

These portals are slow, rate-limited or session-based (ATOM/WFS, login for Flanders, a contact form for Kadaster 3D Tiles). Pre-process to glTF/3D Tiles once and serve from your own CDN rather than hot-linking from a browser game. Hot-linking is also not what most of these servers are provisioned for.

---

## 4. Top 10 by value (detail × size of area)

1. **Japan PLATEAU**: 306 municipalities including Tokyo 23 wards, Osaka, Nagoya and Yokohama. LoD1 everywhere, textured LoD2 widely, LoD3 in spots, plus roads and terrain; 3D Tiles/FBX/OBJ in many cities. CC BY 4.0 / ODbL.
2. **Germany, all 16 Länder LoD2**: around 50 M+ buildings with roof shapes (NRW 11.6 M, Bavaria 9.8 M). NRW, Berlin and Hesse are dl-de/zero; the rest are dl-de/by or CC BY 4.0.
3. **Netherlands 3DBAG** (plus Kadaster 3D Basisvoorziening 3D Tiles): ~10 M LoD2.2 buildings, the whole country, CC BY 4.0.
4. **Strasbourg photomesh 2018**: ~2 TB textured OBJ and 3D Tiles, the whole Eurométropole, Licence Ouverte.
5. **Lyon photomesh 2023**: textured 3D Tiles mesh of the whole metropolis at 5.5 cm, Licence Ouverte 2.0. Lyon's textured CityGML LoD2 is also available.
6. **Switzerland swissBUILDINGS3D 3.0**: whole country plus Liechtenstein, LoD2-type, free and commercial with attribution "© swisstopo".
7. **Hong Kong 3D-BIT00**: textured buildings, infrastructure and terrain for the whole territory (FBX/3DS, plus 3D Tiles API), commercial use OK with attribution.
8. **Helsinki**: textured LoD2 CityGML plus a whole-city reality mesh (OBJ), CC BY 4.0. Espoo next door has CityGML and mesh under CC BY 4.0.
9. **Estonia**: whole-country LoD2 (856k buildings) directly as **OBJ** and CityGML, commercial use OK.
10. **Brussels UrbIS 3D**: whole-region LoD2, **CC0** (no attribution at all).

Honourable mentions: NYC (~1 M buildings, LoD1.5/2, no formal licence), Vienna LoD2.1 (CC BY), Rotterdam (public domain, textured mesh), Montréal textured LoD2 (CC BY), Poland national LoD1 (free, any use), Washington DC (CC BY), Boston (PDDL).

## Counts

- **Usable:** 53 entries. 13 national/state-wide, 16 German Länder, 20 city/metro, 4 university-built. Of these, 29 are government national/regional datasets plus 20 government city datasets.
- **Licences marked S (secondary source, re-check):** 6 (Thüringen, Hessen, Schleswig-Holstein, Rheinland-Pfalz, Bremen, Hamburg partly).
- **Not usable or unclear:** 34 rows. Hard blocks: Dublin (NC), Wallonia (no modification), Vicmap (commercial data), UK OS (paid), Singapore OneMap (view-only), Ingolstadt roads (NC). The rest are unclear licences or no official data found.
