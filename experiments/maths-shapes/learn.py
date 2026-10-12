"""Learner: read a shape's distance grid and say, in one glance, which boxes build it.

The Corridor Crew way (owner, 2026-10-11): a factory makes endless made-up cars
out of boxes whose exact recipe we know, so every training example comes with
its perfect answer; a small network learns to read the recipe off the shape.
Afterwards the real car goes in, and the answer can be polished with the
search from fit.py.

Frame: lengths are divided by the object's half-length, so a car runs from
z = -1 (back) to z = +1 (front), sits on y = 0, and is mirrored about x = 0
(only x >= 0 is stored). Grid cells are 1/32 of the half-length (6 cm on a
4 m car): 64 along z, 24 up, 16 across.

References:
- Training on generated shapes with known recipes: CSGNet, Sharma et al. 2018
  (arXiv 1712.08290), and the synthetic-to-real gap reported by PLAD
  (arXiv 2011.13045) and SuperFit (arXiv 2512.09201, Table 1); techniques only.
- Matching predicted slots to true boxes before comparing: the Hungarian
  method (Kuhn 1955), as used by DETR (Carion et al. 2020); scipy's
  linear_sum_assignment (BSD).
- Coordinate channels so a convolution knows where it is: CoordConv,
  Liu et al. 2018 (arXiv 1807.03247).
- Box distance and soft union: the same maths as fit.py (research/31).
"""
import json, math, sys, time
import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F
from scipy.optimize import linear_sum_assignment

K = 8                      # boxes the learner may use (8 matched the best search result)
NZ, NY, NX = 64, 24, 16    # grid cells along z, y, x
CELL = 1 / 32
BLEND = 0.005              # 1 cm on a 4 m car, as in fit.py
TRUNC = 0.06               # distances beyond 6% of the half-length are just "far"

def grid_points():
    z = -1 + CELL * (np.arange(NZ) + 0.5)
    y = CELL * (np.arange(NY) + 0.5)
    x = CELL * (np.arange(NX) + 0.5)
    Z, Y, X = np.meshgrid(z, y, x, indexing="ij")
    return torch.tensor(np.stack([X, Y, Z], -1).reshape(-1, 3), dtype=torch.float32)

GRID = grid_points()       # (NZ*NY*NX, 3) as x, y, z

def box_distances(p, prm):
    """Distance from points p (B,P,3) to each box (B,K,7: cy cz hx hy hz radius pitch)."""
    cy, cz = prm[..., 0:1].transpose(1, 2), prm[..., 1:2].transpose(1, 2)
    half = prm[..., 2:5]
    rnd = prm[..., 5].unsqueeze(1)
    c, s = torch.cos(prm[..., 6]).unsqueeze(1), torch.sin(prm[..., 6]).unsqueeze(1)
    x = p[..., 0:1].abs()
    y, z = p[..., 1:2] - cy, p[..., 2:3] - cz
    yl, zl = c * y + s * z, -s * y + c * z
    q = torch.stack([x.expand_as(yl), yl.abs(), zl.abs()], -1) - half.unsqueeze(1) + rnd.unsqueeze(-1)
    return q.clamp(min=0).norm(dim=-1) + q.max(-1).values.clamp(max=0) - rnd   # (B,P,K)

def union(d, alive):
    """Soft union of the boxes that exist; a missing box is pushed far away."""
    d = d + (1 - alive.unsqueeze(1)) * 1.0
    return -BLEND * torch.logsumexp(-d / BLEND, dim=-1)

# ---------------------------------------------------------------- the factory
def u(rng, a, b):
    return float(rng.uniform(a, b))

def random_car(rng):
    """One made-up car as a list of boxes (cy, cz, hx, hy, hz, corner fraction, pitch).
    Proportions in half-lengths, spanning small hatchbacks to vans: a 4 m car is
    about 1.75 m wide (0.44) and 1.45 m tall (0.72) with 0.15 m ground clearance
    (0.07) (class sizes as in vehicles/hatchback.json and research/42; the ranges
    around them are our choice, recorded here). Up to two random extra boxes so
    the learner does not only see neat cars."""
    boxes = []
    hx = u(rng, 0.38, 0.47); clear = u(rng, 0.05, 0.12); hy = u(rng, 0.12, 0.22)
    cy = clear + hy; top = cy + hy
    boxes.append([cy, u(rng, -0.04, 0.04), hx, hy, u(rng, 0.88, 1.0), u(rng, 0.15, 0.95), u(rng, -0.03, 0.03)])
    roof = u(rng, top + 0.12, min(top + 0.4, 0.74)); chy = (roof - top) / 2 + 0.02
    boxes.append([roof - chy, u(rng, -0.45, 0.15), u(rng, 0.3, hx - 0.02), chy,
                  u(rng, 0.3, 0.7), u(rng, 0.2, 0.95), u(rng, -0.06, 0.06)])
    cab_front = boxes[1][1] + boxes[1][4]; cab_back = boxes[1][1] - boxes[1][4]
    extras = [
        (0.8, lambda: [top + u(rng, -0.04, 0.02), u(rng, 0.45, 0.75), u(rng, 0.3, hx), u(rng, 0.05, 0.1), u(rng, 0.2, 0.4), u(rng, 0.2, 0.9), u(rng, 0.0, 0.3)]),
        (0.7, lambda: [top + u(rng, 0.04, 0.12), cab_front + u(rng, -0.05, 0.1), u(rng, 0.28, hx - 0.03), u(rng, 0.06, 0.12), u(rng, 0.1, 0.22), u(rng, 0.2, 0.9), u(rng, 0.3, 0.7)]),
        (0.7, lambda: [top + u(rng, 0.0, 0.12), min(cab_back, -0.6) - u(rng, 0.0, 0.15), u(rng, 0.3, hx - 0.02), u(rng, 0.08, 0.18), u(rng, 0.08, 0.2), u(rng, 0.2, 0.9), -u(rng, 0.05, 0.5)]),
        (0.6, lambda: [cy - hy * u(rng, 0.2, 0.6), u(rng, 0.9, 0.97), u(rng, 0.32, hx), u(rng, 0.05, 0.1), u(rng, 0.04, 0.08), u(rng, 0.2, 0.9), u(rng, -0.1, 0.2)]),
        (0.6, lambda: [cy - hy * u(rng, 0.2, 0.6), -u(rng, 0.9, 0.97), u(rng, 0.32, hx), u(rng, 0.05, 0.1), u(rng, 0.04, 0.08), u(rng, 0.2, 0.9), u(rng, -0.2, 0.1)]),
    ]
    for p, make in extras:
        if rng.random() < p:
            boxes.append(make())
    for _ in range(rng.integers(0, 3)):
        if len(boxes) < K:
            boxes.append([u(rng, 0.1, 0.6), u(rng, -0.9, 0.9), u(rng, 0.1, 0.45), u(rng, 0.05, 0.15),
                          u(rng, 0.08, 0.4), u(rng, 0.1, 0.9), u(rng, -0.5, 0.5)])
    return boxes[:K]

def to_params(boxes):
    """Corner fraction -> corner radius (at most half the thinnest side)."""
    b = torch.tensor(boxes, dtype=torch.float32)
    b[:, 5] = b[:, 5] * 0.5 * b[:, 2:5].min(1).values
    return b

def batch_from_factory(rng, n):
    """n made-up cars: their input grids and their exact recipes."""
    prm = torch.zeros(n, K, 7); alive = torch.zeros(n, K)
    for i in range(n):
        b = to_params(random_car(rng))
        prm[i, :len(b)] = b; alive[i, :len(b)] = 1
    prm[alive == 0] = torch.tensor([0.3, 0.0, 0.1, 0.1, 0.1, 0.01, 0.0])
    with torch.no_grad():
        d = union(box_distances(GRID.expand(n, -1, -1), prm), alive)
    return grids(d), prm, alive

def grids(d):
    return (d.clamp(-TRUNC, TRUNC) / TRUNC).view(-1, 1, NZ, NY, NX)

# ---------------------------------------------------------------- the learner
class Learner(nn.Module):
    def __init__(self):
        super().__init__()
        def block(i, o, s):
            return nn.Sequential(nn.Conv3d(i, o, 3, s, 1), nn.GroupNorm(8, o), nn.SiLU())
        self.net = nn.Sequential(block(4, 32, 1), block(32, 48, 2), block(48, 64, 2), block(64, 96, 2), block(96, 128, 2))
        self.head = nn.Sequential(nn.Flatten(), nn.Linear(128 * 4 * 2 * 1, 512), nn.SiLU(), nn.Linear(512, K * 8))
        zz, yy, xx = torch.meshgrid(torch.linspace(-1, 1, NZ), torch.linspace(-1, 1, NY), torch.linspace(-1, 1, NX), indexing="ij")
        self.register_buffer("coords", torch.stack([zz, yy, xx])[None])

    def forward(self, g):
        h = self.net(torch.cat([g, self.coords.expand(len(g), -1, -1, -1, -1)], 1))
        o = self.head(h).view(-1, K, 8)
        sg = torch.sigmoid
        half = torch.stack([0.02 + 0.48 * sg(o[..., 2]), 0.02 + 0.3 * sg(o[..., 3]), 0.02 + 1.0 * sg(o[..., 4])], -1)
        prm = torch.cat([(0.75 * sg(o[..., 0]))[..., None], torch.tanh(o[..., 1])[..., None], half,
                         (sg(o[..., 5]) * 0.5 * half.min(-1).values)[..., None], torch.tanh(o[..., 6])[..., None]], -1)
        return prm, o[..., 7]                      # recipe, "this box exists" score

# ---------------------------------------------------------------- training
def match(prm, alive_logit, true_prm, true_alive):
    """Pair each true box with the predicted slot that fits it best (Hungarian)."""
    pairs = []
    with torch.no_grad():
        for b in range(len(prm)):
            n = int(true_alive[b].sum())
            cost = torch.cdist(prm[b, :, :7], true_prm[b, :n, :7], p=1).numpy()
            r, c = linear_sum_assignment(cost)
            pairs.append((r, c))
    return pairs

def losses(model, g, true_prm, true_alive, n_pts=3000, rng=None):
    prm, logit = model(g)
    pairs = match(prm, logit, true_prm, true_alive)
    p_loss, e_target = 0.0, torch.zeros_like(logit)
    for b, (r, c) in enumerate(pairs):
        p_loss = p_loss + F.l1_loss(prm[b, r], true_prm[b, c], reduction="sum") / max(len(r), 1)
        e_target[b, r] = 1
    p_loss = p_loss / len(pairs)
    e_loss = F.binary_cross_entropy_with_logits(logit, e_target)
    # shape loss: the predicted union must match the true union at sample points
    idx = torch.randint(0, len(GRID), (n_pts,))
    pts = (GRID[idx] + (torch.rand(n_pts, 3) - 0.5) * CELL).expand(len(g), -1, -1)
    with torch.no_grad():
        gt = union(box_distances(pts, true_prm), true_alive)
    pred = union(box_distances(pts, prm), torch.sigmoid(logit))
    outside = gt > 0
    s_err = torch.where(outside, (pred - gt.clamp(max=TRUNC)).abs() * ~((gt > TRUNC) & (pred > TRUNC)),
                        torch.relu(pred + gt.abs().clamp(max=CELL / 2)))
    s_loss = (s_err * (1 + 4 * (gt.abs() < 2 * CELL))).mean()
    return p_loss + e_loss + 20 * s_loss, (float(p_loss.detach()), float(e_loss.detach()), float(s_loss.detach()))

def voxel_iou(prm, alive, target_grid):
    with torch.no_grad():
        d = union(box_distances(GRID.expand(len(prm), -1, -1), prm), alive)
        a, b = d.view(len(prm), -1) < 0, target_grid.view(len(prm), -1) < 0
        return ((a & b).sum(1).float() / (a | b).sum(1).clamp(min=1).float())

def real_grid(npz_path):
    """The real car in the learner's frame, and the scale to go back to metres."""
    z = np.load(npz_path); info = json.load(open(npz_path.replace(".npz", ".json")))
    sdf, origin, pitch = z["sdf"], z["origin"], float(z["pitch"])
    occ = z["occ"]; idx = np.argwhere(occ)
    lo = origin + idx.min(0) * pitch; hi = origin + idx.max(0) * pitch
    s = (hi[2] - lo[2]) / 2; zc = (hi[2] + lo[2]) / 2
    world = GRID.numpy() * s + np.array([0, 0, zc])
    cell = np.clip(np.round((world - origin) / pitch).astype(int), 0, np.array(sdf.shape) - 1)
    d = sdf[cell[:, 0], cell[:, 1], cell[:, 2]] / s
    return grids(torch.tensor(d, dtype=torch.float32)[None]), float(s), float(zc)

def to_metres(prm, alive, s, zc):
    rows = []
    for p, a in zip(prm.tolist(), alive.tolist()):
        if a > 0.5:
            rows.append([p[0] * s, p[1] * s + zc, p[2] * s, p[3] * s, p[4] * s, p[5] * s, p[6]])
    return rows

def train(npz, out_dir, hours, seed=1):
    torch.manual_seed(seed); torch.set_num_threads(2)
    rng = np.random.default_rng(seed)
    model = Learner(); opt = torch.optim.AdamW(model.parameters(), lr=1e-3, weight_decay=1e-4)
    val = batch_from_factory(np.random.default_rng(999), 64)
    real, s, zc = real_grid(npz)
    log = open(f"{out_dir}/train_log.jsonl", "a")
    t0, step = time.time(), 0
    while time.time() - t0 < hours * 3600:
        g, p, a = batch_from_factory(rng, 24)
        loss, parts = losses(model, g, p, a)
        opt.zero_grad(); loss.backward(); nn.utils.clip_grad_norm_(model.parameters(), 1.0); opt.step()
        step += 1
        if step % 100 == 0:
            model.eval()
            with torch.no_grad():
                vp, vl = model(val[0]); rp, rl = model(real)
            v_iou = float(voxel_iou(vp, (vl > 0).float(), val[0]).mean())
            r_iou = float(voxel_iou(rp, (rl > 0).float(), real).mean())
            model.train()
            rec = {"step": step, "minutes": round((time.time() - t0) / 60, 1), "loss": round(float(loss), 4),
                   "parts": [round(x, 4) for x in parts], "made_up_iou": round(v_iou, 3), "real_car_iou": round(r_iou, 3)}
            log.write(json.dumps(rec) + "\n"); log.flush()
            if step % 500 == 0:
                torch.save({"model": model.state_dict(), "step": step}, f"{out_dir}/learner.pt")
                json.dump({"step": step, "rows": to_metres(rp[0], (rl[0] > 0).float(), s, zc)},
                          open(f"{out_dir}/real_guess.json", "w"))
    torch.save({"model": model.state_dict(), "step": step}, f"{out_dir}/learner.pt")

if __name__ == "__main__":
    train(sys.argv[1], sys.argv[2], float(sys.argv[3]))
