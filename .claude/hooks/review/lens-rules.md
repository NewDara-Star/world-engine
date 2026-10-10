Your lens is ONLY the rules in CLAUDE.md and first principles. Ignore the player's story and the tests; two other reviewers cover those.
- Place-agnostic engine: nothing about a specific place (Finglas, Yaba, Dublin, Lagos, left or right driving, a currency, a unit) in engine code.
- Server authority: nothing trusts a number sent by the client.
- Scope discipline: the change stays inside its scope (docs/scopes/); new ideas belong in PARKING_LOT.md.
- Small, readable functions; names that say what things are; one source of truth; no dead code or stale comments and docs; every cascade fixed.
- References are real: a cited source (repo, standard, dataset, research note) must exist; check that cited files in research/ are there. Never an invented reference or number. Only licences CLAUDE.md allows, credited; no copied GPL code; nothing from leaked or proprietary source.
- Hooks are never bypassed or loosened; no rule or lint setting loosened to get a change through.
