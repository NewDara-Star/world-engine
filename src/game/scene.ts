// What is drawn: the sky colour, simple light, the flat ground per square, the
// grey roads and a grey-box car. three.js 0.186.1 with WebGL 2
// (WebGLRenderer, HemisphereLight, DirectionalLight, Fog, BufferGeometry,
// MeshLambertMaterial, Material.depthWrite, Object3D.renderOrder). Ground and
// roads are drawn first and write no depth, so the flat layers never flicker
// against each other (research/36 section 2, item 4).
// Design: docs/designs/src/game/scene.md.
import type RAPIER from "@dimforge/rapier3d-compat";
import {
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  CylinderGeometry,
  DirectionalLight,
  Fog,
  Group,
  HemisphereLight,
  type Material,
  Mesh,
  MeshLambertMaterial,
  PlaneGeometry,
  Scene,
  WebGLRenderer,
} from "three";
import { CAMERA_BEHIND_M, FIELD_OF_VIEW_DEG } from "../camera/chase.js";
import type { Vehicle } from "../place/vehicle.js";
import type { Pose } from "../vehicle/car.js";
import { chassisMassProperties, wheelMountPoints } from "../vehicle/rapier-settings.js";
import type { Chunk } from "../world/chunk.js";
import { type Cell, CELL_SIZE_M, cellBounds } from "../world/grid.js";
import type { GameFailure } from "./failure.js";

// Look-and-feel numbers, the owner's choice, proposed 2026-10-11 (scene.md);
// the real look is found later (D-0023).
const SKY_COLOUR = 0xbfd8ee;
const GROUND_COLOUR = 0x9aa07a;
const ROAD_COLOUR = 0x6b6b6b;
const CAR_COLOUR = 0xd0d4d8;
const WHEEL_COLOUR = 0x222222;
const SKY_LIGHT_STRENGTH = 2;
const SUN_STRENGTH = 1.5;
// Sharper screens cost frame rate on phones; at most two pixels per CSS pixel.
const MOST_PIXEL_RATIO = 2;

export interface SceneParts {
  scene: Scene;
  fog: Fog;
  groundMaterial: Material;
  roadMaterial: Material;
}

export interface CarDrawing {
  group: Group;
  wheels: Mesh[];
}

export type Rendered = { ok: true; renderer: WebGLRenderer } | { ok: false; failure: GameFailure };

// One shared flat 100 m square for every ground tile, laid flat (x east, z
// south), so a three-hour drive does not pile up graphics memory.
const sharedGroundShape = new PlaneGeometry(CELL_SIZE_M, CELL_SIZE_M).rotateX(-Math.PI / 2);

// The picture fills the phone's screen at a sharpness it can keep up with; a
// browser that cannot draw 3D is told so (three.js refuses WebGL 1 since r163).
export function createRenderer(canvas: HTMLCanvasElement, pixelRatio: number): Rendered {
  const context = canvas.getContext("webgl2", { antialias: true });
  if (context === null) return { ok: false, failure: { kind: "cannot-draw-3d" } };
  const renderer = new WebGLRenderer({ canvas, context, antialias: true });
  renderer.setPixelRatio(Math.min(pixelRatio, MOST_PIXEL_RATIO));
  renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
  return { ok: true, renderer };
}

// A sky, soft light from above, one sun for shape, and fog that hides where
// the loaded squares end.
export function createScene(loadRadiusM: number, aspect: number): SceneParts {
  const scene = new Scene();
  const range = fogRangeForView(loadRadiusM, CAMERA_BEHIND_M, FIELD_OF_VIEW_DEG, aspect);
  const fog = new Fog(SKY_COLOUR, range.near, range.far);
  scene.background = fog.color.clone();
  scene.fog = fog;
  scene.add(new HemisphereLight(SKY_COLOUR, GROUND_COLOUR, SKY_LIGHT_STRENGTH));
  const sun = new DirectionalLight(0xffffff, SUN_STRENGTH);
  sun.position.set(30, 100, 20);
  scene.add(sun);
  const groundMaterial = new MeshLambertMaterial({ color: GROUND_COLOUR, depthWrite: false });
  const roadMaterial = new MeshLambertMaterial({ color: ROAD_COLOUR, depthWrite: false });
  return { scene, fog, groundMaterial, roadMaterial };
}

// three.js fogs by depth straight ahead (vFogDepth = −mvPosition.z), not by
// distance, so the fog is pulled in by the cosine of half the widest view
// angle (approver's F13).
export function fogRangeForView(loadRadiusM: number, cameraBehindM: number, fieldOfViewDeg: number, aspect: number): { near: number; far: number } {
  const vertical = (fieldOfViewDeg * Math.PI) / 180;
  const horizontal = 2 * Math.atan(Math.tan(vertical / 2) * aspect);
  const widest = Math.max(vertical, horizontal);
  const far = (loadRadiusM - cameraBehindM) * Math.cos(widest / 2);
  return { near: far / 2, far };
}

// The ground under a loaded square, matching its collider; drawn first.
export function groundTileMesh(cell: Cell, material: Material): Mesh {
  const bounds = cellBounds(cell);
  const tile = new Mesh(sharedGroundShape, material);
  tile.position.set(bounds.westM + CELL_SIZE_M / 2, 0, -(bounds.southM + CELL_SIZE_M / 2));
  tile.renderOrder = 0;
  return tile;
}

// One square's grey roads. Centimetres east become x, centimetres north become
// minus z; anticlockwise in map words stays anticlockwise seen from above, so
// every triangle faces up. Every normal points up, because MeshLambertMaterial
// lights by the normals and draws a shape without them black (approver's F16).
export function roadMeshFromChunk(chunk: Chunk, material: Material): Mesh {
  const cornerCount = chunk.corners.length / 2;
  const positions = new Float32Array(cornerCount * 3);
  const normals = new Float32Array(cornerCount * 3);
  for (let corner = 0; corner < cornerCount; corner += 1) {
    positions[corner * 3] = (chunk.corners[corner * 2] ?? 0) / 100;
    positions[corner * 3 + 2] = -(chunk.corners[corner * 2 + 1] ?? 0) / 100;
    normals[corner * 3 + 1] = 1;
  }
  const shape = new BufferGeometry();
  shape.setAttribute("position", new BufferAttribute(positions, 3));
  shape.setAttribute("normal", new BufferAttribute(normals, 3));
  shape.setIndex(chunk.triangles);
  const road = new Mesh(shape, material);
  const bounds = cellBounds(chunk.cell);
  road.position.set(bounds.westM, 0, -bounds.southM);
  road.renderOrder = 1;
  return road;
}

// A small car the real car's size, of plain shapes: our own grey box, no
// brand (D-0017).
export function carModel(vehicle: Vehicle): CarDrawing {
  const chassis = chassisMassProperties(vehicle);
  const group = new Group();
  const bodyBox = new Mesh(
    new BoxGeometry(chassis.halfExtents.x * 2, chassis.halfExtents.y * 2, chassis.halfExtents.z * 2),
    new MeshLambertMaterial({ color: CAR_COLOUR }),
  );
  bodyBox.position.set(chassis.offset.x, chassis.offset.y, chassis.offset.z);
  bodyBox.renderOrder = 2;
  group.add(bodyBox);
  const wheelShape = new CylinderGeometry(vehicle.wheels.radiusM, vehicle.wheels.radiusM, 0.2, 16).rotateX(Math.PI / 2);
  const wheelMaterial = new MeshLambertMaterial({ color: WHEEL_COLOUR });
  const wheels: Mesh[] = [];
  for (const mount of wheelMountPoints(vehicle)) {
    const wheel = new Mesh(wheelShape, wheelMaterial);
    wheel.position.set(mount.position.x, mount.position.y, mount.position.z);
    wheel.renderOrder = 2;
    group.add(wheel);
    wheels.push(wheel);
  }
  return { group, wheels };
}

// The drawn car is where the physics car is; its front wheels turn with the
// steering, and every wheel sits on its spring and rolls (Rapier 0.21.0
// controller: wheelChassisConnectionPointCs, wheelSuspensionLength,
// wheelSteering, wheelRotation).
export function updateCarModel(drawing: CarDrawing, pose: Pose, controller: RAPIER.DynamicRayCastVehicleController): void {
  drawing.group.position.set(pose.position.x, pose.position.y, pose.position.z);
  drawing.group.quaternion.set(pose.rotation.x, pose.rotation.y, pose.rotation.z, pose.rotation.w);
  for (const [index, wheel] of drawing.wheels.entries()) {
    const mount = controller.wheelChassisConnectionPointCs(index);
    const springLength = controller.wheelSuspensionLength(index) ?? 0;
    wheel.position.y = (mount?.y ?? 0) - springLength;
    wheel.rotation.set(0, controller.wheelSteering(index) ?? 0, -(controller.wheelRotation(index) ?? 0), "YXZ");
  }
}

// A square let go frees its graphics memory, except the shared ground shape.
export function releaseMesh(mesh: Mesh, scene: Scene): void {
  scene.remove(mesh);
  if (mesh.geometry === sharedGroundShape) return;
  mesh.geometry.dispose();
}
