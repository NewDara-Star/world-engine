// A chase camera behind and above the car. It follows the car smoothly instead
// of being bolted to the body, so the springs' bumps do not shake the picture
// (our research/world-drive/12, item 1), with a fraction 1 − e^(−rate × time)
// that feels the same at 60 and 120 frames a second (research 12, item 6).
// Design: docs/designs/src/camera/chase.md.
import { type Pose, flatHeading } from "../vehicle/car.js";
import type { Vec3 } from "../vehicle/rapier-settings.js";

// Game-feel numbers, the owner's choice, proposed 2026-10-11 (chase.md):
// 6 m behind, 2.5 m above the ground, looking 3 m ahead of the car and 1 m
// up, a 60 degree field of view, following at 4 per second.
export const CAMERA_BEHIND_M = 6;
export const CAMERA_HEIGHT_M = 2.5;
export const LOOK_AHEAD_M = 3;
export const LOOK_HEIGHT_M = 1;
export const FIELD_OF_VIEW_DEG = 60;
export const FOLLOW_RATE_PER_S = 4;

export interface CameraAim {
  cameraPoint: Vec3;
  lookPoint: Vec3;
}

export function followFraction(ratePerS: number, frameS: number): number {
  return 1 - Math.exp(-ratePerS * frameS);
}

// Behind the car along its heading flat on the ground, so the horizon stays
// level; flatHeading's fallback keeps a car on its nose from giving "not a
// number", a blank screen (approver's F12). Worked out from the blended pose
// the car is drawn at.
export function chaseCameraGoal(car: Pose): CameraAim {
  const forward = flatHeading(car.rotation);
  return {
    cameraPoint: { x: car.position.x - forward.x * CAMERA_BEHIND_M, y: CAMERA_HEIGHT_M, z: car.position.z - forward.z * CAMERA_BEHIND_M },
    lookPoint: { x: car.position.x + forward.x * LOOK_AHEAD_M, y: LOOK_HEIGHT_M, z: car.position.z + forward.z * LOOK_AHEAD_M },
  };
}

// Glides toward its goal, except straight after a flip or a return to the
// start, where gliding across the map would be confusing.
export function moveChaseCamera(camera: CameraAim, goal: CameraAim, frameS: number, carJumped: boolean): CameraAim {
  if (carJumped) return goal;
  const fraction = followFraction(FOLLOW_RATE_PER_S, frameS);
  return {
    cameraPoint: {
      x: camera.cameraPoint.x + (goal.cameraPoint.x - camera.cameraPoint.x) * fraction,
      y: camera.cameraPoint.y + (goal.cameraPoint.y - camera.cameraPoint.y) * fraction,
      z: camera.cameraPoint.z + (goal.cameraPoint.z - camera.cameraPoint.z) * fraction,
    },
    lookPoint: {
      x: camera.lookPoint.x + (goal.lookPoint.x - camera.lookPoint.x) * fraction,
      y: camera.lookPoint.y + (goal.lookPoint.y - camera.lookPoint.y) * fraction,
      z: camera.lookPoint.z + (goal.lookPoint.z - camera.lookPoint.z) * fraction,
    },
  };
}
