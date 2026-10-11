# src/game/hud.ts

Drawn from the code by `npm run diagrams` (TypeScript compiler, no AI). Do not edit by hand: change the code, then run it again.

## streetsArrived

```mermaid
flowchart TD
  n1(["streetsArrived"])
  n2{"loaded.ok"}
  n3["game.streets = loaded.value.streets;"]
  n4["placeHud(game);<br/>calls placeHud"]
  n5(["return;"])
  n6["game.streets = #quot;failed#quot;;"]
  n7["placeHud(game);<br/>calls placeHud"]
  n8["showNotice(game.page, streetsFailureNotice(loaded.failure));<br/>calls showNotice, streetsFailureNotice"]
  n9(["end"])
  n1 --> n2
  n2 -->|"yes"| n3
  n3 --> n4
  n4 --> n5
  n2 -->|"no"| n6
  n6 --> n7
  n7 --> n8
  n8 --> n9
```

## streetsFailureNotice

```mermaid
flowchart TD
  n1(["streetsFailureNotice"])
  n2{"failure.kind === #quot;file-missing#quot;"}
  n3(["return #quot;No street names or small map: this map was made bef…"])
  n4{"failure.kind === #quot;map-baked-for-something-else#quot;"}
  n5{"failure.problems[0] is missing?"}
  n6["#quot;#quot;"]
  n7{"failureMessage(failure)[0] is missing?<br/>calls failureMessage"}
  n8["#quot;#quot;"]
  n9["const reason = failure.kind === #quot;map-baked-for-something-el…<br/>calls failureMessage"]
  n10(["return #96;No street names or small map: ${reason}#96;;"])
  n1 --> n2
  n2 -->|"yes"| n3
  n2 -->|"no"| n4
  n4 -->|"yes"| n5
  n5 -->|"yes"| n6
  n4 -->|"no"| n7
  n7 -->|"yes"| n8
  n5 -->|"no"| n9
  n6 --> n9
  n7 -->|"no"| n9
  n8 --> n9
  n9 --> n10
```

## placeHud

```mermaid
flowchart TD
  n1(["placeHud"])
  n2["const map = game.page.miniMap;"]
  n3{"game.page.controls.hidden"}
  n4["[]"]
  n5["[...game.page.controls.querySelectorAll(#quot;[data-role]#quot;)]"]
  n6["const controls = game.page.controls.hidden ? [] : [...game.…"]
  n7["const keepOut: ScreenBox[] = controls.map((control) =#gt; cont…"]
  n8["const screen = { width: game.page.canvas.clientWidth, heigh…"]
  n9{"Array.isArray(game.streets)"}
  n10{"game.miniMap.big"}
  n11["MINI_MAP_BIG_PX"]
  n12["MINI_MAP_SMALL_PX"]
  n13["undefined"]
  n14["const box = Array.isArray(game.streets) ? miniMapBox(screen…<br/>calls miniMapBox"]
  n15["game.miniMap.box = box;"]
  n16["game.miniMap.drawnAtMs = undefined;"]
  n17["map.hidden = box === undefined;"]
  n18{"box === undefined"}
  n19(["return;"])
  n20["const pixelRatio = Math.min(window.devicePixelRatio, MOST_P…"]
  n21["const sizePx = box.right - box.left;"]
  n22["Object.assign(map.style, { left: #96;${box.left}px#96;, top: #96;${b…"]
  n23["map.width = Math.round(sizePx * pixelRatio);"]
  n24["map.height = Math.round(sizePx * pixelRatio);"]
  n25["map.getContext(#quot;2d#quot;)?.setTransform(pixelRatio, 0, 0, pixelR…"]
  n26(["end"])
  n1 --> n2
  n2 --> n3
  n3 -->|"yes"| n4
  n3 -->|"no"| n5
  n4 --> n6
  n5 --> n6
  n6 --> n7
  n7 --> n8
  n8 --> n9
  n9 -->|"yes"| n10
  n10 -->|"yes"| n11
  n10 -->|"no"| n12
  n9 -->|"no"| n13
  n11 --> n14
  n12 --> n14
  n13 --> n14
  n14 --> n15
  n15 --> n16
  n16 --> n17
  n17 --> n18
  n18 -->|"yes"| n19
  n18 -->|"no"| n20
  n20 --> n21
  n21 --> n22
  n22 --> n23
  n23 --> n24
  n24 --> n25
  n25 --> n26
```

## listenToMiniMapTaps

```mermaid
flowchart TD
  n1(["listenToMiniMapTaps"])
  n2["game.page.miniMap.addEventListener(#quot;click#quot;, () =#gt; { game.mi…"]
  n3(["end"])
  n1 --> n2
  n2 --> n3
```

## listenToMiniMapTaps > inner function 1

```mermaid
flowchart TD
  n1(["listenToMiniMapTaps #gt; inner function 1"])
  n2["game.miniMap.big = !game.miniMap.big;"]
  n3["placeHud(game);<br/>calls placeHud"]
  n4(["end"])
  n1 --> n2
  n2 --> n3
  n3 --> n4
```

## updateHud

```mermaid
flowchart TD
  n1(["updateHud"])
  n2["const streets = game.streets;"]
  n3{"!Array.isArray(streets)"}
  n4(["return;"])
  n5{"game.miniMap.drawnAtMs !== undefined"}
  n6{"nowMs - game.miniMap.drawnAtMs #lt; HUD_EVERY_MS"}
  n7(["return;"])
  n8["game.miniMap.drawnAtMs = nowMs;"]
  n9["game.streetName = streetNameAfter(game.streetName, nearestS…<br/>calls streetNameAfter, nearestStreetName"]
  n10{"game.streetName.shown is missing?"}
  n11["#quot;#quot;"]
  n12["game.page.streetName.textContent = game.streetName.shown ??…"]
  n13["game.page.streetName.hidden = game.streetName.shown === und…"]
  n14["const box = game.miniMap.box;"]
  n15["const context = game.page.miniMap.getContext(#quot;2d#quot;);"]
  n16{"box === undefined"}
  n17{"context === null"}
  n18(["return;"])
  n19["const headingDeg = headingFromFlat(flatHeading(game.car.bod…<br/>calls headingFromFlat, flatHeading"]
  n20["drawMiniMap(context, streets, mapView(car, box.right - box.…<br/>calls drawMiniMap, mapView"]
  n21(["end"])
  n1 --> n2
  n2 --> n3
  n3 -->|"yes"| n4
  n3 -->|"no"| n5
  n5 -->|"yes"| n6
  n6 -->|"yes"| n7
  n5 -->|"no"| n8
  n6 -->|"no"| n8
  n8 --> n9
  n9 --> n10
  n10 -->|"yes"| n11
  n10 -->|"no"| n12
  n11 --> n12
  n12 --> n13
  n13 --> n14
  n14 --> n15
  n15 --> n16
  n16 -->|"no"| n17
  n16 -->|"yes"| n18
  n17 -->|"yes"| n18
  n17 -->|"no"| n19
  n19 --> n20
  n20 --> n21
```
