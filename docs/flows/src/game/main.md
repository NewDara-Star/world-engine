# src/game/main.ts

Drawn from the code by `npm run diagrams` (TypeScript compiler, no AI). Do not edit by hand: change the code, then run it again.

## startGame

```mermaid
flowchart TD
  n1(["startGame"])
  n2["page.loading.textContent = #quot;Loading the map#quot;;"]
  n3["page.loading.hidden = false;"]
  n4["const [loaded, physics] = await Promise.all([loadGameData(l…<br/>calls loadGameData, startPhysicsEngine"]
  n5{"!loaded.ok"}
  n6(["return showFailure(page, failureMessage(loaded.failure));<br/>calls showFailure, failureMessage"])
  n7{"!physics.ok"}
  n8(["return showFailure(page, failureMessage({ kind: #quot;physics-di…<br/>calls showFailure, failureMessage"])
  n9["const rendered = createRenderer(page.canvas, window.deviceP…<br/>calls createRenderer"]
  n10{"!rendered.ok"}
  n11(["return showFailure(page, failureMessage(rendered.failure));<br/>calls showFailure, failureMessage"])
  n12["const game = buildGame(loaded.value, rendered.renderer, pag…<br/>calls buildGame"]
  n13{"for each const note of loaded.value.notes"}
  n14["showNotice(page, note);<br/>calls showNotice"]
  n15["page.loading.hidden = true;"]
  n16["page.controls.hidden = !shouldShowTouchControls(window.matc…<br/>calls shouldShowTouchControls"]
  n17["window.addEventListener( #quot;touchstart#quot;, () =#gt; { page.control…"]
  n18["listenForResize(game, page);<br/>calls listenForResize"]
  n19["window.dispatchEvent(new Event(#quot;resize#quot;));"]
  n20["listenToMiniMapTaps(game);<br/>calls listenToMiniMapTaps"]
  n21["void loadStreetsForPlace(game.data.place).then((streets) =#gt;…<br/>calls loadStreetsForPlace, streetsArrived"]
  n22["requestAnimationFrame((now) =#gt; runFrame(game, now));<br/>calls runFrame"]
  n23(["end"])
  n1 --> n2
  n2 --> n3
  n3 --> n4
  n4 --> n5
  n5 -->|"yes"| n6
  n5 -->|"no"| n7
  n7 -->|"yes"| n8
  n7 -->|"no"| n9
  n9 --> n10
  n10 -->|"yes"| n11
  n10 -->|"no"| n12
  n12 --> n13
  n13 -->|"next item"| n14
  n14 --> n13
  n13 -->|"done"| n15
  n15 --> n16
  n16 --> n17
  n17 --> n18
  n18 --> n19
  n19 --> n20
  n20 --> n21
  n21 --> n22
  n22 --> n23
```

## startGame > inner function 1

```mermaid
flowchart TD
  n1(["startGame #gt; inner function 1"])
  n2["page.controls.hidden = false;"]
  n3["placeHud(game);<br/>calls placeHud"]
  n4(["end"])
  n1 --> n2
  n2 --> n3
  n3 --> n4
```

## startGameSafely

```mermaid
flowchart TD
  n1(["startGameSafely"])
  n2["try"]
  n3["await startGame(page);<br/>calls startGame"]
  n4["catch (error)"]
  n5["showFailure(page, failureMessage({ kind: #quot;something-unexpec…<br/>calls showFailure, failureMessage"]
  n6(["end"])
  n1 --> n2
  n2 --> n3
  n2 -->|"throws"| n4
  n4 --> n5
  n3 --> n6
  n5 --> n6
```

## buildGame

```mermaid
flowchart TD
  n1(["buildGame"])
  n2["const aspect = page.canvas.clientWidth / Math.max(1, page.c…"]
  n3["const parts = createScene(LOAD_RADIUS_M, aspect);<br/>calls createScene"]
  n4["const world = createPhysicsWorld(data.place);<br/>calls createPhysicsWorld"]
  n5["addMapEdgeWalls(world, data.mapIndex.extent);<br/>calls addMapEdgeWalls"]
  n6["const pose = carStartPose(data.mapIndex.start, data.place, …<br/>calls carStartPose"]
  n7["const car = createCar(world, data.vehicle, pose, data.place…<br/>calls createCar"]
  n8["const carDrawing = carModel(data.vehicle);<br/>calls carModel"]
  n9["parts.scene.add(carDrawing.group);"]
  n10["const heldKeys = new Set#lt;string#gt;();"]
  n11["listenToKeyboard(window, heldKeys);<br/>calls listenToKeyboard"]
  n12["const touches = { state: noTouches };"]
  n13["listenToTouches(page.controls, touches);<br/>calls listenToTouches"]
  n14["const camera = new PerspectiveCamera(FIELD_OF_VIEW_DEG, asp…"]
  n15["const aim = chaseCameraGoal(pose);<br/>calls chaseCameraGoal"]
  n16["camera.position.set(aim.cameraPoint.x, aim.cameraPoint.y, a…"]
  n17["camera.lookAt(aim.lookPoint.x, aim.lookPoint.y, aim.lookPoi…"]
  n18{"new URLSearchParams(location.search).has(#quot;measure#quot;)"}
  n19["{ drivableAtMs: undefined, lengthsMs: [], collectedS: 0, fi…"]
  n20["undefined"]
  n21["const measuring = new URLSearchParams(location.search).has(…"]
  n22["const game: Game = { data, page, renderer, parts, camera, a…"]
  n23["updateStreaming(game, { eastM: pose.position.x, northM: -po…<br/>calls updateStreaming"]
  n24(["return game;"])
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
  n17 --> n18
  n18 -->|"yes"| n19
  n18 -->|"no"| n20
  n19 --> n21
  n20 --> n21
  n21 --> n22
  n22 --> n23
  n23 --> n24
```

## listenForResize

```mermaid
flowchart TD
  n1(["listenForResize"])
  n2["const { renderer, camera, parts } = game;"]
  n3["window.addEventListener(#quot;resize#quot;, fitToScreen);"]
  n4(["return () =#gt; window.removeEventListener(#quot;resize#quot;, fitToScre…"])
  n1 --> n2
  n2 --> n3
  n3 --> n4
```

## listenForResize > fitToScreen

```mermaid
flowchart TD
  n1(["listenForResize #gt; fitToScreen"])
  n2["const width = page.canvas.clientWidth;"]
  n3["const height = Math.max(1, page.canvas.clientHeight);"]
  n4["renderer.setSize(width, height, false);"]
  n5["camera.aspect = width / height;"]
  n6["camera.updateProjectionMatrix();"]
  n7["Object.assign(parts.fog, fogRangeForView(LOAD_RADIUS_M, CAM…<br/>calls fogRangeForView"]
  n8["page.portraitHint.textContent = PORTRAIT_HINT;"]
  n9["page.portraitHint.hidden = !portraitHintShown(!page.control…<br/>calls portraitHintShown"]
  n10["placeHud(game);<br/>calls placeHud"]
  n11(["end"])
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
```
