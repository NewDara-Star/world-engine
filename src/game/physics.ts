// The physics world: Rapier, started once, pulling down with the place's
// gravity (D-0009); flat ground, one collider per 100 m square (D-0008;
// research/36 section 2, item 7); walls at the map's edge; fixed 1/60 s steps
// with an accumulator, at most 5 a frame (Sketchbook, swift502/Sketchbook
// src/ts/world/World.ts, MIT, technique only; research/36 section 3).
// Rapier 0.21.0 API from its type files: `init`, `World`, `timestep`,
// `ColliderDesc.cuboid`, `createCollider`; three.js 0.186.1 `Quaternion.slerp`.
// Design: docs/designs/src/game/physics.md.
import RAPIER from "@dimforge/rapier3d-compat";
import { Quaternion } from "three";
import type { Place } from "../place/place.js";
import { type Cell, CELL_SIZE_M, cellBounds } from "../world/grid.js";
import type { MapExtent, Pose } from "../vehicle/car.js";

export const PHYSICS_STEP_S = 1 / 60;
const MOST_STEPS_A_FRAME = 5;

export type PhysicsStart = { ok: true } | { ok: false; reason: string };

export interface FrameSteps {
  steps: number;
  leftOverS: number;
  // How far between the last two physics poses to draw the car, 0 to 1.
  blend: number;
}

// The physics engine is WebAssembly and must be started before anything
// moves; a phone that cannot run it gets told.
export async function startPhysicsEngine(): Promise<PhysicsStart> {
  try {
    await RAPIER.init();
    return { ok: true };
  } catch (error) {
    return { ok: false, reason: String(error) };
  }
}

// Things fall at the place's own gravity, so a Mars place later falls slower
// with no code change.
export function createPhysicsWorld(place: Pick<Place, "gravityMs2">): RAPIER.World {
  const world = new RAPIER.World({ x: 0, y: -place.gravityMs2, z: 0 });
  world.timestep = PHYSICS_STEP_S;
  return world;
}

// A fixed box 100 m across and 1 m deep, its top at height 0. Game axes:
// x east, y up, z south, so north is minus z.
export function addGroundCollider(world: RAPIER.World, cell: Cell): number {
  const bounds = cellBounds(cell);
  const half = CELL_SIZE_M / 2;
  const ground = RAPIER.ColliderDesc.cuboid(half, 0.5, half).setTranslation(bounds.westM + half, -0.5, -(bounds.southM + half));
  return world.createCollider(ground).handle;
}

// Four invisible walls, 1 m thick and 3 m tall, just outside the map's edges,
// each 1 m longer at both ends so the corners are closed.
export function addMapEdgeWalls(world: RAPIER.World, extent: MapExtent): number[] {
  const middleEast = (extent.westM + extent.eastM) / 2;
  const middleNorth = (extent.southM + extent.northM) / 2;
  const halfAcross = (extent.eastM - extent.westM) / 2 + 1;
  const halfAlong = (extent.northM - extent.southM) / 2 + 1;
  const walls = [
    RAPIER.ColliderDesc.cuboid(0.5, 1.5, halfAlong).setTranslation(extent.westM - 0.5, 1.5, -middleNorth),
    RAPIER.ColliderDesc.cuboid(0.5, 1.5, halfAlong).setTranslation(extent.eastM + 0.5, 1.5, -middleNorth),
    RAPIER.ColliderDesc.cuboid(halfAcross, 1.5, 0.5).setTranslation(middleEast, 1.5, -(extent.southM - 0.5)),
    RAPIER.ColliderDesc.cuboid(halfAcross, 1.5, 0.5).setTranslation(middleEast, 1.5, -(extent.northM + 0.5)),
  ];
  return walls.map((wall) => world.createCollider(wall).handle);
}

// Equal steps on a 60 Hz phone, a 120 Hz Mac and a phone that stutters; after
// a long pause the rest is dropped instead of fast-forwarding.
export function physicsStepsForFrame(leftOverS: number, frameS: number): FrameSteps {
  const owedS = leftOverS + frameS;
  const steps = Math.floor(owedS / PHYSICS_STEP_S);
  if (steps > MOST_STEPS_A_FRAME) return { steps: MOST_STEPS_A_FRAME, leftOverS: 0, blend: 1 };
  const left = owedS - steps * PHYSICS_STEP_S;
  return { steps, leftOverS: left, blend: left / PHYSICS_STEP_S };
}

// The car is drawn between its last two physics poses, the turn along the
// shortest arc, so it glides on a 120 Hz screen.
export function blendPoses(before: Pose, after: Pose, fraction: number): Pose {
  const turn = new Quaternion(before.rotation.x, before.rotation.y, before.rotation.z, before.rotation.w).slerp(
    new Quaternion(after.rotation.x, after.rotation.y, after.rotation.z, after.rotation.w),
    fraction,
  );
  return {
    position: {
      x: before.position.x + (after.position.x - before.position.x) * fraction,
      y: before.position.y + (after.position.y - before.position.y) * fraction,
      z: before.position.z + (after.position.z - before.position.z) * fraction,
    },
    rotation: { x: turn.x, y: turn.y, z: turn.z, w: turn.w },
  };
}
