# tools/bake/write.ts

Drawn from the code by `npm run diagrams` (TypeScript compiler, no AI). Do not edit by hand: change the code, then run it again.

## writeBakeFiles

```mermaid
flowchart TD
  n1(["writeBakeFiles"])
  n2["const placeFolder = dirname(folder);"]
  n3{"basename(folder) !== #quot;chunks#quot;"}
  n4{"!checkPlaceId(basename(placeFolder), []).ok<br/>calls checkPlaceId"}
  n5{"basename(dirname(placeFolder)) !== #quot;places#quot;"}
  n6{{"throw new Error(#96;the bake only writes to places/#lt;id#gt;/chunks…"}}
  n7["const old = await readdir(folder).catch(() =#gt; []);"]
  n8["await Promise.all(old.filter((name) =#gt; name.endsWith(#quot;.json…"]
  n9["await rmdir(folder).catch(() =#gt; undefined);"]
  n10["await mkdir(folder, { recursive: true });"]
  n11{"for each const file of files.toSorted((a, b) =#gt; Number(a.name #gt; b.name) - Number(a…"}
  n12["await writeFile(join(folder, file.name), file.text);"]
  n13(["return files.length;"])
  n1 --> n2
  n2 --> n3
  n3 -->|"no"| n4
  n4 -->|"no"| n5
  n3 -->|"yes"| n6
  n4 -->|"yes"| n6
  n5 -->|"yes"| n6
  n5 -->|"no"| n7
  n7 --> n8
  n8 --> n9
  n9 --> n10
  n10 --> n11
  n11 -->|"next item"| n12
  n12 --> n11
  n11 -->|"done"| n13
```
