# world-engine

A driving game that is not tied to one place. Real places are built from open
map data, and each place is a data file in `places/`, not code. The first two
are Finglas in Dublin (drives on the left) and Yaba in Lagos (drives on the
right). Later: boats, planes, other countries, maybe other planets.

It runs in the browser. The core mode is deliveries in Lagos, and the server
decides every payout.

**Where things are now:** Scopes 001 and 001b only. The repo, the working
rules, the checks that enforce them, and the place and vehicle file format.
There is no game code yet. The order of what comes next is in
`docs/roadmap.md`.

## What is here

- `CLAUDE.md`: the working rules, in plain words.
- `docs/scopes/`: one file per piece of work. `TEMPLATE.md` starts a new one.
- `docs/roadmap.md`: the slices, in order.
- `places/`: the places, as data.
- `src/place/`: the place and vehicle file format and its checker.
- `.claude/`: the hooks that block a commit, push or search when a rule is broken.
- `research/`: notes on where each idea came from.
- `PARKING_LOT.md`: ideas for later.

## Run the checks

Needs Node 22.

    npm install
    npm run check

This runs the typecheck, the lint and the tests. It must pass before anything
is committed.
