"""Scope 003 step 3: distance samples from the hatchback, deterministic.

Reads the car, keeps the four wheels as fixed parts (their size comes from the
model's own named wheel nodes, research/31 "Hard parts"), turns the rest of the
car into a filled voxel grid and a signed distance grid, and records the paint
colour near the surface. Same file in, same grid out: no randomness here.

References:
- glTF 2.0 spec section 3.4: metres, +Y up, front +Z.
- trimesh (MIT) voxelization and fill; scipy (BSD) Euclidean distance transform
  (Maurer et al. 2003) turns the filled grid into distances.
"""
import json, sys
import numpy as np
import trimesh
from scipy import ndimage

PITCH = 0.02  # 2 cm cells: thinner than any panel we want to keep (our choice, recorded)

def load_parts(path):
    scene = trimesh.load(path, force="scene")
    body, wheels = [], []
    for node in scene.graph.nodes_geometry:
        T, geom = scene.graph[node]
        mesh = scene.geometry[geom].copy()
        mesh.apply_transform(T)
        (wheels if node.startswith("Wheel") else body).append((node, mesh))
    return body, wheels

def wheel_record(node, mesh):
    # Wheel axis is X (the car's width); radius from its Y/Z extent, width from X.
    lo, hi = mesh.bounds
    c = (lo + hi) / 2
    return {"name": node, "centre": [round(float(v), 4) for v in c],
            "radius": round(float(max(hi[1] - lo[1], hi[2] - lo[2]) / 2), 4),
            "width": round(float(hi[0] - lo[0]), 4)}

def body_colours(body):
    # Paint at the centre of every face, read from the texture at that face's
    # centre UV (vertex colours sit on texture seams and read the dark trim).
    # Faces are repeated in proportion to their area so big panels count more.
    pts, cols = [], []
    for _, m in body:
        mat = m.visual.material
        img = getattr(mat, "baseColorTexture", None)
        base = np.array(getattr(mat, "baseColorFactor", None) if getattr(mat, "baseColorFactor", None) is not None else [255, 255, 255, 255])[:3] / 255.0
        centres = m.triangles_center
        if img is not None and getattr(m.visual, "uv", None) is not None:
            arr = np.asarray(img.convert("RGB"), np.float32) / 255.0
            uv = m.visual.uv[m.faces].mean(axis=1) % 1.0
            px = (uv[:, 0] * (arr.shape[1] - 1)).astype(int)
            py = (uv[:, 1] * (arr.shape[0] - 1)).astype(int)  # measured: area-weighted paint 0.56 this way, 0.21 (dark trim) flipped
            c = arr[py, px] * base
        else:
            c = np.tile(base, (len(centres), 1))
        reps = np.maximum(1, np.round(m.area_faces / np.median(m.area_faces))).astype(int)
        pts.append(np.repeat(centres, reps, 0)); cols.append(np.repeat(c, reps, 0))
    return np.vstack(pts), np.vstack(cols).astype(np.float32)

def signed_distance_grid(mesh):
    vox = mesh.voxelized(PITCH).fill()
    occ = vox.matrix.astype(bool)
    occ = np.pad(occ, 6)  # room for outside distances on every side
    origin = vox.translation - 6 * PITCH  # centre of cell [0,0,0]
    outside = ndimage.distance_transform_edt(~occ) * PITCH
    inside = ndimage.distance_transform_edt(occ) * PITCH
    sdf = np.where(occ, -(inside - PITCH / 2), outside - PITCH / 2)
    return occ, sdf.astype(np.float32), origin

def main(path, out):
    body, wheels = load_parts(path)
    body_mesh = trimesh.util.concatenate([m for _, m in body])
    occ, sdf, origin = signed_distance_grid(body_mesh)
    pts, cols = body_colours(body)
    wheel_list = [wheel_record(n, m) for n, m in sorted(wheels)]
    np.savez_compressed(out, occ=occ, sdf=sdf, origin=origin, pitch=PITCH,
                        surf_pts=pts.astype(np.float32), surf_cols=cols)
    info = {"grid": list(occ.shape), "pitch": PITCH, "origin": origin.tolist(),
            "filled_m3": round(float(occ.sum() * PITCH ** 3), 3),
            "bbox_m3": round(float(np.prod(body_mesh.extents)), 3),
            "body_triangles": int(len(body_mesh.faces)), "wheels": wheel_list}
    json.dump(info, open(out.replace(".npz", ".json"), "w"), indent=1)
    print(json.dumps(info, indent=1))

if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
