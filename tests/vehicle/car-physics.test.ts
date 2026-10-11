// The car in real Rapier physics, run in Node: does it drive like the small
// hatchback whose published figures it carries? Designs: src/vehicle/car.md,
// rapier-settings.md, drive-force.md, src/game/physics.md. Targets from
// research/36 section 3 and section 7: 0–100 km/h and 100–0 km/h stopping
// distance within ±15 % of the published figures, top speed within ±10 %,
// no creeping at rest; the turning circle within ±10 % (approver's F3).
// These are the slowest tests; every other test is pure and fast.
import { beforeAll, describe, expect, it } from "vitest";
import { createPhysicsWorld } from "../../src/game/physics.js";
import { carStartPose, createCar, driveCar, flipCarUpright, returnCarToStart } from "../../src/vehicle/car.js";
import RAPIER from "@dimforge/rapier3d-compat";
import { hatchback, headingChange, headingOf, placeDrivingOn, quatAbout, rotate, type Quat, type Vec3 } from "./fixtures.js";

const STEP = 1 / 60;
const extent = { westM: -300, southM: -300, eastM: 300, northM: 300 };

beforeAll(async () => {
  await RAPIER.init();
});

interface Actions {
  steer: number;
  accelerate: number;
  brake: number;
  flipUpright: boolean;
}

function actions(changes: Partial<Actions> = {}): Actions {
  return { steer: 0, accelerate: 0, brake: 0, flipUpright: false, ...changes };
}

// A world with the place's gravity and a flat ground 12 km across, top at 0.
function worldWithCar(eastM: number, northM: number, headingDeg: number) {
  const place = placeDrivingOn("right");
  const vehicle = hatchback();
  const world = createPhysicsWorld(place);
  world.createCollider(RAPIER.ColliderDesc.cuboid(6000, 0.5, 6000).setTranslation(0, -0.5, 0));
  const pose = carStartPose({ eastM, northM, headingDeg, roadWidthM: 3.5, oneWay: true }, place, vehicle);
  const car = createCar(world, vehicle, pose, place);
  return { place, vehicle, world, car, pose };
}

type Rig = ReturnType<typeof worldWithCar>;

function step(rig: Rig, wanted: Actions): void {
  driveCar(rig.car, wanted, rig.place, STEP);
  rig.world.step();
}

function run(rig: Rig, seconds: number, wanted: Actions = actions()): void {
  for (let at = 0; at < Math.round(seconds / STEP); at++) step(rig, wanted);
}

function position(rig: Rig): Vec3 {
  return rig.car.body.translation();
}

function turn(rig: Rig): Quat {
  return rig.car.body.rotation();
}

function forwardSpeed(rig: Rig): number {
  const forward = rotate(turn(rig), { x: 1, y: 0, z: 0 });
  const velocity = rig.car.body.linvel();
  return velocity.x * forward.x + velocity.y * forward.y + velocity.z * forward.z;
}

function upness(rig: Rig): number {
  return rotate(turn(rig), { x: 0, y: 1, z: 0 }).y;
}

function flatDistance(a: Vec3, b: Vec3): number {
  return Math.hypot(a.x - b.x, a.z - b.z);
}

// Seconds of full throttle from rest until the forward speed reaches `speed`.
function secondsToReach(rig: Rig, speed: number, limitS: number): number {
  for (let at = 0; at < limitS / STEP; at++) {
    if (forwardSpeed(rig) >= speed) return at * STEP;
    step(rig, actions({ accelerate: 1 }));
  }
  return Number.POSITIVE_INFINITY;
}

function expectWithin(found: number, published: number, fraction: number, what: string): void {
  expect(found, `${what}: found ${found.toFixed(2)}, published ${published}`).toBeGreaterThanOrEqual(published * (1 - fraction));
  expect(found, `${what}: found ${found.toFixed(2)}, published ${published}`).toBeLessThanOrEqual(published * (1 + fraction));
}

describe("the car at rest", () => {
  it("has the real car's mass", () => {
    const rig = worldWithCar(0, 0, 90);
    expect(rig.car.body.mass()).toBeCloseTo(rig.vehicle.body.massKg, 0);
  });

  it("settles on its wheels, level, and does not creep in ten seconds", () => {
    const rig = worldWithCar(0, 0, 90);
    run(rig, 2);
    const settled = position(rig);
    run(rig, 10);
    expect(flatDistance(position(rig), settled)).toBeLessThan(0.01);
    expect(Math.abs(position(rig).y - settled.y)).toBeLessThan(0.01);
    expect(upness(rig)).toBeGreaterThan(0.995);
    expect(position(rig).y).toBeGreaterThan(0.1);
    expect(position(rig).y).toBeLessThan(rig.vehicle.body.centreOfMassHeightM + 0.3);
  });

  it("falls with the place's gravity", () => {
    const rig = worldWithCar(0, 0, 90);
    expect(rig.world.gravity.y).toBeCloseTo(-rig.place.gravityMs2, 6);
  });
});

describe("the car drives like its published figures", () => {
  it("reaches the published test speed (100 km/h) within 15 % of the published time", () => {
    const rig = worldWithCar(-4500, 0, 90);
    run(rig, 1);
    const published = rig.vehicle.published;
    expectWithin(secondsToReach(rig, published.testToSpeedMs, 60), published.testTimeS, 0.15, "0-100 km/h in seconds");
  }, 60_000);

  it("stops from the published test speed within 15 % of the published distance", () => {
    const rig = worldWithCar(-4500, 0, 90);
    run(rig, 1);
    const brakes = rig.vehicle.brakes;
    expect(secondsToReach(rig, brakes.testFromSpeedMs, 60)).toBeLessThan(60);
    let travelled = 0;
    let last = position(rig);
    for (let at = 0; at < 30 / STEP && forwardSpeed(rig) > 0.5; at++) {
      step(rig, actions({ brake: 1 }));
      travelled += flatDistance(position(rig), last);
      last = position(rig);
    }
    expectWithin(travelled, brakes.testStoppingDistanceM, 0.15, "100-0 km/h in metres");
  }, 60_000);

  it("tops out within 10 % of the published top speed", () => {
    const rig = worldWithCar(-5500, 0, 90);
    run(rig, 1);
    let fastest = 0;
    for (let at = 0; at < 150 / STEP; at++) {
      step(rig, actions({ accelerate: 1 }));
      fastest = Math.max(fastest, forwardSpeed(rig));
    }
    expectWithin(fastest, rig.vehicle.published.topSpeedMs, 0.1, "top speed in m/s");
  }, 120_000);

  it("turns as tightly as the real car: at full lock and walking pace, the outer front wheel's circle is within 10 % of the published one", () => {
    const rig = worldWithCar(0, 0, 0);
    run(rig, 1);
    const body = rig.vehicle.body;
    const outerFrontWheel = { x: body.wheelbaseM * (1 - body.frontAxleLoadShare), y: 0, z: -body.trackM / 2 };
    const traced: Vec3[] = [];
    for (let at = 0; at < 40 / STEP; at++) {
      step(rig, actions({ steer: 1, accelerate: forwardSpeed(rig) < 2 ? 0.3 : 0 }));
      const offset = rotate(turn(rig), outerFrontWheel);
      if (at > 10 / STEP) traced.push({ x: position(rig).x + offset.x, y: 0, z: position(rig).z + offset.z });
    }
    const across = (values: number[]) => Math.max(...values) - Math.min(...values);
    const diameter = (across(traced.map((point) => point.x)) + across(traced.map((point) => point.z))) / 2;
    expectWithin(diameter, rig.vehicle.wheels.turningCircleM, 0.1, "turning circle in metres");
  }, 60_000);
});

describe("the controls do what they say", () => {
  it("turns right when steering right, and left when steering left", () => {
    for (const [steer, sign] of [
      [1, 1],
      [-1, -1],
    ] as const) {
      const rig = worldWithCar(0, 0, 0);
      run(rig, 1);
      secondsToReach(rig, 5, 20);
      const before = headingOf(turn(rig));
      run(rig, 2, actions({ steer, accelerate: 0.2 }));
      expect(sign * headingChange(before, headingOf(turn(rig))), `steer ${steer}`).toBeGreaterThan(10);
    }
  });

  it("goes straight with no steering", () => {
    const rig = worldWithCar(0, 0, 0);
    run(rig, 1);
    secondsToReach(rig, 15, 20);
    expect(Math.abs(headingChange(0, headingOf(turn(rig))))).toBeLessThan(1);
  });

  it("reverses when brake is held from a standstill, slowly", () => {
    const rig = worldWithCar(0, 0, 0);
    run(rig, 1);
    run(rig, 5, actions({ brake: 1 }));
    expect(forwardSpeed(rig)).toBeLessThan(-0.5);
    expect(position(rig).z).toBeGreaterThan(rig.pose.position.z + 1);
    expect(forwardSpeed(rig)).toBeGreaterThan(-rig.vehicle.published.topSpeedMs / 2);
  });

  it("slows and stops by itself when no pedal is pressed", () => {
    const rig = worldWithCar(-4500, 0, 90);
    run(rig, 1);
    secondsToReach(rig, 10, 20);
    run(rig, 120);
    expect(Math.abs(forwardSpeed(rig))).toBeLessThan(0.2);
  }, 60_000);
});

describe("Flip upright and the return to the start", () => {
  it("puts a car on its roof back on its wheels where it is, facing the same way, stopped", () => {
    const rig = worldWithCar(0, 0, 90);
    run(rig, 1);
    rig.car.body.setRotation(quatAbout({ x: 1, y: 0, z: 0 }, Math.PI), true);
    run(rig, 3);
    expect(upness(rig)).toBeLessThan(0);
    const before = position(rig);
    const pose = flipCarUpright(rig.car, extent);
    expect(upness(rig)).toBeGreaterThan(0.999);
    expect(Math.abs(headingChange(90, headingOf(turn(rig))))).toBeLessThan(1);
    expect(flatDistance(position(rig), before)).toBeLessThan(0.01);
    expect(Math.hypot(rig.car.body.linvel().x, rig.car.body.linvel().y, rig.car.body.linvel().z)).toBeLessThan(1e-6);
    expect(pose.position.x).toBeCloseTo(position(rig).x, 6);
    run(rig, 3);
    expect(upness(rig)).toBeGreaterThan(0.995);
  });

  it("keeps a flipped car at least 3 m inside the map's edge, never inside the wall", () => {
    const rig = worldWithCar(299, -299.5, 0);
    run(rig, 1);
    flipCarUpright(rig.car, extent);
    expect(position(rig).x).toBeLessThanOrEqual(297 + 1e-6);
    expect(-position(rig).z).toBeGreaterThanOrEqual(-297 - 1e-6);
  });

  it("returns a car to exactly where the game began, stopped", () => {
    const rig = worldWithCar(0, 0, 90);
    run(rig, 1);
    secondsToReach(rig, 10, 20);
    const pose = returnCarToStart(rig.car);
    expect(flatDistance(position(rig), rig.pose.position)).toBeLessThan(1e-6);
    expect(pose.position).toEqual(rig.pose.position);
    expect(Math.abs(forwardSpeed(rig))).toBeLessThan(1e-6);
  });
});

describe("tragedy path: precision at the far corner of a 3 km map", () => {
  it("parks at the far corner without creeping, and drives there as at the centre", () => {
    const rig = worldWithCar(1450, -1450, 45);
    run(rig, 2);
    const settled = position(rig);
    run(rig, 10);
    expect(flatDistance(position(rig), settled)).toBeLessThan(0.01);
    expect(secondsToReach(rig, 10, 20)).toBeLessThan(20);
  });
});
