// Where the small map goes on the screen (scope 005b): a square in the top
// right, below the street-name line, as big as asked but never over a thumb
// control. The controls are given as boxes measured from the page, so this
// rule does not repeat the page's sizes and stays right if they change.
// Pure; the browser part is in hud.ts. Our own rule.
// Design: docs/designs/src/game/hud-layout.md.

// A box on the screen, in CSS pixels from the top-left corner.
export interface ScreenBox {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

// The owner's choice, proposed by the coder on 2026-10-11 and awaiting his
// yes: the small map about a thumb's reach across, the big one nearly double;
// it starts below the street-name line (index.html: the line is 8 px from the
// top and about 36 px tall); 8 px is kept clear around every control.
export const MINI_MAP_SMALL_PX = 140;
export const MINI_MAP_BIG_PX = 260;
export const MINI_MAP_TOP_PX = 52;
export const CLEAR_GAP_PX = 8;
// Below this the map is too small to read, so it is not shown at all.
export const SMALLEST_MINI_MAP_PX = 72;

// Tries the screen's right edge, then just left of each control; keeps the
// place where the biggest map fits, the rightmost on a tie. Nothing when no
// place fits a readable map.
export function miniMapBox(screen: { width: number; height: number }, keepOut: readonly ScreenBox[], wantedPx: number): ScreenBox | undefined {
  const rightEdges = [screen.width - CLEAR_GAP_PX, ...keepOut.map((box) => box.left - CLEAR_GAP_PX)].toSorted((a, b) => b - a);
  let best: { rightPx: number; sizePx: number } | undefined;
  for (const rightPx of rightEdges) {
    if (rightPx > screen.width - CLEAR_GAP_PX) continue;
    const sizePx = sizeClearOf(rightPx, wantedPx, screen.height, keepOut);
    if (sizePx > (best?.sizePx ?? 0)) best = { rightPx, sizePx };
  }
  if (best === undefined || best.sizePx < SMALLEST_MINI_MAP_PX) return undefined;
  return squareAt(best.rightPx, best.sizePx);
}

// The biggest square up to the wanted size whose top-right corner is here,
// inside the screen and clear of every control. A smaller square from the
// same corner sits inside a bigger one, so each control needs shrinking past
// at most once, and the loop ends.
export function sizeClearOf(rightPx: number, wantedPx: number, screenHeight: number, keepOut: readonly ScreenBox[]): number {
  let sizePx = Math.min(wantedPx, rightPx - CLEAR_GAP_PX, screenHeight - CLEAR_GAP_PX - MINI_MAP_TOP_PX);
  for (let pass = 0; pass <= keepOut.length && sizePx > 0; pass += 1) {
    const square = squareAt(rightPx, sizePx);
    const hit = keepOut.find((box) => boxesTouch(square, box));
    if (hit === undefined) return sizePx;
    sizePx = shrunkPast(rightPx, sizePx, hit);
  }
  return Math.max(0, sizePx);
}

// Either end the square above the control or start it to the control's
// right, whichever leaves the bigger square; both are smaller than now,
// because the two touch.
export function shrunkPast(rightPx: number, sizePx: number, box: ScreenBox): number {
  const endingAbove = box.top - CLEAR_GAP_PX - MINI_MAP_TOP_PX;
  const startingRightOf = rightPx - (box.right + CLEAR_GAP_PX);
  return Math.min(sizePx, Math.max(endingAbove, startingRightOf));
}

export function squareAt(rightPx: number, sizePx: number): ScreenBox {
  return { left: rightPx - sizePx, top: MINI_MAP_TOP_PX, right: rightPx, bottom: MINI_MAP_TOP_PX + sizePx };
}

// Closer than the gap counts as touching, so a thumb aimed at a control's
// edge does not land on the map.
export function boxesTouch(a: ScreenBox, b: ScreenBox): boolean {
  return a.left < b.right + CLEAR_GAP_PX && a.right > b.left - CLEAR_GAP_PX && a.top < b.bottom + CLEAR_GAP_PX && a.bottom > b.top - CLEAR_GAP_PX;
}
