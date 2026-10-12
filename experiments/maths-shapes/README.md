# Scope 003: maths-shapes experiment

Experiment only, never merged into main (docs/scopes/003). Results and verdict:
research/31-maths-shapes.md.

Run (Python 3, `pip install torch trimesh scipy scikit-image pillow fast-simplification`):

    python3 prepare.py car_traffic_1.glb hatch.npz      # 2 cm distance grid, wheels, paint
    python3 fit.py hatch.npz layout_a.json A             # run A: one plain box to start
    python3 fit.py hatch.npz layout_b.json B             # run B: proposed hatchback layout
    python3 measure.py car_traffic_1.glb hatch.npz fit_B_8.json

`fit_*_N.json` are the fitted shape lists (rows: centre y, centre z, half x,
half y, half z, corner radius, pitch; mirrored about x = 0). `page.template.html`
is the side-by-side page (shader and mesh versions, 20-car timing).
The input car is not stored here: World Drive `game/public/models/car_traffic_1.glb`.
