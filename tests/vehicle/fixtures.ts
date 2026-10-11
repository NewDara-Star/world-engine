// The car and places the vehicle tests drive with: the real hatchback file
// the game ships (vehicles/hatchback.json) and the made-up tiny place, on
// either side of the road. Plus small sums on rotations (unit quaternions
// x, y, z, w, as Rapier and three.js hold them) to say which way a car faces.
import { expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { validateVehicle } from "../../src/place/index.js";
import { checkedPlace, tinyPlaceTextWith } from "../bake/tiny.js";

const hatchbackPath = resolve(import.meta.dirname, "../../vehicles/hatchback.json");

export function hatchback() {
  expect(existsSync(hatchbackPath), "vehicles/hatchback.json exists").toBe(true);
  const checked = validateVehicle("hatchback.json", readFileSync(hatchbackPath, "utf8"));
  if (!checked.ok) throw new Error(checked.messages.join("\n"));
  return checked.value;
}

export function placeDrivingOn(side: "left" | "right") {
  return checkedPlace("tiny.json", tinyPlaceTextWith({ drivingSide: side }));
}

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface Quat {
  x: number;
  y: number;
  z: number;
  w: number;
}

export function quatAbout(axis: Vec3, angleRad: number): Quat {
  const half = angleRad / 2;
  const length = Math.hypot(axis.x, axis.y, axis.z);
  const s = Math.sin(half) / length;
  return { x: axis.x * s, y: axis.y * s, z: axis.z * s, w: Math.cos(half) };
}

export function multiply(a: Quat, b: Quat): Quat {
  return {
    w: a.w * b.w - a.x * b.x - a.y * b.y - a.z * b.z,
    x: a.w * b.x + a.x * b.w + a.y * b.z - a.z * b.y,
    y: a.w * b.y - a.x * b.z + a.y * b.w + a.z * b.x,
    z: a.w * b.z + a.x * b.y - a.y * b.x + a.z * b.w,
  };
}

// v rotated by q: q v q*.
export function rotate(q: Quat, v: Vec3): Vec3 {
  const p = multiply(multiply(q, { x: v.x, y: v.y, z: v.z, w: 0 }), { x: -q.x, y: -q.y, z: -q.z, w: q.w });
  return { x: p.x, y: p.y, z: p.z };
}

// Game axes: x east, y up, z south; the car's forward axis is its local +x
// (src/vehicle/car.md). A compass heading h is turned 90° − h about y.
export function rotationForHeading(headingDeg: number): Quat {
  return quatAbout({ x: 0, y: 1, z: 0 }, ((90 - headingDeg) * Math.PI) / 180);
}

// The compass heading the car's nose points along, degrees clockwise from north.
export function headingOf(q: Quat): number {
  const forward = rotate(q, { x: 1, y: 0, z: 0 });
  const degrees = (Math.atan2(forward.x, -forward.z) * 180) / Math.PI;
  return (degrees + 360) % 360;
}

// The smallest turn from heading a to heading b, in degrees, positive clockwise.
export function headingChange(a: number, b: number): number {
  return ((b - a + 540) % 360) - 180;
}
