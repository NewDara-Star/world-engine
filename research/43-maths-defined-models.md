# 43: Real 3D models that come with their maths (a yardstick for the learner)

Track 3 (Assets), 2026-10-12. Owner's idea: instead of judging the mesh-to-maths
learner only on made-up box cars, find real, human-designed models that already
exist as maths (CSG, sketch-and-extrude CAD programs, OpenSCAD, distance
formulas), turn them into meshes, give the learner the mesh, and mark its
answer against the known maths. Sources and licences read 2026-10-12.

## What the first learner run showed (2026-10-11, CPU, 3,100 lessons, 1 hour)

| Step | Made-up cars (overlap) | Real hatchback, one glance |
|---|---|---|
| 100 | 0.67 | 0.65 |
| 1,500 | 0.90 | 0.84 |
| 3,100 | 0.93 | 0.85 |

At lesson 500 its glance on the hatchback (0.86) plus 300 polishing steps
matched the hand-started search (0.953 against 0.949). The gap between made-up
(0.93) and real (0.85) is the blocky-factory problem the owner spotted.

## Sources

| Source | Maths format | Size | Vehicles | Licence | Use? |
|---|---|---|---|---|---|
| DeepCAD (from Onshape public documents) [1][2] | sketch-and-extrude sequences (JSON) | ~178k models (paper; README gives no count) | almost none | code MIT; models under Onshape Terms 1.g.ii: "worldwide, royalty-free and non-exclusive license ... to use the intellectual property contained in Customer's Public Document without restriction" (documents with a LICENSE tab keep their own terms) | **Yes, best** (our reading, not legal advice) |
| ABC dataset [3] | B-rep (STEP, Parasolid), FeatureScript | 1M | almost none | same Onshape terms | Yes, larger but harder to read as maths |
| FreeCAD parts library [4] | parametric .FCStd + STEP | ~5 GB | none confirmed | CC-BY 3.0, credit each author | Yes for props, with credits |
| BOSL2 [5], build123d [6], Infinigen [7] | code libraries (OpenSCAD, Python) | building blocks; build123d has one toy truck | ~1 | BSD-2, Apache-2.0, BSD-3 | Yes, as tools for our own generator |
| Fusion 360 Gallery [8] | sketch-and-extrude | 8.6k–154k | few | non-commercial research only | **No** |
| CAD-Recode [9] | CadQuery programs | 1M, machine-made | none | CC-BY-NC-4.0 | **No** |
| Shadertoy SDF scenes [10] | GLSL distance formulas | many, some cars | some | default CC BY-NC-SA 3.0, per author | **No** unless a shader says MIT/CC0 |
| Thingiverse / Printables customizer models | OpenSCAD | many, some vehicles | some | per model, many NC | Only one by one, CC0/CC-BY only |
| GrabCAD [11] | CAD | many | many | private use; commercial needs designer's permission | **No** |

Not fetched (robots.txt refuses us): iquilezles.org; the OpenSCAD examples
folder page on GitHub (the repo itself can be cloned).

## What this means

1. **The yardstick exists, but it's machine parts.** DeepCAD is the cleanest:
   real people's designs, exact maths, a licence that appears to allow
   commercial use, ready to turn into meshes.
2. **It speaks a different language from boxes.** These models are "draw a 2D
   outline, push it out" (extrude). That language also suits cars: a classic
   way to model a car is its side outline pushed sideways, cut by its top
   outline pushed down. So the learner should grow from boxes to outlines.
3. **Almost no vehicle exists as open maths.** Vehicles need our own
   generator, written in the same outline language with real rules (wheelbase,
   overhangs, roof line), owned by us outright.

## Blocked

- The cloud and the owner's Mac shell can't download DeepCAD yet
  (www.cs.columbia.edu refused; deep-geometry.github.io unreachable). Needs
  the domain allowed, or the owner downloads `data.tar` once.

## Sources

1. https://github.com/ChrisWu1997/DeepCAD
2. https://www.onshape.com/en/legal/terms-of-use (section 1.g.ii)
3. https://deep-geometry.github.io/abc-dataset/
4. https://github.com/FreeCAD/FreeCAD-library
5. https://github.com/BelfrySCAD/BOSL2
6. https://github.com/gumyr/build123d
7. https://github.com/princeton-vl/infinigen
8. https://github.com/AutodeskAILab/Fusion360GalleryDataset
9. https://huggingface.co/datasets/filapro/cad-recode-v1.5
10. https://threejs.org/manual/en/shadertoy.html (default licence text)
11. https://help.grabcad.com/article/246-how-can-models-be-used-and-shared
