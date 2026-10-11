# tools/bake/write.ts

Drawn from the code by `npm run diagrams` (TypeScript compiler, no AI). Do not edit by hand: change the code, then run it again.

## writeBakeFiles

```mermaid
flowchart TD
  n1(["writeBakeFiles"])
  n2["const placeFolder = dirname(folder);"]
  n3{"basename(folder) !== #quot;chunks#quot;"}
  n4{"!isPlaceFolder(placeFolder)<br/>calls isPlaceFolder"}
  n5{{"throw new Error(#96;the bake only writes to places/#lt;id#gt;/chunks…"}}
  n6["const old = await readdir(folder).catch(() =#gt; []);"]
  n7["await Promise.all(old.filter((name) =#gt; name.endsWith(#quot;.json…"]
  n8["await rmdir(folder).catch(() =#gt; undefined);"]
  n9["await mkdir(folder, { recursive: true });"]
  n10{"for each const file of files.toSorted((a, b) =#gt; Number(a.name #gt; b.name) - Number(a…"}
  n11["await writeFile(join(folder, file.name), file.text);"]
  n12(["return files.length;"])
  n1 --> n2
  n2 --> n3
  n3 -->|"no"| n4
  n3 -->|"yes"| n5
  n4 -->|"yes"| n5
  n4 -->|"no"| n6
  n6 --> n7
  n7 --> n8
  n8 --> n9
  n9 --> n10
  n10 -->|"next item"| n11
  n11 --> n10
  n10 -->|"done"| n12
```

## writeStreetsFile

```mermaid
flowchart TD
  n1(["writeStreetsFile"])
  n2{"!isPlaceFolder(placeFolder)<br/>calls isPlaceFolder"}
  n3{{"throw new Error(#96;the bake only writes streets.json into pla…"}}
  n4["const path = join(placeFolder, #quot;streets.json#quot;);"]
  n5["await mkdir(placeFolder, { recursive: true });"]
  n6["await writeFile(path, text);"]
  n7(["return path;"])
  n1 --> n2
  n2 -->|"yes"| n3
  n2 -->|"no"| n4
  n4 --> n5
  n5 --> n6
  n6 --> n7
```

## isPlaceFolder

```mermaid
flowchart TD
  n1(["isPlaceFolder"])
  n2{"checkPlaceId(basename(folder), []).ok<br/>calls checkPlaceId"}
  n3["basename(dirname(folder)) === #quot;places#quot;"]
  n4(["return checkPlaceId(basename(folder), []).ok && basename(di…<br/>calls checkPlaceId"])
  n1 --> n2
  n2 -->|"yes"| n3
  n2 -->|"no"| n4
  n3 --> n4
```
