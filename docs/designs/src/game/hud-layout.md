# src/game/hud-layout.ts

Status: approved by the orchestrator in one pass (Scope 005b, the owner's lighter process for non-physics work, 2026-10-11).

New in scope 005b (item 3). Where the small map goes on the screen: a square
in the top right, below the street-name line, as big as asked but never over
a thumb control, in portrait or landscape. The controls are given as boxes
measured from the page (the steering half and each button), so this rule
does not repeat the page's sizes and stays right if they change. Pure; the
browser part is `hud.md`. Our own rule. The pictures drawn from the code will
be in `docs/flows/src/game/hud-layout.md`.

Numbers, the owner's choice, proposed by the coder on 2026-10-11 and awaiting
his yes: the small map 140 px, the big map 260 px; its top 52 px from the
screen's top (the name line is 8 px down and about 36 px tall); 8 px kept
clear round every control and the screen's edge; a map under 72 px is not
shown at all.

On a phone sideways the corner above the buttons is too short, so the map
moves just left of the Go and Flip upright column, still in the right half
(measured in the tests: 393 × 851 upright, the corner; 851 × 393 sideways,
left of the buttons).

## miniMapBox

Why the game needs it: the map must never cover the thumb controls (the scope's story), and should be as big as the player asked for.

```mermaid
flowchart TD
  s(["miniMapBox with the screen size, the controls' boxes and the size asked for"])
  a["right edges to try: the screen's right edge less the gap, and the left of each control less the gap; rightmost first"]
  b["for each right edge inside the screen: the size that fits there, from sizeClearOf"]
  c["keep the biggest; on a tie the one found first, the rightmost"]
  d{"is the best smaller than 72 px, or is there none"}
  e(["return nothing: the map is hidden"])
  f(["return the square from squareAt"])
  s --> a --> b --> c --> d
  d -->|"yes"| e
  d -->|"no"| f
```

## sizeClearOf

Why the game needs it: the biggest map up to the size asked for whose top-right corner is at this edge, inside the screen and clear of every control. A smaller square from the same corner sits inside a bigger one, so each control needs shrinking past at most once, and the loop ends.

```mermaid
flowchart TD
  s(["sizeClearOf with the right edge, the size asked for, the screen's height and the controls"])
  a["size = the smallest of: the size asked for, the room to the screen's left edge, the room down to the screen's bottom"]
  b{"is the size above 0, with passes left (one per control, plus one)"}
  c{"does the square touch a control, by boxesTouch"}
  d(["return the size"])
  e["size = shrunkPast that control"]
  f(["return the size, or 0 if it went below 0"])
  s --> a --> b
  b -->|"yes"| c
  c -->|"no"| d
  c -->|"yes"| e --> b
  b -->|"no"| f
```

## shrunkPast

Why the game needs it: either end the map above the control or start it to the control's right, whichever leaves the bigger map; both are smaller than now, because the two touch.

```mermaid
flowchart TD
  s(["shrunkPast with the right edge, the size and the control's box"])
  a["ending above = the control's top less the gap less the map's top"]
  b["starting right of = the right edge less the control's right less the gap"]
  c(["return the smaller of the size and the larger of those two"])
  s --> a --> b --> c
```

## squareAt

Why the game needs it: one place says what the map's box is, from its right edge and size.

```mermaid
flowchart TD
  s(["squareAt with the right edge and the size"])
  a(["return left = right less size, top = 52, right, bottom = 52 plus size"])
  s --> a
```

## boxesTouch

Why the game needs it: closer than the gap counts as touching, so a thumb aimed at a control's edge does not land on the map.

```mermaid
flowchart TD
  s(["boxesTouch a and b"])
  a(["return yes when they overlap after b is grown by the gap on every side"])
  s --> a
```
