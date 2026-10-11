# 31: Rebuilding a model from maths shapes (Scope 003 research)

Track 3 (Assets), 2026-10-11. Scope 003 asks whether one car can be rebuilt
as a short list of maths shapes (signed distance functions: boxes, rounded
boxes, cylinders, superquadrics and smooth blends between them), fitted by an
optimizer, that is far smaller than its mesh, looks nearly the same, and draws
fast on a phone. Research first; no code yet. Sources read 2026-10-11; licences
read from each repo's LICENSE file. [UNVERIFIED] marks what could not be checked.

## The one thing to understand first

The optimizer copies a model that already exists. It does not invent a good
one. Fit it to a good car and you get a slightly softer copy in a few
kilobytes; fit it to nothing and you get the hand-placed boxes of the first
stand-in page. So maths shapes can make good models smaller and cheaper. Making
them good in the first place is still Meshy's job, or an artist's.

## What exists

| Work | What it does | Result | Code licence |
|---|---|---|---|
| SuperFit / ResFit, CVPR 2026 [1] | adds one primitive at a time where the fit is worst, then refines all; colour per primitive | 3D overlap (IoU) 0.90 with ~24 primitives on Toys4K; 0.865 with ~16 in 184 s | Adobe Research Licence, **non-commercial**: technique only |
| Marching-Primitives, CVPR 2023 [2] | superquadrics grown from the model's distance field | IoU 0.87 on 14 ShapeNet categories (cars not among them), ~7 s a shape; can't keep parts thinner than its grid | **MIT** (MATLAB) |
| CvxNet, 2020 [3] | 50 convex pieces | cars: IoU 0.83 | [UNVERIFIED] |
| BSP-Net [4] | convex cells from planes, sharp edges | ~1,900 triangles out, best edge sharpness | **MIT** |
| D²CSG, CAPRI-Net [5][6] | rebuilds a model as a CSG recipe | ~44–51 primitives, 3–5 min a shape | CAPRI-Net **MIT**; D²CSG [UNVERIFIED] |
| Superquadrics Revisited, 2019 [7] | up to 20 superquadrics | poor volume match (IoU 0.14–0.75); "wheels are not as easily recovered" | **MIT** |
| GeoLIPI and SySL [8][9] | a library of fittable maths shapes in PyTorch, which also writes WebGL shaders | building blocks, no fitter | **MIT** |
| EMS, CuboidAbstraction, CSGNet | various | various | **no licence file**: technique only |

Inigo Quilez's distance-function articles are the usual reference for the
shapes and the smooth blend, but his site's robots.txt refuses us (D-0021):
https://iquilezles.org/articles/distfunctions/ — the owner can open it; the
maths is re-derived and cited, never copied.

## The Corridor Crew idea (training once on made-up shapes)

It exists. CSGNet trains on random generated recipes, then fine-tunes on real
shapes [10]. But made-up shapes don't look like real objects, and the gap is
large: a network trained on made-up assemblies reaches IoU 0.37 (0.49 after
per-model tuning) where direct optimizers reach ~0.90 [1, Table 1]. PLAD names
the same "distributional mismatch" [11]. A green-screen key trained on fake
footage transfers because fake footage looks like real footage; a pile of
random boxes doesn't look like a car. So this stays "later, only if the
optimizer wins", as Scope 003 already says.

## Speed and size on a phone

- **Size:** ~25 shapes × ~12 numbers is 1–2 KB against tens to hundreds of KB
  of mesh: 10× smaller is easy *for the shape* (our arithmetic, not measured).
  But the hatchback's file is mostly its four 2048² textures, and the maths
  carries no paint. The real total depends on how colour is stored (a colour
  per shape, or a small texture projected back on).
- **Drawing straight from the maths (ray marching):** cost grows with screen
  pixels × steps × shapes; no published phone frame times found. Twenty cars
  this way at 60 fps on a mid-range phone is a risk, not a plan.
- **Turning the maths back into a mesh offline** (dual contouring keeps sharp
  edges): the phone then draws ordinary small meshes. 20 cars × 6,800 triangles
  is already only ~136k, inside the phone budget (research/40), so the speed
  gain over the existing mesh is small. The win is file size and variety
  (stretch a parameter, get a new car), not frame rate.

## Hard parts

Thin parts (mirrors, spoilers, wipers) vanish below the fitting grid; wheels
fail in older methods, so wheels and glass should be fixed parts placed from
the vehicle file's own dimensions, not fitted. Superquadrics round off creases;
rounded boxes and convex cells keep them.

## Verdict

| Scope 003 target | Likely? |
|---|---|
| 10× smaller | Yes for the shape; depends on how paint is stored |
| 0.90 silhouette overlap | Plausible (3D 0.90 shown on toys; no paper reports a car) |
| 60 fps for 20 cars | Only if meshed back offline; ray-marching unproven on phones |
| Repeatable | Yes with a fixed seed and a deterministic optimizer |

**Try first:** a direct per-model optimizer on the hatchback, built on GeoLIPI
(MIT), using the add-where-worst-then-refine technique learned from SuperFit's
paper (not its code), starting from a Marching-Primitives-style layout (MIT),
wheels and glass fixed, then meshed offline. The trained network waits.

## Sources

1. https://arxiv.org/pdf/2512.09201 ; https://github.com/BardOfCodes/superfit
2. https://arxiv.org/html/2303.13190 ; https://github.com/ChirikjianLab/Marching-Primitives
3. https://arxiv.org/pdf/1909.05736
4. https://arxiv.org/pdf/1911.06971 ; https://github.com/czq142857/BSP-NET-pytorch
5. https://arxiv.org/pdf/2301.11497
6. https://github.com/FENGGENYU/CAPRI-Net
7. https://arxiv.org/pdf/1904.09970 ; https://github.com/paschalidoud/superquadric_parsing
8. https://github.com/BardOfCodes/geolipi
9. https://github.com/BardOfCodes/sysl
10. https://arxiv.org/abs/1712.08290
11. https://ar5iv.labs.arxiv.org/html/2011.13045
12. https://developer.android.com/games/optimize/geometry
13. https://research.adobe.com/publication/lipschitz-pruning-hierarchical-simplification-of-primitive-based-sdfs

## Results (2026-10-11, first run)

Input: `car_traffic_1.glb` (World Drive hatchback, 6,808 triangles, 785 KB,
CC-BY-4.0 Comrade1280). Code: `experiments/maths-shapes/` on the branch
`experiment/maths-shapes` (Python: PyTorch BSD, trimesh MIT, scipy and
scikit-image BSD, fast-simplification MIT). Distances on a 2 cm grid; wheels
fixed from the model's own wheel nodes (radius 0.307 m, width 0.215 m).

| Run · shapes | Outline overlap, whole car (worst angle) | Body only | Shape list, gzip bytes | Smaller than file | Smaller than its shape data |
|---|---|---|---|---|---|
| A · 8 | 0.914 (0.87) | 0.894 | 409 | 1,130× | 659× |
| A · 16 | 0.938 (0.93) | 0.930 | 540 | 856× | 499× |
| A · 24 | 0.941 (0.93) | 0.932 | 668 | 692× | 403× |
| B · 8 | 0.952 (0.94) | 0.943 | 385 | 1,200× | 700× |
| B · 16 | 0.947 (0.94) | 0.938 | 418 | 1,106× | 644× |
| B · 24 | 0.948 (0.94) | 0.938 | 447 | 1,034× | 603× |

- **Repeatable:** run B done twice gives byte-identical shape lists at 8, 16
  and 24 shapes.
- **Speed:** not measured on the reference phone. The page has a 20-car test
  (shader and mesh versions); the owner's phone is the measurement.
- **Mesh fallback:** marching cubes then simplified to about 3,000 triangles.

### Verdict

Size: a clear win (hundreds of times smaller, not 10). Outline: passes 0.90
from 8 shapes with Claude's starting layout. **Looks: does not pass.** The car
reads as a boxy toy: one colour per box, so no windows, lights or trim, and
add-only boxes can't cut wheel arches or follow the hatch's curves. More boxes
barely helped, because the add-where-worst step places new boxes badly, so the
outline score stops at about 0.95. The outline score flatters it: two shapes
can share an outline and look nothing alike.

### Bugs found and fixed on the way (so the numbers can be trusted)

1. The box distance was missing an absolute value on two axes, so every "box"
   ran off to infinity downward and backward. Found from a slice image; fixed,
   then every run redone.
2. The loss clamped the shapes' own distances, so points a shape had swallowed
   by more than 10 cm gave no pull. Now only the true distance is clamped.
3. Inside the car the loss asked the union's distance to match the true depth,
   which a union of shapes never does; it now only asks to be inside.
4. Paint was read with the texture upside down (dark trim instead of body
   paint); measured both ways, 0.56 against 0.21 average brightness.

### What would make it look right (next, if the owner wants it)

- Paint from a small texture projected back on, not one colour per box
  (SuperFit's per-shape texture idea, technique only).
- Shapes that cut as well as add (wheel arches, window recesses).
- A better growing step: try several candidate boxes and keep the one that
  lowers the error most.
