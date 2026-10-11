# Cut every way touching a lon/lat box (and every multipolygon relation with a
# member way in it) from an OSM PBF, as OPL with node positions on each way:
# the same format as `osmium add-locations-to-ways -f
# opl,add_metadata=false,locations_on_ways=true` (README, bake section).
# pyosmium (BSD-2-Clause). Usage: cut_box.py in.pbf W S E N out.opl
import sys, osmium
pbf, W, S, E, N, out = sys.argv[1], *map(float, sys.argv[2:6]), sys.argv[6]
w = osmium.SimpleWriter(osmium.io.File(out, "opl,add_metadata=false,locations_on_ways=true"))
kept = set(); nw = nr = 0
for o in osmium.FileProcessor(pbf).with_locations():
    if o.is_way():
        for n in o.nodes:
            if n.location.valid() and W <= n.lon <= E and S <= n.lat <= N:
                w.add_way(o); kept.add(o.id); nw += 1; break
    elif o.is_relation():
        if o.tags.get("type") == "multipolygon" and any(m.type == "w" and m.ref in kept for m in o.members):
            w.add_relation(o); nr += 1
w.close()
print("ways", nw, "relations", nr)
