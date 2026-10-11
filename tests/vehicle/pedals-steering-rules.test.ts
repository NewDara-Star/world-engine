// What the pedals and the steering do, where the car is parked, when it may
// be flipped upright, and when it is rescued. Designs: src/vehicle/pedals.md,
// steering.md and car.md (approver's F7, F8, F12; decision E2 (b)).
import { describe, expect, it } from "vitest";
import { pedalCommand } from "../../src/vehicle/pedals.js";
import { steerRateFor, steeringAfter, steeringLimitRad } from "../../src/vehicle/steering.js";
import { maxBrakeForceN, maxSteerAngleRad } from "../../src/vehicle/rapier-settings.js";
import { forwardDriveForceN, rollingResistanceN } from "../../src/vehicle/drive-force.js";
import { canFlipUpright, carRescueNeeded, carStartPose, flatHeading, wheelCommands } from "../../src/vehicle/car.js";
import { hatchback, headingOf, multiply, placeDrivingOn, quatAbout, rotate, rotationForHeading } from "./fixtures.js";

const UP = { x: 0, y: 1, z: 0 };
const STEP = 1 / 60;
const extent = { westM: -300, southM: -300, eastM: 300, northM: 300 };

function start(changes: Record<string, unknown> = {}) {
  return { eastM: 100, northM: 200, headingDeg: 0, roadWidthM: 8, oneWay: false, ...changes };
}

// A car facing east (no turn), tipped about its own forward axis by some degrees.
function tipped(degrees: number) {
  return quatAbout({ x: 1, y: 0, z: 0 }, (degrees * Math.PI) / 180);
}

describe("pedals: brake, or reverse when stopped", () => {
  it("drives forward with accelerate, by how far it is pressed", () => {
    expect(pedalCommand(0.7, 0, 5)).toEqual({ drive: "forward", throttle: 0.7, brake: 0 });
    expect(pedalCommand(1, 0, 0)).toEqual({ drive: "forward", throttle: 1, brake: 0 });
  });

  it("brakes with brake while the car moves forward", () => {
    expect(pedalCommand(0, 1, 5)).toEqual({ drive: "none", throttle: 0, brake: 1 });
  });

  it("reverses with brake once the car has stopped, and keeps reversing", () => {
    expect(pedalCommand(0, 1, 0)).toEqual({ drive: "reverse", throttle: 1, brake: 0 });
    expect(pedalCommand(0, 0.6, 0.1)).toEqual({ drive: "reverse", throttle: 0.6, brake: 0 });
    expect(pedalCommand(0, 1, -3)).toEqual({ drive: "reverse", throttle: 1, brake: 0 });
  });

  it("brakes first when accelerate is pressed while rolling backwards", () => {
    expect(pedalCommand(0.8, 0, -3)).toEqual({ drive: "none", throttle: 0, brake: 0.8 });
  });

  it("lets the car roll when nothing is pressed", () => {
    expect(pedalCommand(0, 0, 10)).toEqual({ drive: "none", throttle: 0, brake: 0 });
  });

  it("brakes when both pedals are pressed at once: brake wins", () => {
    expect(pedalCommand(1, 0.5, 10)).toEqual({ drive: "none", throttle: 0, brake: 0.5 });
    expect(pedalCommand(1, 1, 0)).toEqual({ drive: "none", throttle: 0, brake: 1 });
  });
});

describe("steering: the wheels turn at a limited rate, and less at speed", () => {
  it("gives full lock at a crawl, and less the faster the car goes", () => {
    const v = hatchback();
    expect(steeringLimitRad(v, 0)).toBeCloseTo(maxSteerAngleRad(v), 12);
    expect(steeringLimitRad(v, 2)).toBeCloseTo(maxSteerAngleRad(v), 12);
    const limits = [5, 10, 20, 30].map((speed) => steeringLimitRad(v, speed));
    expect(limits.toSorted((a, b) => b - a)).toEqual(limits);
    expect(limits[3]).toBeLessThan(maxSteerAngleRad(v) / 3);
  });

  it("straightens faster than it turns in, and flicks across the middle fastest", () => {
    const towardLock = steerRateFor(0.2, 0.6);
    const backToMiddle = steerRateFor(0.6, 0.2);
    const acrossMiddle = steerRateFor(0.5, -0.5);
    expect(backToMiddle).toBeGreaterThan(towardLock);
    expect(acrossMiddle).toBeGreaterThan(backToMiddle);
  });

  it("moves the wheels toward the steer action and never past it", () => {
    const after = steeringAfter(0, 1, STEP);
    expect(after).toBeGreaterThan(0);
    expect(after).toBeLessThan(0.2);
    expect(steeringAfter(0, 1, 10)).toBe(1);
    expect(steeringAfter(0.5, 0.5, STEP)).toBe(0.5);
    expect(steeringAfter(0.1, -1, 10)).toBe(-1);
  });

  it("turns the same on a 60 Hz phone and a 120 Hz Mac", () => {
    const twice = steeringAfter(steeringAfter(0.2, 1, STEP / 2), 1, STEP / 2);
    expect(twice).toBeCloseTo(steeringAfter(0.2, 1, STEP), 12);
  });
});

describe("where the car is parked: the place's driving side, from the place file", () => {
  it("parks a quarter of the road's width to the right on a two-way road where the place drives on the right", () => {
    const pose = carStartPose(start(), placeDrivingOn("right"), hatchback());
    expect(pose.position.x).toBeCloseTo(102, 9);
    expect(pose.position.z).toBeCloseTo(-200, 9);
  });

  it("parks a quarter of the road's width to the left where the place drives on the left", () => {
    const pose = carStartPose(start(), placeDrivingOn("left"), hatchback());
    expect(pose.position.x).toBeCloseTo(98, 9);
    expect(pose.position.z).toBeCloseTo(-200, 9);
  });

  it("works out right and left from the heading: facing east, right is south", () => {
    const pose = carStartPose(start({ headingDeg: 90 }), placeDrivingOn("right"), hatchback());
    expect(pose.position.x).toBeCloseTo(100, 9);
    expect(pose.position.z).toBeCloseTo(-198, 9);
  });

  it("parks in the middle of a one-way road, on either side's places", () => {
    for (const side of ["left", "right"] as const) {
      const pose = carStartPose(start({ oneWay: true, roadWidthM: 3.5 }), placeDrivingOn(side), hatchback());
      expect(pose.position.x, side).toBeCloseTo(100, 9);
    }
  });

  it("faces along the road, and starts 5 cm above where the wheels sit", () => {
    const v = hatchback();
    for (const headingDeg of [0, 90, 200, 359]) {
      const pose = carStartPose(start({ headingDeg }), placeDrivingOn("right"), v);
      expect(headingOf(pose.rotation), String(headingDeg)).toBeCloseTo(headingDeg, 6);
      expect(pose.position.y).toBeCloseTo(v.body.centreOfMassHeightM + 0.05, 9);
    }
  });
});

describe("which way the car faces along the ground", () => {
  it("gives the car's heading flat on the ground, one long, whatever its pitch and roll", () => {
    const facingNorth = rotationForHeading(0);
    for (const tilt of [0, 20, -35, 180]) {
      const leaning = multiply(facingNorth, tipped(tilt));
      const heading = flatHeading(leaning);
      expect(Math.hypot(heading.x, heading.z), String(tilt)).toBeCloseTo(1, 9);
      expect(heading.x, String(tilt)).toBeCloseTo(0, 9);
      expect(heading.z, String(tilt)).toBeCloseTo(-1, 9);
    }
  });

  it("still gives a direction for a car standing on its nose, never 'not a number'", () => {
    const noseDown = quatAbout({ x: 0, y: 0, z: 1 }, -Math.PI / 2);
    expect(rotate(noseDown, { x: 1, y: 0, z: 0 }).y).toBeCloseTo(-1, 9);
    const heading = flatHeading(noseDown);
    expect(heading.x).toBeCloseTo(1, 9);
    expect(heading.z).toBeCloseTo(0, 9);
  });

  it("still gives a direction for a car standing on its tail", () => {
    const heading = flatHeading(quatAbout({ x: 0, y: 0, z: 1 }, Math.PI / 2));
    expect(Number.isFinite(heading.x) && Number.isFinite(heading.z)).toBe(true);
    expect(Math.hypot(heading.x, heading.z)).toBeCloseTo(1, 9);
  });
});

describe("Flip upright's rule: only for a car that has stopped or tipped over (decision E2 (b))", () => {
  it("flips a car that has nearly stopped, upright or not", () => {
    expect(canFlipUpright(1, tipped(0))).toBe(true);
    expect(canFlipUpright(0, tipped(180))).toBe(true);
    expect(canFlipUpright(0, tipped(90))).toBe(true);
  });

  it("does not flip an upright car that is moving: it is not a free emergency stop", () => {
    expect(canFlipUpright(16.7, tipped(0))).toBe(false);
    expect(canFlipUpright(1.4, tipped(0))).toBe(false);
    expect(canFlipUpright(10, tipped(30))).toBe(false);
  });

  it("flips a moving car that has tipped more than 45 degrees, such as one sliding on its side", () => {
    expect(canFlipUpright(10, tipped(60))).toBe(true);
    expect(canFlipUpright(10, tipped(-60))).toBe(true);
    expect(canFlipUpright(10, multiply(rotationForHeading(135), quatAbout({ x: 0, y: 0, z: 1 }, Math.PI / 2)))).toBe(true);
  });
});

describe("rescue: a car that fell through the ground or left the map goes back to the start", () => {
  it("leaves a car on the map alone", () => {
    expect(carRescueNeeded({ x: 0, y: 0.5, z: 0 }, extent)).toBe("none");
    expect(carRescueNeeded({ x: 309, y: 0.5, z: -309 }, extent)).toBe("none");
    expect(carRescueNeeded({ x: 0, y: -9, z: 0 }, extent)).toBe("none");
  });

  it("notices a car more than 10 m below the ground", () => {
    expect(carRescueNeeded({ x: 0, y: -10.5, z: 0 }, extent)).toBe("fell-through-ground");
  });

  it("notices a car more than 10 m outside the map, in every direction", () => {
    for (const position of [
      { x: 311, y: 0.5, z: 0 },
      { x: -311, y: 0.5, z: 0 },
      { x: 0, y: 0.5, z: -311 },
      { x: 0, y: 0.5, z: 311 },
    ]) {
      expect(carRescueNeeded(position, extent), JSON.stringify(position)).toBe("left-map");
    }
  });
});

describe("wheel commands: from the pedals to a push and a brake on each wheel", () => {
  const place = placeDrivingOn("right");
  const firstGear = { gear: 1, changeLeftS: 0 };

  function drivenWheels(): number[] {
    const axle = hatchback().drivenAxle;
    if (axle === "front") return [0, 1];
    return axle === "rear" ? [2, 3] : [0, 1, 2, 3];
  }

  it("with no pedal, brakes each wheel by a quarter of rolling resistance, as an impulse for the step", () => {
    const v = hatchback();
    const wheels = wheelCommands(v, pedalCommand(0, 0, 10), firstGear, 10, place, STEP);
    expect(wheels).toHaveLength(4);
    for (const wheel of wheels) {
      expect(wheel.pushN).toBe(0);
      expect(wheel.brakeImpulseNs).toBeCloseTo((rollingResistanceN(v, place.gravityMs2) / 4) * STEP, 9);
    }
  });

  it("with the brake, brakes all four wheels together as hard as the published brake test, plus rolling resistance", () => {
    const v = hatchback();
    const wheels = wheelCommands(v, pedalCommand(0, 1, 20), firstGear, 20, place, STEP);
    const total = wheels.reduce((sum: number, wheel: { brakeImpulseNs: number }) => sum + wheel.brakeImpulseNs, 0);
    expect(total).toBeCloseTo((maxBrakeForceN(v) + rollingResistanceN(v, place.gravityMs2)) * STEP, 6);
    const front = (wheels[0]?.brakeImpulseNs ?? 0) + (wheels[1]?.brakeImpulseNs ?? 0);
    expect(front - rollingResistanceN(v, place.gravityMs2) * STEP / 2).toBeCloseTo(v.brakes.frontShare * maxBrakeForceN(v) * STEP, 6);
  });

  it("with the throttle, pushes the driven wheels equally and brakes none, because Rapier ignores a brake on a driven wheel", () => {
    const v = hatchback();
    const wheels = wheelCommands(v, pedalCommand(1, 0, 0), firstGear, 0, place, STEP);
    const driven = drivenWheels();
    const expected = (forwardDriveForceN(v, firstGear, 0, 1) - rollingResistanceN(v, place.gravityMs2)) / driven.length;
    wheels.forEach((wheel: { pushN: number; brakeImpulseNs: number }, index: number) => {
      expect(wheel.pushN, `wheel ${index}`).toBeCloseTo(driven.includes(index) ? expected : 0, 6);
      expect(wheel.brakeImpulseNs, `wheel ${index}`).toBe(0);
    });
  });

  it("pushes backwards in reverse", () => {
    const wheels = wheelCommands(hatchback(), pedalCommand(0, 1, 0), firstGear, 0, place, STEP);
    for (const index of drivenWheels()) expect(wheels[index]?.pushN).toBeLessThan(0);
  });

  it("never turns a push smaller than rolling resistance round into a pull the other way", () => {
    const wheels = wheelCommands(hatchback(), pedalCommand(0.000001, 0, 0), firstGear, 0, place, STEP);
    for (const wheel of wheels) expect(wheel.pushN).toBeGreaterThanOrEqual(0);
  });
});

describe("tragedy path", () => {
  it("still faces the car the right way after a full circle of headings, with no drift", () => {
    const v = hatchback();
    for (let headingDeg = 0; headingDeg < 360; headingDeg += 15) {
      const pose = carStartPose(start({ headingDeg, eastM: 1450, northM: -1450 }), placeDrivingOn("right"), v);
      expect(Math.abs(((headingOf(pose.rotation) - headingDeg + 540) % 360) - 180), String(headingDeg)).toBeLessThan(1e-6);
    }
  });

  it("keeps a turn that has gathered rounding error over hours one long when finding its heading", () => {
    let turn = rotationForHeading(0);
    const nudge = quatAbout(UP, 0.001);
    for (let step = 0; step < 100_000; step++) turn = multiply(turn, nudge);
    const heading = flatHeading(turn);
    expect(Math.hypot(heading.x, heading.z)).toBeCloseTo(1, 9);
  });
});
