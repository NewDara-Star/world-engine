# src/place/parse.ts

Drawn from the code by `npm run diagrams` (TypeScript compiler, no AI). Do not edit by hand: change the code, then run it again.

## show

```mermaid
flowchart TD
  n1(["show"])
  n2{"JSON.stringify(value) is missing?"}
  n3["#quot;nothing#quot;"]
  n4["const json = JSON.stringify(value) ?? #quot;nothing#quot;;"]
  n5{"json.length #gt; MAX_SHOWN"}
  n6["#96;${json.slice(0, MAX_SHOWN)}…#96;"]
  n7["json"]
  n8(["return json.length #gt; MAX_SHOWN ? #96;${json.slice(0, MAX_SHOWN…"])
  n1 --> n2
  n2 -->|"yes"| n3
  n2 -->|"no"| n4
  n3 --> n4
  n4 --> n5
  n5 -->|"yes"| n6
  n5 -->|"no"| n7
  n6 --> n8
  n7 --> n8
```

## good

```mermaid
flowchart TD
  n1(["good"])
  n2(["return { ok: true, value };"])
  n1 --> n2
```

## bad

```mermaid
flowchart TD
  n1(["bad"])
  n2(["return { ok: false, errors: [#96;${path}: must be ${wanted}, g…<br/>calls show"])
  n1 --> n2
```

## someText

```mermaid
flowchart TD
  n1(["someText"])
  n2(["return (value, path) =#gt; typeof value === #quot;string#quot; && value.…"])
  n1 --> n2
```

## someText > inner function 1

```mermaid
flowchart TD
  n1(["someText #gt; inner function 1"])
  n2{"typeof value === #quot;string#quot;"}
  n3{"value.trim() !== #quot;#quot;"}
  n4["good(value)<br/>calls good"]
  n5["bad(path, #quot;some text#quot;, value)<br/>calls bad"]
  n6(["return typeof value === #quot;string#quot; && value.trim() !== #quot;#quot; ? good(val"])
  n1 --> n2
  n2 -->|"yes"| n3
  n3 -->|"yes"| n4
  n2 -->|"no"| n5
  n3 -->|"no"| n5
  n4 --> n6
  n5 --> n6
```

## textMatching

```mermaid
flowchart TD
  n1(["textMatching"])
  n2(["return (value, path) =#gt; typeof value === #quot;string#quot; && patter…"])
  n1 --> n2
```

## textMatching > inner function 1

```mermaid
flowchart TD
  n1(["textMatching #gt; inner function 1"])
  n2{"typeof value === #quot;string#quot;"}
  n3{"pattern.test(value)"}
  n4["good(value)<br/>calls good"]
  n5["bad(path, wanted, value)<br/>calls bad"]
  n6(["return typeof value === #quot;string#quot; && pattern.test(value) ? good(val"])
  n1 --> n2
  n2 -->|"yes"| n3
  n3 -->|"yes"| n4
  n2 -->|"no"| n5
  n3 -->|"no"| n5
  n4 --> n6
  n5 --> n6
```

## numberBetween

```mermaid
flowchart TD
  n1(["numberBetween"])
  n2(["return (value, path) =#gt; { const inRange = typeof value === …"])
  n1 --> n2
```

## numberBetween > inner function 1

```mermaid
flowchart TD
  n1(["numberBetween #gt; inner function 1"])
  n2{"typeof value === #quot;number#quot;"}
  n3{"Number.isFinite(value)"}
  n4{"value #gt;= min"}
  n5["value #lt;= max"]
  n6["const inRange = typeof value === #quot;number#quot; && Number.isFinit…"]
  n7{"inRange"}
  n8["good(value)<br/>calls good"]
  n9["bad(path, #96;a number from ${min} to ${max} ${unit}#96;.trim(), …<br/>calls bad"]
  n10(["return inRange ? good(value) : bad(path, #96;a number from ${m…<br/>calls good, bad"])
  n1 --> n2
  n2 -->|"yes"| n3
  n3 -->|"yes"| n4
  n4 -->|"yes"| n5
  n2 -->|"no"| n6
  n3 -->|"no"| n6
  n4 -->|"no"| n6
  n5 --> n6
  n6 --> n7
  n7 -->|"yes"| n8
  n7 -->|"no"| n9
  n8 --> n10
  n9 --> n10
```

## oneOf

```mermaid
flowchart TD
  n1(["oneOf"])
  n2["const isOption = (value: unknown): value is T =#gt; options.so…"]
  n3(["return (value, path) =#gt; isOption(value) ? good(value) : bad…"])
  n1 --> n2
  n2 --> n3
```

## oneOf > isOption

```mermaid
flowchart TD
  n1(["oneOf #gt; isOption"])
  n2(["return options.some((option) =#gt; option === value)"])
  n1 --> n2
```

## oneOf > inner function 1

```mermaid
flowchart TD
  n1(["oneOf #gt; inner function 1"])
  n2{"isOption(value)<br/>calls isOption"}
  n3["good(value)<br/>calls good"]
  n4["bad(path, #96;one of ${options.map((o) =#gt; #96;#quot;${o}#quot;#96;).join(#quot;, #quot;)…<br/>calls bad"]
  n5(["return isOption(value) ? good(value) : bad(path, #96;one of ${options"])
  n1 --> n2
  n2 -->|"yes"| n3
  n2 -->|"no"| n4
  n3 --> n5
  n4 --> n5
```

## listOf

```mermaid
flowchart TD
  n1(["listOf"])
  n2(["return (value, path) =#gt; { if (!Array.isArray(value) || valu…"])
  n1 --> n2
```

## listOf > inner function 1

```mermaid
flowchart TD
  n1(["listOf #gt; inner function 1"])
  n2{"!Array.isArray(value)"}
  n3{"value.length #lt; minLength"}
  n4(["return bad(path, #96;a list with at least ${minLength} item(s)…<br/>calls bad"])
  n5(["return collect(value.map((entry, index) =#gt; item(entry, #96;${p…<br/>calls collect, item"])
  n1 --> n2
  n2 -->|"no"| n3
  n2 -->|"yes"| n4
  n3 -->|"yes"| n4
  n3 -->|"no"| n5
```

## collect

```mermaid
flowchart TD
  n1(["collect"])
  n2["const errors = results.flatMap((result) =#gt; (result.ok ? [] …"]
  n3{"errors.length #gt; 0"}
  n4(["return { ok: false, errors };"])
  n5(["return good(results.flatMap((result) =#gt; (result.ok ? [resul…<br/>calls good"])
  n1 --> n2
  n2 --> n3
  n3 -->|"yes"| n4
  n3 -->|"no"| n5
```

## collect > inner function 1

```mermaid
flowchart TD
  n1(["collect #gt; inner function 1"])
  n2{"result.ok"}
  n3["[]"]
  n4["result.errors"]
  n5(["return (result.ok ? [] : result.errors)"])
  n1 --> n2
  n2 -->|"yes"| n3
  n2 -->|"no"| n4
  n3 --> n5
  n4 --> n5
```

## collect > inner function 2

```mermaid
flowchart TD
  n1(["collect #gt; inner function 2"])
  n2{"result.ok"}
  n3["[result.value]"]
  n4["[]"]
  n5(["return (result.ok ? [result.value] : [])"])
  n1 --> n2
  n2 -->|"yes"| n3
  n2 -->|"no"| n4
  n3 --> n5
  n4 --> n5
```

## isPlainObject

```mermaid
flowchart TD
  n1(["isPlainObject"])
  n2{"typeof value === #quot;object#quot;"}
  n3{"value !== null"}
  n4["!Array.isArray(value)"]
  n5(["return typeof value === #quot;object#quot; && value !== null && !Arra…"])
  n1 --> n2
  n2 -->|"yes"| n3
  n3 -->|"yes"| n4
  n2 -->|"no"| n5
  n3 -->|"no"| n5
  n4 --> n5
```

## unknownKeyErrors

```mermaid
flowchart TD
  n1(["unknownKeyErrors"])
  n2["const known = Object.keys(shape).join(#quot;, #quot;);"]
  n3(["return Object.keys(value) .filter((key) =#gt; !(key in shape))…<br/>calls join"])
  n1 --> n2
  n2 --> n3
```

## join

```mermaid
flowchart TD
  n1(["join"])
  n2{"path === #quot;#quot;"}
  n3["key"]
  n4["#96;${path}.${key}#96;"]
  n5(["return path === #quot;#quot; ? key : #96;${path}.${key}#96;;"])
  n1 --> n2
  n2 -->|"yes"| n3
  n2 -->|"no"| n4
  n3 --> n5
  n4 --> n5
```

## object

```mermaid
flowchart TD
  n1(["object"])
  n2(["return (value, path) =#gt; { if (!isPlainObject(value)) return…"])
  n1 --> n2
```

## object > inner function 1

```mermaid
flowchart TD
  n1(["object #gt; inner function 1"])
  n2{"!isPlainObject(value)<br/>calls isPlainObject"}
  n3{"path === #quot;#quot;"}
  n4["#quot;the file#quot;"]
  n5["path"]
  n6(["return bad(path === #quot;#quot; ? #quot;the file#quot; : path, #quot;an object { … …<br/>calls bad"])
  n7["const results = Object.entries(shape).map(([key, parser]) =…<br/>calls parser, join"]
  n8["const errors = [ ...unknownKeyErrors(value, shape, path), .…<br/>calls unknownKeyErrors"]
  n9{"errors.length #gt; 0"}
  n10(["return { ok: false, errors };"])
  n11["const entries = results.flatMap(({ key, result }) =#gt; (resul…"]
  n12(["return good(Object.fromEntries(entries) as Fields#lt;S#gt;);<br/>calls good"])
  n1 --> n2
  n2 -->|"yes"| n3
  n3 -->|"yes"| n4
  n3 -->|"no"| n5
  n4 --> n6
  n5 --> n6
  n2 -->|"no"| n7
  n7 --> n8
  n8 --> n9
  n9 -->|"yes"| n10
  n9 -->|"no"| n11
  n11 --> n12
```

## object > inner function 1 > inner function 1

```mermaid
flowchart TD
  n1(["object #gt; inner function 1 #gt; inner function 1"])
  n2{"result.ok"}
  n3["[]"]
  n4["result.errors"]
  n5(["return (result.ok ? [] : result.errors)"])
  n1 --> n2
  n2 -->|"yes"| n3
  n2 -->|"no"| n4
  n3 --> n5
  n4 --> n5
```

## object > inner function 1 > inner function 2

```mermaid
flowchart TD
  n1(["object #gt; inner function 1 #gt; inner function 2"])
  n2{"result.ok"}
  n3["[[key, result.value]]"]
  n4["[]"]
  n5(["return (result.ok ? [[key, result.value]] : [])"])
  n1 --> n2
  n2 -->|"yes"| n3
  n2 -->|"no"| n4
  n3 --> n5
  n4 --> n5
```

## refine

```mermaid
flowchart TD
  n1(["refine"])
  n2(["return (value, path) =#gt; { const parsed = parser(value, path…"])
  n1 --> n2
```

## refine > inner function 1

```mermaid
flowchart TD
  n1(["refine #gt; inner function 1"])
  n2["const parsed = parser(value, path);<br/>calls parser"]
  n3{"!parsed.ok"}
  n4(["return parsed;"])
  n5["const found = problem(parsed.value);<br/>calls problem"]
  n6{"found === undefined"}
  n7["parsed"]
  n8{"path === #quot;#quot;"}
  n9["#quot;the file#quot;"]
  n10["path"]
  n11(["return found === undefined ? parsed : { ok: false, errors: …"])
  n1 --> n2
  n2 --> n3
  n3 -->|"yes"| n4
  n3 -->|"no"| n5
  n5 --> n6
  n6 -->|"yes"| n7
  n6 -->|"no"| n8
  n8 -->|"yes"| n9
  n8 -->|"no"| n10
  n7 --> n11
  n9 --> n11
  n10 --> n11
```

## shortId

```mermaid
flowchart TD
  n1(["shortId"])
  n2(["return textMatching(/^[a-z][a-z0-9-]*$/, #quot;a short lower-cas…<br/>calls textMatching"])
  n1 --> n2
```
