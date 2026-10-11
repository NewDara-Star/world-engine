# 40. Every free source for rebuilding the world (index)

Track 1, World data. Researched 2026-10-11 by four research agents (web
search and the sources' own licence pages), checked and summarised here by
the World data orchestrator. The full tables, with a licence link for every
claim, are in:

- `41-global-sources.md`: roads, buildings and heights, terrain, sea depth,
  water, land cover, trees, names, imagery, for the whole world.
- `42-official-city-models.md`: 3D city and country models published by
  governments and universities (53 usable, 34 not).
- `43-github-city-projects.md`: open projects that recreate cities, and the
  tools that turn map data into 3D, with their licences.
- `44-lagos-sources.md`: everything that covers Lagos, and the bake order.

Anything marked "(unverified)" in those files was not confirmed on the
source's own page; check it before shipping.

## The short version

The world comes in three layers, the same everywhere; only how much of each
exists changes from place to place.

1. **The skeleton** (everywhere): streets, paths, rail, water outlines, land
   use and names from OpenStreetMap, plus Overture's merged roads.
2. **The bodies** (everywhere, patchy): building outlines from OpenStreetMap,
   Overture (which already merges OSM, Esri, Microsoft and Google), with
   heights from the best source the place has; the shape of the ground from
   Copernicus GLO-30.
3. **The finished pieces** (some places): cities that are already modelled
   in 3D (Japan, Germany, the Netherlands, Switzerland, Helsinki, Lyon,
   Hong Kong and about 45 more), brought in as they are.

Like a football squad: OSM is the academy that every club has; Overture and
Google are the transfers that fill the gaps; the official city models are
the signed stars, but only some clubs have them.

## Best pick per layer

| Layer | Best free source | Licence | Fallbacks |
|---|---|---|---|
| Streets, paths, rail | OpenStreetMap (Geofabrik extracts) | ODbL | Overture transportation (ODbL) |
| Building outlines | Overture buildings | ODbL | OSM; Google Open Buildings v3 (ODbL option); Microsoft (CDLA-Permissive 2.0) |
| Building heights | OSM tags where mapped; EUBUCCO in Europe (ODbL); Google Open Buildings 2.5D Temporal in Africa, Asia, Latin America (CC BY 4.0 or ODbL, about 4 m detail) | as named | Microsoft per-building heights; WSF3D (90 m, CC BY); GHSL built height (100 m, CC BY); then the place file's height-by-type table |
| Ground shape | Copernicus GLO-30 (30 m, free licence with a set credit) | Copernicus DEM licence | Mapterhorn tiles (GLO-30 plus national lidar, up to 0.25 m in parts of Europe and Japan); NASADEM (public domain) |
| Sea depth | GEBCO 2026 (450 m, public domain) | public domain | EMODnet in Europe (115 m, CC BY) |
| Coastline and water | OSM land and water polygons | ODbL | JRC Global Surface Water; HydroLAKES (CC BY) |
| Land cover (fields, forest, sand) | ESA WorldCover 10 m | CC BY 4.0 | OSM land use |
| Trees | Meta/WRI canopy height 1 m | CC BY 4.0 | OSM trees and woods |
| Names and places | OSM, Overture places and divisions | ODbL / CDLA | GeoNames (CC BY) |
| Finished 3D cities | Japan PLATEAU (306 towns), all 16 German states (LoD2), 3DBAG (Netherlands), swissBUILDINGS3D, Lyon and Strasbourg meshes, Hong Kong, Helsinki, Estonia, Brussels | CC BY, CC0, open-government | see 42 |

**Not usable** (non-commercial, no-derivatives or forbidden): Google
Photorealistic 3D Tiles and anything built from them; GlobalBuildingAtlas
heights and LoD1 models (CC BY-NC; only its height-less ODbL outlines are
usable); FABDEM and FathomDEM (CC BY-NC-SA); Ecopia/Maxar Digitize Africa;
the Maxar Lagos mosaic on OpenAerialMap (CC BY-NC); Dublin Docklands model
(CC BY-NC); Wallonia (no modifications); EOX Sentinel-2 cloudless after 2016;
Dynamic World (Earth Engine only, free only non-commercially); every
unlicensed GitHub city, including all the Lagos ones found.

## Lagos: first and best

What Lagos has (44 has the detail):

- **Streets**: OSM, good on main roads, patchy names on small streets. The
  Nigeria extract (Geofabrik, 9 Oct 2026, 710 MB) is already on the owner's
  Mac in `raw-data/`.
- **Buildings**: OSM is partial (almost none near Babatunde Ladega Street);
  Overture fills it from Google and Microsoft. Lagos had the largest building
  mapping gain of any big city in 2023 to 2024 (HeiGIT).
- **Heights**: no official source. The best is Google Open Buildings 2.5D
  Temporal (2023 layer), sampled under each outline. Its accuracy figure was
  measured only in Europe and North America, so Lagos accuracy is unknown;
  tall towers are likely low (it stops at 100 m).
- **Ground**: Copernicus GLO-30 tile `N06 E003` covers Omole, Yaba and the
  lagoon. It is a surface model (it includes roofs and trees), so the bake
  must take the ground from the low points.
- **Water**: lagoon and creek outlines from OSM; sea depth from GEBCO. No
  open lagoon depth data exists.
- **3D models**: none official, none usable on GitHub.
- **Not open**: Lagos State's own lidar and aerial survey (done, not public);
  danfo route data (a 2022 survey was never released).

Bake order for every building: OSM outline, else Overture, else Google v3 at
its 90 % precision cut-off; height from OSM tags, else Overture, else Google
2.5D, else Microsoft, else WSF3D, else GHSL, else the place file's table.
Each building records which source won, so the About page and later
corrections know where it came from.

## Everywhere else: the baseline, baked on visit

The same bake, run for a 1 km square when the first player drives near it,
from Overture (fetched by box, so only that square is downloaded), the
Copernicus tile under it and the OSM water. The result is stored in our own
Cloudflare R2 bucket and served from there, so each square is baked once.
Nothing is downloaded for the whole world up front.

Real sizes (whole-dataset figures are from the sources' own pages or the
reports cited in 41; per-area figures are estimates until the downloads are
reachable):

| What | Whole world | One area |
|---|---|---|
| OSM planet | about 88.5 GB | Nigeria 710 MB (on disk) |
| Overture buildings | about 213 to 363 GB | read by box; Lagos box estimated tens of MB |
| Overture roads | about 59 GB | read by box |
| Google Open Buildings v3 | 178 GB | per S2 cell, up to 7.8 GB (Lagos is cell `103`); not needed if Overture is used |
| Copernicus GLO-30 | about 26,000 one-degree tiles | one tile, estimated 20 to 50 MB |
| Meta canopy height | 23.8 TB | per tile |
| GlobalBuildingAtlas ODbL outlines | 462 GB | not needed (no heights) |

Nothing over 1 GB will be downloaded without the owner's yes.

## What this session could not reach (2026-10-11)

The session's network allowlist let through only GitHub and the package
registries. Blocked: copernicus-dem-30m.s3.amazonaws.com,
overturemaps-us-west-2.s3.amazonaws.com, overturemaps.blob.core.windows.net,
storage.googleapis.com, minedbuildings.z5.web.core.windows.net,
download.geofabrik.de, planet.openstreetmap.org, osmdata.openstreetmap.de,
esa-worldcover.s3.eu-central-1.amazonaws.com, zenodo.org, huggingface.co,
data.source.coop, naturalearthdata.com, 3dbag.nl, 3d.bk.tudelft.nl,
mlit.go.jp, data.cityofnewyork.us, geodata.gov.hk. The full list of hosts a
downloader needs is at the end of 41 and 42.

Never fetched because their robots.txt says no (the owner can open them):
Nominatim, Overpass, planet.openstreetmap.org, OSM changeset pages, the HOT
Tasking Manager, the South Korea and Taiwan 3D portals.

## Still unknown

- How complete Overture's buildings are inside the Omole and Yaba boxes.
- Google 2.5D accuracy in Lagos, and its tile names and sizes for the box.
- 3D-GloBFP's licence (Zenodo refused the page).
- Six German state licences were read from a secondary source (42 marks
  them); check them on the state portals before shipping.
- Open coordinates for Fasta International School, St Jude's Church and the
  Foursquare church in Omole: none found on the web; to be looked up in the
  OSM and Overture data, then placed by the owner if missing.
