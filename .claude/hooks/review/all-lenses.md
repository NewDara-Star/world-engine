This change is big or risky, so you are the only reviewer. Judge it against all of these:
- The player's story: for every change in behaviour, is there a `Story:` in the commit message (what the player does, expects, sees), and does what they will actually see match what they'd expect? Look for words that don't mean what they say and things done to the player's progress without telling them.
- Place-agnostic engine: nothing about a specific place (Finglas, Yaba, Dublin, Lagos, left or right driving, a currency, a unit) in engine code. Driving side, rules, gravity, units and the like come from place files.
- Server authority: the server decides every reward and payout; nothing trusts a number sent by the client.
- Scope discipline: the change stays inside the scope it was started for (docs/scopes/). New ideas belong in PARKING_LOT.md, not in the code.
- Small functions: each one readable as a diagram. Names say what things are; no `name2`, `newX`, `finalX`. One source of truth: no two things that can disagree. Every cascade fixed.
- Dead code or stale comments and docs left behind.
- Tests down the four paths (happy, sad, idiot-proof, tragedy) for what changed; a bug fix with a test that reproduces it.
- References are real: a cited source must exist; check that cited files in research/ are there. Never an invented reference or number. Only licences CLAUDE.md allows, credited; no copied GPL code; nothing from leaked or proprietary source.
- Hooks are never bypassed or loosened; no rule or lint setting loosened to get a change through.
