# 27: The HUD, against top-end driving games

Date: 2026-10-05. Question: what do the best driving games do with their HUD
(layout, speed and gear, map, sat-nav, messages, type, colour, glass, motion,
cockpit view, accessibility), how do driving-school sims show faults without
clutter, and what exactly should our HUD become? Research only; no code
changed.

What was checked:
- Our code: `game/index.html`, `game/src/client/style.css` (226 lines, the
  only stylesheet for the game page), the HUD parts of `main.ts` (`updateDash`,
  `showFault`, `updateTally`, `updateNav`, `openWheelMon`, `g29.onChange`,
  the autodrive label), `map.ts` (`drawMinimap`), `rules.ts` (`verdict`),
  `mirrors.ts` (mirror placement).
- Mac screenshots, stills at 1600x794 and 1600x918 (Electron window, CSS
  pixels = macOS points): `game/shots/svc/001` and `005`, `lights2/006`
  (two faults), `lights/004` (night, 20:30), `own/001`, `check/001`. No
  cockpit-view screenshot exists; everything said about cockpit layout below
  is from code, untested on screen.
- Pinterest and the Game UI Database (gameuidatabase.com) both refuse
  automated fetches (403), so game layouts come from published manuals,
  accessibility write-ups, developer pages and patch notes, plus what is
  widely known from playing these games. Where a layout detail is from
  memory rather than a fetched page it says **[from play]**.

## 1. What we have now, and what's wrong with it

Read off the screenshots at their native size.

| Element | Now | Problem seen |
|---|---|---|
| Top bar | Cream pills, 13 px bold, emoji icons: "📍 Finglas", "☀️ 10:37", mute, then World far right | Three visual languages on one screen: cream pills, dark examiner/speedo panels, a saturated blue sat-nav card. Cream pills glare at night (`lights/004`). Emoji render as Apple Color Emoji, can't be tinted for states, and read as a chat app, not a car. |
| Drive bar | Get out, Wheel check (and Connect / Set up wheel) under World, top right | Always on while driving. Get out is offered at 50 km/h. |
| Wheel check | 320 px cream panel, top left at y=90 | **Opens itself on every wheel connect** (`g29.onChange` → `openWheelMon(true)`) and never closes, so it covers the left third in every G29 shot (`svc/001-008`). Shows a raw HID dump to the driver. |
| Examiner | Dark panel top left, y=56: "G1 0 · G2 0 · G3 0 PASS" plus up to 5 fault lines that fade to 45% after 8 s but stay | Sits under the Wheel check panel and collides with it (`lights2/006`: two faults drawn through the wheel panel). "PASS" is shown at minute one, before anything has been tested. Five lines of prose is a reading task while driving. |
| Sat-nav | Blue card top centre, 22 px distance, 14 px text, Unicode arrow | Says "Turn right", never the street. No lane guidance although the SUMO network knows the lanes. The dev autodrive label (top 56 px, centred) cuts through its second line in every autodrive shot. |
| Speedo | Dark box bottom right: 30 px speed, km/h, arrows, 34 px limit disc, PRND, tell-tale row | About 40% of the box is empty (the tell-tale row reserves space at opacity 0). Limit disc is smaller than the speed. Indicator arrows glow dull green when off. |
| Minimap | 220 px circle bottom left, heading-up, zoom with speed | Good bones. The "N" is a 6 px letter that drifts round the rim unnoticed; the route (light blue) is close to the road grey-blue; no frame, so it bleeds into grass. |
| Labels | POI and place labels in the world | Drawn above HUD panels ("Keith Lenihan Motors" over the wheel panel in `lights/004`). |
| Toast | Black box top centre, y=64 | Same spot as the sat-nav card and autodrive label. |
| Pause | Dark centred box, blurred backdrop | Fine as a base; holds FOV and textures but not the wheel settings that should live there. |

The root problem is not any one panel: there's no layout system. Every
element picks its own corner, colour and size, so they collide as soon as
two are on at once. The fix is zones, one material, one type scale, one
z-order, and a rule for what may be on screen while the car moves.

## 2. What top-end driving games do

### 2.1 Layout zones

- **Forza Horizon 4/5:** speedometer and map "located on the lower corners
  of the screen" and "mainly transparent to give way to the road"; bold white
  speed, gear smaller and coloured, revs flash red at the limit
  ([Mechanics of Magic, FH4](https://mechanicsofmagic.com/?p=6144)). Map
  bottom left, speedo bottom right, race info and notifications along the
  top **[from play]**. Every element can be toggled: map, lap/position,
  wrong-way, notifications, analogue or digital speedo
  ([Can I Play That, FH5](https://caniplaythat.com/2021/11/04/forza-horizon-5-accessibility-menu-deep-dive/)).
- **GTA V:** heading-up rectangular radar bottom left; street, area and
  vehicle name appear bottom right when they change and fade out after a few
  seconds ([GTA wiki, HUD](https://gta.fandom.com/wiki/Heads-Up_Display),
  [Hide Extra HUD Features mod](https://www.gta5-mods.com/scripts/hide-extra-hud-features)).
  Help text top left, subtitles bottom centre **[from play]**. The lesson:
  location is an *event*, not a permanent label.
- **Need for Speed Unbound:** minimap lower left with a coloured route line;
  speedo/tacho/nitrous together lower right, each toggleable
  ([EA accessibility page](https://ea.com/able/resources/need-for-speed-unbound)).
  Players criticised the map as unreadable at speed and the HUD sitting near
  the centre on ultrawide screens
  ([EA forums](https://forums.ea.com/discussions/need-for-speed-unbound-tech-issues-en/ultrawide/9398398)).
  Lesson: anchor to the corners of a 16:9/16:10 safe box, and don't make the
  map the only way to know the next turn.
- **Gran Turismo 7:** track map and (since an update) wind indicators upper
  right; a multi-function display cycles functions (TCS, brake balance, fuel
  map, radar, weather radar) in *one slot* with the d-pad
  ([GT7 manual](https://www.gran-turismo.com/gb/gt7/manual/race/02),
  [EGM on the update](https://egmnow.com/gran-turismo-7-update-adds-new-race-indicators-and-replay-music/)).
  Lesson: one slot that changes beats five permanent boxes.
- **Euro Truck Simulator 2 (2026 rework):** the old Route Advisor panel became
  separate widgets; each can be set to show in **interior view, exterior
  view, both or neither**; non-driving data moved to a Quick Info menu;
  notifications get "a dedicated, color-coded area displaying one alert at a
  time to reduce screen clutter"
  ([patched.gg](https://patched.gg/games/euro-truck-simulator-2/the-new-route-advisor-why-and-how-its-evolving)).
  Fines and messages previously went to a messages tab
  ([Route Advisor wiki](https://trucksimulator.wiki.gg/wiki/Route_Advisor)).
  This is the closest model to ours: sim, real-ish roads, cockpit-first.
- **BeamNG.drive:** every HUD element is an "app" the player moves and
  resizes; each app has a **Hide in cockpit** checkbox; layouts switch per
  activity (bus routes add a stops app)
  ([BeamNG docs](https://documentation.beamng.com/getting_started/user_interface)).
- **Microsoft Flight Simulator:** the in-flight toolbar sits at the top and
  stays hidden until the mouse goes there; MSFS 2024 restyled it to match
  the menus ([FSElite](https://fselite.net/content/microsoft-flight-simulator-2024-ui-overview/),
  [MSFS Addons](https://msfsaddons.com/2025/01/06/msfs-2024-users-can-now-get-rid-of-the-toolbar-handle-just-like-in-msfs-2020/)).
  Lesson: buttons you don't need while moving (our World, Get out, Invite)
  belong in an auto-hiding dock.
- **The Crew Motorfest:** "High-contrast HUD option, to add high contrast
  black backgrounds behind key HUD text", per-element toggles, scalable text,
  colour-blind presets, voiced sat-nav
  ([Ubisoft accessibility spotlight](https://news.ubisoft.com/en-gb/article/OUUpCEKxrkfv6I5sGAeWz/the-crew-motorfest-accessibility-spotlight));
  Can I Play That notes plain white text over gameplay is the genre's
  common failure ([caniplaythat](https://caniplaythat.com/?p=12609)).

The pattern across all of them: **map bottom left, speed bottom right,
navigation and race info along the top, messages in one queued slot**, and
everything else either fades out when unchanged or lives in a menu.

### 2.2 Speed, gear, revs

- Forza: analogue dial or digital, the player's choice; speed is the biggest
  number on screen; gear small and coloured; rev limit by colour flash.
- Real cars and ETS2 show the speed-limit sign next to the speed at the same
  visual weight, because the two are read together.
- For an automatic driving-test car, revs don't matter; **speed vs limit** and
  **selector position** do. A dial would be decoration. Digital speed, big.

### 2.3 Map shape and rotation

- GTA V: rectangle, heading-up. FH and NFS: lower-left, heading-up with a
  route line **[from play]**. A circle reads as a compass and hides the
  rotating square's corners; a rectangle shows more road ahead. Heading-up
  is universal in driving games because the player turns with the car.
- Zoom out with speed (we already do: 2.2x down to 1.0x at 25 m/s).

### 2.4 Sat-nav cards and lane guidance

- Real sat-navs (Google Maps, Garmin "Active Lane Guidance") show: big turn
  glyph, distance, the **street name you turn onto**, a lane row with the
  lanes to use highlighted, and a small "then" glyph when two turns are
  close ([Garmin manual](https://www8.garmin.com/manuals/webhelp/GUID-03E29042-23C8-4418-8521-2AAEA94C7400/EN-US/GUID-E6EA81D1-5E15-4F3D-8021-4A8421F0BD0C.html),
  [Mapbox maneuver view API](https://docs.mapbox.com/android/navigation/api/coreframework/3.7.2/ui-components/com.mapbox.navigation.ui.components.maneuver.model/-maneuver-view-options/lane-guidance-turn-icon-maneuver.html)).
- ETS2's known weakness: lane changes only shown "almost right on top of"
  the junction ([ets2_autopilot2 notes](https://github.com/Hexus-One/ets2_autopilot2)).
  Show the lane row from the first prompt (our spoken prompt is at
  60-220 m).

### 2.5 Notifications

- One at a time, queued, colour-coded (ETS2 2026; God of War Ragnarok uses
  "a single queuing system ... displaying one message at a time"
  ([80.lv](https://80.lv/articles/a-deep-dive-into-god-of-war-ragnar-k-s-user-interface))).
- FH5 lets the player set notification duration
  ([Can I Play That](https://caniplaythat.com/2021/11/04/forza-horizon-5-accessibility-menu-deep-dive/)).

### 2.6 Type

- Racing HUDs use clean sans-serifs for numbers read at a glance; Forza's
  in-game type is a contemporary sans, the display face is reserved for the
  logo ([Made Good Designs](https://madegooddesigns.com/?p=10598)).
- God of War: two typefaces only; the 2018 text was "so small it was
  unreadable while sitting on a couch", so Ragnarok added scaling, growing
  small text faster than large ([80.lv](https://80.lv/articles/a-deep-dive-into-god-of-war-ragnar-k-s-user-interface)).
- OFL candidates, licences checked in `google/fonts` METADATA:
  **Inter** (OFL, Rasmus Andersson; variable, tabular figures),
  **Barlow / Barlow Semi Condensed** (OFL; drawn from California highway
  signs, close to DIN, [fontalternatives](https://fontalternatives.com/compare/barlow-vs-din/)),
  **Overpass** (OFL; Highway Gothic). Irish road signs use the Transport
  typeface, which I didn't find under an open licence (not checked further).

### 2.7 Colour, translucency, glass

- FH: mostly transparent HUD, white numbers. Motorfest: optional solid black
  plates. Xbox XAG 102: text contrast 4.5:1 (3:1 for large), 7:1 in a
  high-contrast mode; over non-solid backgrounds measure against the
  lowest-contrast part, and "allow players to put a solid background behind
  on-screen text, and adjust its opacity"
  ([XAG 102](https://devdocs.xbox.com/build/game-principles/accessibility/xag-deep-dives/xag-102-contrast.md)).
- Measured for us: white text on a black plate of opacity *a* over a white
  sky (our worst case, `svc/001`). Plate colour #0E1014.
  - a = 0.55 → composite #7A7C7E → contrast 4.2:1 (fails 4.5).
  - a = 0.62 → composite #6A6B6D → contrast 5.3:1 (passes).
  - a = 0.72 → composite #515356 → 7.7:1 (passes high-contrast 7:1).
  - Coloured text is worse: on the 0.62 plate the grade-1 amber #F2C94C
    reaches 3.4:1 and the grade-3 red #EB5757 only 1.5:1. **Grade and
    warning colours go on shapes, bars and fills, never as text colour.**
  (WCAG relative-luminance formula, computed in Python; not measured off a
  screen.)
  Blur doesn't change the mean, so **0.62 is the floor** for the glass and
  0.72 is the high-contrast setting.
- `backdrop-filter: blur()` in Chromium is GPU work proportional to the
  blurred area; a static backdrop is cached, but our backdrop is the game
  canvas, which changes every frame, so every glass panel is re-blurred every
  frame ([Grida notes on Chromium effects](https://grida.co/docs/wg/research/chromium/effect-optimizations)).
  Keep total glass small, radius modest, and offer it off. **Cost on the
  Mac: not measured.**

### 2.8 Motion

- Material 3: enter with "emphasized decelerate" `cubic-bezier(0.05, 0.7,
  0.1, 1)` at 400 ms, exit with emphasized accelerate at 200 ms
  ([Material motion](https://m1.material.io/motion/duration-easing.html)
  and M3 token docs). For a HUD read at speed, shorter: enter 220-280 ms,
  exit 160 ms.
- Indicator arrows blink in step with the car's own flasher (we already use
  `blinkOn`), not a CSS animation of their own.
- Nothing flashes more than 3 times a second (WCAG 2.3.1); respect
  `prefers-reduced-motion`.

### 2.9 Cockpit view, diegetic vs non-diegetic

- Fagerholt and Lorentzon (Chalmers, 2009) split game UI into diegetic (in
  the world and the fiction: the car's own dash), spatial (in 3D but not in
  the fiction: a route line on the road), meta, and non-diegetic (the
  classic HUD) ([thesis PDF](https://publications.lib.chalmers.se/records/fulltext/111921.pdf)).
- Sims lean diegetic in the cockpit: ETS2 and BeamNG let each widget hide in
  interior view; GT7 cockpit view leans on the car's real dashboard.
- For a driving test this matters more than for a racer: **the real skill
  is glancing down at the speedo and at the mirrors.** A big floating speed
  number in cockpit view trains the wrong habit. Long term, speed and PRND
  belong on the 3D dash (diegetic). Until the dash shows them legibly, keep
  a small cluster at the bottom centre where the real cluster is.

### 2.10 Accessibility and size

- XAG 101 minimum text (body height, descender to ascender): PC 18 px at
  1080p, console 26 px; text must scale to 200%
  ([XAG 101](https://devdocs.xbox.com/build/game-principles/accessibility/xag-deep-dives/xag-101-text-display.md)).
  Body height is about 1.2x the CSS font-size for Inter, so 18 px ≈ 15 px
  font-size at 1080 rows.
- Mac sizes in points (CSS px in Electron): 13" Air 1280x832 (default
  scaled; 1470x956 on the 15"), 14" Pro 1512x982, 16" Pro 1728x1117, all
  16:10, rendered at 2x. A 27" external at 2560x1440 is 1x or 2x depending
  on scaling. Scaling 15 px@1080 to 945-982 rows gives **13 px minimum** for
  anything read while driving. Laptops are closer to the eye than a TV, which
  is why the PC figure is lower than the console one.
- Safe area: Xbox title-safe is the inner 90% for TV overscan
  ([Xbox screen areas](https://devdocs.xbox.com/build/core-features/graphics/overviews/screen-areas)).
  A Mac screen has no overscan, and full-screen apps on notched MacBooks sit
  below the notch, so a ~2.5% margin (24 px at 1512 wide) is enough.
- Colour alone never carries meaning (Motorfest, FH5 colour-blind filters):
  fault grades get a number and a shape as well as a colour.

### 2.11 Driving-school sims and examiner faults

- **City Car Driving** shows penalty points on an in-car tablet; players say
  points "are given out 1 by 1, but very fast and often get to 5 before i
  can notice them on the in-car tablet", and ask for a warning meter
  ([Steam thread](https://steamcommunity.com/app/493490/discussions/0/1620600279655798461)).
  Lesson: a fault must be noticed when it happens (one clear toast plus a
  sound), but the panel must not become a log you read while driving.
- **Real examiners** mark silently and debrief afterwards. The Croatian HAK
  examiner app logs each mistake "pinpointed at the exact location", with the
  route shown at the end ([Infinum case study](https://infinum.com/work/hak-examiners)).
  The RSA test in Ireland works the same way: the result sheet comes at the
  end. Lesson: live feedback is a *lesson* feature; a *mock test* should be
  silent, then a debrief with faults pinned on the route map.
- From research 13: every check needs a tolerance and a reason the player
  can see later. The HUD's job is to say what and when; the debrief says why
  and where.

## 3. The design spec

### 3.1 Principles

1. **Zones, not positions.** Six zones; each element belongs to one zone and
   a zone stacks its elements, so nothing overlaps by accident.
2. **One material.** Dark glass everywhere: no cream pills, no saturated
   card backgrounds. Colour is for meaning (route, grades, warnings).
3. **Driving shows only driving.** While the car moves: speed and limit,
   selector, indicators, next turn, map, faults as they happen. Everything
   else hides, and comes back when stopped, on mouse move, or in pause.
4. **Events, then quiet.** Street names, radio station, faults, toasts:
   show big when they change, then shrink or fade.
5. **One source of truth.** The speed colour reads the examiner's own
   speeding threshold (`rules.ts`), the lane row reads the SUMO lanes, the
   night palette reads the same sun elevation as the clock icon. No second
   copies of any rule.
6. **SVG icons, not emoji.** One inline SVG sprite (24 px grid, 2 px
   stroke, `currentColor`), drawn by us or taken from an MIT/ISC set (e.g.
   Lucide, ISC) and credited.

### 3.2 Tokens

All sizes scale with one unit so the HUD holds its proportions from a 13"
Air to a 27" monitor. Reference viewport: 1512x945 (14" MacBook Pro,
window minus title bar).

```css
:root {
  /* 1 at 1512x945; never below 0.85 (13" Air) or above 1.5 (27" at 1x). */
  --u: clamp(0.85px, min(100vw / 1512, 100vh / 945), 1.5px);
  --hud-scale: 1;            /* player setting 1.0-2.0 (XAG 101: up to 200%) */
  --s: calc(var(--u) * var(--hud-scale));

  --edge: calc(24 * var(--u));          /* safe margin, not scaled by the player */
  --gap: calc(8 * var(--s));
  --r-sm: calc(8 * var(--s));
  --r-md: calc(14 * var(--s));
  --r-lg: calc(20 * var(--s));

  /* glass */
  --glass: rgba(14, 16, 20, 0.62);      /* 5.3:1 white-on-white-sky floor */
  --glass-hc: rgba(14, 16, 20, 0.86);   /* high-contrast setting, >= 7:1 */
  --glass-blur: blur(14px) saturate(140%);
  --glass-edge: inset 0 0 0 1px rgba(255, 255, 255, 0.08);
  --shadow: 0 6px 24px rgba(0, 0, 0, 0.28);

  /* ink */
  --ink: #f4f6f8;
  --ink-2: rgba(244, 246, 248, 0.68);   /* large text / labels only (3:1) */
  --ink-3: rgba(244, 246, 248, 0.38);   /* inactive PRND letters, decoration */

  /* meaning */
  --route: #4da3ff;      --route-casing: #0b2a4a;
  --go: #3ddc84;         /* indicators, arrived */
  --gear: #ffd23f;       /* active selector letter */
  --g1: #f2c94c;         --g2: #f2994a;         --g3: #eb5757;
  --warn: #ffb020;       --danger: #ff4d4d;
  --sign-red: #c8202a;   --sign-white: #ffffff; --sign-ink: #111111;

  /* type */
  --font-ui: "Inter", system-ui, -apple-system, sans-serif;
  --font-num: "Barlow Semi Condensed", "Inter", sans-serif;
  --t-cap: calc(12 * var(--s));   /* pause/settings fine print only */
  --t-body: calc(14 * var(--s));  /* minimum for anything read while driving */
  --t-label: calc(13 * var(--s)); /* uppercase labels, letter-spacing .06em */
  --t-street: calc(18 * var(--s));
  --t-dist: calc(30 * var(--s));
  --t-speed: calc(48 * var(--s));

  /* motion */
  --ease-in: cubic-bezier(0.05, 0.7, 0.1, 1);   /* entering: decelerate */
  --ease-out: cubic-bezier(0.3, 0, 0.8, 0.15);  /* leaving: accelerate */
  --t-enter: 240ms;  --t-exit: 160ms;  --t-state: 120ms;

  /* layers */
  --z-labels: 1; --z-hud: 10; --z-toast: 20; --z-dock: 30; --z-modal: 40; --z-dev: 50;
}
.night { --ink: #e3e7ec; --glass: rgba(10, 12, 16, 0.70); }  /* sun elevation < -0.833° */
.hc    { --glass: var(--glass-hc); }
@media (prefers-reduced-motion: reduce) { :root { --t-enter: 0ms; --t-exit: 0ms; } }

.glass {
  background: var(--glass); backdrop-filter: var(--glass-blur);
  box-shadow: var(--glass-edge), var(--shadow); border-radius: var(--r-md);
  color: var(--ink); font-family: var(--font-ui);
  font-feature-settings: "tnum" 1, "cv11" 1;  /* tabular figures, Inter's single-storey a */
}
.no-blur .glass { backdrop-filter: none; background: rgba(14, 16, 20, 0.78); }
```

Fonts ship in the app, not from the Google Fonts CDN (Electron works
offline): `public/fonts/` with Inter and Barlow Semi Condensed as woff2,
the OFL text, and a `CREDITS.md`. The pre-commit credit check and the
licence list in `CLAUDE.md` name three asset folders; `public/fonts` would be
a fourth, so both need the same change.

### 3.3 Zones (chase camera, 16:10)

ASCII at the 1512x945 reference; one character ≈ 12 px across, 21 px down.

```
+------------------------------------------------------------------------------------------------------------------------------+
| [A] LOCATION / TIME              [B]      +----------------------------------+                 [C] EXAMINER            |
| +-----------------------------+           | (R)  200 m                        |                 +--------------------+  |
| | Jamestown Road     10:37 ☀  |           |      onto Cappagh Road            |                 | LESSON  ●1 0 ▲2 0 ■3 0 |
| | Finglas                     |           |  ↑ ↑ [↑↱]          then (L)       |                 +--------------------+  |
| +-----------------------------+           +----------------------------------+                 +--------------------+  |
|                                                                                                  | ▲ SERIOUS          |  |
|                                                                                                  | No mirror check    |  |
|                                                                                                  | before turning left|  |
|                                                                                                  +--------------------+  |
|                                                                                                                              |
|                                                                                                                              |
|                                                    (road, car, world: nothing here)                                          |
|                                                                                                                              |
|                                                                                                                              |
|                                                                                                                              |
|                                                                                                                              |
|  [D] MAP                                                                                            [E] CLUSTER            |
|    .--------.        +-----------------+                                                 +--------------------------+  |
|  /     N      \      | ♪ Phantom 105.2  |  [F] RADIO (on change)                         | ◀    27      ▶   ( 50 )   |  |
| |      ↑       |     |  ◀  ▶   ▮▮▮▮▯▯   |                                                 |      km/h                  |  |
| |    route     |     +-----------------+                                                  |  P  R  N  [D]   (P)  ◐  |  |
|  \            /                                                                          +--------------------------+  |
|    '--------'                                                                                                              |
+------------------------------------------------------------------------------------------------------------------------------+
  Dock [G] (World · Get out · Settings · Invite) slides in at the top right over [C] only when stopped or on mouse move.
```

Cockpit (driver's eye on the right; the interior mirror is upper left of
centre and the wing mirrors sit at both edges, mid-height, per `mirrors.ts`
and `drive.ts`; positions to be checked on a real cockpit screenshot):

```
+------------------------------------------------------------------------------------------------------------------------------+
| [A] street (fades after 4 s)                  [interior mirror, in 3D]              [B] sat-nav card     [C] examiner     |
|                                                                                       (moves right, so it                   |
|                                                                                        never covers the mirror)             |
|                                                                                                                              |
| [left wing mirror, 3D]                                                                         [right wing mirror, 3D]       |
|                                                                                                                              |
|  [D] map, 160 px, or hidden                           [E] cluster, compact, bottom centre (behind the wheel)                 |
+------------------------------------------------------------------------------------------------------------------------------+
```

Zone rules:
- **A top-left:** location and time. **B top-centre:** sat-nav (chase);
  in cockpit B moves to the right half so it never covers the interior
  mirror. **C top-right:** examiner chip and the single toast slot under it.
  **D bottom-left:** map, radio card to its right. **E bottom-right**
  (chase) / bottom centre (cockpit): speed cluster. **G top-right dock:**
  buttons, overlaying C only while visible.
- Each zone is a flex column with `gap: var(--gap)`; elements never set
  their own `top`/`left`.
- Every element has a per-view visibility (chase, cockpit, on foot), as
  ETS2 and BeamNG do, stored in one settings object (Settings › HUD).
- World labels sit at `--z-labels`, under every panel.

### 3.4 Elements

#### A. Location and time chip

- Position: zone A, `top/left: var(--edge)`. Width auto, max 38vw.
- Content: street (`--t-street`, 600) on line 1; town (`--t-label`,
  `--ink-2`) on line 2; time `HH:MM` right-aligned in tabular figures with a
  sun / moon / cloud / rain SVG (weather when it exists).
- States:
  - *Street changed:* full chip for 4 s (GTA pattern), then collapses to one
    line, 13 px street + time, `--ink-2`.
  - *Night:* `.night` palette; nothing cream anywhere.
  - *Time skip (T):* time cross-fades; a toast says "Time skipped to 20:00"
    (nothing behind their back).
- Motion: expand/collapse height and font-size over `--t-enter`.
- Mute and Online move out: mute to Settings › Sound and a keyboard key;
  "● 3 here" joins the chip's second line only when online.

#### B. Sat-nav card

- Position: zone B, centred, `min-width: calc(320 * var(--s))`, max 44vw.
  Cockpit: right half, `right: calc(var(--edge) + 260 * var(--s))`, or left
  of the examiner chip.
- Layout, left to right: turn glyph (SVG, 48 px box, white on a
  `--route` circle 56 px); then a column: distance (`--font-num`,
  `--t-dist`, 700, tabular), street "onto Cappagh Road" (`--t-street`, 500,
  one line, ellipsis); then a lane row underneath spanning the card: one
  24 px arrow per lane, lanes to use at `--ink`, others at `--ink-3`, drawn
  from the SUMO lane connections for the next junction. A "then" glyph
  (24 px, `--ink-2`) at the right when the following manoeuvre is under
  150 m after this one.
- Distance format: over 1 km "1.2 km"; 100-1000 m in 50 m steps; under 100 m
  in 10 m steps; "Now" under 15 m.
- States:
  - *Approaching (under 60 m):* the glyph circle fills from the left as a
    progress ring; card border `--route`.
  - *Rerouting:* glyph is a spinner, text "Rerouting", 1 s minimum on
    screen so it doesn't flicker.
  - *Arrived:* circle `--go`, text "Arrived: <name>", fades out after 6 s.
  - *Roundabout:* glyph shows the exit number ("2nd exit") in the circle.
  - *No route:* the card is gone, not empty.
- Motion: on a new instruction, the old glyph slides up 8 px and fades
  (`--t-exit`), the new one comes in from below (`--t-enter`).
- Ties: the spoken prompt (220-60 m) and the lane row show together, so ear
  and eye agree.

#### C. Examiner chip and fault toast

Two modes, chosen in the session menu: **Lesson** (live faults, default)
and **Mock test** (silent, like the RSA; debrief only).

- Chip: zone C. One line, `--t-label`: mode badge ("LESSON" / "MOCK TEST",
  uppercase, `--ink-2`), then three counters, each a shape plus a number
  plus a colour: `● 1` (`--g1`, circle), `▲ 2` (`--g2`, triangle),
  `■ 3` (`--g3`, square), digits tabular. Mock test hides the counts and
  shows only a small pulse dot while the examiner is watching.
- Pass/fail: no "PASS" during the drive (nothing has been passed yet). When
  `verdict()` first returns a reason, the chip gains a red `--g3` edge and
  the text "Would fail: <reason>" for 6 s, then a small red bar remains.
- Toast slot: under the chip, width `calc(300 * var(--s))`. One fault at a
  time, queued (ETS2, God of War). Grade colour as a 4 px left bar plus the
  shape; title "SERIOUS" (`--t-label`, `--ink`, on a grade-colour pill
  for G3 only), fault text
  (`--t-body`, max two lines, the examiner's own fault names). Hold 4 s
  (setting 2-8 s, FH5), then shrink into the chip counter (the toast scales
  to 0.6 toward the counter while fading, 240 ms) so the eye sees where it
  went.
- Grade 3: toast holds 6 s, plus a short low tone. No full-screen flash.
- Queue: if three or more wait, show "+2 more" on the current toast rather
  than cycling them all.
- Debrief (end of drive, or pause › Examiner): every fault in a list, each
  pinned on the route map where it happened (HAK pattern), with the reason.
- Colour as text fails contrast (section 2.7): grade colours fill the
  shapes and the left bar; all words are `--ink`.

#### D. Minimap

- Position: zone D, `left/bottom: var(--edge)`, diameter
  `calc(200 * var(--s))` chase, 160 cockpit (or hidden, per setting).
  Canvas backing at `devicePixelRatio` (now fixed at 440 for 220 CSS, right
  for 2x, blurry at 1.5x).
- Shape: keep the circle, heading-up. Add a 2 px `rgba(255,255,255,0.14)`
  rim and a 10 px dark outer ring that carries a bold "N" chip (16 px
  circle, white on `--ink-3`) orbiting with north, so north is always
  findable.
- Route: `--route` 5 px with a 2 px `--route-casing` either side (today's
  light blue is too close to road grey). Destination off-map: an arrow on
  the rim pointing to it.
- Player: white arrow with dark stroke at 62% height (more road ahead than
  behind; we already offset to 1.25 r).
- Zoom with speed as now. Night: base tiles darkened 15%, route unchanged.
- Big map (M) unchanged in function; restyle its side panel with `.glass`.

#### E. Speed cluster

- Position: zone E, `right/bottom: var(--edge)`. Chase: width
  `calc(240 * var(--s))`. Cockpit: bottom centre, width 200, translucency
  raised to 0.70 so the 3D dash shows through less (it's what the eye lands
  on).
- Row 1: left indicator arrow (20 px SVG), speed (`--font-num`,
  `--t-speed`, 700, tabular, right-aligned in 3ch), right arrow, then the
  limit disc.
- Limit disc: same height as the speed digits (`calc(48 * var(--s))`),
  white with a `--sign-red` ring at 12% of diameter, numerals
  `--font-num` 700 `--sign-ink`. Hidden only when the limit is unknown (not
  shown as a blank).
- Row 2: "km/h" (`--t-label`, `--ink-2`) under the speed.
- Row 3: selector `P R N D`, 16 px, letters `--ink-3`, the active one in
  `--gear` on a 1 px `--gear` rounded box. Tell-tales on the same row at the
  right: parking brake (P in a circle, red), dipped (green), full beam
  (blue), wipers (INT/LO/HI), hazards. Off tell-tales take no space; the row
  height is fixed so the box never jumps.
- States:
  - *Indicators:* arrows `--ink-3` when off; `--go` with a 6 px glow when
    `blinkOn`. No CSS animation, they follow the car's flasher.
  - *Over the limit:* a 3 px underline bar under the speed digits turns
    `--warn` at the examiner's tolerance start and the whole cluster gets a
    `--danger` 2 px edge where it would mark a fault (digits stay white:
    red text on the glass is 1.5:1), both read
    from `rules.ts` (one source of truth). The limit disc pulses once
    (scale 1 → 1.08 → 1, 300 ms) when the limit changes.
  - *Gear change:* new letter's box slides to it in `--t-state`.
  - *Parking brake on with throttle:* tell-tale blinks 2 Hz and a toast says
    why the car won't move; if the game releases it on throttle, the toast
    says so.
  - *Reverse:* "R" box turns white-on-`--ink`, and the speed shows without a
    minus sign.
  - *Night:* `.night` palette; tell-tales keep their colours.

#### F. Radio (new)

There's no radio in the game yet. This is the UI; what plays is a separate
decision (licences: CC0/CC-BY music, or live Irish station streams, which
raises rights and network questions). Ask the owner before building audio.

- Position: zone D, right of the map, bottom-aligned with it.
- Collapsed (default while driving): a one-line chip
  `♪ Station name`, `--t-label`, `--ink-2`; hidden entirely when the radio
  is off.
- Expanded (on any radio input, for 4 s, or while the mouse is over it):
  card `calc(220 * var(--s))` wide: station name (`--t-body`, 600), then
  prev / next buttons (32 px hit areas, SVG chevrons), a 6-segment volume
  bar, and a mute/off toggle. On station change the name appears large for
  2 s (GTA's station banner pattern **[from play]**).
- Controls: keyboard keys and wheel buttons to be mapped (the G29's +/-
  and the red dial are free candidates; check against the Controls table
  in pause before choosing).
- Cockpit: same position (it's the centre console's side of the screen for a
  right-hand-drive car). Later, the car's head unit can show it (diegetic).

#### G. Dock: World, Get out, Settings, Invite

- Position: zone G, top-right, a horizontal row of `.glass` buttons, 36 px
  tall, SVG icon plus label, `--t-label`.
- Visible when: the car is stopped (speed under 1 km/h), on foot, the mouse
  has moved in the last 3 s (MSFS toolbar pattern), or paused. Slides down
  from the top in `--t-enter`; hides in `--t-exit`.
- "Get out" only shows when stopped, in P or with the parking brake on.
  Pressing F while moving gets a toast: "Stop and select P to get out".
- "Wheel check", "Connect wheel", "Set up wheel" leave the dock: they live
  in Settings › Wheel. A wheel plugged in for the first time shows a toast
  ("Wheel connected. Settings › Wheel to test pedals and force feedback")
  instead of opening a panel.

#### H. Toasts (system messages)

- One slot, top-centre under the sat-nav card in chase (so it doesn't fight
  the examiner's slot), max width 50vw, `.glass`, `--t-body`, icon at
  left. Hold 3 s plus 60 ms per character, max 8 s. Queue, one at a time.
- Used for everything the game does on its own (parking brake released,
  car reset, time skipped, wheel connected), with the reason, per the
  "nothing behind their back" rule.
- The long wheel-controls message now in `g29.onChange` becomes a short
  toast plus a "Show controls" button into pause › Controls.

#### I. Pause, Settings, Wheel

- Pause: full-screen scrim `rgba(8,10,14,0.55)` + `blur(6px)` (static,
  the game is paused so this costs nothing per frame), centred sheet
  `calc(560 * var(--s))` wide, `--r-lg`, `.glass` at 0.86.
- Left column: Resume (primary, `--gear` fill), Map and sat-nav, Examiner
  (debrief), Settings, Controls, World map. Right: the selected section.
- Settings tabs:
  - **Wheel:** everything now in Wheel check: device line (name and force
    feedback state, no raw HID unless "Show raw input" is ticked), Steer /
    Gas / Brake / Clutch live bars (12 px, `--r-sm`), Swap gas and brake,
    Reverse force feedback, Force feedback strength, Set up wheel, Connect
    wheel. Same localStorage keys (`ffb-invert`, `ffb-gain`, the swap and
    calibration keys), so the owner's saved settings carry over.
  - **Display:** cockpit field of view (moved from the pause root, same
    `cockpit-fov` key), real textures, HUD scale 100-200%, HUD glass
    blur on/off, high-contrast plates, per-element visibility per view
    (chase / cockpit), notification duration.
  - **Sound:** master, engine, sat-nav voice, radio.
- Keyboard and wheel navigation: arrow keys / d-pad move focus, visible
  2 px `--gear` focus ring, Esc / Options back.

#### J. Dev autodrive label

- Bottom-centre, 11 px mono, `--z-dev`, only with `?autodrive=`. Never in
  zone B again.

### 3.5 Night and other screen states to check when built

- Day sky (worst contrast), night 20:30 (glare), rain when it exists.
- Chase and cockpit, on foot, danfo (taller cockpit eye: re-check mirror
  positions).
- 13" Air (1280x832), 14" (1512x982), 16" (1728x1117), 27" external, window
  half-width (the HUD scale clamps at 0.85; below 1100 px wide the radio
  card hides and the sat-nav card drops the street line).
- Every state at once: indicator, over the limit, grade 3 toast, reroute,
  radio change, toast. Nothing may overlap.
- Wheel unplugged mid-drive: a toast, and the cluster keeps working on
  keyboard.

## 4. What to build first

1. Stop the Wheel check opening itself; move it into Settings › Wheel.
   (One-line cause, biggest visible win: it covers every G29 shot.)
2. Tokens, `.glass`, zones as flex stacks, z-order. Kills every overlap
   seen in the shots.
3. Speed cluster and limit disc to spec; speed colour from `rules.ts`.
4. Sat-nav card with street names, then the lane row.
5. Examiner chip, single toast slot, Lesson / Mock test, debrief map.
6. Dock auto-hide, location chip collapse, SVG icons, bundled fonts.
7. Radio, after the owner decides what plays.

Untested: everything here. No cockpit screenshot was available; glass
cost on the Mac GPU is unmeasured; the contrast numbers are calculated, not
measured off a screen.

## Sources

- Mechanics of Magic, Forza Horizon 4 analysis: https://mechanicsofmagic.com/?p=6144
- Can I Play That, FH5 menu deep dive: https://caniplaythat.com/2021/11/04/forza-horizon-5-accessibility-menu-deep-dive/
- Ubisoft, The Crew Motorfest accessibility spotlight: https://news.ubisoft.com/en-gb/article/OUUpCEKxrkfv6I5sGAeWz/the-crew-motorfest-accessibility-spotlight
- Can I Play That, Motorfest: https://caniplaythat.com/?p=12609
- patched.gg, ETS2 new Route Advisor: https://patched.gg/games/euro-truck-simulator-2/the-new-route-advisor-why-and-how-its-evolving
- Truck Simulator wiki, Route Advisor: https://trucksimulator.wiki.gg/wiki/Route_Advisor
- ets2_autopilot2 (lane-change timing note): https://github.com/Hexus-One/ets2_autopilot2
- BeamNG documentation, User Interface: https://documentation.beamng.com/getting_started/user_interface
- FSElite, MSFS 2024 UI overview: https://fselite.net/content/microsoft-flight-simulator-2024-ui-overview/
- MSFS Addons, toolbar handle: https://msfsaddons.com/2025/01/06/msfs-2024-users-can-now-get-rid-of-the-toolbar-handle-just-like-in-msfs-2020/
- GT7 online manual, race screen: https://www.gran-turismo.com/gb/gt7/manual/race/02
- EGM, GT7 update indicators: https://egmnow.com/gran-turismo-7-update-adds-new-race-indicators-and-replay-music/
- GTA wiki, Heads-Up Display: https://gta.fandom.com/wiki/Heads-Up_Display
- GTA V mod, Hide Extra HUD Features: https://www.gta5-mods.com/scripts/hide-extra-hud-features
- EA, NFS Unbound accessibility: https://ea.com/able/resources/need-for-speed-unbound
- EA forums, Unbound ultrawide HUD: https://forums.ea.com/discussions/need-for-speed-unbound-tech-issues-en/ultrawide/9398398
- 80.lv, God of War Ragnarok UI: https://80.lv/articles/a-deep-dive-into-god-of-war-ragnar-k-s-user-interface
- Made Good Designs, Forza Horizon font: https://madegooddesigns.com/?p=10598
- Xbox XAG 101 text display: https://devdocs.xbox.com/build/game-principles/accessibility/xag-deep-dives/xag-101-text-display.md
- Xbox XAG 102 contrast: https://devdocs.xbox.com/build/game-principles/accessibility/xag-deep-dives/xag-102-contrast.md
- Xbox screen areas: https://devdocs.xbox.com/build/core-features/graphics/overviews/screen-areas
- Material motion, duration and easing: https://m1.material.io/motion/duration-easing.html
- Grida, Chromium effect optimisations: https://grida.co/docs/wg/research/chromium/effect-optimizations
- Fagerholt and Lorentzon, Beyond the HUD (Chalmers 2009): https://publications.lib.chalmers.se/records/fulltext/111921.pdf
- Garmin Active Lane Guidance: https://www8.garmin.com/manuals/webhelp/GUID-03E29042-23C8-4418-8521-2AAEA94C7400/EN-US/GUID-E6EA81D1-5E15-4F3D-8021-4A8421F0BD0C.html
- Mapbox maneuver view, lane guidance: https://docs.mapbox.com/android/navigation/api/coreframework/3.7.2/ui-components/com.mapbox.navigation.ui.components.maneuver.model/-maneuver-view-options/lane-guidance-turn-icon-maneuver.html
- Steam, City Car Driving penalty thread: https://steamcommunity.com/app/493490/discussions/0/1620600279655798461
- Infinum, HAK examiner app: https://infinum.com/work/hak-examiners
- Google Fonts licences (METADATA.pb): https://github.com/google/fonts/tree/main/ofl/inter, https://github.com/google/fonts/tree/main/ofl/barlowsemicondensed, https://github.com/google/fonts/tree/main/ofl/overpass
- fontalternatives, Barlow vs DIN: https://fontalternatives.com/compare/barlow-vs-din/
