# src/game/scene.ts

Drawn from the code by `npm run diagrams` (TypeScript compiler, no AI). Do not edit by hand: change the code, then run it again.

## createRenderer

```mermaid
flowchart TD
  n1(["createRenderer"])
  n2["const context = canvas.getContext(#quot;webgl2#quot;, { antialias: tr…"]
  n3{"context === null"}
  n4(["return { ok: false, failure: { kind: #quot;cannot-draw-3d#quot; } };"])
  n5["const renderer = new WebGLRenderer({ canvas, context, antia…"]
  n6["renderer.setPixelRatio(Math.min(pixelRatio, MOST_PIXEL_RATI…"]
  n7["renderer.setSize(canvas.clientWidth, canvas.clientHeight, f…"]
  n8(["return { ok: true, renderer };"])
  n1 --> n2
  n2 --> n3
  n3 -->|"yes"| n4
  n3 -->|"no"| n5
  n5 --> n6
  n6 --> n7
  n7 --> n8
```

## createScene

```mermaid
flowchart TD
  n1(["createScene"])
  n2["const scene = new Scene();"]
  n3["const range = fogRangeForView(loadRadiusM, CAMERA_BEHIND_M,…<br/>calls fogRangeForView"]
  n4["const fog = new Fog(SKY_COLOUR, range.near, range.far);"]
  n5["scene.background = fog.color.clone();"]
  n6["scene.fog = fog;"]
  n7["scene.add(new HemisphereLight(SKY_COLOUR, GROUND_COLOUR, SK…"]
  n8["const sun = new DirectionalLight(0xffffff, SUN_STRENGTH);"]
  n9["sun.position.set(30, 100, 20);"]
  n10["scene.add(sun);"]
  n11["const groundMaterial = new MeshLambertMaterial({ color: GRO…"]
  n12["const roadMaterial = new MeshLambertMaterial({ color: ROAD_…"]
  n13(["return { scene, fog, groundMaterial, roadMaterial };"])
  n1 --> n2
  n2 --> n3
  n3 --> n4
  n4 --> n5
  n5 --> n6
  n6 --> n7
  n7 --> n8
  n8 --> n9
  n9 --> n10
  n10 --> n11
  n11 --> n12
  n12 --> n13
```

## fogRangeForView

```mermaid
flowchart TD
  n1(["fogRangeForView"])
  n2["const vertical = (fieldOfViewDeg * Math.PI) / 180;"]
  n3["const horizontal = 2 * Math.atan(Math.tan(vertical / 2) * a…"]
  n4["const widest = Math.max(vertical, horizontal);"]
  n5["const far = (loadRadiusM - cameraBehindM) * Math.cos(widest…"]
  n6(["return { near: far / 2, far };"])
  n1 --> n2
  n2 --> n3
  n3 --> n4
  n4 --> n5
  n5 --> n6
```

## groundTileMesh

```mermaid
flowchart TD
  n1(["groundTileMesh"])
  n2["const bounds = cellBounds(cell);<br/>calls cellBounds"]
  n3["const tile = new Mesh(sharedGroundShape, material);"]
  n4["tile.position.set(bounds.westM + CELL_SIZE_M / 2, 0, -(boun…"]
  n5["tile.renderOrder = 0;"]
  n6(["return tile;"])
  n1 --> n2
  n2 --> n3
  n3 --> n4
  n4 --> n5
  n5 --> n6
```

## roadMeshFromChunk

```mermaid
flowchart TD
  n1(["roadMeshFromChunk"])
  n2["const cornerCount = chunk.corners.length / 2;"]
  n3["const positions = new Float32Array(cornerCount * 3);"]
  n4["const normals = new Float32Array(cornerCount * 3);"]
  n5["let corner = 0"]
  n6{"corner #lt; cornerCount"}
  n7{"chunk.corners[corner * 2] is missing?"}
  n8["0"]
  n9["positions[corner * 3] = (chunk.corners[corner * 2] ?? 0) / …"]
  n10{"chunk.corners[corner * 2 + 1] is missing?"}
  n11["0"]
  n12["positions[corner * 3 + 2] = -(chunk.corners[corner * 2 + 1]…"]
  n13["normals[corner * 3 + 1] = 1;"]
  n14["corner += 1"]
  n15["const shape = new BufferGeometry();"]
  n16["shape.setAttribute(#quot;position#quot;, new BufferAttribute(position…"]
  n17["shape.setAttribute(#quot;normal#quot;, new BufferAttribute(normals, 3…"]
  n18["shape.setIndex(chunk.triangles);"]
  n19["const road = new Mesh(shape, material);"]
  n20["const bounds = cellBounds(chunk.cell);<br/>calls cellBounds"]
  n21["road.position.set(bounds.westM, 0, -bounds.southM);"]
  n22["road.renderOrder = 1;"]
  n23(["return road;"])
  n1 --> n2
  n2 --> n3
  n3 --> n4
  n4 --> n5
  n5 --> n6
  n6 -->|"yes"| n7
  n7 -->|"yes"| n8
  n7 -->|"no"| n9
  n8 --> n9
  n9 --> n10
  n10 -->|"yes"| n11
  n10 -->|"no"| n12
  n11 --> n12
  n12 --> n13
  n13 --> n14
  n14 --> n6
  n6 -->|"no"| n15
  n15 --> n16
  n16 --> n17
  n17 --> n18
  n18 --> n19
  n19 --> n20
  n20 --> n21
  n21 --> n22
  n22 --> n23
```

## carModel

```mermaid
flowchart TD
  n1(["carModel"])
  n2["const chassis = chassisMassProperties(vehicle);<br/>calls chassisMassProperties"]
  n3["const group = new Group();"]
  n4["const bodyBox = new Mesh( new BoxGeometry(chassis.halfExten…"]
  n5["bodyBox.position.set(chassis.offset.x, chassis.offset.y, ch…"]
  n6["bodyBox.renderOrder = 2;"]
  n7["group.add(bodyBox);"]
  n8["const wheelShape = new CylinderGeometry(vehicle.wheels.radi…"]
  n9["const wheelMaterial = new MeshLambertMaterial({ color: WHEE…"]
  n10["const wheels: Mesh[] = [];"]
  n11{"for each const mount of wheelMountPoints(vehicle)<br/>calls wheelMountPoints"}
  n12["const wheel = new Mesh(wheelShape, wheelMaterial);"]
  n13["wheel.position.set(mount.position.x, mount.position.y, moun…"]
  n14["wheel.renderOrder = 2;"]
  n15["group.add(wheel);"]
  n16["wheels.push(wheel);"]
  n17(["return { group, wheels };"])
  n1 --> n2
  n2 --> n3
  n3 --> n4
  n4 --> n5
  n5 --> n6
  n6 --> n7
  n7 --> n8
  n8 --> n9
  n9 --> n10
  n10 --> n11
  n11 -->|"next item"| n12
  n12 --> n13
  n13 --> n14
  n14 --> n15
  n15 --> n16
  n16 --> n11
  n11 -->|"done"| n17
```

## updateCarModel

```mermaid
flowchart TD
  n1(["updateCarModel"])
  n2["drawing.group.position.set(pose.position.x, pose.position.y…"]
  n3["drawing.group.quaternion.set(pose.rotation.x, pose.rotation…"]
  n4{"for each const [index, wheel] of drawing.wheels.entries()"}
  n5["const mount = controller.wheelChassisConnectionPointCs(inde…"]
  n6{"controller.wheelSuspensionLength(index) is missing?"}
  n7["0"]
  n8["const springLength = controller.wheelSuspensionLength(index…"]
  n9{"mount?.y is missing?"}
  n10["0"]
  n11["wheel.position.y = (mount?.y ?? 0) - springLength;"]
  n12{"controller.wheelSteering(index) is missing?"}
  n13["0"]
  n14{"controller.wheelRotation(index) is missing?"}
  n15["0"]
  n16["wheel.rotation.set(0, controller.wheelSteering(index) ?? 0,…"]
  n17(["end"])
  n1 --> n2
  n2 --> n3
  n3 --> n4
  n4 -->|"next item"| n5
  n5 --> n6
  n6 -->|"yes"| n7
  n6 -->|"no"| n8
  n7 --> n8
  n8 --> n9
  n9 -->|"yes"| n10
  n9 -->|"no"| n11
  n10 --> n11
  n11 --> n12
  n12 -->|"yes"| n13
  n12 -->|"no"| n14
  n13 --> n14
  n14 -->|"yes"| n15
  n14 -->|"no"| n16
  n15 --> n16
  n16 --> n4
  n4 -->|"done"| n17
```

## releaseMesh

```mermaid
flowchart TD
  n1(["releaseMesh"])
  n2["scene.remove(mesh);"]
  n3{"mesh.geometry === sharedGroundShape"}
  n4(["return;"])
  n5["mesh.geometry.dispose();"]
  n6(["end"])
  n1 --> n2
  n2 --> n3
  n3 -->|"yes"| n4
  n3 -->|"no"| n5
  n5 --> n6
```
