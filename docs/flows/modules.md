# Module map

Which file uses which, drawn by dependency-cruiser from the imports in the code (`npm run diagrams`). Do not edit by hand.

```mermaid
flowchart LR

subgraph 0["src"]
subgraph 1["camera"]
2["chase.ts"]
end
subgraph 3["vehicle"]
4["car.ts"]
T["drive-force.ts"]
U["pedals.ts"]
V["rapier-settings.ts"]
W["steering.ts"]
end
subgraph D["controls"]
E["actions.ts"]
F["feel.ts"]
X["gamepad.ts"]
Y["keyboard.ts"]
Z["touch.ts"]
end
subgraph G["place"]
H["place.ts"]
I["check-file.ts"]
N["json-text.ts"]
O["parse.ts"]
P["closest-word.ts"]
Q["planet.ts"]
R["vocabulary.ts"]
S["vehicle.ts"]
18["start.ts"]
1F["index.ts"]
end
subgraph 10["game"]
11["failure.ts"]
12["game.ts"]
17["load.ts"]
1A["scene.ts"]
1B["loop.ts"]
1C["physics.ts"]
1D["streaming.ts"]
1E["main.ts"]
end
subgraph 13["measure"]
14["measure.ts"]
end
subgraph 15["world"]
16["grid.ts"]
19["chunk.ts"]
end
end
subgraph 5["node_modules"]
subgraph 6["@dimforge"]
subgraph 7["rapier3d-compat"]
subgraph 8["dist"]
9["rapier.cjs"]
end
end
end
subgraph A["three"]
subgraph B["build"]
C["three.cjs"]
end
end
subgraph J["jsonc-parser"]
subgraph K["lib"]
subgraph L["umd"]
M["main.js"]
end
end
end
subgraph 1Y["stemmer"]
1Z["index.js"]
end
subgraph 25["typescript"]
subgraph 26["lib"]
27["typescript.js"]
end
end
end
subgraph 1G["tools"]
subgraph 1H["bake"]
1I["bake.ts"]
1J["chunk-text.ts"]
1K["projection.ts"]
1L["start.ts"]
1M["roads.ts"]
1N["clip.ts"]
1O["opl.ts"]
1P["ribbons.ts"]
1Q["cli.ts"]
1V["write.ts"]
end
subgraph 1W["decisions"]
1X["clash.ts"]
20["log.ts"]
21["cli.ts"]
end
subgraph 22["diagrams"]
23["cli.ts"]
24["generate.ts"]
28["flow-model.ts"]
29["flow.ts"]
2A["context.ts"]
2B["functions.ts"]
2C["expressions.ts"]
2D["statements.ts"]
2E["modules.ts"]
end
subgraph 2G["site"]
2H["data-files.ts"]
end
end
subgraph 1R["fs"]
1S["promises"]
end
1T["path"]
1U["url"]
2F["child_process"]
2-->4
2-->V
4-->E
4-->F
4-->H
4-->S
4-->T
4-->U
4-->V
4-->W
4-->9
4-->C
H-->I
H-->O
H-->Q
H-->R
I-->N
I-->O
I-->M
N-->O
N-->M
O-->P
Q-->I
Q-->O
Q-->R
S-->I
S-->O
S-->R
T-->S
U-->F
V-->S
W-->F
W-->S
W-->V
X-->E
X-->F
Y-->E
Z-->E
Z-->F
Z-->X
12-->2
12-->Z
12-->14
12-->4
12-->16
12-->11
12-->17
12-->1A
12-->9
12-->C
17-->I
17-->O
17-->H
17-->Q
17-->18
17-->S
17-->19
17-->16
17-->11
18-->I
18-->O
19-->I
19-->O
19-->H
19-->16
1A-->2
1A-->S
1A-->4
1A-->V
1A-->19
1A-->16
1A-->11
1A-->9
1A-->C
1B-->2
1B-->E
1B-->X
1B-->Y
1B-->Z
1B-->14
1B-->4
1B-->16
1B-->11
1B-->12
1B-->1C
1B-->1A
1B-->1D
1C-->H
1C-->4
1C-->16
1C-->9
1C-->C
1D-->4
1D-->19
1D-->16
1D-->11
1D-->12
1D-->17
1D-->1C
1D-->1A
1E-->2
1E-->Y
1E-->Z
1E-->4
1E-->11
1E-->12
1E-->17
1E-->1B
1E-->1C
1E-->1A
1E-->1D
1E-->C
1F-->I
1F-->H
1F-->Q
1F-->S
1F-->R
1I-->1F
1I-->16
1I-->1J
1I-->1N
1I-->1O
1I-->1K
1I-->1P
1I-->1M
1I-->1L
1J-->16
1J-->1K
1J-->1L
1K-->16
1L-->16
1L-->1M
1N-->16
1P-->16
1Q-->1F
1Q-->1I
1Q-->1V
1Q-->1S
1Q-->1T
1Q-->1U
1V-->O
1V-->1I
1V-->1S
1V-->1T
1X-->20
1X-->1Z
20-->P
21-->P
21-->1X
21-->20
21-->1R
21-->1T
21-->1Z
21-->1U
23-->24
23-->2E
23-->1R
23-->1T
23-->1U
24-->28
24-->29
24-->2B
24-->1R
24-->1T
24-->27
29-->2A
29-->2C
29-->28
29-->2B
29-->2D
29-->27
2A-->28
2A-->2B
2A-->27
2B-->27
2C-->2A
2C-->28
2C-->2B
2C-->27
2D-->2A
2D-->2C
2D-->28
2D-->27
2E-->24
2E-->2F
2E-->1R
2E-->1T
```
