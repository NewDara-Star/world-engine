# src/controls/touch.ts

Drawn from the code by `npm run diagrams` (TypeScript compiler, no AI). Do not edit by hand: change the code, then run it again.

## touchStateAfter

```mermaid
flowchart TD
  n1(["touchStateAfter"])
  n2{"switch event.kind"}
  n3(["return fingerDown(state, event);<br/>calls fingerDown"])
  n4(["return fingerMoved(state, event);<br/>calls fingerMoved"])
  n5(["return fingerLifted(state, event.pointerId);<br/>calls fingerLifted"])
  n6(["end"])
  n1 --> n2
  n2 -->|"case #quot;down#quot;"| n3
  n2 -->|"case #quot;move#quot;"| n4
  n2 -->|"case #quot;cancel#quot;"| n5
  n2 -->|"case #quot;up#quot;"| n5
  n2 -->|"no case matches"| n6
```

## fingerDown

```mermaid
flowchart TD
  n1(["fingerDown"])
  n2{"event.role === #quot;stick#quot;"}
  n3{"state.stick !== null"}
  n4(["return state;"])
  n5["const start = { x: Math.min(Math.max(event.x, STICK_RADIUS_…"]
  n6(["return { ...state, stick: { pointerId: event.pointerId, sta…"])
  n7{"event.role !== #quot;none#quot;"}
  n8(["return { ...state, buttons: [...state.buttons, { pointerId:…"])
  n9(["return state;"])
  n1 --> n2
  n2 -->|"yes"| n3
  n3 -->|"yes"| n4
  n3 -->|"no"| n5
  n5 --> n6
  n2 -->|"no"| n7
  n7 -->|"yes"| n8
  n7 -->|"no"| n9
```

## fingerMoved

```mermaid
flowchart TD
  n1(["fingerMoved"])
  n2{"state.stick?.pointerId === event.pointerId"}
  n3(["return { ...state, stick: { ...state.stick, now: { x: event…"])
  n4["const held = state.buttons.find((button) =#gt; button.pointerI…"]
  n5{"held !== undefined"}
  n6{"PEDALS.includes(held.role)"}
  n7{"PEDALS.includes(event.role)"}
  n8{"held.role !== event.role"}
  n9["const otherPedal = event.role as ButtonRole;"]
  n10(["return { ...state, buttons: [...state.buttons.filter((butto…"])
  n11(["return state;"])
  n1 --> n2
  n2 -->|"yes"| n3
  n2 -->|"no"| n4
  n4 --> n5
  n5 -->|"yes"| n6
  n6 -->|"yes"| n7
  n7 -->|"yes"| n8
  n8 -->|"yes"| n9
  n9 --> n10
  n5 -->|"no"| n11
  n6 -->|"no"| n11
  n7 -->|"no"| n11
  n8 -->|"no"| n11
```

## fingerLifted

```mermaid
flowchart TD
  n1(["fingerLifted"])
  n2{"state.stick?.pointerId === pointerId"}
  n3(["return { ...state, stick: null };"])
  n4(["return { ...state, buttons: state.buttons.filter((button) =…"])
  n1 --> n2
  n2 -->|"yes"| n3
  n2 -->|"no"| n4
```

## stickSteer

```mermaid
flowchart TD
  n1(["stickSteer"])
  n2["const sideways = Math.max(-1, Math.min(1, (now.x - start.x)…"]
  n3(["return withDeadZone(sideways, deadZone);<br/>calls withDeadZone"])
  n1 --> n2
  n2 --> n3
```

## touchActions

```mermaid
flowchart TD
  n1(["touchActions"])
  n2{"state.stick === null"}
  n3["0"]
  n4["stickSteer(state.stick.start, state.stick.now, STICK_RADIUS…<br/>calls stickSteer"]
  n5["const steer = state.stick === null ? 0 : stickSteer(state.s…<br/>calls stickSteer"]
  n6["const roles = state.buttons.map((button) =#gt; button.role);"]
  n7(["return { steer, accelerate: Number(roles.includes(#quot;accelera…"])
  n1 --> n2
  n2 -->|"yes"| n3
  n2 -->|"no"| n4
  n3 --> n5
  n4 --> n5
  n5 --> n6
  n6 --> n7
```

## shouldShowTouchControls

```mermaid
flowchart TD
  n1(["shouldShowTouchControls"])
  n2{"coarsePointer"}
  n3["touchSeen"]
  n4(["return coarsePointer || touchSeen;"])
  n1 --> n2
  n2 -->|"no"| n3
  n2 -->|"yes"| n4
  n3 --> n4
```

## portraitHintShown

```mermaid
flowchart TD
  n1(["portraitHintShown"])
  n2{"touchControlsShown"}
  n3["height #gt; width"]
  n4(["return touchControlsShown && height #gt; width;"])
  n1 --> n2
  n2 -->|"yes"| n3
  n2 -->|"no"| n4
  n3 --> n4
```

## listenToTouches

```mermaid
flowchart TD
  n1(["listenToTouches"])
  n2["const page = layer.ownerDocument;"]
  n3["const listening = new AbortController();"]
  n4["const options = { signal: listening.signal };"]
  n5{"for each const type of Object.keys(KIND_OF_POINTER_EVENT)"}
  n6["layer.addEventListener(type, passPointerEvent as EventListe…"]
  n7["page.addEventListener(#quot;visibilitychange#quot;, () =#gt; (kept.state…"]
  n8["page.defaultView?.addEventListener(#quot;blur#quot;, () =#gt; (kept.stat…"]
  n9["layer.addEventListener(#quot;contextmenu#quot;, (event) =#gt; event.prev…"]
  n10(["return () =#gt; listening.abort();"])
  n1 --> n2
  n2 --> n3
  n3 --> n4
  n4 --> n5
  n5 -->|"next item"| n6
  n6 --> n5
  n5 -->|"done"| n7
  n7 --> n8
  n8 --> n9
  n9 --> n10
```

## listenToTouches > passPointerEvent

```mermaid
flowchart TD
  n1(["listenToTouches #gt; passPointerEvent"])
  n2{"event.type === #quot;pointerdown#quot;"}
  n3["(event.target as Element).setPointerCapture(event.pointerId…"]
  n4["event.preventDefault();"]
  n5{"page.elementFromPoint(event.clientX, event.clientY)?.closes… is missing?"}
  n6["#quot;none#quot;"]
  n7["const under = page.elementFromPoint(event.clientX, event.cl…"]
  n8{"ROLES.find((known) =#gt; known === under) is missing?"}
  n9["#quot;none#quot;"]
  n10["const role = ROLES.find((known) =#gt; known === under) ?? #quot;non…"]
  n11{"KIND_OF_POINTER_EVENT[event.type] is missing?"}
  n12["#quot;cancel#quot;"]
  n13["kept.state = touchStateAfter(kept.state, { kind: KIND_OF_PO…<br/>calls touchStateAfter"]
  n14(["end"])
  n1 --> n2
  n2 -->|"yes"| n3
  n3 --> n4
  n2 -->|"no"| n4
  n4 --> n5
  n5 -->|"yes"| n6
  n5 -->|"no"| n7
  n6 --> n7
  n7 --> n8
  n8 -->|"yes"| n9
  n8 -->|"no"| n10
  n9 --> n10
  n10 --> n11
  n11 -->|"yes"| n12
  n11 -->|"no"| n13
  n12 --> n13
  n13 --> n14
```
