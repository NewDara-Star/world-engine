# src/game/scene.ts

Status: approved. Judged by the delegated approver (docs/reviews/slice-1-approver.md); its fixes F1 to F24 and the orchestrator's decisions on E1 to E3 applied in one pass.

New in scope 005 (item 4). What is drawn: sky colour, simple light, the flat
ground per square, the grey roads, and a grey-box car. three.js 0.186.1 with
WebGL 2 (`WebGLRenderer`, `HemisphereLight`, `DirectionalLight`, `Fog`,
`BufferGeometry`, `MeshLambertMaterial`, `Material.depthWrite`,
`Object3D.renderOrder`). Ground and roads are drawn first and write no depth,
so the flat layers can never flicker against each other at any distance
(research/36 section 2, item 4). Colours, light strength, fog distance and the
cap on screen sharpness (device pixel ratio at most 2, to keep the frame rate
on phones with very sharp screens) are look-and-feel numbers, the owner's
choice, proposed as named constants here; the real look is found later
(D-0023). The pictures drawn from the code will be in
`docs/flows/src/game/scene.md`.

## createRenderer

Why the game needs it: the picture fills the phone's screen at a sharpness the phone can keep up with; a browser that cannot draw 3D is told so.

```mermaid
flowchart TD
  s(["createRenderer on the page's canvas"])
  a{"can the browser make a WebGL 2 drawing context on it"}
  b(["return failure: cannot draw 3D"])
  c["make the three.js renderer with smoothed edges; sharpness = the smaller of the device's pixel ratio and the cap; size = the canvas's size on screen"]
  d(["return the renderer"])
  s --> a
  a -->|"no"| b
  a -->|"yes"| c --> d
```

## createScene

Why the game needs it: a plain, readable world: a sky, soft light from above, one sun for shape, and fog that hides where the loaded squares end.

```mermaid
flowchart TD
  s(["createScene with the load radius and the camera's aspect"])
  a["background = sky colour; fog of the same colour, from fogRangeForView, so squares appear inside the fog, never at a hard edge"]
  b["a hemisphere light, sky colour above and ground colour below, and one directional light from high up"]
  c(["return the scene, and the shared ground and road materials: neither writes depth; the ground is drawn first, the roads second"])
  s --> a --> b --> c
```

## fogRangeForView

New in scope 005 (approver's F13). Why the game needs it: three.js fogs by depth straight ahead of the camera, not by distance (in 0.186.1, `vFogDepth = - mvPosition.z`), so at the side of a wide screen a square far away has a small depth and pops in nearly unfogged. On a 20:9 phone held sideways, a square 294 m away at the screen edge has a depth of only 181 m. So the fog is pulled in by the cosine of half the widest view angle, and worked out again whenever the screen's shape changes. The load radius stays the owner's performance number; the clear view on a wide phone becomes shorter (about 180 m), which the frame-rate measurement can trade against a bigger radius.

```mermaid
flowchart TD
  s(["fogRangeForView with the load radius, the camera's distance behind the car, its vertical field of view and its aspect"])
  a["horizontal view angle = 2 times the arctangent of (the tangent of half the vertical angle, times the aspect); the widest view angle is the larger of the two"]
  b["complete = (load radius minus the distance behind) times the cosine of half the widest view angle"]
  c(["return the fog starting at half of complete, and complete at complete"])
  s --> a --> b --> c
```

## groundTileMesh

Why the game needs it: the ground under every loaded square, matching its collider.

```mermaid
flowchart TD
  s(["groundTileMesh for a square, with the shared ground material"])
  a(["return a flat 100 m square at height 0 on the square's bounds, using one shared shape for all tiles so a three-hour drive does not pile up memory"])
  s --> a
```

## roadMeshFromChunk

Why the game needs it: the grey roads of one square, from its checked chunk file.

```mermaid
flowchart TD
  s(["roadMeshFromChunk with a checked chunk and the shared road material"])
  a["corner positions: east centimetres over 100 becomes x, north centimetres over 100 becomes minus z, height 0; all relative to the square's south-west corner"]
  b["triangles as given; anticlockwise in map words stays anticlockwise seen from above after north becomes minus z, so every triangle faces up"]
  n["every corner's normal points straight up, because MeshLambertMaterial lights by the normals and draws a shape without them black (approver's F16)"]
  c(["return a mesh of that shape, placed at the square's south-west corner, drawn after the ground"])
  s --> a --> b --> n --> c
```

## carModel

Why the game needs it: the player sees a small car, the real car's size, made of plain shapes: our own invented grey box, no brand (D-0017).

```mermaid
flowchart TD
  s(["carModel for the vehicle"])
  a["a body box the size of the chassis box from chassisMassProperties"]
  b["four wheel cylinders of the wheel radius, at wheelMountPoints"]
  c(["return the car group and its four wheels, for updateCarModel"])
  s --> a --> b --> c
```

## updateCarModel

Why the game needs it: the drawn car is where the physics car is, its front wheels turn with the steering and every wheel sits on its spring and rolls.

```mermaid
flowchart TD
  s(["updateCarModel with the model, the blended pose and the controller"])
  a["set the group's position and turn to the pose"]
  b["for each wheel: its height from its suspension length, its steering angle, and its roll from its rotation, read from the controller"]
  c(["return"])
  s --> a --> b --> c
```

## releaseMesh

Why the game needs it: a square let go must free its graphics memory, or a long drive slowly fills the phone.

```mermaid
flowchart TD
  s(["releaseMesh from the scene"])
  a["remove it from the scene"]
  b{"is its shape the shared ground shape"}
  c(["return; the shared shape stays for the next tile"])
  d(["free its shape's graphics memory and return"])
  s --> a --> b
  b -->|"yes"| c
  b -->|"no"| d
```
