# tools/bake/start.ts

Drawn from the code by `npm run diagrams` (TypeScript compiler, no AI). Do not edit by hand: change the code, then run it again.

## carStartOnRoad

```mermaid
flowchart TD
  n1(["carStartOnRoad"])
  n2["let best = { distanceM: Number.POSITIVE_INFINITY, point: CE…"]
  n3{"for each const road of roads"}
  n4["let at = 1"]
  n5{"at #lt; road.points.length"}
  n6["const from = road.points[at - 1] as MapPoint;"]
  n7["const to = road.points[at] as MapPoint;"]
  n8["const nearest = nearestPointOnSegment(CENTRE, from, to);<br/>calls nearestPointOnSegment"]
  n9{"nearest.distanceM #lt; best.distanceM"}
  n10["best = { ...nearest, from, to, road };"]
  n11["at += 1"]
  n12["let headingDeg = compassHeading(best.from, best.to);<br/>calls compassHeading"]
  n13{"best.road.tags[#quot;oneway#quot;] === #quot;-1#quot;"}
  n14["headingDeg = (headingDeg + 180) % 360;"]
  n15(["return { eastM: best.point.eastM, northM: best.point.northM…<br/>calls isOneWay"])
  n1 --> n2
  n2 --> n3
  n3 -->|"next item"| n4
  n4 --> n5
  n5 -->|"yes"| n6
  n6 --> n7
  n7 --> n8
  n8 --> n9
  n9 -->|"yes"| n10
  n10 --> n11
  n9 -->|"no"| n11
  n11 --> n5
  n5 -->|"no"| n3
  n3 -->|"done"| n12
  n12 --> n13
  n13 -->|"yes"| n14
  n14 --> n15
  n13 -->|"no"| n15
```

## nearestPointOnSegment

```mermaid
flowchart TD
  n1(["nearestPointOnSegment"])
  n2["const alongEast = b.eastM - a.eastM;"]
  n3["const alongNorth = b.northM - a.northM;"]
  n4["const lengthSquared = alongEast * alongEast + alongNorth * …"]
  n5{"lengthSquared === 0"}
  n6(["return { point: a, distanceM: Math.hypot(point.eastM - a.ea…"])
  n7["const shadow = ((point.eastM - a.eastM) * alongEast + (poin…"]
  n8["const fraction = Math.min(1, Math.max(0, shadow));"]
  n9["const nearest = { eastM: a.eastM + fraction * alongEast, no…"]
  n10(["return { point: nearest, distanceM: Math.hypot(point.eastM …"])
  n1 --> n2
  n2 --> n3
  n3 --> n4
  n4 --> n5
  n5 -->|"yes"| n6
  n5 -->|"no"| n7
  n7 --> n8
  n8 --> n9
  n9 --> n10
```

## compassHeading

```mermaid
flowchart TD
  n1(["compassHeading"])
  n2["const degrees = (Math.atan2(b.eastM - a.eastM, b.northM - a…"]
  n3(["return ((degrees % 360) + 360) % 360;"])
  n1 --> n2
  n2 --> n3
```
