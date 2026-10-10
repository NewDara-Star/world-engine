# Module map

Which file uses which, drawn by dependency-cruiser from the imports in the code (`npm run diagrams`). Do not edit by hand.

```mermaid
flowchart LR

subgraph 0["src"]
subgraph 1["place"]
2["index.ts"]
3["parse.ts"]
4["place.ts"]
5["vocabulary.ts"]
6["vehicle.ts"]
end
end
subgraph 7["tools"]
subgraph 8["diagrams"]
9["cli.ts"]
D["generate.ts"]
I["flow-model.ts"]
J["flow.ts"]
K["context.ts"]
L["functions.ts"]
M["expressions.ts"]
N["statements.ts"]
O["modules.ts"]
end
end
A["fs"]
B["path"]
C["url"]
subgraph E["node_modules"]
subgraph F["typescript"]
subgraph G["lib"]
H["typescript.js"]
end
end
end
P["child_process"]
2-->3
2-->4
2-->6
2-->5
4-->3
4-->5
6-->3
6-->5
9-->D
9-->O
9-->A
9-->B
9-->C
D-->I
D-->J
D-->L
D-->A
D-->B
D-->H
J-->K
J-->M
J-->I
J-->L
J-->N
J-->H
K-->I
K-->L
K-->H
L-->H
M-->K
M-->I
M-->L
M-->H
N-->K
N-->M
N-->I
N-->H
O-->D
O-->P
O-->A
O-->B
```
