# Module map

Which file uses which, drawn by dependency-cruiser from the imports in the code (`npm run diagrams`). Do not edit by hand.

```mermaid
flowchart LR

subgraph 0["src"]
subgraph 1["place"]
2["check-file.ts"]
8["json-text.ts"]
9["parse.ts"]
A["closest-word.ts"]
B["index.ts"]
C["place.ts"]
D["planet.ts"]
E["vocabulary.ts"]
F["vehicle.ts"]
end
end
subgraph 3["node_modules"]
subgraph 4["jsonc-parser"]
subgraph 5["lib"]
subgraph 6["umd"]
7["main.js"]
end
end
end
subgraph N["typescript"]
subgraph O["lib"]
P["typescript.js"]
end
end
end
subgraph G["tools"]
subgraph H["diagrams"]
I["cli.ts"]
M["generate.ts"]
Q["flow-model.ts"]
R["flow.ts"]
S["context.ts"]
T["functions.ts"]
U["expressions.ts"]
V["statements.ts"]
W["modules.ts"]
end
end
J["fs"]
K["path"]
L["url"]
X["child_process"]
2-->8
2-->9
2-->7
8-->9
8-->7
9-->A
B-->2
B-->C
B-->D
B-->F
B-->E
C-->2
C-->9
C-->D
C-->E
D-->2
D-->9
D-->E
F-->2
F-->9
F-->E
I-->M
I-->W
I-->J
I-->K
I-->L
M-->Q
M-->R
M-->T
M-->J
M-->K
M-->P
R-->S
R-->U
R-->Q
R-->T
R-->V
R-->P
S-->Q
S-->T
S-->P
T-->P
U-->S
U-->Q
U-->T
U-->P
V-->S
V-->U
V-->Q
V-->P
W-->M
W-->X
W-->J
W-->K
```
