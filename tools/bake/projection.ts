// Latitude and longitude to metres east and north of the place centre. For a
// 3 km place, a flat map using the Earth's curvature at the centre is accurate
// to about 4 cm at the far corners (research/36 section 2, item 5).
// WGS84 defining values a = 6378137 m, f = 1/298.257223563 (NIMA TR8350.2, the
// same ellipsoid as the place files' gravity, research/30). Radii of
// curvature: meridian M = a(1 − e²) / (1 − e² sin²φ)^1.5, prime vertical
// N = a / √(1 − e² sin²φ), e² = f(2 − f) (standard geodesy; checked by the
// approver, docs/reviews/slice-1-approver.md). Design:
// docs/designs/tools/bake/projection.md.
import type { MapPoint } from "../../src/world/grid.js";

const WGS84_SEMI_MAJOR_AXIS_M = 6378137;
const WGS84_FLATTENING = 1 / 298.257223563;

export interface LatLon {
  lat: number;
  lon: number;
}

export function radiiOfCurvature(latDeg: number): { meridianM: number; primeVerticalM: number } {
  const eSquared = WGS84_FLATTENING * (2 - WGS84_FLATTENING);
  const sinLat = Math.sin((latDeg * Math.PI) / 180);
  const w = 1 - eSquared * sinLat * sinLat;
  return {
    meridianM: (WGS84_SEMI_MAJOR_AXIS_M * (1 - eSquared)) / w ** 1.5,
    primeVerticalM: WGS84_SEMI_MAJOR_AXIS_M / Math.sqrt(w),
  };
}

// The place centre is at zero, so positions stay precise without a floating
// origin at this size (research/36 section 5).
export function localProjection(centre: LatLon): (point: LatLon) => MapPoint {
  const radii = radiiOfCurvature(centre.lat);
  const metresPerDegreeNorth = (radii.meridianM * Math.PI) / 180;
  const metresPerDegreeEast = (radii.primeVerticalM * Math.cos((centre.lat * Math.PI) / 180) * Math.PI) / 180;
  // The same sum for every node, so two roads that share a node meet exactly.
  function metresFromCentre(point: LatLon): MapPoint {
    return {
      eastM: (point.lon - centre.lon) * metresPerDegreeEast,
      northM: (point.lat - centre.lat) * metresPerDegreeNorth,
    };
  }
  return metresFromCentre;
}
