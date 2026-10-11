// Which OSM ways are roads a car may use, and how wide each one is. Sources:
// osm2lanes (a-b-street/osm2lanes, Apache-2.0: locale.rs lane widths by
// country, counts.rs lane counts, transform/tags_to_lanes/oneway.rs for
// roundabouts; techniques only), SUMO's use of the `width` tag
// (research/world-drive/28), the OSM wiki's Key:highway and Key:access
// (research/36 section 2). Design: docs/designs/tools/bake/roads.md.

export type Tags = Readonly<Record<string, string>>;

// The road kinds a car may use (research/36 section 2, "What we take" 1).
const DRIVABLE_HIGHWAYS: readonly string[] = [
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
];

// OSM's transport-mode order for access, most specific first (OSM wiki
// Key:access; approver's F22).
const ACCESS_TAGS_MOST_SPECIFIC_FIRST = ["motorcar", "motor_vehicle", "vehicle", "access"] as const;

// Sanity limits, our own choice, not measured: the widest roads near Omole are
// far below both, and a typing mistake would otherwise paint a grey blob
// across the map. A lanes tag is used only when it is a whole number from 1 to
// MOST_LANES; a width only up to WIDEST_ROAD_M.
const MOST_LANES = 12;
const WIDEST_ROAD_M = 50;
const WHOLE_NUMBER = /^\d+$/;
const PLAIN_NUMBER = /^\d+(?:\.\d+)?$/;
const TRAILING_METRES = /\s?m$/;

// Values of the oneway tag that mean one-way (osm2lanes oneway.rs): -1 is
// one-way against the drawing direction.
const ONE_WAY_VALUES: readonly string[] = ["yes", "true", "1", "-1"];

export function isDrivableRoad(tags: Tags): boolean {
  if (!DRIVABLE_HIGHWAYS.includes(tags["highway"] ?? "")) return false;
  if (tags["area"] === "yes") return false;
  // The most specific access tag present decides; private and destination
  // roads are kept, because estate streets are often tagged private.
  const deciding = ACCESS_TAGS_MOST_SPECIFIC_FIRST.find((key) => tags[key] !== undefined);
  if (deciding !== undefined && tags[deciding] === "no") return false;
  return true;
}

// A roundabout is one-way even when nobody tagged it so (osm2lanes).
export function isOneWay(tags: Tags): boolean {
  const oneway = tags["oneway"];
  if (oneway !== undefined) return ONE_WAY_VALUES.includes(oneway);
  return tags["junction"] === "roundabout";
}

// One lane on a one-way street and one each way otherwise, when the lanes tag
// is missing or unusable (osm2lanes counts.rs).
export function laneCount(tags: Tags): number {
  const lanes = tags["lanes"] ?? "";
  const tagged = Number(lanes);
  if (WHOLE_NUMBER.test(lanes) && tagged >= 1 && tagged <= MOST_LANES) return tagged;
  if (isOneWay(tags)) return 1;
  return 2;
}

// Only metres are safe to use without guessing: `7`, `7 m`, `7.5`. Feet,
// ranges, words and absurd numbers are not guessed at.
export function widthFromTag(text: string | undefined): number | "unreadable" | undefined {
  if (text === undefined) return undefined;
  const number = text.trim().replace(TRAILING_METRES, "");
  const metres = Number(number);
  if (PLAIN_NUMBER.test(number) && metres > 0 && metres <= WIDEST_ROAD_M) return metres;
  return "unreadable";
}

// A mapper's measured width wins; otherwise lanes times the place's lane
// width. Every tag that could not be used is noted for the bake report.
export function roadWidthMetres(wayId: number, tags: Tags, laneWidthM: number): { widthM: number; notes: string[] } {
  const tagged = widthFromTag(tags["width"]);
  if (typeof tagged === "number") return { widthM: tagged, notes: [] };
  const lanes = laneCount(tags);
  const widthM = lanes * laneWidthM;
  const notes: string[] = [];
  if (tagged === "unreadable") {
    notes.push(`way ${wayId} has a width we could not read ("${tags["width"]}"); drew it ${widthM} m wide from its lanes instead.`);
  }
  const lanesTag = tags["lanes"];
  if (lanesTag !== undefined && String(lanes) !== lanesTag) {
    notes.push(`way ${wayId} has a lanes tag we could not use ("${lanesTag}"); counted ${lanes} lanes instead.`);
  }
  return { widthM, notes };
}
