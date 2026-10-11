// The page's starting point: load, build the world, put the car on the
// street, start the frames. Anything that fails on the way ends in
// showFailure, so the player never sees a blank page (the scope's story).
// Browser plumbing (MDN): location.search, matchMedia("(pointer: coarse)"),
// devicePixelRatio, the window's resize and touchstart events,
// requestAnimationFrame; three.js 0.186.1 PerspectiveCamera.
// Design: docs/designs/src/game/main.md.
import { PerspectiveCamera, type WebGLRenderer } from "three";
import { FIELD_OF_VIEW_DEG, CAMERA_BEHIND_M, chaseCameraGoal } from "../camera/chase.js";
import { listenToKeyboard } from "../controls/keyboard.js";
import { listenToTouches, noTouches, portraitHintShown, shouldShowTouchControls } from "../controls/touch.js";
import { carStartPose, createCar } from "../vehicle/car.js";
import { noStreetName } from "../world/streets.js";
import { failureMessage, showFailure, showNotice } from "./failure.js";
import type { Game, GamePage } from "./game.js";
import { listenToMiniMapTaps, placeHud, streetsArrived } from "./hud.js";
import { type GameData, loadGameData, loadStreetsForPlace } from "./load.js";
import { runFrame } from "./loop.js";
import { addMapEdgeWalls, createPhysicsWorld, startPhysicsEngine } from "./physics.js";
import { carModel, createRenderer, createScene, fogRangeForView } from "./scene.js";
import { LOAD_RADIUS_M, updateStreaming } from "./streaming.js";

// The camera sees from 10 cm to 2 km; the fog ends far nearer than that.
const NEAREST_DRAWN_M = 0.1;
const FARTHEST_DRAWN_M = 2000;
const PORTRAIT_HINT = "Turn your phone sideways for a wider view.";

// From opening the link to driving, or to a plain message saying why not.
export async function startGame(page: GamePage): Promise<void> {
  page.loading.textContent = "Loading the map";
  page.loading.hidden = false;
  const [loaded, physics] = await Promise.all([loadGameData(location.search), startPhysicsEngine()]);
  if (!loaded.ok) return showFailure(page, failureMessage(loaded.failure));
  if (!physics.ok) return showFailure(page, failureMessage({ kind: "physics-did-not-start", reason: physics.reason }));
  const rendered = createRenderer(page.canvas, window.devicePixelRatio);
  if (!rendered.ok) return showFailure(page, failureMessage(rendered.failure));
  const game = buildGame(loaded.value, rendered.renderer, page);
  for (const note of loaded.value.notes) showNotice(page, note);
  page.loading.hidden = true;
  page.controls.hidden = !shouldShowTouchControls(window.matchMedia("(pointer: coarse)").matches, false);
  // A touch screen on a computer gets the thumb controls once it is touched,
  // and the small map moves clear of them.
  window.addEventListener(
    "touchstart",
    () => {
      page.controls.hidden = false;
      placeHud(game);
    },
    { once: true },
  );
  listenForResize(game, page);
  window.dispatchEvent(new Event("resize"));
  // The street names follow without holding up the drive (scope 005b).
  listenToMiniMapTaps(game);
  void loadStreetsForPlace(game.data.place).then((streets) => streetsArrived(game, streets));
  requestAnimationFrame((now) => runFrame(game, now));
}

// An error nobody planned for still ends in a message on screen, never a
// frozen loading line.
export async function startGameSafely(page: GamePage): Promise<void> {
  try {
    await startGame(page);
  } catch (error) {
    showFailure(page, failureMessage({ kind: "something-unexpected", reason: String(error) }));
  }
}

// Everything the frames need, made once, with the car parked on the street.
export function buildGame(data: GameData, renderer: WebGLRenderer, page: GamePage): Game {
  const aspect = page.canvas.clientWidth / Math.max(1, page.canvas.clientHeight);
  const parts = createScene(LOAD_RADIUS_M, aspect);
  const world = createPhysicsWorld(data.place);
  addMapEdgeWalls(world, data.mapIndex.extent);
  const pose = carStartPose(data.mapIndex.start, data.place, data.vehicle);
  const car = createCar(world, data.vehicle, pose, data.place);
  const carDrawing = carModel(data.vehicle);
  parts.scene.add(carDrawing.group);
  const heldKeys = new Set<string>();
  listenToKeyboard(window, heldKeys);
  const touches = { state: noTouches };
  listenToTouches(page.controls, touches);
  const camera = new PerspectiveCamera(FIELD_OF_VIEW_DEG, aspect, NEAREST_DRAWN_M, FARTHEST_DRAWN_M);
  const aim = chaseCameraGoal(pose);
  camera.position.set(aim.cameraPoint.x, aim.cameraPoint.y, aim.cameraPoint.z);
  camera.lookAt(aim.lookPoint.x, aim.lookPoint.y, aim.lookPoint.z);
  const measuring = new URLSearchParams(location.search).has("measure")
    ? { drivableAtMs: undefined, lengthsMs: [], collectedS: 0, finished: false }
    : undefined;
  const game: Game = {
    data,
    page,
    renderer,
    parts,
    camera,
    aim,
    world,
    car,
    carDrawing,
    heldKeys,
    touches,
    navigator,
    roadCells: new Set(data.mapIndex.cells),
    squares: new Map(),
    leftOverS: 0,
    lastFrameMs: undefined,
    flipWasPressed: false,
    poseBefore: pose,
    poseNow: pose,
    edgeNoticeAtMs: undefined,
    measuring,
    streets: undefined,
    streetName: noStreetName,
    miniMap: { big: false, box: undefined, drawnAtMs: undefined },
  };
  updateStreaming(game, { eastM: pose.position.x, northM: -pose.position.z }, performance.now());
  return game;
}

// Turning the phone or resizing the window keeps the picture filling the
// screen without stretching; the fog depends on the screen's shape
// (approver's F13), the portrait hint shows only while the phone is held
// upright (decision E3 (a)), and the small map moves clear of the controls
// (scope 005b).
export function listenForResize(game: Game, page: GamePage): () => void {
  const { renderer, camera, parts } = game;
  function fitToScreen(): void {
    const width = page.canvas.clientWidth;
    const height = Math.max(1, page.canvas.clientHeight);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    Object.assign(parts.fog, fogRangeForView(LOAD_RADIUS_M, CAMERA_BEHIND_M, FIELD_OF_VIEW_DEG, camera.aspect));
    page.portraitHint.textContent = PORTRAIT_HINT;
    page.portraitHint.hidden = !portraitHintShown(!page.controls.hidden, window.innerWidth, window.innerHeight);
    placeHud(game);
  }
  window.addEventListener("resize", fitToScreen);
  return () => window.removeEventListener("resize", fitToScreen);
}

// The page's parts, by their ids in index.html.
const byId = document.getElementById.bind(document);
void startGameSafely({
  canvas: byId("game") as HTMLCanvasElement,
  controls: byId("controls") as HTMLElement,
  loading: byId("loading") as HTMLElement,
  panel: byId("panel") as HTMLElement,
  notice: byId("notice") as HTMLElement,
  portraitHint: byId("portrait-hint") as HTMLElement,
  measurePanel: byId("measure") as HTMLElement,
  streetName: byId("street-name") as HTMLElement,
  miniMap: byId("mini-map") as HTMLCanvasElement,
});
