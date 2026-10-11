# src/game/loop.ts

Drawn from the code by `npm run diagrams` (TypeScript compiler, no AI). Do not edit by hand: change the code, then run it again.

## frameSeconds

```mermaid
flowchart TD
  n1(["frameSeconds"])
  n2(["return Math.min(LONGEST_FRAME_S, Math.max(0, (nowMs - lastM…"])
  n1 --> n2
```

## readActions

```mermaid
flowchart TD
  n1(["readActions"])
  n2["const fromKeys = keyboardActions(game.heldKeys);<br/>calls keyboardActions"]
  n3["const fromThumbs = touchActions(game.touches.state);<br/>calls touchActions"]
  n4["const fromPad = gamepadActions(game.navigator);<br/>calls gamepadActions"]
  n5(["return strongestActions([fromKeys, fromThumbs, fromPad].map…<br/>calls strongestActions"])
  n1 --> n2
  n2 --> n3
  n3 --> n4
  n4 --> n5
```

## stepCarPhysics

```mermaid
flowchart TD
  n1(["stepCarPhysics"])
  n2["let step = 0"]
  n3{"step #lt; steps"}
  n4["game.poseBefore = game.poseNow;"]
  n5["driveCar(game.car, actions, game.data.place, PHYSICS_STEP_S…<br/>calls driveCar"]
  n6["game.world.step();"]
  n7["game.poseNow = { position: game.car.body.translation(), rot…"]
  n8["step += 1"]
  n9(["end"])
  n1 --> n2
  n2 --> n3
  n3 -->|"yes"| n4
  n4 --> n5
  n5 --> n6
  n6 --> n7
  n7 --> n8
  n8 --> n3
  n3 -->|"no"| n9
```

## rescueCarIfNeeded

```mermaid
flowchart TD
  n1(["rescueCarIfNeeded"])
  n2["const extent = game.data.mapIndex.extent;"]
  n3["const flipNow = pressedJustNow(game.flipWasPressed, actions…<br/>calls pressedJustNow"]
  n4["game.flipWasPressed = actions.flipUpright;"]
  n5{"flipNow"}
  n6["const velocity = game.car.body.linvel();"]
  n7{"!canFlipUpright(Math.hypot(velocity.x, velocity.y, velocity…<br/>calls canFlipUpright"}
  n8["showNotice(game.page, #quot;Flip upright works when the car has …<br/>calls showNotice"]
  n9(["return #quot;nothing#quot;;"])
  n10["const flipped = flipCarUpright(game.car, extent);<br/>calls flipCarUpright"]
  n11["game.poseBefore = flipped;"]
  n12["game.poseNow = flipped;"]
  n13["showNotice(game.page, #quot;Flipped upright.#quot;);<br/>calls showNotice"]
  n14(["return #quot;flipped#quot;;"])
  n15{"carRescueNeeded(game.car.body.translation(), extent) === #quot;n…<br/>calls carRescueNeeded"}
  n16(["return #quot;nothing#quot;;"])
  n17["const atStart = returnCarToStart(game.car);<br/>calls returnCarToStart"]
  n18["game.poseBefore = atStart;"]
  n19["game.poseNow = atStart;"]
  n20["showNotice(game.page, #quot;The car fell through the ground, or …<br/>calls showNotice"]
  n21(["return #quot;returned-to-start#quot;;"])
  n1 --> n2
  n2 --> n3
  n3 --> n4
  n4 --> n5
  n5 -->|"yes"| n6
  n6 --> n7
  n7 -->|"yes"| n8
  n8 --> n9
  n7 -->|"no"| n10
  n10 --> n11
  n11 --> n12
  n12 --> n13
  n13 --> n14
  n5 -->|"no"| n15
  n15 -->|"yes"| n16
  n15 -->|"no"| n17
  n17 --> n18
  n18 --> n19
  n19 --> n20
  n20 --> n21
```

## warnAtMapEdge

```mermaid
flowchart TD
  n1(["warnAtMapEdge"])
  n2["const extent = game.data.mapIndex.extent;"]
  n3["const fromEdge = Math.min(carEastM - extent.westM, extent.e…"]
  n4{"fromEdge #gt; EDGE_WARNING_M"}
  n5(["return;"])
  n6{"game.edgeNoticeAtMs !== undefined"}
  n7{"nowMs - game.edgeNoticeAtMs #lt; EDGE_NOTICE_EVERY_MS"}
  n8(["return;"])
  n9["showNotice(game.page, #quot;This is the edge of the map for now.…<br/>calls showNotice"]
  n10["game.edgeNoticeAtMs = nowMs;"]
  n11(["end"])
  n1 --> n2
  n2 --> n3
  n3 --> n4
  n4 -->|"yes"| n5
  n4 -->|"no"| n6
  n6 -->|"yes"| n7
  n7 -->|"yes"| n8
  n6 -->|"no"| n9
  n7 -->|"no"| n9
  n9 --> n10
  n10 --> n11
```

## measureFrame

```mermaid
flowchart TD
  n1(["measureFrame"])
  n2["const recorder = game.measuring;"]
  n3{"recorder === undefined"}
  n4(["return;"])
  n5["const startKey = cellKey(cellOfPoint({ eastM: game.data.map…<br/>calls cellKey, cellOfPoint"]
  n6{"recorder.drivableAtMs === undefined"}
  n7{"game.squares.get(startKey)?.road === #quot;loaded#quot;"}
  n8["recorder.drivableAtMs = nowMs;"]
  n9["recordFrame(recorder, frameS * 1000);<br/>calls recordFrame"]
  n10{"!recorder.finished"}
  n11(["return;"])
  n12["game.measuring = undefined;"]
  n13["const page = performance.getEntriesByType(#quot;navigation#quot;) as …"]
  n14["const files = performance.getEntriesByType(#quot;resource#quot;) as P…"]
  n15["const bytes = bytesBeforeDriving([...page, ...files], Numbe…<br/>calls bytesBeforeDriving"]
  n16["const frames = frameRateSummary(recorder.lengthsMs);<br/>calls frameRateSummary"]
  n17["showMeasureReport(game, measureReportLines(bytes, undefined…<br/>calls showMeasureReport, measureReportLines"]
  n18{"bytes.unsizedUrls.length === 0"}
  n19(["return;"])
  n20["void serverSizes(bytes.unsizedUrls, (url, init) =#gt; fetch(ur…<br/>calls serverSizes, showMeasureReport, measureReportLines"]
  n21(["end"])
  n1 --> n2
  n2 --> n3
  n3 -->|"yes"| n4
  n3 -->|"no"| n5
  n5 --> n6
  n6 -->|"yes"| n7
  n7 -->|"yes"| n8
  n8 --> n9
  n6 -->|"no"| n9
  n7 -->|"no"| n9
  n9 --> n10
  n10 -->|"yes"| n11
  n10 -->|"no"| n12
  n12 --> n13
  n13 --> n14
  n14 --> n15
  n15 --> n16
  n16 --> n17
  n17 --> n18
  n18 -->|"yes"| n19
  n18 -->|"no"| n20
  n20 --> n21
```

## showMeasureReport

```mermaid
flowchart TD
  n1(["showMeasureReport"])
  n2["game.page.measurePanel.replaceChildren(...lines.map((line) …"]
  n3["game.page.measurePanel.hidden = false;"]
  n4(["end"])
  n1 --> n2
  n2 --> n3
  n3 --> n4
```

## playFrame

```mermaid
flowchart TD
  n1(["playFrame"])
  n2{"game.lastFrameMs is missing?"}
  n3["nowMs"]
  n4["const frameS = frameSeconds(game.lastFrameMs ?? nowMs, nowM…<br/>calls frameSeconds"]
  n5["game.lastFrameMs = nowMs;"]
  n6["const actions = readActions(game);<br/>calls readActions"]
  n7["const happened = rescueCarIfNeeded(game, actions);<br/>calls rescueCarIfNeeded"]
  n8{"happened === #quot;returned-to-start#quot;"}
  n9["updateStreaming(game, { eastM: game.poseNow.position.x, nor…<br/>calls updateStreaming"]
  n10["const frame = physicsStepsForFrame(game.leftOverS, frameS);<br/>calls physicsStepsForFrame"]
  n11["game.leftOverS = frame.leftOverS;"]
  n12["stepCarPhysics(game, actions, frame.steps);<br/>calls stepCarPhysics"]
  n13["const here = game.car.body.translation();"]
  n14["updateStreaming(game, { eastM: here.x, northM: -here.z }, n…<br/>calls updateStreaming"]
  n15["const drawn = blendPoses(game.poseBefore, game.poseNow, fra…<br/>calls blendPoses"]
  n16["updateCarModel(game.carDrawing, drawn, game.car.controller);<br/>calls updateCarModel"]
  n17["game.aim = moveChaseCamera(game.aim, chaseCameraGoal(drawn)…<br/>calls moveChaseCamera, chaseCameraGoal"]
  n18["game.camera.position.set(game.aim.cameraPoint.x, game.aim.c…"]
  n19["game.camera.lookAt(game.aim.lookPoint.x, game.aim.lookPoint…"]
  n20["warnAtMapEdge(game, here.x, -here.z, nowMs);<br/>calls warnAtMapEdge"]
  n21["updateHud(game, { eastM: here.x, northM: -here.z }, nowMs);<br/>calls updateHud"]
  n22["measureFrame(game, frameS, nowMs);<br/>calls measureFrame"]
  n23["game.renderer.render(game.parts.scene, game.camera);"]
  n24(["end"])
  n1 --> n2
  n2 -->|"yes"| n3
  n2 -->|"no"| n4
  n3 --> n4
  n4 --> n5
  n5 --> n6
  n6 --> n7
  n7 --> n8
  n8 -->|"yes"| n9
  n9 --> n10
  n8 -->|"no"| n10
  n10 --> n11
  n11 --> n12
  n12 --> n13
  n13 --> n14
  n14 --> n15
  n15 --> n16
  n16 --> n17
  n17 --> n18
  n18 --> n19
  n19 --> n20
  n20 --> n21
  n21 --> n22
  n22 --> n23
  n23 --> n24
```

## runFrame

```mermaid
flowchart TD
  n1(["runFrame"])
  n2["try"]
  n3["playFrame(game, nowMs);<br/>calls playFrame"]
  n4["catch (error)"]
  n5["showFailure(game.page, failureMessage({ kind: #quot;something-un…<br/>calls showFailure, failureMessage"]
  n6(["return;"])
  n7["requestAnimationFrame((next) =#gt; runFrame(game, next));<br/>calls runFrame"]
  n8(["end"])
  n1 --> n2
  n2 --> n3
  n2 -->|"throws"| n4
  n4 --> n5
  n5 --> n6
  n3 --> n7
  n7 --> n8
```
