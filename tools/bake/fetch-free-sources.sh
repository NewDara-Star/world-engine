#!/bin/sh
# Downloads the free sources for one box on Earth into raw-data/<name>/, for
# the bake. Works for any place: the box is the only input.
#
#   sh tools/bake/fetch-free-sources.sh <name> W S E N
#   e.g. sh tools/bake/fetch-free-sources.sh lagos 3.10 6.38 3.70 6.72
#
# What it gets (research/40-world-data-sources.md says why each one):
#   1. Copernicus GLO-30 ground-shape tiles under the box (1 degree each).
#      Licence: Copernicus DEM licence, free with the set credit.
#      Host: copernicus-dem-30m.s3.amazonaws.com
#   2. Overture Maps, cut to the box: buildings, building parts, road
#      segments and connectors, places, water, land, land use, land cover,
#      infrastructure. Licence: ODbL (buildings, roads, base), CDLA (places).
#      Host: overturemaps-us-west-2.s3.us-west-2.amazonaws.com, through the
#      overturemaps command (github.com/OvertureMaps/overturemaps-py).
#
# It shows the size of each Copernicus tile before downloading and asks once
# before starting. Overture has no size up front; a box of a big city is tens
# to a few hundred MB. Needs: curl, python3 with pip.
# raw-data/ is not in git (.gitignore).
set -eu

if [ "$#" -ne 5 ]; then
  echo "usage: sh tools/bake/fetch-free-sources.sh <name> W S E N   (degrees, west south east north)"
  exit 1
fi
NAME=$1; W=$2; S=$3; E=$4; N=$5
OUT="raw-data/$NAME"
mkdir -p "$OUT/copernicus" "$OUT/overture"

# Copernicus tile names: the south-west corner of each 1-degree square,
# e.g. Copernicus_DSM_COG_10_N06_00_E003_00_DEM (copernicus-dem-30m readme).
TILES=$(python3 - "$W" "$S" "$E" "$N" <<'PY'
import math, sys
w, s, e, n = map(float, sys.argv[1:])
for lat in range(math.floor(s), math.ceil(n)):
    for lon in range(math.floor(w), math.ceil(e)):
        ns = f"N{lat:02d}" if lat >= 0 else f"S{-lat:02d}"
        ew = f"E{lon:03d}" if lon >= 0 else f"W{-lon:03d}"
        print(f"Copernicus_DSM_COG_10_{ns}_00_{ew}_00_DEM")
PY
)
BASE=https://copernicus-dem-30m.s3.amazonaws.com
TOTAL=0
echo "Ground-shape tiles for $NAME:"
for T in $TILES; do
  SIZE=$(curl -sI "$BASE/$T/$T.tif" | tr -d '\r' | awk 'tolower($1)=="content-length:"{print $2}')
  if [ -z "$SIZE" ]; then echo "  $T: none (sea, or not published)"; continue; fi
  echo "  $T: $((SIZE / 1048576)) MB"
  TOTAL=$((TOTAL + SIZE))
done
echo "Copernicus total: $((TOTAL / 1048576)) MB. Overture: by box, size shown as it downloads."
printf "Download? [y/N] "
read -r ANSWER
[ "$ANSWER" = "y" ] || { echo "Nothing downloaded."; exit 0; }

for T in $TILES; do
  if curl -sfI "$BASE/$T/$T.tif" >/dev/null; then
    curl -f --progress-bar -o "$OUT/copernicus/$T.tif" "$BASE/$T/$T.tif"
  fi
done

python3 -m pip install --user --quiet overturemaps
for TYPE in building building_part segment connector place water land land_use land_cover infrastructure; do
  echo "Overture $TYPE..."
  python3 -m overturemaps.cli download --bbox="$W,$S,$E,$N" -f geoparquet --type="$TYPE" -o "$OUT/overture/$TYPE.parquet"
  ls -lh "$OUT/overture/$TYPE.parquet" | awk '{print "  " $5}'
done
echo "Done. Everything is in $OUT/."
