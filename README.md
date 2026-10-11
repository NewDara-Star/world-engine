# world-engine

A driving game that is not tied to one place. Real places are built from open
map data, and each place is a data file in `places/`, not code. The first two
are Finglas in Dublin (drives on the left) and Yaba in Lagos (drives on the
right). Later: boats, planes, other countries, maybe other planets.

It runs in the browser. The core mode is deliveries in Lagos, and the server
decides every payout.

**Where things are now:** Scope 005, slice 1: drive your street. A grey road
map of about 1.5 km around Babatunde Ladega Street, Omole Phase 1, Lagos,
baked from OpenStreetMap, and a small grey-box car you drive with thumbs on a
phone or keys on a computer. No buildings, traffic or jobs yet. The order of
what comes next is in `docs/roadmap.md`.

## What is here

- `CLAUDE.md`: the working rules, in plain words.
- `docs/scopes/`: one file per piece of work. `TEMPLATE.md` starts a new one.
- `docs/roadmap.md`: the slices, in order.
- `docs/flows/`: a picture of every function, drawn from the code by
  `npm run diagrams` (GitHub draws them). `docs/designs/`: the designs the
  owner approves before code.
- `tools/diagrams/`: the program that draws them.
- `places/`: the places, as data. `places/omole/chunks/`: Omole's baked map
  (ODbL, © OpenStreetMap contributors), one file per 100 m square;
  `places/omole/streets.json`: every road's name and centre line, for the
  street-name line and the small map.
- `vehicles/`, `planets/`, `start.json`: the car, the planets, and which
  place and car the game opens with.
- `src/place/`: the place and vehicle file format and its checker.
- `src/game/`, `src/vehicle/`, `src/controls/`, `src/camera/`,
  `src/world/`, `src/measure/`: the game page.
- `tools/bake/`: turns an OpenStreetMap extract into the map squares.
- `.claude/`: the hooks that block a commit, push or search when a rule is broken.
- `research/`: notes on where each idea came from.
- `PARKING_LOT.md`: ideas for later.

## Run the checks

Needs Node 22.

    npm install
    npm run check

This runs the typecheck, the lint and the tests. It must pass before anything
is committed.

## Play it on your phone

**On the same Wi-Fi as your computer.** Run this on the computer:

    npm install
    npm run dev

It prints two links. Open the `Network:` one (it looks like
`http://192.168.1.20:5173/`) on the phone. Only do this on your home Wi-Fi or
another network you trust: while it runs, anyone on that network can open the
game. The dev server refuses the private folders (`raw-data/`, `research/`,
`docs/`, `tests/`, `.claude/`, `CLAUDE.md`). Stop it with Ctrl+C.

On the phone: put your left thumb down anywhere on the left half and slide it
left or right to steer. On the right: Go, Brake (hold it when stopped to
reverse) and Flip upright. On a computer: the arrow keys or WASD, Space also
brakes, R flips the car upright.

**A public link, from anywhere.** Build the game and put it on Cloudflare
(needs a Cloudflare account; `wrangler` asks you to log in the first time):

    npm run build && npx wrangler deploy

It prints a `https://world-engine.<your-account>.workers.dev` link. The
Worker only serves the built files in `dist/` (`wrangler.jsonc`); there are no
secrets in it.

**Measuring.** Add `?measure` to the link (`…:5173/?measure`, or better, the
built game: `npm run build`, then `npm run preview -- --host`). After 60
seconds of driving it shows what was downloaded before you could drive and
the frame rate.

## Make the map (the bake)

The map is baked once on a computer from an OpenStreetMap extract and the
place file's centre and map size. You need `osmium` (osmium-tool) and a
download of Nigeria from Geofabrik (`nigeria-latest.osm.pbf`). Cut a box a
little larger than the map (W,S,E,N in degrees), keep the roads, and write
OPL with the node positions on each way:

    osmium extract --bbox W,S,E,N nigeria-latest.osm.pbf -o raw-data/omole/omole.osm.pbf
    osmium tags-filter raw-data/omole/omole.osm.pbf w/highway -o raw-data/omole/omole-highways.osm.pbf
    osmium add-locations-to-ways raw-data/omole/omole-highways.osm.pbf -f opl,add_metadata=false,locations_on_ways=true -o raw-data/omole/omole-highways.opl

The last step must be `add-locations-to-ways`, not `osmium cat`, or the
nodes come out without positions. Then:

    npm run bake -- --place places/omole.json --extract raw-data/omole/omole-highways.opl --buildings raw-data/omole/omole-buildings.opl

The buildings extract (scope 006) is cut the same way with
`osmium tags-filter raw-data/omole/omole.osm.pbf nwr/building`, which also
keeps the untagged ways that make the rings of courtyard buildings, then
`add-locations-to-ways` as above. (This command was not run in scope 006;
the file in `raw-data/` was already there.) `--buildings` is optional;
without it the map has roads only. Building heights come from the place
file's `buildingHeights`.

It replaces `places/omole/chunks/` and `places/omole/streets.json` and prints
how many roads, buildings and files it made, the street file's size and where the car
starts. The same extract always gives the same files, byte for byte.
`raw-data/` stays out of git; the baked squares and street file are published
under ODbL with the bake script.
