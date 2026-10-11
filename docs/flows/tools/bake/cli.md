# tools/bake/cli.ts

Drawn from the code by `npm run diagrams` (TypeScript compiler, no AI). Do not edit by hand: change the code, then run it again.

## readBakeArguments

```mermaid
flowchart TD
  n1(["readBakeArguments"])
  n2["const values = new Map#lt;string, string#gt;();"]
  n3["let wellFormed = words.length % 2 === 0;"]
  n4["let at = 0"]
  n5{"at + 1 #lt; words.length"}
  n6["const [option, value] = [words[at] as string, words[at + 1]…"]
  n7{"OPTIONS.includes(option)"}
  n8{"!values.has(option)"}
  n9["!value.startsWith(#quot;--#quot;)"]
  n10["wellFormed &&= OPTIONS.includes(option) && !values.has(opti…"]
  n11["values.set(option, value);"]
  n12["at += 2"]
  n13["const placePath = values.get(#quot;--place#quot;);"]
  n14["const extractPath = values.get(#quot;--extract#quot;);"]
  n15{"!wellFormed"}
  n16{"placePath === undefined"}
  n17{"extractPath === undefined"}
  n18(["return { ok: false, problem: #96;${USAGE}\nGive --place and --…"])
  n19(["return { ok: true, placePath, extractPath, buildingsPath: v…"])
  n1 --> n2
  n2 --> n3
  n3 --> n4
  n4 --> n5
  n5 -->|"yes"| n6
  n6 --> n7
  n7 -->|"yes"| n8
  n8 -->|"yes"| n9
  n7 -->|"no"| n10
  n8 -->|"no"| n10
  n9 --> n10
  n10 --> n11
  n11 --> n12
  n12 --> n5
  n5 -->|"no"| n13
  n13 --> n14
  n14 --> n15
  n15 -->|"no"| n16
  n16 -->|"no"| n17
  n15 -->|"yes"| n18
  n16 -->|"yes"| n18
  n17 -->|"yes"| n18
  n17 -->|"no"| n19
```

## readBakeInputs

```mermaid
flowchart TD
  n1(["readBakeInputs"])
  n2["try"]
  n3["const planetNames = (await readdir(PLANETS_FOLDER)).filter(…"]
  n4{"args.buildingsPath === undefined"}
  n5["undefined"]
  n6["await readFile(args.buildingsPath, #quot;utf8#quot;)"]
  n7(["return { place: await readFile(args.placePath, #quot;utf8#quot;), ext…"])
  n8["catch (error)"]
  n9(["return #96;A file could not be read: ${String(error)}#96;;"])
  n1 --> n2
  n2 --> n3
  n3 --> n4
  n4 -->|"yes"| n5
  n4 -->|"no"| n6
  n5 --> n7
  n6 --> n7
  n2 -->|"throws"| n8
  n8 --> n9
```

## runBake

```mermaid
flowchart TD
  n1(["runBake"])
  n2["const args = readBakeArguments(words);<br/>calls readBakeArguments"]
  n3{"!args.ok"}
  n4["console.error(args.problem);"]
  n5(["return 1;"])
  n6["const texts = await readBakeInputs(args);<br/>calls readBakeInputs"]
  n7{"typeof texts === #quot;string#quot;"}
  n8["console.error(texts);"]
  n9(["return 1;"])
  n10["const planets = texts.planets.map((planet) =#gt; validatePlane…<br/>calls validatePlanet"]
  n11["const goodPlanets = planets.filter((checked): checked is Ex…"]
  n12["const planetProblems = planets.filter((checked): checked is…"]
  n13["const baked = bakePlace(args.placePath, texts.place, goodPl…<br/>calls bakePlace"]
  n14{"!baked.ok"}
  n15{"planetProblems.length #gt; 0"}
  n16{"baked.ok"}
  n17["[]"]
  n18["baked.problems"]
  n19["console.error([...planetProblems, ...(baked.ok ? [] : baked…"]
  n20(["return 1;"])
  n21["const folder = join(dirname(args.placePath), baked.placeId,…"]
  n22["const written = await writeBakeFiles(folder, baked.files);<br/>calls writeBakeFiles"]
  n23["const streetsPath = await writeStreetsFile(dirname(folder),…<br/>calls writeStreetsFile"]
  n24["console.log(#96;Baked ${baked.roadCount} roads and ${baked.bui…"]
  n25["console.log(#96;Wrote the street names and centre lines to ${s…"]
  n26{"baked.start.oneWay"}
  n27["#quot;one-way#quot;"]
  n28["#quot;two-way#quot;"]
  n29["console.log(#96;The car starts ${baked.start.eastM.toFixed(2)}…"]
  n30{"for each const note of baked.notes"}
  n31["console.log(#96;Note: ${note}#96;);"]
  n32(["return 0;"])
  n1 --> n2
  n2 --> n3
  n3 -->|"yes"| n4
  n4 --> n5
  n3 -->|"no"| n6
  n6 --> n7
  n7 -->|"yes"| n8
  n8 --> n9
  n7 -->|"no"| n10
  n10 --> n11
  n11 --> n12
  n12 --> n13
  n13 --> n14
  n14 -->|"no"| n15
  n14 -->|"yes"| n16
  n15 -->|"yes"| n16
  n16 -->|"yes"| n17
  n16 -->|"no"| n18
  n17 --> n19
  n18 --> n19
  n19 --> n20
  n15 -->|"no"| n21
  n21 --> n22
  n22 --> n23
  n23 --> n24
  n24 --> n25
  n25 --> n26
  n26 -->|"yes"| n27
  n26 -->|"no"| n28
  n27 --> n29
  n28 --> n29
  n29 --> n30
  n30 -->|"next item"| n31
  n31 --> n30
  n30 -->|"done"| n32
```
