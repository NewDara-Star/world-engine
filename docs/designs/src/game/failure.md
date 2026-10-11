# src/game/failure.ts

Status: draft

New in scope 005 (item 4, "a plain-words message if loading fails"; the
player's story: "he is told so in plain words, not left with a blank
screen"). Turns a failure into words, and shows messages on the page. Text
from files (a place name, a checker message) is put on the page as text, never
as HTML (DOM `textContent`), so a file can never inject anything into the
page. The pictures drawn from the code will be in
`docs/flows/src/game/failure.md`.

## failureMessage

Why the game needs it: the player sees what went wrong and what to do about it, in words a non-coder understands; a place-maker sees the checker's exact line.

```mermaid
flowchart TD
  s(["failureMessage of a failure"])
  a{"which kind"}
  b(["no connection: The game could not reach its files. Check the Wi-Fi or mobile data, then reload the page."])
  c(["file missing: A file the game needs is missing: the path. If you typed a link by hand, check the spelling."])
  d(["map not baked: The map for the place has not been made yet. On the computer, run the bake for it (see the README)."])
  e(["map baked for something else: The map files do not match the place file, so roads would be in the wrong place. Run the bake again. Then the reasons."])
  f(["server error: The server could not send the path (error number). Reload in a moment."])
  g(["file has mistakes: The path has mistakes, so the game cannot start. Then the first ten messages, and how many more"])
  h(["vehicle not allowed here, cannot draw 3D, physics did not start, or something unexpected: messageForStartProblem"])
  s --> a
  a -->|"no connection"| b
  a -->|"file missing"| c
  a -->|"map not baked"| d
  a -->|"map baked for something else"| e
  a -->|"server error"| f
  a -->|"file has mistakes"| g
  a -->|"anything else"| h
```

## messageForStartProblem

Why the game needs it: the rarer failures, after the files are good, get their own plain words.

```mermaid
flowchart TD
  s(["messageForStartProblem of a failure"])
  a{"which kind"}
  b(["vehicle not allowed here: The vehicle name is a class, and the place allows only the list."])
  c(["cannot draw 3D: This browser cannot draw 3D: WebGL 2 is off or missing. Try Chrome, or switch on hardware acceleration in the browser's settings."])
  d(["physics did not start: The driving physics could not start on this device. Then the technical reason, for the owner to send on."])
  e(["something unexpected: Something went wrong while starting. Then the technical reason, for the owner to send on."])
  s --> a
  a -->|"vehicle not allowed here"| b
  a -->|"cannot draw 3D"| c
  a -->|"physics did not start"| d
  a -->|"anything else"| e
```

## showFailure

Why the game needs it: the message replaces the game on screen, readable on a phone, and the controls are hidden so nothing looks drivable.

```mermaid
flowchart TD
  s(["showFailure on the page, with the message"])
  a["hide the game's canvas and the touch controls"]
  b["write the heading and each line of the message as text into the message panel, and show it"]
  c(["return"])
  s --> a --> b --> c
```

## showNotice

Why the game needs it: anything the game does by itself (putting the car back, part of the map not loading, the map's edge) is shown with the reason, and goes away by itself (CLAUDE.md: nothing happens behind the player's back).

```mermaid
flowchart TD
  s(["showNotice on the page, with a line of text"])
  a["write the text into the notice strip and show it; if a notice is already showing, it is replaced"]
  b["after 4 seconds, hide it, unless a newer notice has replaced it since"]
  c(["return"])
  s --> a --> b --> c
```
