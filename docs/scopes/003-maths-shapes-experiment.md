# Scope 003: maths-shapes experiment

Status: written 2026-10-10, awaiting the owner's approval of the design
diagram (V5 doc, section "Scope 003"). Runs after Scope 002 (diagram tool).

## Goal

Find out, with numbers, whether one car can be rebuilt from maths shapes
(signed distance functions: boxes, rounded boxes, cylinders, capsules and the
smooth blends between them) that are much smaller than its 3D file, look
nearly the same, and draw fast on the reference phone.

This is an experiment, not a feature. It lives on the branch
`experiment/maths-shapes` and is never merged into `main` by this scope.

## Background

The idea came from the owner's research chat (2026-10-10). The weak version,
asking an AI to write the shader directly from a mesh, is ruled out: AI is
poor at exact geometry and its output is not repeatable. In this version an
optimizer, a program that adjusts numbers until the error stops falling,
does the fitting. Claude may only propose a starting layout of parts.

## In scope

1. **Research first** (`research/31-maths-shapes.md`), before any code:
   existing work on fitting primitives or signed distance functions to meshes
   (papers and open repos on primitive fitting, superquadrics, CSG recovery,
   neural SDFs, and SDF modelling references). For each source: what it does,
   its licence, what we take as technique. Techniques only; no GPL code.
2. **Input model:** one free CC0 car (e.g. Kenney or Quaternius car kits).
   Record its source and licence. If the owner subscribes to Meshy, repeat the
   run with one Meshy car.
3. **Distance samples:** sample the model's signed distance at points near
   and away from its surface. Deterministic: same model and seed, same points.
4. **Fitter:** an optimizer that fits a small list of shapes and blends to
   those samples. The shape count is a setting, tried at a few sizes.
   - Run A: the optimizer starts from a plain default layout.
   - Run B: the optimizer starts from a layout Claude proposes (body, cabin,
     four wheels and so on), saved as data before the run.
5. **Output:** the shape list as a small data file, then two ways to draw it:
   a three.js shader that draws straight from the maths, and a mesh made from
   the maths as the fallback.
6. **Measure, against the original model:**

   | Measure | How | Wins if |
   | --- | --- | --- |
   | Size | Compressed bytes of the shape list vs the compressed original | At least 10x smaller |
   | Likeness | Silhouettes from 8 fixed angles, overlap score | 0.90 or better, and the owner passes it by eye in the white-clay look |
   | Speed | Frame time drawing 20 cars on the reference phone (or a stated stand-in if no phone is available, said so plainly) | Holds 60 fps |
   | Repeatable | Same model and seed, run twice | Identical shape lists |

7. **Write-up** (`research/31-maths-shapes.md`, results section): the numbers
   for runs A and B at each shape count, pictures side by side, and a plain
   verdict. A clear win ends with a proposed follow-up scope. A loss says why,
   so the idea is settled.

## Out of scope

Putting any of this in the game; buildings or any other model; more than one
car (plus the optional Meshy repeat); merging into `main`.

## Rules

Everything in CLAUDE.md applies on the branch: hooks, the diagram gate, small
functions, block-level references, the four test paths. The optimizer's
maths cites its source.

## Time box

Two weeks of sessions. If it is not answered by then, write up what is known
and stop.

## Done when

- The research note exists, with sources and licences.
- Runs A and B are measured at each shape count against all four measures.
- The write-up gives a verdict the owner can read in five minutes.
- `npm run check` passes on the branch.
