# Track 1: World data (log)

Kept by the World data chat (from 2026-10-11 night; before that by the first
orchestrator chat). Newest first.

## 2026-10-11 (night): World data chat, session 1
- Research: every free source written up in `research/40` (index, plain
  words) and `41` to `44` (global sources, 53 usable official city models,
  GitHub city projects, Lagos). Best height source for Lagos: Google Open
  Buildings 2.5D Temporal; no official or licensed 3D model of Lagos exists.
- Network: this session reached only GitHub and the package registries; every
  data host was blocked (list in research/40). Push from here was refused
  (repo not in the session's sources); the branch went to the owner's Mac as
  a git bundle and he pushes it.
- Done: all of Lagos State cut from the Nigeria extract on the owner's Mac
  (2.42 M ways); a cut tool that needs no osmium-tool (`tools/bake/cut/`,
  README); **Yaba baked** from it (1,914 roads, 18,690 OSM buildings, 1,660
  files), drivable at `?place=yaba`; `places/yaba.json` given Omole's height
  table and sources that say what was really baked (OSM only).
- Found: across Lagos (3.10–3.70 E, 6.38–6.72 N) OSM has 1,804,163 buildings
  and 20,420 km of drivable road, but only 5,278 buildings (0.3 %) carry a
  height or levels tag. Heights are the gap.
- Main's `npm run check` is red before any change of ours (stale decision-log
  tests): request in `docs/requests/platform.md`.
- Next: with the data hosts reachable (or `tools/bake/fetch-free-sources.sh`
  run on the owner's Mac), read Overture buildings and Copernicus GLO-30 into
  the bake (designs first), then per-building heights from Google 2.5D, then
  water and land use; then the bring-in of PLATEAU and 3DBAG as the first
  existing city models; then the bake-on-visit baseline into R2.
- Needs from others: Platform, the check fix above. World look will need to
  draw water, land use and terrain once baked.

## 2026-10-11 (evening)
- Handing over to a fresh World data chat (starter in STARTERS.md). This
  chat cannot push or use the newly allowed domains.
- Data reachability: the first chat's network could not reach Copernicus,
  Google storage or Overture (blocked, allowlist read at session start).
- Open Buildings v3 is split by S2 level-4 cells; Omole is in cell `103`
  (`.../v3/polygons_s2_level_4_gzip/103_buildings.csv.gz`, likely very large).
  Overture's buildings (which include Open Buildings) can be read for just
  the Omole box, so prefer Overture.

## 2026-10-11
- Done: Omole cut from the Geofabrik Nigeria extract (osmium); roads baked
  into 862 squares; street names (streets.json); 2,862 OpenStreetMap
  buildings as blocks with a by-type height table (owner-choice, 6 m).
- Found: OpenStreetMap has almost no buildings near Babatunde Ladega Street
  (13 within 500 m of the start).
- Next: Google Open Buildings outlines (ODbL option) to fill the gaps;
  Copernicus GLO-30 terrain (owner downloading the N06 E003 tile); then
  landmarks the owner places (Fasta International School, St. Jude's Church,
  Foursquare Church).
- Needs from others: none yet.
