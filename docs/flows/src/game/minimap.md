# src/game/minimap.ts

Drawn from the code by `npm run diagrams` (TypeScript compiler, no AI). Do not edit by hand: change the code, then run it again.

## mapView

```mermaid
flowchart TD
  n1(["mapView"])
  n2(["return { centre: car, sizePx, pixelsPerMetre: sizePx / MINI…"])
  n1 --> n2
```

## toScreen

```mermaid
flowchart TD
  n1(["toScreen"])
  n2(["return { x: view.sizePx / 2 + (point.eastM - view.centre.ea…"])
  n1 --> n2
```

## lineInView

```mermaid
flowchart TD
  n1(["lineInView"])
  n2["const halfM = view.sizePx / 2 / view.pixelsPerMetre;"]
  n3["const { eastM, northM } = view.centre;"]
  n4{"box.eastM #gt;= eastM - halfM"}
  n5{"box.westM #lt;= eastM + halfM"}
  n6{"box.northM #gt;= northM - halfM"}
  n7["box.southM #lt;= northM + halfM"]
  n8(["return box.eastM #gt;= eastM - halfM && box.westM #lt;= eastM + h…"])
  n1 --> n2
  n2 --> n3
  n3 --> n4
  n4 -->|"yes"| n5
  n5 -->|"yes"| n6
  n6 -->|"yes"| n7
  n4 -->|"no"| n8
  n5 -->|"no"| n8
  n6 -->|"no"| n8
  n7 --> n8
```

## headingFromFlat

```mermaid
flowchart TD
  n1(["headingFromFlat"])
  n2["const degrees = (Math.atan2(flat.x, -flat.z) * 180) / Math.…"]
  n3(["return ((degrees % 360) + 360) % 360;"])
  n1 --> n2
  n2 --> n3
```

## labelSpots

```mermaid
flowchart TD
  n1(["labelSpots"])
  n2["const placed: LabelSpot[] = [];"]
  n3{"for each const street of streets"}
  n4{"street.name === undefined"}
  n5{"street.size !== #quot;major#quot;"}
  n6{"!big"}
  n7["continue"]
  n8{"placed.some((spot) =#gt; spot.name === street.name)"}
  n9["continue"]
  n10["const widthPx = measure(street.name);<br/>calls measure"]
  n11["const name = street.name;"]
  n12["const spot = labelCandidates(street, view) .map((middle) =#gt;…<br/>calls labelCandidates, labelFits"]
  n13{"spot !== undefined"}
  n14["placed.push(spot);"]
  n15(["return placed;"])
  n1 --> n2
  n2 --> n3
  n3 -->|"next item"| n4
  n4 -->|"no"| n5
  n5 -->|"yes"| n6
  n4 -->|"yes"| n7
  n6 -->|"yes"| n7
  n5 -->|"no"| n8
  n6 -->|"no"| n8
  n8 -->|"yes"| n9
  n8 -->|"no"| n10
  n10 --> n11
  n11 --> n12
  n12 --> n13
  n13 -->|"yes"| n14
  n14 --> n3
  n13 -->|"no"| n3
  n7 --> n3
  n9 --> n3
  n3 -->|"done"| n15
```

## labelCandidates

```mermaid
flowchart TD
  n1(["labelCandidates"])
  n2["const parts: { lengthPx: number; middle: ScreenPoint }[] = …"]
  n3{"for each const line of street.lines.filter((one) =#gt; lineInView(one.box, view))<br/>calls lineInView"}
  n4["const points = line.points.map((point) =#gt; toScreen(point, v…<br/>calls toScreen"]
  n5["let at = 1"]
  n6{"at #lt; points.length"}
  n7["const part = segmentPartInCircle(points[at - 1] as ScreenPo…<br/>calls segmentPartInCircle"]
  n8{"part !== undefined"}
  n9["parts.push(part);"]
  n10["at += 1"]
  n11(["return parts.toSorted((a, b) =#gt; b.lengthPx - a.lengthPx).ma…"])
  n1 --> n2
  n2 --> n3
  n3 -->|"next item"| n4
  n4 --> n5
  n5 --> n6
  n6 -->|"yes"| n7
  n7 --> n8
  n8 -->|"yes"| n9
  n9 --> n10
  n8 -->|"no"| n10
  n10 --> n6
  n6 -->|"no"| n3
  n3 -->|"done"| n11
```

## segmentPartInCircle

```mermaid
flowchart TD
  n1(["segmentPartInCircle"])
  n2["const along = { x: b.x - a.x, y: b.y - a.y };"]
  n3["const fromCentre = { x: a.x - radiusPx, y: a.y - radiusPx };"]
  n4["const quadratic = along.x * along.x + along.y * along.y;"]
  n5["const linear = 2 * (fromCentre.x * along.x + fromCentre.y *…"]
  n6["const constant = fromCentre.x * fromCentre.x + fromCentre.y…"]
  n7["const discriminant = linear * linear - 4 * quadratic * cons…"]
  n8{"quadratic === 0"}
  n9{"discriminant #lt;= 0"}
  n10(["return undefined;"])
  n11["const enter = Math.max(0, (-linear - Math.sqrt(discriminant…"]
  n12["const leave = Math.min(1, (-linear + Math.sqrt(discriminant…"]
  n13{"leave #lt;= enter"}
  n14(["return undefined;"])
  n15["const middle = (enter + leave) / 2;"]
  n16(["return { lengthPx: (leave - enter) * Math.sqrt(quadratic), …"])
  n1 --> n2
  n2 --> n3
  n3 --> n4
  n4 --> n5
  n5 --> n6
  n6 --> n7
  n7 --> n8
  n8 -->|"no"| n9
  n8 -->|"yes"| n10
  n9 -->|"yes"| n10
  n9 -->|"no"| n11
  n11 --> n12
  n12 --> n13
  n13 -->|"yes"| n14
  n13 -->|"no"| n15
  n15 --> n16
```

## labelFits

```mermaid
flowchart TD
  n1(["labelFits"])
  n2["const halfWidth = spot.widthPx / 2;"]
  n3["const halfHeight = LABEL_HEIGHT_PX / 2;"]
  n4["const radiusPx = view.sizePx / 2;"]
  n5["const farthestX = Math.abs(spot.x - radiusPx) + halfWidth;"]
  n6["const farthestY = Math.abs(spot.y - radiusPx) + halfHeight;"]
  n7{"Math.hypot(farthestX, farthestY) #gt; radiusPx"}
  n8(["return false;"])
  n9{"Math.abs(spot.x - radiusPx) #lt; halfWidth + CAR_CLEAR_PX"}
  n10{"Math.abs(spot.y - radiusPx) #lt; halfHeight + CAR_CLEAR_PX"}
  n11(["return false;"])
  n12(["return placed.every((other) =#gt; labelsApart(spot, other));<br/>calls labelsApart"])
  n1 --> n2
  n2 --> n3
  n3 --> n4
  n4 --> n5
  n5 --> n6
  n6 --> n7
  n7 -->|"yes"| n8
  n7 -->|"no"| n9
  n9 -->|"yes"| n10
  n10 -->|"yes"| n11
  n9 -->|"no"| n12
  n10 -->|"no"| n12
```

## labelsApart

```mermaid
flowchart TD
  n1(["labelsApart"])
  n2{"Math.abs(a.x - b.x) #gt;= (a.widthPx + b.widthPx) / 2"}
  n3["Math.abs(a.y - b.y) #gt;= LABEL_HEIGHT_PX"]
  n4(["return Math.abs(a.x - b.x) #gt;= (a.widthPx + b.widthPx) / 2 |…"])
  n1 --> n2
  n2 -->|"no"| n3
  n2 -->|"yes"| n4
  n3 --> n4
```

## drawMiniMap

```mermaid
flowchart TD
  n1(["drawMiniMap"])
  n2["const middle = view.sizePx / 2;"]
  n3["context.save();"]
  n4["context.clearRect(0, 0, view.sizePx, view.sizePx);"]
  n5["context.beginPath();"]
  n6["context.arc(middle, middle, middle - 1, 0, Math.PI * 2);"]
  n7["context.fillStyle = MAP_COLOURS.ground;"]
  n8["context.fill();"]
  n9["context.clip();"]
  n10["drawRoads(context, streets, view);<br/>calls drawRoads"]
  n11["context.font = LABEL_FONT;"]
  n12["drawLabels(context, labelSpots(streets, view, big, (text) =…<br/>calls drawLabels, labelSpots"]
  n13["drawCarArrow(context, middle, headingDeg);<br/>calls drawCarArrow"]
  n14["context.restore();"]
  n15["drawEdgeAndNorth(context, middle);<br/>calls drawEdgeAndNorth"]
  n16(["end"])
  n1 --> n2
  n2 --> n3
  n3 --> n4
  n4 --> n5
  n5 --> n6
  n6 --> n7
  n7 --> n8
  n8 --> n9
  n9 --> n10
  n10 --> n11
  n11 --> n12
  n12 --> n13
  n13 --> n14
  n14 --> n15
  n15 --> n16
```

## drawRoads

```mermaid
flowchart TD
  n1(["drawRoads"])
  n2["context.lineCap = #quot;round#quot;;"]
  n3["context.lineJoin = #quot;round#quot;;"]
  n4{"for each const [colour, extraPx] of [[MAP_COLOURS.roadCasing, 2], [MAP_COLOURS.road, 0]] as con…"}
  n5["context.strokeStyle = colour;"]
  n6{"for each const street of streets"}
  n7["context.lineWidth = ROAD_PX[street.size] + extraPx;"]
  n8["context.beginPath();"]
  n9{"for each const line of street.lines.filter((one) =#gt; lineInView(one.box, view))<br/>calls lineInView"}
  n10["traceLine(context, line.points, view);<br/>calls traceLine"]
  n11["context.stroke();"]
  n12(["end"])
  n1 --> n2
  n2 --> n3
  n3 --> n4
  n4 -->|"next item"| n5
  n5 --> n6
  n6 -->|"next item"| n7
  n7 --> n8
  n8 --> n9
  n9 -->|"next item"| n10
  n10 --> n9
  n9 -->|"done"| n11
  n11 --> n6
  n6 -->|"done"| n4
  n4 -->|"done"| n12
```

## traceLine

```mermaid
flowchart TD
  n1(["traceLine"])
  n2{"for each const [at, point] of points.entries()"}
  n3["const spot = toScreen(point, view);<br/>calls toScreen"]
  n4{"at === 0"}
  n5["context.moveTo(spot.x, spot.y);"]
  n6["context.lineTo(spot.x, spot.y);"]
  n7(["end"])
  n1 --> n2
  n2 -->|"next item"| n3
  n3 --> n4
  n4 -->|"yes"| n5
  n4 -->|"no"| n6
  n5 --> n2
  n6 --> n2
  n2 -->|"done"| n7
```

## drawLabels

```mermaid
flowchart TD
  n1(["drawLabels"])
  n2["context.textAlign = #quot;center#quot;;"]
  n3["context.textBaseline = #quot;middle#quot;;"]
  n4["context.lineWidth = 3;"]
  n5["context.strokeStyle = MAP_COLOURS.labelHalo;"]
  n6["context.fillStyle = MAP_COLOURS.label;"]
  n7{"for each const spot of spots"}
  n8["context.strokeText(spot.name, spot.x, spot.y);"]
  n9["context.fillText(spot.name, spot.x, spot.y);"]
  n10(["end"])
  n1 --> n2
  n2 --> n3
  n3 --> n4
  n4 --> n5
  n5 --> n6
  n6 --> n7
  n7 -->|"next item"| n8
  n8 --> n9
  n9 --> n7
  n7 -->|"done"| n10
```

## drawCarArrow

```mermaid
flowchart TD
  n1(["drawCarArrow"])
  n2["context.save();"]
  n3["context.translate(middle, middle);"]
  n4["context.rotate((headingDeg * Math.PI) / 180);"]
  n5["context.beginPath();"]
  n6["context.moveTo(0, -CAR_ARROW_PX);"]
  n7["context.lineTo(CAR_ARROW_PX * 0.7, CAR_ARROW_PX * 0.8);"]
  n8["context.lineTo(0, CAR_ARROW_PX * 0.4);"]
  n9["context.lineTo(-CAR_ARROW_PX * 0.7, CAR_ARROW_PX * 0.8);"]
  n10["context.closePath();"]
  n11["context.fillStyle = MAP_COLOURS.car;"]
  n12["context.strokeStyle = MAP_COLOURS.road;"]
  n13["context.lineWidth = 2;"]
  n14["context.stroke();"]
  n15["context.fill();"]
  n16["context.restore();"]
  n17(["end"])
  n1 --> n2
  n2 --> n3
  n3 --> n4
  n4 --> n5
  n5 --> n6
  n6 --> n7
  n7 --> n8
  n8 --> n9
  n9 --> n10
  n10 --> n11
  n11 --> n12
  n12 --> n13
  n13 --> n14
  n14 --> n15
  n15 --> n16
  n16 --> n17
```

## drawEdgeAndNorth

```mermaid
flowchart TD
  n1(["drawEdgeAndNorth"])
  n2["context.beginPath();"]
  n3["context.arc(middle, middle, middle - 1, 0, Math.PI * 2);"]
  n4["context.strokeStyle = MAP_COLOURS.edge;"]
  n5["context.lineWidth = 2;"]
  n6["context.stroke();"]
  n7["context.font = LABEL_FONT;"]
  n8["context.textAlign = #quot;center#quot;;"]
  n9["context.textBaseline = #quot;top#quot;;"]
  n10["context.lineWidth = 3;"]
  n11["context.strokeStyle = MAP_COLOURS.labelHalo;"]
  n12["context.strokeText(#quot;N#quot;, middle, 3);"]
  n13["context.fillStyle = MAP_COLOURS.label;"]
  n14["context.fillText(#quot;N#quot;, middle, 3);"]
  n15(["end"])
  n1 --> n2
  n2 --> n3
  n3 --> n4
  n4 --> n5
  n5 --> n6
  n6 --> n7
  n7 --> n8
  n8 --> n9
  n9 --> n10
  n10 --> n11
  n11 --> n12
  n12 --> n13
  n13 --> n14
  n14 --> n15
```
