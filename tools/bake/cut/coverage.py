# Per 1 km square across a box: OSM buildings (by first node), buildings with
# a height or levels tag, and metres of drivable road. From the OPL cut.
import json, math, re, sys

src, W, S, E, N, out = sys.argv[1], *map(float, sys.argv[2:6]), sys.argv[6]
NODE = re.compile(r"n-?\d+x(-?[\d.]+)y(-?[\d.]+)")
KM_LAT = 1 / 110.574
KM_LON = 1 / (111.320 * math.cos(math.radians((S + N) / 2)))
cols, rows = math.ceil((E - W) / KM_LON), math.ceil((N - S) / KM_LAT)
bld = [[0] * cols for _ in range(rows)]
tall = [[0] * cols for _ in range(rows)]
road = [[0.0] * cols for _ in range(rows)]
DRIVE = {"motorway", "trunk", "primary", "secondary", "tertiary", "unclassified", "residential", "service", "living_street",
         "motorway_link", "trunk_link", "primary_link", "secondary_link", "tertiary_link", "road"}

def cell(x, y):
    c, r = int((x - W) / KM_LON), int((y - S) / KM_LAT)
    return (r, c) if 0 <= c < cols and 0 <= r < rows else None

for line in open(src):
    if not line.startswith("w"):
        continue
    parts = line.rstrip("\n").split(" ")
    tags = next((p[1:] for p in parts if p.startswith("T")), "")
    nodes = [(float(x), float(y)) for x, y in NODE.findall(next((p[1:] for p in parts if p.startswith("N")), ""))]
    if not nodes:
        continue
    tagmap = dict(t.split("=", 1) for t in tags.split(",") if "=" in t)
    if "building" in tagmap:
        at = cell(*nodes[0])
        if at:
            bld[at[0]][at[1]] += 1
            if "height" in tagmap or "building:levels" in tagmap:
                tall[at[0]][at[1]] += 1
    if tagmap.get("highway") in DRIVE:
        for (x1, y1), (x2, y2) in zip(nodes, nodes[1:]):
            at = cell((x1 + x2) / 2, (y1 + y2) / 2)
            if at:
                road[at[0]][at[1]] += math.hypot((x2 - x1) / KM_LON, (y2 - y1) / KM_LAT) * 1000
json.dump({"box": [W, S, E, N], "cols": cols, "rows": rows, "buildings": bld, "withHeight": tall,
           "roadM": [[round(v) for v in row] for row in road]}, open(out, "w"))
print(cols, rows, sum(map(sum, bld)), sum(map(sum, tall)), round(sum(map(sum, road)) / 1000), "km road")
