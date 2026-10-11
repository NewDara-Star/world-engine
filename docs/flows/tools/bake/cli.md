# tools/bake/cli.ts

Drawn from the code by `npm run diagrams` (TypeScript compiler, no AI). Do not edit by hand: change the code, then run it again.

## readBakeArguments

```mermaid
flowchart TD
  n1(["readBakeArguments"])
  n2["const placePath = words[words.indexOf(#quot;--place#quot;) + 1];"]
  n3["const extractPath = words[words.indexOf(#quot;--extract#quot;) + 1];"]
  n4["const optionCount = words.filter((word) =#gt; word.startsWith(…"]
  n5{"optionCount !== 2"}
  n6{"words.length !== 4"}
  n7{"placePath === undefined"}
  n8{"extractPath === undefined"}
  n9{"placePath.startsWith(#quot;--#quot;)"}
  n10{"extractPath.startsWith(#quot;--#quot;)"}
  n11(["return { ok: false, problem: #96;${USAGE}\nGive --place and --…"])
  n12(["return { ok: true, placePath, extractPath };"])
  n1 --> n2
  n2 --> n3
  n3 --> n4
  n4 --> n5
  n5 -->|"no"| n6
  n6 -->|"no"| n7
  n7 -->|"no"| n8
  n8 -->|"no"| n9
  n9 -->|"no"| n10
  n5 -->|"yes"| n11
  n6 -->|"yes"| n11
  n7 -->|"yes"| n11
  n8 -->|"yes"| n11
  n9 -->|"yes"| n11
  n10 -->|"yes"| n11
  n10 -->|"no"| n12
```

## runBake

```mermaid
flowchart TD
  n1(["runBake"])
  n2["const args = readBakeArguments(words);<br/>calls readBakeArguments"]
  n3{"!args.ok"}
  n4["console.error(args.problem);"]
  n5(["return 1;"])
  n6["let texts: { place: string; extract: string; planets: { nam…"]
  n7["try"]
  n8["const planetNames = (await readdir(PLANETS_FOLDER)).filter(…"]
  n9["texts = { place: await readFile(args.placePath, #quot;utf8#quot;), ex…"]
  n10["catch (error)"]
  n11["console.error(#96;A file could not be read: ${String(error)}#96;);"]
  n12(["return 1;"])
  n13["const planets = texts.planets.map((planet) =#gt; validatePlane…<br/>calls validatePlanet"]
  n14["const goodPlanets = planets.filter((checked): checked is Ex…"]
  n15["const planetProblems = planets.filter((checked): checked is…"]
  n16["const baked = bakePlace(args.placePath, texts.place, goodPl…<br/>calls bakePlace"]
  n17{"!baked.ok"}
  n18{"planetProblems.length #gt; 0"}
  n19{"baked.ok"}
  n20["[]"]
  n21["baked.problems"]
  n22["console.error([...planetProblems, ...(baked.ok ? [] : baked…"]
  n23(["return 1;"])
  n24["const folder = join(dirname(args.placePath), baked.placeId,…"]
  n25["const written = await writeBakeFiles(folder, baked.files);<br/>calls writeBakeFiles"]
  n26["const streetsPath = await writeStreetsFile(dirname(folder),…<br/>calls writeStreetsFile"]
  n27["console.log(#96;Baked ${baked.roadCount} roads into ${written …"]
  n28["console.log(#96;Wrote the street names and centre lines to ${s…"]
  n29{"baked.start.oneWay"}
  n30["#quot;one-way#quot;"]
  n31["#quot;two-way#quot;"]
  n32["console.log(#96;The car starts ${baked.start.eastM.toFixed(2)}…"]
  n33{"for each const note of baked.notes"}
  n34["console.log(#96;Note: ${note}#96;);"]
  n35(["return 0;"])
  n1 --> n2
  n2 --> n3
  n3 -->|"yes"| n4
  n4 --> n5
  n3 -->|"no"| n6
  n6 --> n7
  n7 --> n8
  n8 --> n9
  n7 -->|"throws"| n10
  n10 --> n11
  n11 --> n12
  n9 --> n13
  n13 --> n14
  n14 --> n15
  n15 --> n16
  n16 --> n17
  n17 -->|"no"| n18
  n17 -->|"yes"| n19
  n18 -->|"yes"| n19
  n19 -->|"yes"| n20
  n19 -->|"no"| n21
  n20 --> n22
  n21 --> n22
  n22 --> n23
  n18 -->|"no"| n24
  n24 --> n25
  n25 --> n26
  n26 --> n27
  n27 --> n28
  n28 --> n29
  n29 -->|"yes"| n30
  n29 -->|"no"| n31
  n30 --> n32
  n31 --> n32
  n32 --> n33
  n33 -->|"next item"| n34
  n34 --> n33
  n33 -->|"done"| n35
```
