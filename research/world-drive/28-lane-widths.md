# 28: Road and lane widths for Finglas

Date: 2026-10-05. Question: OSM has almost no `width` tags in Finglas, so
netconvert gives every lane 3.2 m (8,720 of 8,720 road lanes, research 25).
Where can we legally get real widths, how do others do it, and what method
fits `tools/bake/`? Research only; no repo code changed.

What was checked:
- OSM highways in the Finglas box (`places.json` bbox -6.323,53.38,-6.269,53.412),
  Overpass, today: 3,642 ways; in the village pilot box 2 of 471 ways carry `width`.
- The OSM editor imagery index (`osmlab/editor-layer-index`): layers whose
  footprint covers Finglas.
- data.gov.ie catalogue (CKAN API) searched for kerb, footpath, carriageway,
  road edge, road width, road centreline, pavement, orthophoto, aerial.
- Tailte Éireann's open data hub (ArcGIS) item and licence text.
- Esri World Imagery item licence; OSM wiki on Esri and Bing.
- SUMO source `NIImporter_OpenStreetMap.cpp` (how `width` becomes lane width).
- osm2streets / osm2lanes source (Apache-2.0) for default widths.
- A pilot measurement over the whole Finglas box (numbers in section 4).

## 1. The answer: Tailte Éireann "High Value Dataset - Ways" (CC BY 4.0)

Tailte Éireann (formerly OSi) publishes its Prime2 **Way polygons** as open
data under the EU High Value Datasets rules: "Way objects represent all
drivable and walkable roads and paths. All Ways from Motorway to Fifth Class
have polygon geometry." They are the road surface as surveyed by the national
mapping agency, so we don't need to measure pixels at all.

- Hub: https://data-osi.opendata.arcgis.com/datasets/osi::high-value-dataset-ways
- Catalogue: https://data.gov.ie/dataset/high-value-dataset-ways1
- Feature service (queryable by bbox, 2,000 features a page):
  `https://services-eu1.arcgis.com/FH5XCsx8rYXqnjF5/arcgis/rest/services/Ways/FeatureServer/9/query`
- Licence (item `licenseInfo`, read today): "Tailte Éireann content published
  as open data is licenced under a Creative Commons Attribution 4.0
  International (CC BY 4.0) licence." Attribution: "© Tailte Éireann".
  It adds that open topographic data "is generalised ... and should be used
  for reference purposes only"; no warranty.
- Last modified 2026-01-09. Fields: only `GUID`, `OBJECTID`, area, length. No
  road class, no name, no width: the polygon is the data.
- Finglas box: 2,113 polygons, one GeoJSON fetch of a few MB.
- Companion layer "High Value Dataset - Way GDF2" (centrelines, same hub,
  https://data.gov.ie/dataset/high-value-dataset-way-gdf21) if we ever want
  to match by their centreline instead of OSM's.

**What the polygons are**, checked by overlaying them on aerial imagery at two
places (Ballygall Crescent / Glasanaon Road green, and Finglas village Main
Street), looked at only, imagery not kept:
- Edges sit on the kerb line (dark asphalt against the lighter footpath) to
  within about 2 pixels at zoom 19 (~0.35 m). Footpaths beside a road are
  **not** in the road polygon; free-standing paths through greens are their
  own polygons (measured 2-3 m wide).
- On-street parking lay-bys are inside the polygon (Main Street), so the
  width there is kerb-to-kerb including parking, not running lanes.
- Junctions are one merged blob; car parks and most private service roads
  have no polygon.

**Licence verdict: we may ship the derived widths.** CC BY 4.0 allows
adaptation and redistribution, commercial included, with attribution. Add
"© Tailte Éireann (CC BY 4.0)" to the world's `attribution` string in the
baked `<place>.json` and the `#attrib` footer in `game/index.html`, beside
OSM and Overture. Nothing ShareAlike, so it doesn't touch our code or other
data. This is the national dataset, so it covers every Irish place we add,
not just Finglas.

## 2. Other sources, and why not

| Source | Licence for our use | Verdict |
|---|---|---|
| Esri World Imagery | Esri Master License; item says it "may be used in various ArcGIS apps to support data collection and editing, with the results used internally or shared" and "is not intended to be used to export tiles". OSM has a tracing permission (contributions become ODbL). | Fine to **look at** for checking. Not for an automated pipeline that downloads tiles and measures them outside ArcGIS apps. |
| Bing aerial | Microsoft's 2010 permission covers tracing into OSM in OSM editors. Bing Maps for Enterprise basic keys are being retired. | Only via OSM: a human traces `width` into OSM, we read OSM. Not for our own pipeline. |
| Tailte Éireann orthophotos | Sold under commercial licence (MapGenie); not in their open data list. data.gov.ie search "orthophoto" finds no Tailte dataset. | No. And not needed: their Way polygons are the vector product of the same survey. |
| Dublin City Council / Fingal (data.gov.ie, Dublinked, data.fingal.ie) | CC BY 4.0 throughout, but no kerb line, footpath polygon or carriageway dataset exists. Fingal has pedestrian crossings and cycleways; DLR has a road schedule (lengths, not widths). The 2015 NYU/UCD Dublin LiDAR + orthophotos (CC BY 4.0) cover the city centre only, not Finglas. | Nothing usable for widths. Fingal pedestrian crossings (CC BY) may help research 25's crossing work. |
| Copernicus / Sentinel-2 | Open, 10 m pixels. | Far too coarse for a 3 m lane. |
| Mapillary | CC-BY-SA imagery; `MAPILLARY_TOKEN` not set in this shell. Street-level, width needs a 3D method (e.g. UrbanVGGT-style ground-plane fitting). | Later, for lane markings and counts, not widths. ShareAlike on derived data needs thought first. |
| Overture transportation segments | Schema has `width_rules` ("edge-to-edge width ... in meters"), filled from OSM `width`. | Same gap as OSM in Finglas. |
| OSM `width` | ODbL. 2 of 471 ways in the village box. | Read it when present, otherwise ours. |

Sources: https://www.arcgis.com/home/item.html?id=10df2279f9684e4a9f6a7f08febac2a9 (Esri World Imagery),
https://wiki.openstreetmap.org/wiki/Esri, https://wiki.openstreetmap.org/wiki/Bing_Maps,
https://data.gov.ie/dataset/3d-data-hack-dublin-resources,
https://archive.nyu.edu/handle/2451/38684 (2015 Dublin LiDAR),
https://docs.overturemaps.org/schema/reference/transportation/segment/,
https://data.fingal.ie/.

## 3. How others get widths at scale

- **Defaults by road type.** What nearly every importer does. SUMO: 3.2 m
  (`SUMO_const_laneWidth`) unless the typemap or OSM says otherwise.
  osm2lanes (osm2streets, Apache-2.0, `osm2lanes/src/lib.rs`): driving lane
  3.0 m, service road 2.0 m, sidewalk 1.5 m, from Wikipedia/NACTO/LTN 1/20.
  Cheap and wrong by a metre either way on real streets.
- **OSM tags.** `width`, `width:lanes`, `width:carriageway`. SUMO reads
  `width` and divides it by the tagged lane count, excluding sidewalks and
  cycleways (`NIImporter_OpenStreetMap.cpp`, "width is tagged excluding
  sidewalks and cycleways": `forwardWidth = myWidth / taggedLanes`), and
  reads `width:lanes[:forward|:backward]` per lane; `--ignore-widths` turns
  both off. So writing a `width` tag into the OSM file before netconvert is
  all SUMO needs.
- **Aerial segmentation.** Mattyus, Wang, Fidler, Urtasun, "Enhancing Road
  Maps by Parsing Aerial Images Around the World" (ICCV 2015): an MRF over
  road centreline offset and width per OSM segment, rather than per-pixel
  segmentation. DLR "Augment the road map data by the width"
  (https://elib.dlr.de/109327). A Chinese patent (CN115808128B) pairs
  parallel edge lines and clusters widths. All need imagery we may lawfully
  process in bulk, which for Finglas we don't have. With national vector
  polygons, the profile method below gives the same answer without the
  imagery problem.
- **Standards as a clamp.** DMURS 4.4.1 (research 25): arterial/link lanes
  2.75-3.5 m, preferred 3.0-3.25 m; local streets 5-5.5 m carriageway.

## 4. Pilot: measured Finglas widths

Script (scratchpad only, not in repo): for each OSM highway way, every 4 m
along it, skipping 12 m at each end (junction blobs), cut a 50 m line
perpendicular to the way, intersect it with the union of the Tailte polygons,
keep the piece that contains the OSM centreline point (within 0.5 m), and take
its length. Profiles that run the full 50 m are discarded (plazas, junctions).
Width per way = median of its profiles; "cover" = share of profiles that hit a
polygon. Done in Irish Transverse Mercator (EPSG:2157) with shapely/pyproj.

Whole Finglas box, drivable ways with cover > 0.8: 1,048 of 1,678 ways.
Most of the rest are service roads in car parks and estates with no polygon.

| OSM class | ways | carriageway median | carriageway / lanes: p25 / p50 / p75 |
|---|---|---|---|
| secondary | 118 | 9.41 m | 3.83 / 4.68 / 6.32 m |
| tertiary | 63 | 9.17 m | 3.77 / 4.29 / 5.10 m |
| unclassified | 33 | 9.08 m | 3.87 / 4.55 / 6.26 m |
| residential | 651 | 7.05 m | 3.09 / 3.57 / 4.03 m |
| service | 177 | 5.87 m | 2.21 / 3.17 / 4.74 m |

(lanes = OSM `lanes` where tagged, 80% of these ways; else 2, or 1 if oneway.)

Named streets in the village box (median kerb-to-kerb, interquartile range):
- Finglas Bypass (N2), each carriageway, 2 lanes one way: 7.8-8.0 m,
  IQR within 0.2 m on four ways. About 3.65 m lanes plus edge strips.
- Ballygall Crescent 7.79 m (7.6-8.0), Ballygall Parade 8.01 m, Glenhill
  Road 7.80 m, McKee Road 7.56 m: the 1950s-60s estate distributors.
- Finglas Park 6.25 m, Clancy Avenue 6.46 m, Casement Road 6.48 m,
  Wellmount Parade 6.03 m: smaller estate roads, ~3.0-3.2 m a lane.
- Collins Place 4.65 m, Dunsink Gardens 5.18 m, Sycamore Grove 5.22 m: narrow
  two-way cul-de-sacs, where we now draw 6.4 m.
- Wellmount Road 9.4-9.6 m, Seamus Ennis Road 9.4 m, Ballygall Road West
  (secondary) 9.2 m: wider than two lanes; cycle lanes or hatching.
- Main Street 8.6-9.0 m: includes the parking lay-bys.

Against our 3.2 m (6.4 m two-way): residential streets are close on average
(3.57 m a lane) but range from 2.3 to 4+ m; the bypass is ~1.2 m too narrow
in total; cul-de-sacs are 1-1.7 m too wide.

**The catch.** Dividing kerb-to-kerb by the lane count gives more than 3.65 m
a lane on 568 of 1,048 ways, and more than 5 m on 222. Those carriageways hold
things that aren't running lanes: bus lanes and cycle lanes OSM doesn't count
in `lanes`, hatched centres, parking lay-bys, turn pockets near junctions.
Feeding raw width straight into SUMO would draw 4.7 m lanes on Finglas Road.
The honest model has two numbers per edge: kerb-to-kerb (measured) and
running-lane width (bounded by the standard), with the difference as a
kerbside strip.

## 5. Method for `tools/bake/` (for when we build it)

1. `fetch_ways_te.py <place>`: page the Tailte feature service for the
   place bbox (GeoJSON, `outSR=4326`, 2,000 a page, cached in the place's
   bake dir like the Overture parquet). Only for places in Ireland; others
   skip the step and keep defaults.
2. `measure_widths.py <in.osm> <ways.geojson>`: the profile median above, per
   OSM way. Keep a way's number only if cover >= 0.8 and the IQR is under
   1.5 m; otherwise no tag (the default stands).
3. Write into the OSM file before netconvert, one source of truth for both
   numbers:
   - `width` = n x clamp(kerb_width / n, 2.5, 3.65) where n is the lane count
     netconvert will use (OSM `lanes`, else the typemap's). SUMO divides it
     back into lane width. Skip ways that already carry `width` or
     `width:lanes` in OSM (a mapper measured them).
   - `width:carriageway` = measured kerb-to-kerb. netconvert ignores it; it
     reaches `bake_net.py` through a small per-way table (OSM way id ->
     kerb width), since `--output.original-names` already keeps the OSM id
     on each edge. Store it per edge in `.net.bin`.
4. `roadrender.ts` draws the kerb at kerb-to-kerb width; the strip between
   the outer lane and the kerb is plain asphalt (later: parking bays, cycle
   lane paint from OSM `cycleway=*`, `parking:*`). Physics reads the kerb
   position from `roadrender.ts` as it does heights now.
5. Credit "© Tailte Éireann (CC BY 4.0)" in the place's `attribution` and
   the footer.

Cascade when built: the `.net.bin` lane record already has a width float
(bake_net.py line 284); a kerb width per edge is a format change, so the
loader, tests that load `finglas.net.bin`, and old baked worlds (default:
kerb = sum of lane widths) all need the same change. Traffic lateral
placement and the examiner's lane position checks read lane width; they
need a look once lanes stop being 3.2 m.

Decision for the owner: step 3's split into lane width and a kerbside strip.
The simpler option (raw width into SUMO) is wrong on half the network; I'd
take the split.

Untested: none of this runs in the bake yet; the polygon/kerb match was
checked by eye at two places only; widths at junctions are not measured
(netconvert shapes junctions from lane widths).
