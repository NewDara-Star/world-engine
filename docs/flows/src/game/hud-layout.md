# src/game/hud-layout.ts

Drawn from the code by `npm run diagrams` (TypeScript compiler, no AI). Do not edit by hand: change the code, then run it again.

## miniMapBox

```mermaid
flowchart TD
  n1(["miniMapBox"])
  n2["const rightEdges = [screen.width - CLEAR_GAP_PX, ...keepOut…"]
  n3["let best: { rightPx: number; sizePx: number } | undefined;"]
  n4{"for each const rightPx of rightEdges"}
  n5{"rightPx #gt; screen.width - CLEAR_GAP_PX"}
  n6["continue"]
  n7["const sizePx = sizeClearOf(rightPx, wantedPx, screen.height…<br/>calls sizeClearOf"]
  n8{"best?.sizePx is missing?"}
  n9["0"]
  n10{"sizePx #gt; (best?.sizePx ?? 0)"}
  n11["best = { rightPx, sizePx };"]
  n12{"best === undefined"}
  n13{"best.sizePx #lt; SMALLEST_MINI_MAP_PX"}
  n14(["return undefined;"])
  n15(["return squareAt(best.rightPx, best.sizePx);<br/>calls squareAt"])
  n1 --> n2
  n2 --> n3
  n3 --> n4
  n4 -->|"next item"| n5
  n5 -->|"yes"| n6
  n5 -->|"no"| n7
  n7 --> n8
  n8 -->|"yes"| n9
  n8 -->|"no"| n10
  n9 --> n10
  n10 -->|"yes"| n11
  n11 --> n4
  n10 -->|"no"| n4
  n6 --> n4
  n4 -->|"done"| n12
  n12 -->|"no"| n13
  n12 -->|"yes"| n14
  n13 -->|"yes"| n14
  n13 -->|"no"| n15
```

## sizeClearOf

```mermaid
flowchart TD
  n1(["sizeClearOf"])
  n2["let sizePx = Math.min(wantedPx, rightPx - CLEAR_GAP_PX, scr…"]
  n3["let pass = 0"]
  n4{"pass #lt;= keepOut.length"}
  n5{"sizePx #gt; 0"}
  n6["const square = squareAt(rightPx, sizePx);<br/>calls squareAt"]
  n7["const hit = keepOut.find((box) =#gt; boxesTouch(square, box));<br/>calls boxesTouch"]
  n8{"hit === undefined"}
  n9(["return sizePx;"])
  n10["sizePx = shrunkPast(rightPx, sizePx, hit);<br/>calls shrunkPast"]
  n11["pass += 1"]
  n12(["return Math.max(0, sizePx);"])
  n1 --> n2
  n2 --> n3
  n3 --> n4
  n4 -->|"yes"| n5
  n5 -->|"yes"| n6
  n6 --> n7
  n7 --> n8
  n8 -->|"yes"| n9
  n8 -->|"no"| n10
  n10 --> n11
  n11 --> n4
  n4 -->|"no"| n12
  n5 -->|"no"| n12
```

## shrunkPast

```mermaid
flowchart TD
  n1(["shrunkPast"])
  n2["const endingAbove = box.top - CLEAR_GAP_PX - MINI_MAP_TOP_P…"]
  n3["const startingRightOf = rightPx - (box.right + CLEAR_GAP_PX…"]
  n4(["return Math.min(sizePx, Math.max(endingAbove, startingRight…"])
  n1 --> n2
  n2 --> n3
  n3 --> n4
```

## squareAt

```mermaid
flowchart TD
  n1(["squareAt"])
  n2(["return { left: rightPx - sizePx, top: MINI_MAP_TOP_PX, righ…"])
  n1 --> n2
```

## boxesTouch

```mermaid
flowchart TD
  n1(["boxesTouch"])
  n2{"a.left #lt; b.right + CLEAR_GAP_PX"}
  n3{"a.right #gt; b.left - CLEAR_GAP_PX"}
  n4{"a.top #lt; b.bottom + CLEAR_GAP_PX"}
  n5["a.bottom #gt; b.top - CLEAR_GAP_PX"]
  n6(["return a.left #lt; b.right + CLEAR_GAP_PX && a.right #gt; b.left …"])
  n1 --> n2
  n2 -->|"yes"| n3
  n3 -->|"yes"| n4
  n4 -->|"yes"| n5
  n2 -->|"no"| n6
  n3 -->|"no"| n6
  n4 -->|"no"| n6
  n5 --> n6
```
