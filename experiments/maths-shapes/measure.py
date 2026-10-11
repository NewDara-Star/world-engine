"""Scope 003 step 6: measure a fitted shape list against the original car.

- Size: gzip bytes of the shape list against gzip bytes of the original file,
  and against only the original's shape data (its textures excluded), because
  the maths carries no paint (research/31).
- Likeness: silhouettes from 8 fixed angles (every 45 degrees around, 20
  degrees above), overlap = intersection / union of the two silhouettes.
  Reported with the fixed wheels included (the honest whole-car view) and for
  the body alone (what the optimizer actually fitted).
- Mesh fallback: marching cubes (Lorensen and Cline 1987, scikit-image, BSD)
  on the fitted distances, then simplified (fast-simplification, MIT,
  quadric error metrics, Garland and Heckbert 1997).

Silhouettes are drawn by projecting triangles and filling them with Pillow
(HPND licence); orthographic, 400 px, the same frame for both cars.
"""
import json, sys, gzip, struct
import numpy as np
import torch, trimesh
from PIL import Image, ImageDraw
from skimage.measure import marching_cubes
import fast_simplification
sys.path.insert(0, ".")
from fit import Shapes, BLEND

ANGLES = [(yaw, 20) for yaw in range(0, 360, 45)]
PX = 400

def original_parts(path):
    s = trimesh.load(path, force="scene")
    body, wheels = [], []
    for node in s.graph.nodes_geometry:
        T, g = s.graph[node]; m = s.geometry[g].copy(); m.apply_transform(T)
        (wheels if node.startswith("Wheel") else body).append(m)
    return trimesh.util.concatenate(body), trimesh.util.concatenate(wheels)

def wheel_meshes(info):
    out = []
    for w in info["wheels"]:
        c = trimesh.creation.cylinder(radius=w["radius"], height=w["width"], sections=24)
        c.apply_transform(trimesh.transformations.rotation_matrix(np.pi / 2, [0, 1, 0]))
        c.apply_translation(w["centre"]); out.append(c)
    return trimesh.util.concatenate(out)

def fitted_mesh(doc, z, target_tris):
    model = Shapes(doc["rows"])
    origin, pitch, shape = z["origin"], float(z["pitch"]), z["sdf"].shape
    idx = np.indices(shape).reshape(3, -1).T
    pts = torch.tensor(origin + idx * pitch, dtype=torch.float32)
    with torch.no_grad():
        d = torch.cat([model(pts[i:i + 200_000]) for i in range(0, len(pts), 200_000)])
    vol = d.numpy().reshape(shape)
    v, f, _, _ = marching_cubes(vol, 0.0, spacing=(pitch,) * 3)
    v = v + origin
    raw = len(f)
    v2, f2 = fast_simplification.simplify(v.astype(np.float32), f.astype(np.int64), 1 - target_tris / raw)
    mesh = trimesh.Trimesh(v2, f2, process=True)
    with torch.no_grad():
        owner = model.distances(torch.tensor(mesh.vertices, dtype=torch.float32)).argmin(1).numpy()
    cols = (np.array(doc["colours"])[owner] * 255).astype(np.uint8)
    mesh.visual.vertex_colors = np.c_[cols, np.full(len(cols), 255, np.uint8)]
    return mesh, raw

def view_matrix(yaw, elev):
    R = trimesh.transformations.rotation_matrix(np.radians(-yaw), [0, 1, 0])
    E = trimesh.transformations.rotation_matrix(np.radians(elev), [1, 0, 0])
    return (E @ R)[:3, :3]

def silhouette(mesh, yaw, elev, frame):
    p = mesh.vertices @ view_matrix(yaw, elev).T
    (x0, y0), span = frame
    xy = np.c_[(p[:, 0] - x0) / span * PX, PX - (p[:, 1] - y0) / span * PX]
    img = Image.new("1", (PX, PX), 0); dr = ImageDraw.Draw(img)
    for tri in xy[mesh.faces]:
        dr.polygon([tuple(t) for t in tri], fill=1)
    return np.array(img, bool)

def frame_for(mesh, yaw, elev):
    p = mesh.vertices @ view_matrix(yaw, elev).T
    lo, hi = p[:, :2].min(0), p[:, :2].max(0)
    span = float((hi - lo).max()) * 1.1
    return ((lo[0] - (span - (hi[0] - lo[0])) / 2, lo[1] - (span - (hi[1] - lo[1])) / 2), span)

def overlap(a_mesh, b_mesh, save=None):
    scores = []
    for i, (yaw, elev) in enumerate(ANGLES):
        fr = frame_for(a_mesh, yaw, elev)
        a, b = silhouette(a_mesh, yaw, elev, fr), silhouette(b_mesh, yaw, elev, fr)
        scores.append(float((a & b).sum() / (a | b).sum()))
        if save:
            rgb = np.zeros((PX, PX, 3), np.uint8) + 245
            rgb[a & b] = (70, 70, 70); rgb[a & ~b] = (214, 69, 65); rgb[~a & b] = (59, 130, 246)
            Image.fromarray(rgb).save(f"{save}_{yaw:03d}.png")
    return scores

def glb_geometry_bytes(path):
    b = open(path, "rb").read()
    ln = struct.unpack("<I", b[12:16])[0]; j = json.loads(b[20:20 + ln])
    img_views = {im["bufferView"] for im in j.get("images", []) if "bufferView" in im}
    geo = sum(v["byteLength"] for i, v in enumerate(j["bufferViews"]) if i not in img_views)
    return geo, len(gzip.compress(b, 9))

def main(glb, npz, fit_json, target_tris=3000):
    z = np.load(npz); info = json.load(open(npz.replace(".npz", ".json")))
    doc = json.load(open(fit_json))
    body, wheels = original_parts(glb)
    orig = trimesh.util.concatenate([body, wheels])
    fbody, raw = fitted_mesh(doc, z, target_tris)
    fwhole = trimesh.util.concatenate([fbody, wheel_meshes(info)])
    tag = fit_json.replace(".json", "")
    whole = overlap(orig, fwhole, save=f"sil_{tag}")
    body_only = overlap(body, fbody)
    shape_list = json.dumps({k: doc[k] for k in ("rows", "colours", "blend")} | {"wheels": info["wheels"]}, separators=(",", ":"))
    geo_bytes, glb_gz = glb_geometry_bytes(glb)
    res = {"fit": fit_json, "shapes": doc["shapes"], "loss": doc["loss"],
           "overlap_whole_mean": round(float(np.mean(whole)), 3), "overlap_whole_min": round(float(np.min(whole)), 3),
           "overlap_body_mean": round(float(np.mean(body_only)), 3), "overlap_body_min": round(float(np.min(body_only)), 3),
           "per_angle_whole": [round(s, 3) for s in whole],
           "shape_list_gz_bytes": len(gzip.compress(shape_list.encode(), 9)),
           "original_glb_gz_bytes": glb_gz, "original_geometry_bytes": geo_bytes,
           "mesh_fallback_raw_tris": raw, "mesh_fallback_tris": int(len(fbody.faces))}
    res["smaller_than_file_x"] = round(glb_gz / res["shape_list_gz_bytes"], 1)
    res["smaller_than_geometry_x"] = round(geo_bytes / res["shape_list_gz_bytes"], 1)
    fbody.export(f"{tag}_mesh.glb")
    json.dump(res, open(f"measure_{tag}.json", "w"), indent=1)
    print(json.dumps({k: v for k, v in res.items() if k != "per_angle_whole"}))

if __name__ == "__main__":
    main(*sys.argv[1:4])
