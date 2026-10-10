# 26: The car radio: real live stations, local to the place

Date: 2026-10-05. Question: can the car play real live radio, local stations
first (Dublin: RTÉ Radio 1, 2FM, lyric fm, Today FM, FM104, 98FM, Spin 1038,
Newstalk; then Lagos), with a world browse, and sound like it's coming out of
a car's speakers? Which directory, how open players use it, what breaks in
Electron, and a plan. Research only; no game code changed.

What was checked:
- Our code: `game/src/client/audio.ts` (StreetAudio), `main.ts` (mute pill,
  pause, sat-nav `say()`, cockpit/chase), `wheel.ts` and `g29.ts` (free
  buttons), `game/desktop/main.cjs` (app:// scheme, session),
  `index.html` (HUD), `public/world/places.json`.
- The Radio Browser API, live, on 2026-10-05: DNS, `/json/servers`,
  `/json/stats`, searches for IE and NG, geo search near Finglas.
- Every Dublin and Lagos preset stream, with curl (`Origin: app://game`):
  redirects, content type, CORS headers.
- **Playback in our own Electron 44.5.1 (Chromium 152.0.7977.130)** from the
  repo's `node_modules`, with throwaway probe scripts in the scratchpad (not
  in the repo): plain `<audio>`, Web Audio routing with and without CORS,
  native HLS, http streams, and a main-process proxy scheme. Audio level was
  read with an AnalyserNode, not by ear. Not tried on the owner's Mac
  speakers through the real game, nor with the wheel.
- Shortwave's API client (GPL-3.0, so read for technique only).

## 1. The directory: Radio Browser

The only open, free, keyless directory of any size. Measured `/json/stats`
today: 60,234 stations, 7,147 marked broken, 241 countries, 252,191 clicks
in the last day; server software 0.7.45.

- **Data licence:** the API docs say nothing about a licence; the service
  "can be used freely but without guarantee to work". The project is
  widely described as releasing its data into the public domain (dokk.org
  write-up). The server software is AGPL-3.0 (GitHub repo licence field). We
  don't run or copy the server; we only call the public API, so AGPL doesn't
  reach us. We don't ship their database either; we ship a handful of station
  UUIDs. Credit "Station data: Radio Browser (radio-browser.info)" in the
  radio panel anyway; it costs nothing.
- **Rules for clients** (docs.radio-browser.info): send a speaking
  User-Agent (`appname/version`); find servers by DNS (`all.api.radio-browser.info`
  A records, reverse-resolved, or the SRV record `_api._tcp.radio-browser.info`);
  shuffle the list and take the first that answers; `/json/servers` only if
  the client can't do DNS. Measured today: the SRV record and `/json/servers`
  both list a single server, `de1.api.radio-browser.info`. So the
  "pick a random mirror" logic currently picks from one; keep it anyway, the
  list has been longer before.
- **User-Agent:** a renderer `fetch()` can't set `User-Agent` (forbidden
  header in Chromium). Electron's default UA is a Chrome string with
  `Electron/44.5.1`, which is not "speaking". Either set it per session in
  main (`ses.setUserAgent` would change it for every request the game
  makes) or, better, make the directory
  calls from the main process with `net.fetch(url, { headers: { "User-Agent":
  "WorldDrive/<version>" } })`. CLAUDE.md: no email or name in the UA. Just
  the app name and version.
- **Clicks:** `GET /json/url/{stationuuid}` counts a click, "once per day per
  IP per station". Send it when the driver picks a station by hand (not on
  every auto-retry or every app start that resumes the last station). It also
  returns the station's current URL, so it doubles as the "resolve before
  play" call.
- **Search** (`/json/stations/search`): `countrycode`, `state`, `tag`,
  `name`, `hidebroken=true`, `is_https`, `order=clickcount&reverse=true`,
  `limit`. Geo: `geo_lat`, `geo_long`, `geo_distance` (metres) **do work**
  (the docs summary I read didn't list `geo_distance`, but the live server
  accepted it and returned Newstalk, FM104, Gem, Q102 within 5.3 to 6.1 km of
  Finglas). Also `/json/stations/byuuid/{uuid}`.
- **Fields we use:** `stationuuid`, `name`, `url`, `url_resolved`, `codec`,
  `bitrate`, `hls`, `lastcheckok`, `geo_lat`/`geo_long`, `state`,
  `countrycode`, `favicon` (don't show favicons: they're station logos, and
  CLAUDE.md keeps logos out of the game).

### What the data actually looks like for our places

| | Ireland (IE) | Nigeria (NG) |
|---|---|---|
| Working stations (hidebroken) | 223 | 75 |
| `url_resolved` is https | 167 | 64 |
| Flagged HLS | 13 | 0 |
| Has geo coordinates | 78 (35%) | few; Wazobia, Cool FM, Nigeria Info have none |

Lessons:
- **Geo search alone can't find the big local stations.** The most-clicked
  RTÉ Radio 1 entry and all the big Lagos stations have no coordinates; the
  geo search near Finglas finds Newstalk and FM104 but not RTÉ.
- **The directory is messy:** RTÉ Radio 1 appears at least four times (MP3 over
  http, MP3 over https, HLS twice); Newstalk twice; FM104 three times on
  two hosts. `state` is free text ("Dublin", "", "belfast", "GBR").
- So: **a hand-picked preset list per place** (UUIDs, verified), and the
  world browse uses search by country plus geo, de-duplicated by name.

## 2. The streams: measured

Dublin presets (curl, 2026-10-05, following redirects):

| Station | UUID used | Final host | Type | CORS on final response |
|---|---|---|---|---|
| RTÉ Radio 1 | 8643cfcb-a7bb-4c46-8391-fffe266bce16 (url http, works as https) | icecast.rte.ie → 302 → streamtheworld.com | audio/mpeg 160k | **none** |
| RTÉ 2FM | d1f3bbb8-bb22-4efd-9f23-0e22ad2ae209 | same pattern | audio/mpeg 160k | **none** |
| RTÉ lyric fm | c96b0b99-6dc6-4b76-9971-b48a55c628ca | same pattern | audio/mpeg 160k | **none** |
| Today FM | d0a1da9f-46b3-11e9-aa55-52543be04c81 | stream.audioxi.com → 302 → edgex.audioxi.com | audio/mpeg 128k | on the final hop only; not on the 302 |
| FM104 | e51f7fbf-ff3d-4fc0-845d-71faf507183b | onic.dublin.live.stream.broadcasting.news | audio/aac | yes, echoes origin |
| 98FM | ad48771d-17a7-11ea-a620-52543be04c81 | audioxi, 302 | audio/mpeg 192k | final hop only |
| Spin 1038 | 32e96359-9dbb-4cc8-adf9-7d5a948223db | live-bauerie.sharp-stream.com | audio/mpeg 192k | yes |
| Newstalk | d037031b-f31e-4298-b36e-654eaad6416e | audioxi, 302 | audio/mpeg 128k | final hop only |

Lagos (all MP3 over https, all with CORS): Wazobia FM 95.1
(1dfcc339-6292-4bf1-8b21-5c4a099ecd7e), Cool FM 96.9
(a3c93ca9-9891-4249-a805-d622dadeed21), Nigeria Info 99.3
(36d4a771-6a91-454d-a6e4-d55667aa6dd4), Brila FM
(2940057c-ccb6-4d81-a95b-06a74eccd5d4), Metro FM 97.7
(050bccf6-2ca8-41f9-ad89-66d035c8b779), Konga 103.7
(f835db87-94b4-4256-a893-b8194316df3f). Yaba is Lagos Mainland, so these
are the right stations, not just Nigerian ones.

### In our Electron (Chromium 152), measured

| Test | Result |
|---|---|
| `canPlayType` mp3 / aac / HLS | probably / probably / **maybe** |
| Plain `<audio>` RTÉ Radio 1 MP3 | plays |
| Plain `<audio>` RTÉ Radio 1 HLS (`.m3u8`) | **plays natively**, no hls.js |
| Plain `<audio>` from app:// page, http:// stream (RTÉ, and an http-only internet-radio.com host on :8200) | plays; Electron's custom secure scheme didn't block mixed content |
| RTÉ through Web Audio (`createMediaElementSource`), no `crossOrigin` | plays but **the node outputs silence** (peak 0.000) |
| RTÉ with `crossOrigin="anonymous"` | **fails** (no CORS on the redirect chain) |
| RTÉ with `crossOrigin` plus CORS headers injected in `onHeadersReceived` | still fails (the redirect hops are the problem) |
| FM104 with `crossOrigin` through Web Audio | works (peak ~1.0) |
| Newstalk with `crossOrigin` | fails (302 has no CORS) |
| **Main-process proxy scheme `radio://`** (`protocol.handle` + `net.fetch`, adds `Access-Control-Allow-Origin`) | **RTÉ Radio 1 (https and http), Newstalk, FM104 all play through Web Audio** (peaks 0.34 to 1.05) |

What this means:
- The Web Audio spec says a media element source "MUST output silence" for
  CORS-cross-origin media. Without Web Audio there's no car-speaker EQ, no
  speed volume, no muffling in chase view; only `element.volume`.
- Five of our eight Dublin presets don't pass CORS. **The proxy is the fix**,
  and it also handles http-only streams, redirect chains and a proper
  User-Agent in one place. It's one function in `main.cjs`.
- **hls.js is not needed.** Chromium 152 plays HLS natively (Chrome shipped
  native HLS on desktop from 142). But native HLS through the proxy would
  need the playlists rewritten so segment URLs also go through `radio://`.
  Every preset has a progressive MP3/AAC stream, so prefer those
  (`hls=0`), and only fall back to HLS for a browsed station with nothing
  else. If we ever need HLS through Web Audio: rewrite m3u8 lines in the
  proxy (a few lines), still no hls.js.
- The web build (Cloudflare, `wrangler`) has no main process. There: play
  the plain element, use Web Audio only for stations whose CORS works, skip
  http-only stations (browsers block or auto-upgrade mixed media), and say
  "simple speaker" in the panel. Don't proxy radio through our Worker: that
  would be us redistributing the stream, and costs bandwidth.

### Proxy safety (desktop)

The renderer is our own code, but the proxy still shouldn't be a general
fetcher: allow only `http:`/`https:` targets, refuse private and loopback
addresses (no reaching the owner's router), require an `audio/*` or HLS
content type on the answer, no cookies, stream the body through without
buffering, and abort the upstream fetch when the renderer drops the request
(pass the request's signal). Whether Electron aborts `net.fetch` when the
`<audio>` element lets go is **untested**: the tragedy test below must count
open upstream connections after 200 station changes.

## 3. How others do it (techniques only)

- **Shortwave** (GNOME, GPL-3.0, Rust/GTK, GStreamer playback): finds the
  server by forward DNS of the lookup domain, shuffles the IPs, reverse-
  resolves each to a hostname (needed for TLS), checks `/json/stats`, and
  uses the first that answers. Sends its own User-Agent. Caches station data
  locally and works from saved stations when the API is down. We take: the
  shuffle-check-fallback discovery, and "saved stations still play when the
  directory is down".
- **radio-browser's own web client**: search, then `/json/url/{uuid}` on play.
- **Radio Garden** (closed, not open source): a 3D globe (they built on
  Cesium) with green dots for about 8,000 to 17,000 hand-curated stations;
  spin a dot into the centre circle and it plays. Their station list and API
  are their own, not open; we can't use either. What's worth learning is the
  interaction: tuning by moving, not by list. For us the natural version is
  that *driving* is the tuning: the presets come from the place you're in,
  and the world browse lives on our existing globe (`globe.ts`), where a
  station dot is a click away. No copying of their look.

## 4. Legal

- We link the station's own public stream URL and play it in the listener's
  own app, for personal listening. Nothing is re-broadcast, stored, or
  recorded. In EU law, linking to a work freely available on the internet to
  the same public isn't a new "communication to the public" (CJEU Svensson
  C-466/12, 2014; GS Media C-160/15, 2016). The line is crossed if we
  get around a restriction (geo-blocking, a paywall, a login: VG Bild-Kunst
  C-392/19). So: never use a stream that needs a token we'd have to scrape,
  never strip geo-blocks, keep the station's own ad/analytics query
  parameters (Bauer's `aw_0_1st...`) as listed, don't record.
- The desktop proxy is a pipe for one listener, like a browser. It must not
  cache, share between players, or go into multiplayer (multiplayer sends
  the station UUID, each player fetches their own).
- No station logos or favicons in the game (CLAUDE.md rule on logos); show
  the station's name as text.
- Not legal advice; if the game is ever sold, ask a solicitor about IMRO /
  PPI in Ireland (they license public performance, not a listener's own
  device, but check).

## 5. Sound like a car

The radio is *inside* the cabin, so it doesn't get the windows-closed low-pass
(that's for the street sounds, which we don't yet muffle either). What real
cars do:

- **Car speakers:** door speakers roll off below ~80 Hz and the cabin adds a
  bump around 100 to 200 Hz; a hatchback isn't a hi-fi. Chain: high-pass
  80 Hz, peaking +3 dB at 150 Hz, gentle high-shelf -3 dB above 8 kHz, a
  `DynamicsCompressorNode` (threshold -24 dB, ratio 3) so news and music sit
  at one level. Tune by ear on the Mac, then fix the numbers.
- **Speed-compensated volume, not ducking under the engine.** Real cars raise
  the radio with speed (Mazda "ALC", Bose AudioPilot) so it stays audible over
  road noise; they don't duck the radio when you rev. So: gain +0 dB at
  rest rising to about +6 dB at 100 km/h, smoothed over a second or two.
  One source of truth: speed comes from the car (`c.speed`), as now.
- **Ducking that is real:** cars drop the radio for navigation prompts. Our
  sat-nav uses `speechSynthesis`, which can't go through Web Audio, so duck
  the radio gain by ~12 dB on the utterance's `onstart` and restore on
  `onend`/`onerror`. Same for the examiner's spoken instructions later.
- **Chase camera:** you're outside the car, so the radio is muffled (low-pass
  ~1.2 kHz, -10 dB). On foot (no car), the radio fades out.
- **Pause:** fade out over 0.2 s and pause the element. Live radio can't
  pause; on resume, if paused longer than 30 s, reload the source so it's
  live again rather than half a minute behind. Mute pill: mutes the radio too
  (one master gain, as StreetAudio's `master`).
- **Engine off / out of the car:** a real car radio stays on with the
  ignition at ACC. We don't model ignition, so: radio plays while in the
  driver's seat, stops when you get out, and comes back on the same station
  when you get in (the car remembers).
- **Driving test note:** in the real test the radio should be off. The
  examiner mode should switch it off and say so on screen ("Radio off for the
  test"), not silently (CLAUDE.md: nothing behind their back). I haven't
  found the RSA's exact wording on this; check before writing the message.

## 6. Plan

### Files

- `game/desktop/main.cjs`: register `radio` as a privileged scheme next to
  `app` (`standard, secure, supportFetchAPI, stream, corsEnabled`).
  `protocol.handle("radio", …)` with two routes:
  - `radio://dir/<path>?<query>`: forwards to the current Radio Browser
    server with `User-Agent: WorldDrive/<package version>`; server picked by
    `dns.promises.resolveSrv("_api._tcp.radio-browser.info")`, shuffled,
    checked with `/json/stats`, falling back to `all.api.radio-browser.info`
    A records then `/json/servers`. Cached for the session.
  - `radio://stream/?u=<encoded url>`: the stream pipe from section 2, with
    the safety rules.
- `game/src/client/radio.ts` (new): the radio, no DOM except one
  `HTMLAudioElement`.
  - `type Station = { uuid; name; url; codec; bitrate; hls; place? }`
  - `type RadioState = "off" | "loading" | "playing" | "failed" | "offline"`
  - `class CarRadio` with `constructor(ctx: AudioContext, out: AudioNode,
    deps: { fetch: typeof fetch; streamUrl(u: string): string; now(): number })`
    (deps injected so tests mock the network and clock)
  - `presets(place: string): Station[]` from `public/radio/presets.json`;
    `next()`, `prev()`, `off()`, `play(st)`, `browse(q)` (country/geo/name).
  - `update(dt, { inCar, cockpit, speedKmh, paused, muted })`: drives the gain
    chain (speed volume, chase muffle, pause fade) from the game loop.
  - `duck(on: boolean)` for spoken prompts.
  - Failure handling: `error`/`stalled` → one silent retry after 2 s with a
    fresh `/json/url/{uuid}` lookup → then `failed` with the reason. Watchdog:
    `loading` longer than 10 s → `failed ("no answer")`. `navigator.onLine`
    false or the directory unreachable with no cached URL → `offline`.
  - `state`, `station`, `reason` readable for the HUD; `onChange` callback.
- `game/public/radio/presets.json` (new): per place (`finglas`, `yaba`), an
  ordered list of `{ uuid, name, fallbackUrl }`. `fallbackUrl` is the https
  progressive URL verified above, used when the directory is down. No logos.
  Data source credited in a `CREDITS.md` next to it.
- `game/src/client/audio.ts`: `StreetAudio` exposes its `AudioContext` and
  `master` (read-only getters) so the radio joins the same context and the
  mute pill mutes everything. One context, one master.
- `game/src/client/main.ts`: create `CarRadio` after `audio.start()`; call
  `radio.update()` in the drive step next to `audio.drive()`; `setPaused`
  passes pause; `say()` sets `u.onstart/onend` to `radio.duck`; HUD wiring.
- `game/index.html`: a `#radio` pill in `#hud` beside `#mute`, showing
  "📻 Off" / "📻 RTÉ Radio 1 …" / "📻 RTÉ Radio 1" / "📻 Newstalk: no
  signal" / "📻 Offline"; click opens a small panel: the place's presets,
  a search box (world browse by name/country), and the credit line.
- `tools/bake/add_place.py`: when a place is added, write a starter preset
  list for it from Radio Browser (country code plus geo within 30 km, top 8
  by clicks, https progressive only, de-duplicated by name) for the owner to
  check. Places that get none: the panel says "No local stations listed" and
  offers the browse.
- `ROADMAP.md`: add the radio in order (after whatever is current), with the
  web-build limitation and the untested items.

### Controls

- Keyboard: **O** radio on/off, **[** and **]** previous/next preset. (Not R or
  N: those are gear letters in this game; O, [ and ] are unused today.)
- Wheel: the G29's **−** button (free; `+` opens the map) = next station;
  hold − for 1 s = off. Add `radioNext` to `WHEEL_MAP` so it's remappable in
  the one place. On Gamepad-API wheels (G923 path), button 21.
- Pad: none at first (buttons are full); the pill is clickable.
- A station change shows a 2 s toast with the name, so the driver doesn't
  look down at the pill.

### Storage

- `localStorage["radio-last"]`: `{ place, uuid }`; `radio-volume`: 0..1.
  The radio does **not** auto-start on load (an app that starts playing the
  news on its own is a surprise); it resumes the last station only when the
  driver presses O or the pill.

### UI states

| State | Pill | Sound |
|---|---|---|
| off | 📻 Off | none |
| loading | 📻 Spin 1038 … (pulsing) | none; after 10 s → failed |
| playing | 📻 Spin 1038 | stream through the car chain |
| failed | 📻 Spin 1038: no signal (reason on hover/in panel) | none; ] moves on |
| offline | 📻 Offline | none; retried when `online` fires |

### Tests (`game/tests/radio.test.mts`, headless, mocked fetch and clock)

`CarRadio` takes a fake `fetch`, a fake audio element (an object with
`src`, `play()`, event dispatch) and a fake clock; the gain math is pure
functions tested directly. A test for a bug reproduces it first.

Happy:
- "pressing next from off plays the place's first preset and counts one click"
- "next wraps from the last preset to the first"
- "speed raises radio gain by 6 dB at 100 km/h and none at rest"
- "a sat-nav prompt ducks the radio and restores it after"

Sad:
- "a stream that errors retries once with a fresh URL, then shows failed with the reason"
- "a station still loading after 10 s shows no signal"
- "with the directory down, presets play from their fallback URL"
- "with no network at all the pill says Offline, and comes back when online returns"
- "a place with no presets says no local stations, not an empty list"
- "the proxy refuses a loopback or private address" (pure URL check, no network)

Idiot-proof:
- "mashing next 50 times leaves one stream loading, not 50" (latest wins; earlier
  loads aborted)
- "pressing O while loading turns it off and the late answer doesn't start playback"
- "getting out of the car fades the radio; getting back in resumes the same station"
- "chase camera muffles the radio; cockpit unmuffles it"
- "pause silences the radio; resuming after 30 s reloads it live"

Tragedy:
- "200 station changes leave one audio element and one source node" (no node
  leak in the graph)
- "a three-hour session's watchdog timers don't pile up" (fake clock)
- "a saved last-station from a deleted or renamed place is ignored, not crashed on"
- Manual on the Mac, not headless: count upstream sockets in the main
  process (`lsof -p`) after 200 changes, to prove the proxy aborts.

Plus a repo test: "presets.json names only https URLs and every place in
places.json has an entry (possibly empty)".

### What stays untested until tried on the Mac

How it sounds (the EQ numbers are a starting point), whether the proxy
aborts upstream fetches, whether Electron's `net.fetch` handles ICY servers
that answer `ICY 200 OK` instead of `HTTP/1.0` (none of our presets do; old
SHOUTcast v1 hosts might), and the wheel's − button on the owner's G29.

### Later

"Now playing" text from ICY metadata (the proxy asks with `Icy-MetaData: 1`
and strips the metadata blocks, sends titles over IPC); station dots on the
globe; multiplayer passengers hearing the driver's station (send the UUID).

## Sources

- Radio Browser API docs: https://docs.radio-browser.info/ and
  https://api.radio-browser.info/
- Radio Browser server software (AGPL-3.0, moved to GitLab):
  https://github.com/segler-alex/radiobrowser-api-rust ,
  https://gitlab.com/radiobrowser/radiobrowser-api-rust
- Radio Browser described as public-domain data: https://dokk.org/radio-browser.info
- Live API calls made 2026-10-05: `https://de1.api.radio-browser.info/json/stats`,
  `/json/servers`, `/json/stations/search?countrycode=IE|NG…`, geo search
  near 53.39,-6.30.
- Shortwave (GPL-3.0): https://gitlab.gnome.org/World/Shortwave , file
  `src/api/client.rs` (`lookup_rb_server`).
- Radio Garden on Cesium: https://cesium.com/blog/2019/07/19/radio-garden/ ;
  station counts: https://www.thefader.com/2016/12/12/radiogarden-discover-live-streaming-radio-across-the-glove ,
  https://stadthaus.ulm.de/en/radio-garden
- Chrome native HLS on desktop (142): https://windowsreport.com/chrome-on-desktop-to-finally-support-native-hls-playback/ ;
  playback issues around 141: https://status.mux.com/incidents/g4wcv5cm02sg
- Web Audio silence for cross-origin media: https://lists.w3.org/Archives/Public/public-audio/2013JulSep/0224.html ,
  https://github.com/katspaugh/wavesurfer.js/issues/2014
- Speed-compensated volume: https://owners-manual.mazda.com/gen/en/cx-5/cx-5_8hy1eo20a/contents/06060303.html ,
  https://gmauthority.com/blog/2014/11/bose-audiopilot-noise-compensation-technology-feature-spotlight/
- CJEU linking cases: Svensson C-466/12 https://curia.europa.eu/juris/liste.jsf?num=C-466/12 ;
  GS Media C-160/15 https://curia.europa.eu/juris/liste.jsf?num=C-160/15 ;
  VG Bild-Kunst C-392/19 https://curia.europa.eu/juris/liste.jsf?num=C-392/19
- Electron `protocol.handle`, `net.fetch`, privileged schemes:
  https://www.electronjs.org/docs/latest/api/protocol ,
  https://www.electronjs.org/docs/latest/api/net
