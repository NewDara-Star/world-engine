// The physics world: the place's gravity, one flat ground collider per
// 100 m square, walls at the map's edge, fixed 1/60 s steps and smooth
// drawing between them. Design: src/game/physics.md (Sketchbook's fixed
// step with an accumulator, research/36 section 3).
import { beforeAll, describe, expect, it } from "vitest";
import { addGroundCollider, addMapEdgeWalls, blendPoses, createPhysicsWorld, physicsStepsForFrame } from "../../src/game/physics.js";
import RAPIER from "@dimforge/rapier3d-compat";
import { checkedPlace, tinyPlaceTextWith } from "../bake/tiny.js";
import { headingOf, rotationForHeading } from "../vehicle/fixtures.js";

const STEP = 1 / 60;
const extent = { westM: -300, southM: -300, eastM: 300, northM: 300 };

beforeAll(async () => {
  await RAPIER.init();
});

type World = ReturnType<typeof createPhysicsWorld>;

function ballAt(world: World, x: number, y: number, z: number) {
  const body = world.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(x, y, z));
  world.createCollider(RAPIER.ColliderDesc.ball(0.5), body);
  return body;
}

function runFor(world: World, seconds: number): void {
  for (let at = 0; at < Math.round(seconds / STEP); at++) world.step();
}

describe("fixed steps", () => {
  it("takes one step for a 60 Hz frame", () => {
    expect(physicsStepsForFrame(0, STEP)).toEqual({ steps: 1, leftOverS: expect.closeTo(0, 9), blend: expect.closeTo(0, 6) });
  });

  it("takes no step for half a step, keeping it for next time, and blends halfway", () => {
    expect(physicsStepsForFrame(0, STEP / 2)).toEqual({ steps: 0, leftOverS: expect.closeTo(STEP / 2, 12), blend: expect.closeTo(0.5, 9) });
  });

  it("steps at 60 Hz on a 120 Hz screen: 120 frames make 60 steps", () => {
    let leftOver = 0;
    let steps = 0;
    for (let frame = 0; frame < 120; frame++) {
      const result = physicsStepsForFrame(leftOver, 1 / 120);
      steps += result.steps;
      leftOver = result.leftOverS;
    }
    expect(Math.abs(steps - 60)).toBeLessThanOrEqual(1);
  });

  it("catches up only a little after a long pause: at most 5 steps, nothing left over, blend 1", () => {
    expect(physicsStepsForFrame(0, 10)).toEqual({ steps: 5, leftOverS: 0, blend: 1 });
    expect(physicsStepsForFrame(0.01, 0.25)).toEqual({ steps: 5, leftOverS: 0, blend: 1 });
  });

  it("keeps its count over a three-hour session of uneven frames: about 648,000 steps", () => {
    let leftOver = 0;
    let steps = 0;
    const lengths = [1 / 60, 1 / 120, 1 / 50, 1 / 75];
    for (let frame = 0; frame < 3 * 3600 * 4; frame++) {
      const result = physicsStepsForFrame(leftOver, lengths[frame % 4] ?? STEP);
      steps += result.steps;
      leftOver = result.leftOverS;
    }
    const seconds = 3 * 3600 * (1 / 60 + 1 / 120 + 1 / 50 + 1 / 75);
    expect(Math.abs(steps - seconds * 60)).toBeLessThanOrEqual(1);
  });
});

describe("smooth drawing between steps", () => {
  const before = { position: { x: 0, y: 0, z: 0 }, rotation: rotationForHeading(170) };
  const after = { position: { x: 10, y: 2, z: -4 }, rotation: rotationForHeading(190) };

  it("blends the position by the fraction", () => {
    expect(blendPoses(before, after, 0.5).position).toEqual({ x: 5, y: 1, z: -2 });
    expect(blendPoses(before, after, 0).position).toEqual(before.position);
    expect(blendPoses(before, after, 1).position).toEqual(after.position);
  });

  it("turns the short way round: halfway from 170° to 190° is 180°, not 0°", () => {
    expect(headingOf(blendPoses(before, after, 0.5).rotation)).toBeCloseTo(180, 6);
  });
});

describe("the physics world", () => {
  it("pulls down with the place's own gravity, and steps 1/60 s", () => {
    const world = createPhysicsWorld(checkedPlace("tiny.json", tinyPlaceTextWith({})));
    expect(world.gravity).toEqual({ x: 0, y: expect.closeTo(-9.781, 6), z: 0 });
    expect(world.timestep).toBeCloseTo(STEP, 9);
  });

  it("gives each square flat ground at height 0 you can stand on, anywhere in the square", () => {
    const world = createPhysicsWorld(checkedPlace("tiny.json", tinyPlaceTextWith({})));
    addGroundCollider(world, { east: 0, north: 0 });
    addGroundCollider(world, { east: -1, north: -1 });
    const balls = [ballAt(world, 50, 3, -50), ballAt(world, 1, 3, -99), ballAt(world, -50, 3, 50)];
    runFor(world, 3);
    for (const ball of balls) expect(ball.translation().y).toBeCloseTo(0.5, 1);
  });

  it("lets a removed square's ground go: nothing holds a ball up there any more", () => {
    const world = createPhysicsWorld(checkedPlace("tiny.json", tinyPlaceTextWith({})));
    const ground = addGroundCollider(world, { east: 0, north: 0 });
    world.removeCollider(world.getCollider(ground), false);
    const ball = ballAt(world, 50, 3, -50);
    runFor(world, 2);
    expect(ball.translation().y).toBeLessThan(-5);
  });

  it("stops a car-sized thing at the map's edge with an invisible wall on every side, corners closed", () => {
    const world = createPhysicsWorld(checkedPlace("tiny.json", tinyPlaceTextWith({})));
    world.createCollider(RAPIER.ColliderDesc.cuboid(400, 0.5, 400).setTranslation(0, -0.5, 0));
    addMapEdgeWalls(world, extent);
    const throws = [
      { start: { x: 290, z: 0 }, velocity: { x: 20, z: 0 } },
      { start: { x: -290, z: 0 }, velocity: { x: -20, z: 0 } },
      { start: { x: 0, z: -290 }, velocity: { x: 0, z: -20 } },
      { start: { x: 0, z: 290 }, velocity: { x: 0, z: 20 } },
      { start: { x: 290, z: -290 }, velocity: { x: 14, z: -14 } },
    ];
    const balls = throws.map((one) => {
      const ball = ballAt(world, one.start.x, 0.5, one.start.z);
      ball.setLinvel({ x: one.velocity.x, y: 0, z: one.velocity.z }, true);
      return ball;
    });
    runFor(world, 3);
    for (const ball of balls) {
      const at = ball.translation();
      expect(Math.abs(at.x), JSON.stringify(at)).toBeLessThanOrEqual(300);
      expect(Math.abs(at.z), JSON.stringify(at)).toBeLessThanOrEqual(300);
    }
  });
});
