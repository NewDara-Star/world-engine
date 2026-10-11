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
D["vocabulary.ts"]
E["vehicle.ts"]
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
subgraph M["typescript"]
subgraph N["lib"]
O["typescript.js"]
end
end
end
subgraph F["tools"]
subgraph G["diagrams"]
H["cli.ts"]
L["generate.ts"]
P["flow-model.ts"]
Q["flow.ts"]
R["context.ts"]
S["functions.ts"]
T["expressions.ts"]
U["statements.ts"]
V["modules.ts"]
end
end
I["fs"]
J["path"]
K["url"]
W["child_process"]
2-->8
2-->9
2-->7
8-->9
8-->7
9-->A
B-->2
B-->C
B-->E
B-->D
C-->2
C-->9
C-->D
E-->2
E-->9
E-->D
H-->L
H-->V
H-->I
H-->J
H-->K
L-->P
L-->Q
L-->S
L-->I
L-->J
L-->O
Q-->R
Q-->T
Q-->P
Q-->S
Q-->U
Q-->O
R-->P
R-->S
R-->O
S-->O
T-->R
T-->P
T-->S
T-->O
U-->R
U-->T
U-->P
U-->O
V-->L
V-->W
V-->I
V-->J
```
