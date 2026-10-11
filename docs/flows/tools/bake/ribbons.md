# tools/bake/ribbons.ts

Drawn from the code by `npm run diagrams` (TypeScript compiler, no AI). Do not edit by hand: change the code, then run it again.

## roadPieces

```mermaid
flowchart TD
  n1(["roadPieces"])
  n2["const halfWidthM = widthM / 2;"]
  n3["const pieces: MapPoint[][] = [];"]
  n4["let at = 1"]
  n5{"at #lt; points.length"}
  n6["const rectangle = segmentRectangle(points[at - 1] as MapPoi…<br/>calls segmentRectangle"]
  n7{"rectangle !== undefined"}
  n8["pieces.push(rectangle);"]
  n9["at += 1"]
  n10(["return [...pieces, ...points.map((point) =#gt; nodeOctagon(poi…<br/>calls nodeOctagon"])
  n1 --> n2
  n2 --> n3
  n3 --> n4
  n4 --> n5
  n5 -->|"yes"| n6
  n6 --> n7
  n7 -->|"yes"| n8
  n8 --> n9
  n7 -->|"no"| n9
  n9 --> n5
  n5 -->|"no"| n10
```

## segmentRectangle

```mermaid
flowchart TD
  n1(["segmentRectangle"])
  n2["const lengthM = Math.hypot(b.eastM - a.eastM, b.northM - a.…"]
  n3{"lengthM #lt; SHORTEST_SEGMENT_M"}
  n4(["return undefined;"])
  n5["const alongEast = (b.eastM - a.eastM) / lengthM;"]
  n6["const alongNorth = (b.northM - a.northM) / lengthM;"]
  n7["const leftEast = -alongNorth * halfWidthM;"]
  n8["const leftNorth = alongEast * halfWidthM;"]
  n9(["return [ { eastM: a.eastM - leftEast, northM: a.northM - le…"])
  n1 --> n2
  n2 --> n3
  n3 -->|"yes"| n4
  n3 -->|"no"| n5
  n5 --> n6
  n6 --> n7
  n7 --> n8
  n8 --> n9
```

## nodeOctagon

```mermaid
flowchart TD
  n1(["nodeOctagon"])
  n2["const reachM = halfWidthM / Math.cos(Math.PI / 8);"]
  n3(["return Array.from({ length: 8 }, (_, corner) =#gt; ({ eastM: p…"])
  n1 --> n2
  n2 --> n3
```
