# Roadmap: slices in order

Each slice is one or more scopes (`docs/scopes/`), built on the reference
device (a mid-range Android phone) and playable before the next begins. This
order follows the owner's V5 plan; a slice is not started until the one before
it is done.

1. **Street.** Drive a real street, built from the place file and map data,
   streamed in 100 m grid chunks.
2. **Server-paid grey-box delivery, with a cheat test.** Plain boxes and
   markers, but the server assigns the job, times the route on its own clock and
   decides the payout. A test tries to cheat (a faked arrival, a replayed
   delivery) and must fail.
3. **Traffic and lights.** Other road users and signals that follow the place's
   road rules.
4. **Buildings.** Real footprints and heights, in the clay look.
5. **Shared world.** Other players on the same streets.
6. **Economy.** Earnings, caps, costs and what money is for.
7. **First hunt.** The first pin-guessing hunt, rate-limited per device and IP.

Ideas that do not fit a slice yet go in `PARKING_LOT.md`.
