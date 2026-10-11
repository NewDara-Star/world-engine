# From an OPL file with locations on ways (cut_box.py), keep the ways with a
# node inside a smaller box, split into the two inputs the bake takes:
#   <out>-highways.opl: ways tagged highway
#   <out>-buildings.opl: ways tagged building or untagged (relation rings),
#                        plus building multipolygons with a ring kept
# Usage: cut_opl.py in.opl W S E N out_prefix
import re, sys

src, W, S, E, N, out = sys.argv[1], *map(float, sys.argv[2:6]), sys.argv[6]
NODE = re.compile(r"n-?\d+x(-?[\d.]+)y(-?[\d.]+)")

def field(line, letter):
    for part in line.rstrip("\n").split(" "):
        if part.startswith(letter):
            return part[1:]
    return ""

kept = set()
roads = open(out + "-highways.opl", "w")
blds = open(out + "-buildings.opl", "w")
counts = {"roads": 0, "building ways": 0, "rings": 0, "relations": 0}
with open(src) as f:
    for line in f:
        if line.startswith("w"):
            if not any(W <= float(x) <= E and S <= float(y) <= N for x, y in NODE.findall(field(line, "N"))):
                continue
            tags = field(line, "T")
            keys = {t.split("=", 1)[0] for t in tags.split(",") if t}
            if "highway" in keys:
                roads.write(line); counts["roads"] += 1
            if "building" in keys or not keys:
                blds.write(line); kept.add(line.split(" ", 1)[0][1:])
                counts["building ways" if keys else "rings"] += 1
        elif line.startswith("r"):
            tags = field(line, "T")
            if "building=" not in tags or "type=multipolygon" not in tags:
                continue
            members = re.findall(r"w(-?\d+)@", field(line, "M"))
            if any(m in kept for m in members):
                blds.write(line); counts["relations"] += 1
roads.close()
# Second pass: a ring of a kept building relation may carry other tags
# (landuse, area...), so it was not kept above; add every missing ring.
blds.close()
needed = set()
for line in open(out + "-buildings.opl"):
    if line.startswith("r"):
        needed.update(re.findall(r"w(-?\d+)@", field(line, "M")))
needed -= kept
with open(out + "-buildings.opl", "a") as blds, open(src) as f:
    for line in f:
        if line.startswith("w") and line.split(" ", 1)[0][1:] in needed:
            blds.write(line); counts["rings"] += 1
print(counts, "rings asked for by relations:", len(needed))
