"""Judge the learner on the real car, three ways, with the same measure as Scope 003.

1. Glance: the learner's answer alone (one pass, no search).
2. Glance + polish: that answer used as the starting layout for fit.py's
   search, for a short fixed number of steps.
3. Search alone: fit.py from Claude's hand layout (run B), the Scope 003 result,
   for the same number of steps, so the comparison is fair.
4. Search alone from one plain box (run A): no human help and no learner.

Reports silhouette overlap (measure.py) and wall-clock time for each.
"""
import json, sys, time
import numpy as np
import torch
sys.path.insert(0, ".")
import fit, learn, measure

GLB, NPZ, CAR = "car_traffic_1.glb", "hatch.npz", "hatch"

def save(rows, z, tag, loss=0.0):
    doc = {"run": tag, "shapes": len(rows), "loss": loss, "blend": fit.BLEND,
           "rows": rows, "colours": fit.colour_per_shape(rows, z)}
    path = f"fit_{CAR}_{tag}.json"; json.dump(doc, open(path, "w")); return path

def score(path):
    measure.main(GLB, NPZ, path)
    return json.load(open("measure_" + path.replace(".json", "") + ".json"))

def polish(rows, pts, gt, steps):
    t = time.time()
    m = fit.Shapes(rows); loss = fit.optimise(m, pts, gt, steps)
    return fit.export_rows(m), loss, time.time() - t

def main(ckpt, steps=300):
    z = np.load(NPZ); pts, gt, _ = fit.load(NPZ, 7)
    model = learn.Learner(); model.load_state_dict(torch.load(ckpt)["model"]); model.eval()
    real, s, zc = learn.real_grid(NPZ)
    t = time.time()
    with torch.no_grad():
        prm, logit = model(real)
    glance_s = time.time() - t
    rows = learn.to_metres(prm[0], (logit[0] > 0).float(), s, zc)
    out = {"glance": {"seconds": round(glance_s, 3), "boxes": len(rows), **pick(score(save(rows, z, "L_glance")))}}
    pr, loss, secs = polish(rows, pts, gt, steps)
    out["glance_polish"] = {"seconds": round(glance_s + secs, 1), "steps": steps, **pick(score(save(pr, z, "L_polish", loss)))}
    hand = json.load(open("layout_b.json"))["rows"]
    hr, loss, secs = polish(hand, pts, gt, steps)
    out["search_from_hand_layout"] = {"seconds": round(secs, 1), "steps": steps, **pick(score(save(hr, z, "L_search", loss)))}
    plain = json.load(open("layout_a.json"))["rows"]
    ar, loss, secs = polish(plain, pts, gt, steps)
    out["search_from_one_box"] = {"seconds": round(secs, 1), "steps": steps, **pick(score(save(ar, z, "L_plain", loss)))}
    json.dump(out, open(f"judge_{CAR}.json", "w"), indent=1)
    print(json.dumps(out, indent=1))

def pick(m):
    return {k: m[k] for k in ("overlap_whole_mean", "overlap_whole_min", "overlap_body_mean", "shape_list_gz_bytes")}

if __name__ == "__main__":
    # judge.py CHECKPOINT [GLB NPZ NAME] [STEPS]
    if len(sys.argv) >= 5:
        GLB, NPZ, CAR = sys.argv[2], sys.argv[3], sys.argv[4]
    main(sys.argv[1], int(sys.argv[5]) if len(sys.argv) > 5 else 300)
