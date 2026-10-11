# 42: Models already on the owner's Mac (World Drive), and which we can use now

Track 3 (Assets), 2026-10-11. The owner pointed at `/Users/Star/Real-world`
(the World Drive project) and asked whether its models can be used for now.
Measured on his Mac by reading each file's glTF header (triangles counted from
index accessors, texture sizes from the PNG/JPEG headers). Licences read from
each model's own `license.txt` / `source.json` and `game/public/models/CREDITS.md`.

## Use now (licence clean, close to budget)

| Models | Licence | Triangles | Problem | Fix in the cut |
|---|---|---|---|---|
| `car_traffic_1..5` (hatchback, saloon, estate, compact SUV, small van) | CC-BY-4.0, "Generic passenger car pack" by Comrade1280; already generic, scaled to real class lengths | 6,800–8,000 | four 2048² textures each (~22 MB on the graphics chip per car before compression) | textures to 1024 (512 for traffic), KTX2, meshopt: expected well under 500 KB each |
| `car_service_van`, `_taxi`, `_truck`, `_tow` | CC-BY-4.0, "Generic civil service vehicles pack" by Comrade1280; lettering already removed | 6,000–8,200 | same 2048² textures, 1.8–4.3 MB files | same |
| Own street furniture: `bollard_steel`, `lamp_post_led`, `traffic_signal_head`, `traffic_signal_pole`, `telecom_cabinet`, `garden_wall_*` | made for the project by script, no third-party content, no credit needed | 24–1,134 | none | pack only |
| Poly Haven: `rollershutter_door`, `rollershutter_window_01..03`, `security_light`, `utility_box_01/02`, `trashbag`, `water_manhole_cover`, `exterior_aircon_unit`, `concrete_road_barrier(_02)` | CC0, no credit needed | 1,100–61,000 | barriers and aircon are 19k–61k triangles | simplify to the prop budget (2,000 or less) |

## Use later or only after heavy cutting

- Poly Haven `modular_electricity_poles` (200k), `modular_electric_cables`,
  `shrub_*` (8k–156k), `street_lamp_01/02` (20k–30k), planters, seating,
  chainlink fence, gutter: CC0 and useful for Lagos streets, but 10–100 times
  over budget; worth a simplify test, not first.
- Sketchfab CC-BY: `traffic_cones` (19k), `cc0_-_iron_fence` (CC-BY despite
  its name, 3.8k), `yellow_bicycle` (16k; a bike body for later).
- Microsoft Rocketbox people (MIT, ~9–11k triangles, ~600 KB each): fine for a
  few people, too heavy for crowds; not needed until Traffic and people.

## Not for Lagos, or not for the game

- `bus_dublin_dd`, `post_box_pillar`, `wheelie_bin`, `bus_stop_pole`,
  `bus_shelter`: our own, but Dublin street furniture; kept for Finglas.
- `car_concept` (213,000 triangles, 11.5 MB, Khronos CC-BY): far over budget;
  only the Scope 003 maths-shapes test input.

## Notes

- CC-BY models need one credit line each on the About page (D-0011). Own and
  CC0 models need none, so where two models do the same job, prefer those.
- The existing `CREDITS.md` text and the Sketchfab `license.txt` files carry
  over as each model's record; nothing new has to be looked up.
- None of these has a danfo, keke or Lagos kiosk; those still need Meshy.
