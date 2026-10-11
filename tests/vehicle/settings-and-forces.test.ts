// Real car figures turned into Rapier's numbers, and the engine, gearbox, air
// and road forces. Designs: src/vehicle/rapier-settings.md (approver's F3)
// and src/vehicle/drive-force.md (decision E1 (a): real gears). Every
// expected value is worked out here from the design's own formulas and the
// hatchback's figures, so no number is made up in the test.
import { describe, expect, it } from "vitest";
import {
  cornerMassKg,
  maxBrakeForceN,
  maxSteerAngleRad,
  suspensionForAxle,
  tyreSettings,
  wheelMountPoints,
} from "../../src/vehicle/rapier-settings.js";
import {
  airDragN,
  engineRpm,
  engineTorqueNm,
  forwardDriveForceN,
  gearboxAfter,
  reverseDriveForceN,
  rollingResistanceN,
} from "../../src/vehicle/drive-force.js";
import { hatchback } from "./fixtures.js";

const STEP = 1 / 60;

function car() {
  return hatchback();
}

// Road speed at which the engine reaches its redline in a gear (drive-force.md).
function redlineSpeed(ratio: number): number {
  const v = car();
  return (v.engine.redlineRpm * 2 * Math.PI * v.wheels.radiusM) / (60 * ratio * v.engine.finalDriveRatio);
}

function gearRatio(gear: number): number {
  return car().engine.forwardGearRatios[gear - 1] ?? Number.NaN;
}

function wheelForce(torqueNm: number, ratio: number): number {
  const v = car();
  return (torqueNm * ratio * v.engine.finalDriveRatio * v.engine.drivetrainEfficiency) / v.wheels.radiusM;
}

describe("Rapier settings from real figures", () => {
  it("shares the mass between the wheels by the front axle load: the four corners add up to the whole car", () => {
    const v = car();
    expect(cornerMassKg(v, "front")).toBeCloseTo((v.body.massKg * v.body.frontAxleLoadShare) / 2, 9);
    expect(cornerMassKg(v, "rear")).toBeCloseTo((v.body.massKg * (1 - v.body.frontAxleLoadShare)) / 2, 9);
    expect(2 * cornerMassKg(v, "front") + 2 * cornerMassKg(v, "rear")).toBeCloseTo(v.body.massKg, 9);
  });

  it("turns ride frequency and damping ratio into Rapier's springs, which Rapier multiplies by the car's mass", () => {
    const v = car();
    const g = 9.781;
    for (const axle of ["front", "rear"] as const) {
      const omega = 2 * Math.PI * v.wheels.rideFrequencyHz;
      const corner = cornerMassKg(v, axle);
      const restLength = g / omega ** 2 + v.wheels.suspensionTravelM / 2;
      const suspension = suspensionForAxle(v, axle, g);
      expect(suspension.suspensionStiffness, axle).toBeCloseTo((omega ** 2 * corner) / v.body.massKg, 9);
      expect(suspension.suspensionCompression, axle).toBeCloseTo((2 * v.wheels.dampingRatio * omega * corner) / v.body.massKg, 9);
      expect(suspension.suspensionRelaxation, axle).toBeCloseTo(suspension.suspensionCompression, 12);
      expect(suspension.suspensionRestLength, axle).toBeCloseTo(restLength, 9);
      expect(suspension.maxSuspensionTravel, axle).toBeCloseTo(restLength, 9);
      expect(suspension.maxSuspensionForce, axle).toBeCloseTo(omega ** 2 * corner * restLength * 2, 6);
    }
  });

  it("sags the springs less on a planet with less gravity", () => {
    const v = car();
    expect(suspensionForAxle(v, "front", 3.71).suspensionRestLength).toBeLessThan(suspensionForAxle(v, "front", 9.781).suspensionRestLength);
  });

  it("works out full lock from the kerb-to-kerb turning circle, traced by the outer front wheel", () => {
    const v = car();
    const expected = Math.asin(v.body.wheelbaseM / (v.wheels.turningCircleM / 2 - v.body.trackM / 2));
    expect(maxSteerAngleRad(v)).toBeCloseTo(expected, 12);
    expect(maxSteerAngleRad(v)).toBeGreaterThan(0.3);
    expect(maxSteerAngleRad(v)).toBeLessThan(0.8);
  });

  it("brakes the whole car hard enough to stop in the published distance: mass times v squared over twice the distance", () => {
    const v = car();
    const deceleration = v.brakes.testFromSpeedMs ** 2 / (2 * v.brakes.testStoppingDistanceM);
    expect(maxBrakeForceN(v)).toBeCloseTo(v.body.massKg * deceleration, 6);
  });

  it("uses the tyre's real friction, not Rapier's default of 10.5", () => {
    const v = car();
    expect(tyreSettings(v)).toEqual({ frictionSlip: v.wheels.tyreFriction, sideFrictionStiffness: 1 });
  });

  it("puts four wheels on the car", () => {
    expect(wheelMountPoints(car())).toHaveLength(4);
  });
});

describe("engine and gearbox", () => {
  it("turns road speed into engine speed through the gear and final drive", () => {
    const v = car();
    const rpm = engineRpm(v, 10, gearRatio(2));
    expect(rpm).toBeCloseTo((10 * gearRatio(2) * v.engine.finalDriveRatio * 60) / (2 * Math.PI * v.wheels.radiusM), 9);
  });

  it("gives peak torque low down and at a standstill, and peak power's torque higher up", () => {
    const v = car();
    expect(engineTorqueNm(v, 0)).toBe(v.engine.peakTorqueNm);
    const nearRedline = v.engine.redlineRpm - 1;
    const powerTorque = (v.engine.peakPowerKw * 1000) / ((nearRedline * 2 * Math.PI) / 60);
    expect(engineTorqueNm(v, nearRedline)).toBeCloseTo(Math.min(v.engine.peakTorqueNm, powerTorque), 9);
    expect(engineTorqueNm(v, 1000)).toBeLessThanOrEqual(v.engine.peakTorqueNm);
  });

  it("gives nothing past the redline: the rev limiter", () => {
    const v = car();
    expect(engineTorqueNm(v, v.engine.redlineRpm + 1)).toBe(0);
  });

  it("changes up at the redline, with a gear change under way for gearChangeS", () => {
    const v = car();
    const after = gearboxAfter(v, { gear: 1, changeLeftS: 0 }, redlineSpeed(gearRatio(1)) + 0.01, STEP);
    expect(after).toEqual({ gear: 2, changeLeftS: v.engine.gearChangeS });
  });

  it("stays in gear while a change is under way, counting the time down but never below 0", () => {
    const v = car();
    expect(gearboxAfter(v, { gear: 2, changeLeftS: 0.3 }, 1, 0.1)).toEqual({ gear: 2, changeLeftS: expect.closeTo(0.2, 9) });
    expect(gearboxAfter(v, { gear: 2, changeLeftS: 0.01 }, 1, 0.1)).toEqual({ gear: 2, changeLeftS: 0 });
  });

  it("changes down when slowing, so the car pulls again", () => {
    const after = gearboxAfter(car(), { gear: 3, changeLeftS: 0 }, 2, STEP);
    expect(after.gear).toBe(2);
    expect(after.changeLeftS).toBeGreaterThan(0);
  });

  it("does not hunt between two gears straight after changing up", () => {
    const v = car();
    const speed = redlineSpeed(gearRatio(1)) + 0.01;
    const changed = gearboxAfter(v, { gear: 1, changeLeftS: 0 }, speed, STEP);
    const settled = gearboxAfter(v, { ...changed, changeLeftS: 0 }, speed, STEP);
    expect(settled.gear).toBe(2);
  });

  it("does not change up past the top gear", () => {
    const v = car();
    const top = v.engine.forwardGearRatios.length;
    const after = gearboxAfter(v, { gear: top, changeLeftS: 0 }, redlineSpeed(gearRatio(top)) + 1, STEP);
    expect(after).toEqual({ gear: top, changeLeftS: 0 });
  });
});

describe("drive, air and road forces", () => {
  it("pulls hardest from a standstill in first gear, by the throttle", () => {
    const v = car();
    const first = wheelForce(v.engine.peakTorqueNm, gearRatio(1));
    expect(forwardDriveForceN(v, { gear: 1, changeLeftS: 0 }, 0, 1)).toBeCloseTo(first, 6);
    expect(forwardDriveForceN(v, { gear: 1, changeLeftS: 0 }, 0, 0.5)).toBeCloseTo(first / 2, 6);
    expect(forwardDriveForceN(v, { gear: 1, changeLeftS: 0 }, 0, 0)).toBe(0);
  });

  it("gives no drive while a gear change is under way", () => {
    expect(forwardDriveForceN(car(), { gear: 2, changeLeftS: 0.1 }, 10, 1)).toBe(0);
  });

  it("pulls less in a higher gear at the same speed", () => {
    const v = car();
    expect(forwardDriveForceN(v, { gear: 3, changeLeftS: 0 }, 10, 1)).toBeLessThan(forwardDriveForceN(v, { gear: 2, changeLeftS: 0 }, 10, 1));
  });

  it("reverses strongly from a standstill and stops pushing at reverse's rev limit", () => {
    const v = car();
    expect(reverseDriveForceN(v, 0, 1)).toBeCloseTo(wheelForce(v.engine.peakTorqueNm, v.engine.reverseGearRatio), 6);
    expect(reverseDriveForceN(v, redlineSpeed(v.engine.reverseGearRatio) + 0.01, 1)).toBe(0);
  });

  it("holds the car back with air drag of one half rho Cd A v squared, from the place's air density", () => {
    const v = car();
    const expected = 0.5 * 1.167 * v.air.dragCoefficient * v.air.frontalAreaM2 * 30 ** 2;
    expect(Math.abs(airDragN(v, 30, 1.167))).toBeCloseTo(expected, 6);
    expect(Math.abs(airDragN(v, 30, 0.02))).toBeLessThan(Math.abs(airDragN(v, 30, 1.167)));
    expect(airDragN(v, 0, 1.167)).toBeCloseTo(0, 12);
  });

  it("slows a rolling car by rolling resistance, Crr times mass times the place's gravity", () => {
    const v = car();
    expect(rollingResistanceN(v, 9.781)).toBeCloseTo(v.wheels.rollingResistance * v.body.massKg * 9.781, 9);
  });

  it("never gives a force that is not a number, at any speed from standing to past top speed", () => {
    const v = car();
    for (let speed = 0; speed <= 100; speed += 0.5) {
      for (let gear = 1; gear <= v.engine.forwardGearRatios.length; gear++) {
        expect(Number.isFinite(forwardDriveForceN(v, { gear, changeLeftS: 0 }, speed, 1)), `${speed} m/s in gear ${gear}`).toBe(true);
      }
      expect(Number.isFinite(reverseDriveForceN(v, speed, 1))).toBe(true);
    }
  });
});
