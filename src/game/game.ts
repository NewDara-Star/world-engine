// The game's parts, kept between frames: what main.ts builds once and
// loop.ts and streaming.ts read and change every frame. Types only (plumbing,
// no design of its own): docs/designs/src/game/main.md (buildGame) says what
// the game holds.
import type RAPIER from "@dimforge/rapier3d-compat";
import type { Mesh, PerspectiveCamera, WebGLRenderer } from "three";
import type { CameraAim } from "../camera/chase.js";
import type { TouchState } from "../controls/touch.js";
import type { FrameRecorder } from "../measure/measure.js";
import type { Car, Pose } from "../vehicle/car.js";
import type { Cell } from "../world/grid.js";
import type { Street, StreetNameHold } from "../world/streets.js";
import type { MessagePage } from "./failure.js";
import type { ScreenBox } from "./hud-layout.js";
import type { GameData } from "./load.js";
import type { CarDrawing, SceneParts } from "./scene.js";

// The page's parts the game writes to (index.html).
export interface GamePage extends MessagePage {
  canvas: HTMLCanvasElement;
  portraitHint: HTMLElement;
  measurePanel: HTMLElement;
  streetName: HTMLElement;
  miniMap: HTMLCanvasElement;
}

// A loaded 100 m square: its ground, its collider, and its road when it has
// arrived (streaming.md).
export interface LoadedSquare {
  cell: Cell;
  groundMesh: Mesh;
  groundCollider: number;
  roadMesh: Mesh | undefined;
  road: "loading" | "loaded" | "failed" | "not-needed";
  failedAtMs: number | undefined;
  // Only the first failure of a square is told to the player; retries stay quiet.
  failedBefore: boolean;
}

export interface Game {
  data: GameData;
  page: GamePage;
  renderer: WebGLRenderer;
  parts: SceneParts;
  camera: PerspectiveCamera;
  aim: CameraAim;
  world: RAPIER.World;
  car: Car;
  carDrawing: CarDrawing;
  heldKeys: Set<string>;
  touches: { state: TouchState };
  navigator: Pick<Navigator, "getGamepads">;
  // The squares that have road, from the map index, by key.
  roadCells: ReadonlySet<string>;
  squares: Map<string, LoadedSquare>;
  leftOverS: number;
  lastFrameMs: number | undefined;
  flipWasPressed: boolean;
  poseBefore: Pose;
  poseNow: Pose;
  edgeNoticeAtMs: number | undefined;
  // In measuring mode (?measure in the link) until the report is shown.
  measuring: FrameRecorder | undefined;
  // The street file's streets once they arrive, or "failed" (hud.ts).
  streets: Street[] | "failed" | undefined;
  streetName: StreetNameHold;
  // Where the small map is on screen (none when it does not fit), whether it
  // is the big one, and when it was last drawn.
  miniMap: { big: boolean; box: ScreenBox | undefined; drawnAtMs: number | undefined };
}
