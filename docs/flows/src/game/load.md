# src/game/load.ts

Drawn from the code by `npm run diagrams` (TypeScript compiler, no AI). Do not edit by hand: change the code, then run it again.

## fetchText

```mermaid
flowchart TD
  n1(["fetchText"])
  n2["const giveUp = new AbortController();"]
  n3["const timer = setTimeout(() =#gt; giveUp.abort(), DOWNLOAD_GIV…"]
  n4["try"]
  n5["const answer = await fetch(path, { signal: giveUp.signal });"]
  n6{"answer.status === 404"}
  n7(["return { ok: false, failure: { kind: #quot;file-missing#quot;, path }…"])
  n8{"!answer.ok"}
  n9(["return { ok: false, failure: { kind: #quot;server-error#quot;, path, …"])
  n10(["return { ok: true, value: await answer.text() };"])
  n11["catch"]
  n12{"giveUp.signal.aborted"}
  n13(["return { ok: false, failure: { kind: #quot;too-slow#quot;, path } };"])
  n14(["return { ok: false, failure: { kind: #quot;no-connection#quot;, path …"])
  n15["clearTimeout(timer);"]
  n16(["end"])
  n1 --> n2
  n2 --> n3
  n3 --> n4
  n4 --> n5
  n5 --> n6
  n6 -->|"yes"| n7
  n6 -->|"no"| n8
  n8 -->|"yes"| n9
  n8 -->|"no"| n10
  n4 -->|"throws"| n11
  n11 --> n12
  n12 -->|"yes"| n13
  n12 -->|"no"| n14
  n15 --> n16
```

## fetchChecked

```mermaid
flowchart TD
  n1(["fetchChecked"])
  n2["const text = await fetchText(path);<br/>calls fetchText"]
  n3{"!text.ok"}
  n4(["return text;"])
  n5["const checked = check(path, text.value);<br/>calls check"]
  n6{"!checked.ok"}
  n7(["return { ok: false, failure: { kind: #quot;file-has-mistakes#quot;, p…"])
  n8(["return { ok: true, value: checked.value };"])
  n1 --> n2
  n2 --> n3
  n3 -->|"yes"| n4
  n3 -->|"no"| n5
  n5 --> n6
  n6 -->|"yes"| n7
  n6 -->|"no"| n8
```

## planetIdWrittenIn

```mermaid
flowchart TD
  n1(["planetIdWrittenIn"])
  n2["let planet: unknown;"]
  n3["try"]
  n4["planet = (Object(JSON.parse(placeText)) as Record#lt;string, u…"]
  n5["catch"]
  n6(["return undefined;"])
  n7{"typeof planet === #quot;string#quot;"}
  n8{"requireShortId()(planet, []).ok<br/>calls requireShortId"}
  n9(["return planet;"])
  n10(["return undefined;"])
  n1 --> n2
  n2 --> n3
  n3 --> n4
  n3 -->|"throws"| n5
  n5 --> n6
  n4 --> n7
  n7 -->|"yes"| n8
  n8 -->|"yes"| n9
  n7 -->|"no"| n10
  n8 -->|"no"| n10
```

## loadPlaceOnItsPlanet

```mermaid
flowchart TD
  n1(["loadPlaceOnItsPlanet"])
  n2["const path = #96;places/${placeId}.json#96;;"]
  n3["const text = await fetchText(path);<br/>calls fetchText"]
  n4{"!text.ok"}
  n5(["return text;"])
  n6["const planetId = planetIdWrittenIn(text.value);<br/>calls planetIdWrittenIn"]
  n7["const planets: Planet[] = [];"]
  n8{"planetId !== undefined"}
  n9["const planet = await fetchChecked(#96;planets/${planetId}.json…<br/>calls fetchChecked"]
  n10{"!planet.ok"}
  n11(["return planet;"])
  n12["planets.push(planet.value);"]
  n13["const place = validatePlace(path, text.value, planets);<br/>calls validatePlace"]
  n14["const planet = planets[0];"]
  n15{"!place.ok"}
  n16{"planet === undefined"}
  n17{"place.ok"}
  n18["[]"]
  n19["place.messages"]
  n20(["return { ok: false, failure: { kind: #quot;file-has-mistakes#quot;, p…"])
  n21(["return { ok: true, value: { place: place.value, planet } };"])
  n1 --> n2
  n2 --> n3
  n3 --> n4
  n4 -->|"yes"| n5
  n4 -->|"no"| n6
  n6 --> n7
  n7 --> n8
  n8 -->|"yes"| n9
  n9 --> n10
  n10 -->|"yes"| n11
  n10 -->|"no"| n12
  n12 --> n13
  n8 -->|"no"| n13
  n13 --> n14
  n14 --> n15
  n15 -->|"no"| n16
  n15 -->|"yes"| n17
  n16 -->|"yes"| n17
  n17 -->|"yes"| n18
  n17 -->|"no"| n19
  n18 --> n20
  n19 --> n20
  n16 -->|"no"| n21
```

## loadVehicleForPlace

```mermaid
flowchart TD
  n1(["loadVehicleForPlace"])
  n2["const vehicle = await fetchChecked(#96;vehicles/${vehicleId}.j…<br/>calls fetchChecked"]
  n3{"!vehicle.ok"}
  n4(["return vehicle;"])
  n5{"!place.allowedVehicleClasses.includes(vehicle.value.class)"}
  n6(["return { ok: false, failure: { kind: #quot;vehicle-not-allowed#quot;,…"])
  n7(["return vehicle;"])
  n1 --> n2
  n2 --> n3
  n3 -->|"yes"| n4
  n3 -->|"no"| n5
  n5 -->|"yes"| n6
  n5 -->|"no"| n7
```

## loadMapIndexForPlace

```mermaid
flowchart TD
  n1(["loadMapIndexForPlace"])
  n2["const index = await fetchChecked(#96;places/${place.id}/chunks…<br/>calls fetchChecked"]
  n3{"!index.ok"}
  n4{"index.failure.kind === #quot;file-missing#quot;"}
  n5(["return { ok: false, failure: { kind: #quot;map-not-baked#quot;, place…"])
  n6(["return index;"])
  n7["const problems = indexProblemsForPlace(index.value, place, …<br/>calls indexProblemsForPlace"]
  n8{"problems.length #gt; 0"}
  n9(["return { ok: false, failure: { kind: #quot;map-baked-for-somethi…"])
  n10(["return index;"])
  n1 --> n2
  n2 --> n3
  n3 -->|"yes"| n4
  n4 -->|"yes"| n5
  n4 -->|"no"| n6
  n3 -->|"no"| n7
  n7 --> n8
  n8 -->|"yes"| n9
  n8 -->|"no"| n10
```

## loadGameData

```mermaid
flowchart TD
  n1(["loadGameData"])
  n2["const start = await fetchChecked(#quot;start.json#quot;, validateStar…<br/>calls fetchChecked"]
  n3{"!start.ok"}
  n4(["return start;"])
  n5["const choice = startChoiceFromLink(start.value, query);<br/>calls startChoiceFromLink"]
  n6["const placed = await loadPlaceOnItsPlanet(choice.placeId);<br/>calls loadPlaceOnItsPlanet"]
  n7{"!placed.ok"}
  n8(["return placed;"])
  n9["const vehicle = await loadVehicleForPlace(choice.vehicleId,…<br/>calls loadVehicleForPlace"]
  n10{"!vehicle.ok"}
  n11(["return vehicle;"])
  n12["const mapIndex = await loadMapIndexForPlace(placed.value.pl…<br/>calls loadMapIndexForPlace"]
  n13{"!mapIndex.ok"}
  n14(["return mapIndex;"])
  n15(["return { ok: true, value: { ...placed.value, vehicle: vehic…"])
  n1 --> n2
  n2 --> n3
  n3 -->|"yes"| n4
  n3 -->|"no"| n5
  n5 --> n6
  n6 --> n7
  n7 -->|"yes"| n8
  n7 -->|"no"| n9
  n9 --> n10
  n10 -->|"yes"| n11
  n10 -->|"no"| n12
  n12 --> n13
  n13 -->|"yes"| n14
  n13 -->|"no"| n15
```
