# src/game/failure.ts

Drawn from the code by `npm run diagrams` (TypeScript compiler, no AI). Do not edit by hand: change the code, then run it again.

## failureMessage

```mermaid
flowchart TD
  n1(["failureMessage"])
  n2{"switch failure.kind"}
  n3(["return [#quot;The game could not reach its files. Check the Wi-F…"])
  n4(["return [#quot;The game's files are taking too long. The signal m…"])
  n5(["return [#96;A file the game needs is missing: ${failure.path}.…"])
  n6(["return [#96;The map for ${failure.placeId} has not been made y…"])
  n7(["return [#quot;The map files do not match the place file, so road…"])
  n8(["return [#96;The server could not send ${failure.path} (error $…"])
  n9["const more = failure.messages.length - MOST_MESSAGES_SHOWN;"]
  n10["const moreLine = [#96;… and ${more} more.#96;].filter(() =#gt; more …"]
  n11(["return [#96;${failure.path} has mistakes, so the game cannot s…"])
  n12(["return messageForStartProblem(failure);<br/>calls messageForStartProblem"])
  n1 --> n2
  n2 -->|"case #quot;no-connection#quot;"| n3
  n2 -->|"case #quot;too-slow#quot;"| n4
  n2 -->|"case #quot;file-missing#quot;"| n5
  n2 -->|"case #quot;map-not-baked#quot;"| n6
  n2 -->|"case #quot;map-baked-for-something-else#quot;"| n7
  n2 -->|"case #quot;server-error#quot;"| n8
  n2 -->|"case #quot;file-has-mistakes#quot;"| n9
  n9 --> n10
  n10 --> n11
  n2 -->|"default"| n12
```

## messageForStartProblem

```mermaid
flowchart TD
  n1(["messageForStartProblem"])
  n2{"switch failure.kind"}
  n3(["return [#96;The ${failure.vehicleName} is a ${failure.vehicleC…"])
  n4(["return [#quot;This browser cannot draw 3D: WebGL 2 is off or mis…"])
  n5(["return [#quot;The driving physics could not start on this device…"])
  n6{"#quot;reason#quot; in failure"}
  n7["failure.reason"]
  n8["failure.kind"]
  n9(["return [#quot;Something went wrong while starting.#quot;, #96;Technical …"])
  n1 --> n2
  n2 -->|"case #quot;vehicle-not-allowed#quot;"| n3
  n2 -->|"case #quot;cannot-draw-3d#quot;"| n4
  n2 -->|"case #quot;physics-did-not-start#quot;"| n5
  n2 -->|"default"| n6
  n6 -->|"yes"| n7
  n6 -->|"no"| n8
  n7 --> n9
  n8 --> n9
```

## showFailure

```mermaid
flowchart TD
  n1(["showFailure"])
  n2["page.canvas.hidden = true;"]
  n3["page.controls.hidden = true;"]
  n4["page.loading.hidden = true;"]
  n5["const heading = page.panel.ownerDocument.createElement(#quot;h1#quot;…"]
  n6["heading.textContent = #quot;The game could not start#quot;;"]
  n7["const paragraphs = lines.map((line) =#gt; Object.assign(page.p…"]
  n8["page.panel.replaceChildren(heading, ...paragraphs);"]
  n9["page.panel.hidden = false;"]
  n10(["end"])
  n1 --> n2
  n2 --> n3
  n3 --> n4
  n4 --> n5
  n5 --> n6
  n6 --> n7
  n7 --> n8
  n8 --> n9
  n9 --> n10
```

## showNotice

```mermaid
flowchart TD
  n1(["showNotice"])
  n2{"page.notice.dataset[#quot;shown#quot;] is missing?"}
  n3["#quot;0#quot;"]
  n4["const shownAt = String(Number(page.notice.dataset[#quot;shown#quot;] …"]
  n5["page.notice.dataset[#quot;shown#quot;] = shownAt;"]
  n6["page.notice.textContent = text;"]
  n7["page.notice.hidden = false;"]
  n8["setTimeout(() =#gt; (page.notice.hidden = page.notice.dataset[…"]
  n9(["end"])
  n1 --> n2
  n2 -->|"yes"| n3
  n2 -->|"no"| n4
  n3 --> n4
  n4 --> n5
  n5 --> n6
  n6 --> n7
  n7 --> n8
  n8 --> n9
```
