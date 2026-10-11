# tools/bake/projection.ts

Drawn from the code by `npm run diagrams` (TypeScript compiler, no AI). Do not edit by hand: change the code, then run it again.

## radiiOfCurvature

```mermaid
flowchart TD
  n1(["radiiOfCurvature"])
  n2["const eSquared = WGS84_FLATTENING * (2 - WGS84_FLATTENING);"]
  n3["const sinLat = Math.sin((latDeg * Math.PI) / 180);"]
  n4["const w = 1 - eSquared * sinLat * sinLat;"]
  n5(["return { meridianM: (WGS84_SEMI_MAJOR_AXIS_M * (1 - eSquare…"])
  n1 --> n2
  n2 --> n3
  n3 --> n4
  n4 --> n5
```

## localProjection

```mermaid
flowchart TD
  n1(["localProjection"])
  n2["const radii = radiiOfCurvature(centre.lat);<br/>calls radiiOfCurvature"]
  n3["const metresPerDegreeNorth = (radii.meridianM * Math.PI) / …"]
  n4["const metresPerDegreeEast = (radii.primeVerticalM * Math.co…"]
  n5(["return metresFromCentre;"])
  n1 --> n2
  n2 --> n3
  n3 --> n4
  n4 --> n5
```

## localProjection > metresFromCentre

```mermaid
flowchart TD
  n1(["localProjection #gt; metresFromCentre"])
  n2(["return { eastM: (point.lon - centre.lon) * metresPerDegreeE…"])
  n1 --> n2
```
