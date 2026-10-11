# Track 1: World data (log)

Kept by the first orchestrator chat. Newest first.

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
