// Turns a failure into plain words, and shows messages on the page (scope
// 005 item 4: the player "is told so in plain words, not left with a blank
// screen"). Text from files is put on the page as text, never as HTML (DOM
// `textContent`), so a file can never inject anything into the page.
// Design: docs/designs/src/game/failure.md.

// Everything that can stop the game starting, with what the words need.
export type GameFailure =
  | { kind: "no-connection"; path: string }
  | { kind: "too-slow"; path: string }
  | { kind: "file-missing"; path: string }
  | { kind: "server-error"; path: string; status: number }
  | { kind: "file-has-mistakes"; path: string; messages: string[] }
  | { kind: "map-not-baked"; placeId: string }
  | { kind: "map-baked-for-something-else"; problems: string[] }
  | { kind: "vehicle-not-allowed"; vehicleName: string; vehicleClass: string; allowedClasses: string[] }
  | { kind: "cannot-draw-3d" }
  | { kind: "physics-did-not-start"; reason: string }
  | { kind: "something-unexpected"; reason: string };

// The page's parts a message is shown in (index.html).
export interface MessagePage {
  canvas: HTMLElement;
  controls: HTMLElement;
  loading: HTMLElement;
  panel: HTMLElement;
  notice: HTMLElement;
}

// A checker's messages beyond this many are counted, not listed, so a phone
// screen is not filled.
const MOST_MESSAGES_SHOWN = 10;
const NOTICE_SHOWN_MS = 4000;

// What went wrong and what to do about it, in words a non-coder understands;
// a place-maker sees the checker's exact lines.
export function failureMessage(failure: GameFailure): string[] {
  switch (failure.kind) {
    case "no-connection":
      return ["The game could not reach its files. Check the Wi-Fi or mobile data, then reload the page."];
    case "too-slow":
      return ["The game's files are taking too long. The signal may be weak; reload to try again."];
    case "file-missing":
      return [`A file the game needs is missing: ${failure.path}. If you typed a link by hand, check the spelling.`];
    case "map-not-baked":
      return [`The map for ${failure.placeId} has not been made yet. On the computer, run the bake for it (see the README).`];
    case "map-baked-for-something-else":
      return ["The map files do not match the place file, so roads would be in the wrong place. Run the bake again.", ...failure.problems];
    case "server-error":
      return [`The server could not send ${failure.path} (error ${failure.status}). Reload in a moment.`];
    case "file-has-mistakes": {
      const more = failure.messages.length - MOST_MESSAGES_SHOWN;
      const moreLine = [`… and ${more} more.`].filter(() => more > 0);
      return [`${failure.path} has mistakes, so the game cannot start.`, ...failure.messages.slice(0, MOST_MESSAGES_SHOWN), ...moreLine];
    }
    default:
      return messageForStartProblem(failure);
  }
}

// The rarer failures, after the files are good.
export function messageForStartProblem(failure: GameFailure): string[] {
  switch (failure.kind) {
    case "vehicle-not-allowed":
      return [`The ${failure.vehicleName} is a ${failure.vehicleClass}, and the place allows only ${failure.allowedClasses.join(", ")}.`];
    case "cannot-draw-3d":
      return ["This browser cannot draw 3D: WebGL 2 is off or missing. Try Chrome, or switch on hardware acceleration in the browser's settings."];
    case "physics-did-not-start":
      return ["The driving physics could not start on this device.", `Technical reason, to send on: ${failure.reason}`];
    default:
      return ["Something went wrong while starting.", `Technical reason, to send on: ${"reason" in failure ? failure.reason : failure.kind}`];
  }
}

// The message replaces the game on screen, and the controls are hidden so
// nothing looks drivable.
export function showFailure(page: MessagePage, lines: readonly string[]): void {
  page.canvas.hidden = true;
  page.controls.hidden = true;
  page.loading.hidden = true;
  const heading = page.panel.ownerDocument.createElement("h1");
  heading.textContent = "The game could not start";
  const paragraphs = lines.map((line) => Object.assign(page.panel.ownerDocument.createElement("p"), { textContent: line }));
  page.panel.replaceChildren(heading, ...paragraphs);
  page.panel.hidden = false;
}

// Anything the game does by itself is shown with the reason, and goes away
// by itself (CLAUDE.md). The strip ignores touches (pointer-events: none, in
// index.html) so it never swallows a pedal press (approver's F15).
export function showNotice(page: Pick<MessagePage, "notice">, text: string): void {
  const shownAt = String(Number(page.notice.dataset["shown"] ?? "0") + 1);
  page.notice.dataset["shown"] = shownAt;
  page.notice.textContent = text;
  page.notice.hidden = false;
  // Hidden only if no newer notice replaced it; a newer one is still showing,
  // and hides itself later.
  setTimeout(() => (page.notice.hidden = page.notice.dataset["shown"] === shownAt), NOTICE_SHOWN_MS);
}
