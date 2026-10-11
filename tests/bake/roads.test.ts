// Which OSM ways are roads a car may use, and how many lanes they have.
// Design: tools/bake/roads.md (OSM access order motorcar, motor_vehicle,
// vehicle, access; osm2lanes lane counts and its roundabout rule).
import { describe, expect, it } from "vitest";
import { isDrivableRoad, isOneWay, laneCount } from "../../tools/bake/roads.js";

describe("which roads: happy path", () => {
  it.each([
    "motorway",
    "trunk",
    "primary",
    "secondary",
    "tertiary",
    "motorway_link",
    "trunk_link",
    "primary_link",
    "secondary_link",
    "tertiary_link",
    "unclassified",
    "residential",
    "living_street",
    "service",
    "road",
  ])("keeps highway=%s, a road a car may use", (kind) => {
    expect(isDrivableRoad({ highway: kind })).toBe(true);
  });

  it.each(["footway", "path", "cycleway", "pedestrian", "steps", "bridleway", "track", "construction", "proposed", "busway"])(
    "drops highway=%s: no footpaths, farm tracks or roads not built yet drawn as streets",
    (kind) => {
      expect(isDrivableRoad({ highway: kind })).toBe(false);
    },
  );

  it("keeps private and destination roads, because estate streets are often tagged private", () => {
    expect(isDrivableRoad({ highway: "residential", access: "private" })).toBe(true);
    expect(isDrivableRoad({ highway: "residential", access: "destination" })).toBe(true);
  });
});

describe("which roads: sad path", () => {
  it("drops a way with no highway tag at all", () => {
    expect(isDrivableRoad({})).toBe(false);
    expect(isDrivableRoad({ name: "Some Street" })).toBe(false);
  });

  it("drops a square or plaza drawn as a road outline (area=yes)", () => {
    expect(isDrivableRoad({ highway: "residential", area: "yes" })).toBe(false);
  });

  it.each([{ access: "no" }, { motor_vehicle: "no" }, { motorcar: "no" }, { vehicle: "no" }])("drops a road closed to cars: %o", (closed) => {
    expect(isDrivableRoad({ highway: "residential", ...closed })).toBe(false);
  });
});

describe("which roads: idiot-proof path (the most specific access tag decides)", () => {
  it("keeps a road closed to all traffic but open to cars: access=no with motorcar=yes", () => {
    expect(isDrivableRoad({ highway: "service", access: "no", motorcar: "yes" })).toBe(true);
    expect(isDrivableRoad({ highway: "service", access: "no", motor_vehicle: "yes" })).toBe(true);
    expect(isDrivableRoad({ highway: "service", vehicle: "no", motorcar: "yes" })).toBe(true);
  });

  it("drops a road open to traffic but closed to cars: motorcar=no with access=yes", () => {
    expect(isDrivableRoad({ highway: "service", access: "yes", motorcar: "no" })).toBe(false);
    expect(isDrivableRoad({ highway: "service", vehicle: "yes", motor_vehicle: "no" })).toBe(false);
  });

  it("does not guess at a road kind written another way: Residential is not a road kind", () => {
    expect(isDrivableRoad({ highway: "Residential" })).toBe(false);
    expect(isDrivableRoad({ highway: " residential" })).toBe(false);
  });
});

describe("one-way roads", () => {
  it.each(["yes", "true", "1", "-1"])("reads oneway=%s as one-way", (value) => {
    expect(isOneWay({ highway: "residential", oneway: value })).toBe(true);
  });

  it.each(["no", "false", "0", "reversible", "alternating"])("reads oneway=%s as two-way", (value) => {
    expect(isOneWay({ highway: "residential", oneway: value })).toBe(false);
  });

  it("treats an untagged roundabout as one-way, as mapping tools do", () => {
    expect(isOneWay({ highway: "residential", junction: "roundabout" })).toBe(true);
  });

  it("lets a oneway tag on a roundabout decide", () => {
    expect(isOneWay({ highway: "residential", junction: "roundabout", oneway: "no" })).toBe(false);
  });

  it("treats a street with no oneway tag as two-way", () => {
    expect(isOneWay({ highway: "residential" })).toBe(false);
  });
});

describe("how many lanes", () => {
  it("uses a lanes tag that is a whole number from 1 to 12", () => {
    expect(laneCount({ highway: "primary", lanes: "4" })).toBe(4);
    expect(laneCount({ highway: "primary", lanes: "1" })).toBe(1);
    expect(laneCount({ highway: "primary", lanes: "12" })).toBe(12);
  });

  it("counts one lane on a one-way street and two otherwise, when there is no lanes tag", () => {
    expect(laneCount({ highway: "residential" })).toBe(2);
    expect(laneCount({ highway: "residential", oneway: "yes" })).toBe(1);
    expect(laneCount({ highway: "residential", junction: "roundabout" })).toBe(1);
  });

  it.each(["0", "13", "2.5", "abc", "", "-2", "2;3", "1e1"])("does not use lanes=%s, and counts lanes the usual way instead", (lanes) => {
    expect(laneCount({ highway: "residential", lanes })).toBe(2);
    expect(laneCount({ highway: "residential", lanes, oneway: "yes" })).toBe(1);
  });
});
