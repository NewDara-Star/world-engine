// One frame of the game, about 60 times a second (browser
// requestAnimationFrame, MDN). Order: read the controls, flip the car upright
// if asked (or return it to the start if it left the world, then load the
// squares there), run the physics in fixed steps, move the squares, move the
// camera, draw. The pose before and the pose now are kept in the game between
// frames for smooth drawing (approver's F17). Resource Timing
// (performance.getEntriesByType) feeds the measuring mode.
// Design: docs/designs/src/game/loop.md.
import { chaseCameraGoal, moveChaseCamera } from "../camera/chase.js";
import { type Actions, cleanActions, pressedJustNow, strongestActions } from "../controls/actions.js";
import { gamepadActions } from "../controls/gamepad.js";
import { keyboardActions } from "../controls/keyboard.js";
import { touchActions } from "../controls/touch.js";
import { bytesBeforeDriving, frameRateSummary, measureReportLines, recordFrame } from "../measure/measure.js";
import { canFlipUpright, carRescueNeeded, driveCar, flipCarUpright, returnCarToStart } from "../vehicle/car.js";
import { cellKey, cellOfPoint } from "../world/grid.js";
import { failureMessage, showFailure, showNotice } from "./failure.js";
import type { Game } from "./game.js";
import { PHYSICS_STEP_S, blendPoses, physicsStepsForFrame } from "./physics.js";
import { updateCarModel } from "./scene.js";
import { updateStreaming } from "./streaming.js";

// A locked phone or a hidden tab must not make the game simulate minutes.
const LONGEST_FRAME_S = 0.25;
// The map-edge notice: within this far of the edge, at most once in this long.
const EDGE_WARNING_M = 20;
const EDGE_NOTICE_EVERY_MS = 10_000;

export type WhatHappened = "flipped" | "returned-to-start" | "nothing";

export function frameSeconds(lastMs: number, nowMs: number): number {
  return Math.min(LONGEST_FRAME_S, Math.max(0, (nowMs - lastMs) / 1000));
}

// Every device is read every frame and combined, so the player can switch from
// thumbs to keys at any time.
export function readActions(game: Game): Actions {
  const fromKeys = keyboardActions(game.heldKeys);
  const fromThumbs = touchActions(game.touches.state);
  const fromPad = gamepadActions(game.navigator);
  return strongestActions([fromKeys, fromThumbs, fromPad].map(cleanActions));
}

// Equal steps; the pose before the last step is kept for smooth drawing, and a
// frame with no step leaves both poses as they were.
export function stepCarPhysics(game: Game, actions: Actions, steps: number): void {
  for (let step = 0; step < steps; step += 1) {
    game.poseBefore = game.poseNow;
    driveCar(game.car, actions, game.data.place, PHYSICS_STEP_S);
    game.world.step();
    game.poseNow = { position: game.car.body.translation(), rotation: game.car.body.rotation() };
  }
}

// Whether the player asked or the car fell off the world, it is put right and
// the player is told why, in the same words as the button. Flip upright works
// only for a car nearly stopped or tipped over (decision E2 (b)).
export function rescueCarIfNeeded(game: Game, actions: Actions): WhatHappened {
  const extent = game.data.mapIndex.extent;
  const flipNow = pressedJustNow(game.flipWasPressed, actions.flipUpright);
  game.flipWasPressed = actions.flipUpright;
  if (flipNow) {
    const velocity = game.car.body.linvel();
    if (!canFlipUpright(Math.hypot(velocity.x, velocity.y, velocity.z), game.car.body.rotation())) {
      showNotice(game.page, "Flip upright works when the car has stopped or tipped over.");
      return "nothing";
    }
    const flipped = flipCarUpright(game.car, extent);
    game.poseBefore = flipped;
    game.poseNow = flipped;
    showNotice(game.page, "Flipped upright.");
    return "flipped";
  }
  if (carRescueNeeded(game.car.body.translation(), extent) === "none") return "nothing";
  const atStart = returnCarToStart(game.car);
  game.poseBefore = atStart;
  game.poseNow = atStart;
  showNotice(game.page, "The car fell through the ground, or left the map, so it is back at the start.");
  return "returned-to-start";
}

// The invisible wall at the map's edge is explained, not a mystery, and not
// repeated while the player stays there.
export function warnAtMapEdge(game: Game, carEastM: number, carNorthM: number, nowMs: number): void {
  const extent = game.data.mapIndex.extent;
  const fromEdge = Math.min(carEastM - extent.westM, extent.eastM - carEastM, carNorthM - extent.southM, extent.northM - carNorthM);
  if (fromEdge > EDGE_WARNING_M) return;
  if (game.edgeNoticeAtMs !== undefined && nowMs - game.edgeNoticeAtMs < EDGE_NOTICE_EVERY_MS) return;
  showNotice(game.page, "This is the edge of the map for now.");
  game.edgeNoticeAtMs = nowMs;
}

// In measuring mode: the drivable moment is marked once (the car on the
// ground and its start square's road drawn), frames are recorded for 60
// seconds from then, and the report appears on screen when done.
export function measureFrame(game: Game, frameS: number, nowMs: number): void {
  const recorder = game.measuring;
  if (recorder === undefined) return;
  const startKey = cellKey(cellOfPoint({ eastM: game.data.mapIndex.start.eastM, northM: game.data.mapIndex.start.northM }));
  if (recorder.drivableAtMs === undefined && game.squares.get(startKey)?.road === "loaded") recorder.drivableAtMs = nowMs;
  recordFrame(recorder, frameS * 1000);
  if (!recorder.finished) return;
  // Shown once: measuring ends with the report.
  game.measuring = undefined;
  const page = performance.getEntriesByType("navigation")[0] as PerformanceResourceTiming | undefined;
  const files = performance.getEntriesByType("resource") as PerformanceResourceTiming[];
  const bytes = bytesBeforeDriving(page ?? { transferSize: 0, decodedBodySize: 0, responseEnd: 0 }, files, Number(recorder.drivableAtMs));
  const lines = measureReportLines(bytes, frameRateSummary(recorder.lengthsMs));
  game.page.measurePanel.replaceChildren(...lines.map((line) => Object.assign(document.createElement("p"), { textContent: line })));
  game.page.measurePanel.hidden = false;
}

// The whole game, once a frame.
export function playFrame(game: Game, nowMs: number): void {
  const frameS = frameSeconds(game.lastFrameMs ?? nowMs, nowMs);
  game.lastFrameMs = nowMs;
  const actions = readActions(game);
  const happened = rescueCarIfNeeded(game, actions);
  if (happened === "returned-to-start") updateStreaming(game, { eastM: game.poseNow.position.x, northM: -game.poseNow.position.z }, nowMs);
  const frame = physicsStepsForFrame(game.leftOverS, frameS);
  game.leftOverS = frame.leftOverS;
  stepCarPhysics(game, actions, frame.steps);
  const here = game.car.body.translation();
  updateStreaming(game, { eastM: here.x, northM: -here.z }, nowMs);
  const drawn = blendPoses(game.poseBefore, game.poseNow, frame.blend);
  updateCarModel(game.carDrawing, drawn, game.car.controller);
  game.aim = moveChaseCamera(game.aim, chaseCameraGoal(drawn), frameS, happened !== "nothing");
  game.camera.position.set(game.aim.cameraPoint.x, game.aim.cameraPoint.y, game.aim.cameraPoint.z);
  game.camera.lookAt(game.aim.lookPoint.x, game.aim.lookPoint.y, game.aim.lookPoint.z);
  warnAtMapEdge(game, here.x, -here.z, nowMs);
  measureFrame(game, frameS, nowMs);
  game.renderer.render(game.parts.scene, game.camera);
}

// Frames keep coming while all is well; a frame that goes wrong ends with a
// message on screen instead of a frozen picture (approver's F17).
export function runFrame(game: Game, nowMs: number): void {
  try {
    playFrame(game, nowMs);
  } catch (error) {
    showFailure(game.page, failureMessage({ kind: "something-unexpected", reason: String(error) }));
    return;
  }
  requestAnimationFrame((next) => runFrame(game, next));
}
