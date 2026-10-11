"""Scope 003 step 4: fit a short list of maths shapes to the car's distances.

Shapes: rounded boxes, mirrored across the car's centre line (cars are
left-right symmetric, so every shape is centred on x = 0), each allowed to tip
forward or back (pitch) so it can follow a windscreen or a sloping bonnet.
They are joined with a smooth minimum, so where two shapes meet the surface
blends instead of creasing.

The fitter grows the list the way research/31 recommends: optimise, then add
one new shape where the car is most under-covered, then optimise all again.
Run A starts from one plain box; run B starts from a layout proposed before the
run and saved as data (layout_b.json).

References:
- Rounded box distance: the standard box distance with a corner radius
  subtracted (same form as the box primitive in GeoLIPI, MIT,
  github.com/BardOfCodes/geolipi); derived here, not copied.
- Smooth minimum as a scaled log-sum-exp (a standard soft minimum; the
  smooth-union idea is surveyed in research/31).
- Add-where-worst-then-refine: the residual fitting idea in SuperFit/ResFit,
  arXiv 2512.09201 (technique only; its code is non-commercial).
- Adam optimiser: Kingma and Ba 2015, as implemented in PyTorch (BSD).
"""
import json, sys, hashlib
import numpy as np
import torch

torch.use_deterministic_algorithms(True)
torch.set_num_threads(1)
BLEND = 0.01      # smooth-min width in metres. Log-sum-exp sits up to BLEND*ln(n) below the nearest shape, so it must stay small: 0.03 swelled the car by up to 10 cm (first run, 2026-10-11)
CLAMP = 0.10      # distances further than 10 cm from the surface count as "far"
N_SAMPLES = 60_000

def load(npz_path, seed):
    z = np.load(npz_path)
    sdf, origin, pitch = z["sdf"], z["origin"], float(z["pitch"])
    idx = np.indices(sdf.shape).reshape(3, -1).T
    pts = origin + idx * pitch
    d = sdf.reshape(-1)
    # Keep every cell near the surface and a fixed random share of the rest.
    rng = np.random.default_rng(seed)
    near = np.abs(d) < 0.08
    far_idx = np.flatnonzero(~near)
    far_pick = rng.choice(far_idx, size=min(len(far_idx), N_SAMPLES // 3), replace=False)
    near_idx = np.flatnonzero(near)
    near_pick = rng.choice(near_idx, size=min(len(near_idx), N_SAMPLES - len(far_pick)), replace=False)
    pick = np.sort(np.concatenate([near_pick, far_pick]))
    return (torch.tensor(pts[pick], dtype=torch.float32),
            torch.tensor(d[pick], dtype=torch.float32), z)

class Shapes(torch.nn.Module):
    """Each shape: centre (y, z), half-size (x, y, z), corner radius, pitch angle."""
    def __init__(self, rows):
        super().__init__()
        r = torch.tensor(rows, dtype=torch.float32)
        self.cyz = torch.nn.Parameter(r[:, 0:2])
        self.log_half = torch.nn.Parameter(torch.log(r[:, 2:5].clamp(min=0.01)))
        # stored radius -> fraction of the most it may be (half the thinnest side), so rows round-trip
        frac = r[:, 5] / (0.5 * r[:, 2:5].clamp(min=0.01).min(dim=1).values)
        self.raw_round = torch.nn.Parameter(torch.logit(frac.clamp(0.02, 0.98)))
        self.pitch = torch.nn.Parameter(r[:, 6])

    def rows(self):
        half = self.log_half.exp()
        rnd = torch.sigmoid(self.raw_round) * 0.5 * half.min(dim=1).values  # radius ≤ half the thinnest side
        return self.cyz, half, rnd, self.pitch

    def distances(self, p):
        cyz, half, rnd, pitch = self.rows()
        x = p[:, None, 0].abs().expand(-1, cyz.shape[0])  # mirrored: |x|, centre x = 0
        y = p[:, None, 1] - cyz[None, :, 0]
        z = p[:, None, 2] - cyz[None, :, 1]
        c, s = torch.cos(pitch)[None], torch.sin(pitch)[None]
        yl, zl = c * y + s * z, -s * y + c * z          # rotate about the x axis
        q = torch.stack([x, yl.abs(), zl.abs()], -1) - half[None] + rnd[None, :, None]  # box is symmetric on every axis
        outside = q.clamp(min=0).norm(dim=-1)
        inside = q.max(dim=-1).values.clamp(max=0)
        return outside + inside - rnd[None]             # (points, shapes)

    def forward(self, p):
        d = self.distances(p)
        return -BLEND * torch.logsumexp(-d / BLEND, dim=1)

def loss_fn(pred, gt):
    """Outside the car the shapes' distance must match the true distance (a union of
    shapes gives the exact distance outside). Inside it only has to be inside: a
    union's inside distance is never the true depth, so asking it to match (runs 1
    and 2) swelled every shape outward by about 5 cm."""
    outside = gt > 0
    far_ok = outside & (gt > CLAMP) & (pred > CLAMP)
    out_err = (pred - gt.clamp(max=CLAMP)).abs()
    out_err = torch.where(far_ok, torch.zeros_like(out_err), out_err)
    in_err = torch.relu(pred + gt.abs().clamp(max=0.01))   # at least 1 cm inside where the car is
    err = torch.where(outside, out_err, in_err)
    w = 1.0 + 4.0 * (gt.abs() < 0.03)   # care most about the surface itself
    return (w * err).mean()

def optimise(model, pts, gt, steps, lr=0.01):
    opt = torch.optim.Adam(model.parameters(), lr=lr)
    for _ in range(steps):
        opt.zero_grad()
        loss = loss_fn(model(pts), gt)
        loss.backward()
        opt.step()
    return float(loss.detach())

def worst_spot(model, pts, gt):
    """Centre of the most under-covered region: inside the car but outside every shape."""
    with torch.no_grad():
        miss = (model(pts) - gt).clamp(min=0) * (gt < 0)
    top = torch.topk(miss, 200).indices
    centre = pts[top].median(dim=0).values
    spread = (pts[top] - centre).abs().quantile(0.8, dim=0).clamp(0.05, 0.6)
    return [float(centre[1]), float(centre[2]), float(spread[0]) + 0.02,
            float(spread[1]), float(spread[2]), 0.02, 0.0]

def grow(rows, pts, gt, targets, log):
    model = Shapes(rows)
    optimise(model, pts, gt, 300)
    out = {}
    while True:
        n = model.cyz.shape[0]
        if n in targets:
            final = Shapes(export_rows(model))
            loss = optimise(final, pts, gt, 400, lr=0.005)
            out[n] = (export_rows(final), loss)
            log(f"  {n} shapes: loss {loss:.5f}")
        if n >= max(targets):
            return out
        rows = export_rows(model) + [worst_spot(model, pts, gt)]
        model = Shapes(rows)
        optimise(model, pts, gt, 100)

def export_rows(model):
    cyz, half, rnd, pitch = model.rows()
    rows = torch.cat([cyz, half, rnd[:, None], pitch[:, None]], 1).detach()
    return [[round(float(v), 5) for v in r] for r in rows]

def colour_per_shape(rows, z):
    """Paint for each shape: the median colour of body points that shape is nearest to."""
    model = Shapes(rows)
    pts = torch.tensor(z["surf_pts"]); cols = z["surf_cols"]
    with torch.no_grad():
        owner = model.distances(pts).argmin(dim=1).numpy()
    out = []
    for i in range(len(rows)):
        mine = cols[owner == i]
        c = np.median(mine, axis=0) if len(mine) else np.array([0.5, 0.5, 0.5])
        out.append([round(float(v), 3) for v in c])
    return out

def main(npz, start_json, tag, seed=7):
    torch.manual_seed(seed)
    pts, gt, z = load(npz, seed)
    rows = json.load(open(start_json))["rows"]
    targets = {8, 16, 24}
    results = grow(rows, pts, gt, targets, print)
    for n, (r, loss) in sorted(results.items()):
        doc = {"run": tag, "shapes": n, "loss": round(loss, 6), "blend": BLEND,
               "format": "per shape: centre y, centre z, half x, half y, half z, corner radius, pitch (rad); mirrored about x = 0",
               "rows": r, "colours": colour_per_shape(r, z)}
        text = json.dumps(doc, separators=(",", ":"))
        doc["sha256"] = hashlib.sha256(json.dumps(r).encode()).hexdigest()[:16]
        json.dump(doc, open(f"fit_{tag}_{n}.json", "w"))
        print(tag, n, "sha", doc["sha256"], "bytes", len(text))

if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2], sys.argv[3])
