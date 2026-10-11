# 45. Valdrada: a whole city first, then chosen areas in detail

Source: github.com/mkturkcan/valdrada (read 2026-10-11, shallow clone of the
default branch). Owner's pointer: "a better way to tackle this is focusing on
Lagos and building out from there, one area at a time."

## What it is

A digital twin of New York City (Manhattan, the Bronx, Brooklyn, Queens) in
the browser (three.js, WebGL2), with lane-level traffic and pedestrians.
Built by one author, Mehmet Kerem Turkcan, 2026.

## Licences (LICENSING.md)

- Code: MIT. Docs and figures: CC BY 4.0. Compiled city: ODbL 1.0 (it holds
  OSM data). We take **techniques only** (owner's rule), so no credit is owed.
- Not for us even as assets: its vehicle bodies are CARLA models in real NYC
  liveries (NYPD, USPS, MTA: real brands, against our rule); its
  photoreal pedestrians fall under Epic's MetaHuman terms.

## How it is built, and what we take

1. **Compile once, from records, into tiles.** A Node compiler reads the
   city's open records and writes binary tiles: 2,884 near tiles of 512 m
   and 210 far tiles of 2,048 m (BUILDING.md). The client streams near tiles
   round the camera at full detail and far tiles beyond.
   *Take:* the two-ring idea. Our 100 m squares are the near ring; a coarse
   far ring (outlines and heights only, 1 to 2 km squares) would show the
   skyline and the lagoon instead of empty fog. For World look and Platform
   (it touches drawing and download size); noted in PARKING_LOT.
2. **Every element traces to a record.** Footprints joined to tax lots
   (floors, use, year) and facade filings (wall material); street
   centrelines carry width, lanes, direction, speed limit, grade.
   *Lagos difference:* Lagos publishes none of these openly (research/44).
   Our records are OSM, Overture, Google heights, and what the owner knows.
   The rule stays the same: every building says which source each fact came
   from.
3. **The city everywhere, plus "areas modelled in detail".** A plain but
   complete city, then chosen corridors (125th Street end to end, Central
   Park, Times Square) authored by hand on top: facades, shop signs, street
   furniture, landmarks with their own models.
   *Take:* this is the owner's area-by-area plan. Lagos-wide baseline from
   the free data first (one bake), then one area at a time gets the detail
   pass and is announced.
4. **Facades from a few typologies, not one model per building.** A small
   split grammar (CGA-style) dresses each footprint by its typology
   (docs/techniques.md sections 1.1 to 1.5); windows by instancing and
   interior mapping; brick and grime textures drawn procedurally.
   *Take (World look and Assets):* a handful of Lagos typologies (bungalow
   with fence and gate, two-storey "duplex", block of flats, shop row with
   awnings, church, school, filling station), picked per building from its
   OSM type, size and height.
5. **Street furniture placed from records, the rest generated along kerbs.**
   *Take:* place what OSM has (bus stops, traffic signals, filling stations,
   street lamps where mapped) and generate kerbside life (kiosks, gutters,
   gates, palm and almond trees) by rule along each road.
6. **Performance notes** (docs/techniques.md sections 0, 3, 6): the cost is
   draw calls and JavaScript, not triangles; merge static geometry per
   block, BatchedMesh, impostors for far buildings. For World look.

## What it means for World data

Our bake already does step 1 for any place (Omole, and now Yaba, from the
same code). The order for Lagos becomes:

1. Lagos-wide baseline: every street and building in the Lagos box, from
   OSM now, Overture and Google heights once the hosts are reachable,
   Copernicus ground.
2. One area at a time, in the owner's order: everything every source has
   for that area, the facts each building needs for its typology (type,
   size, height, storeys), the kerbside objects OSM records, and the
   owner's own landmarks; then World look and Assets dress it, and the game
   announces it.
