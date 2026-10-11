# src/controls/keyboard.ts

Drawn from the code by `npm run diagrams` (TypeScript compiler, no AI). Do not edit by hand: change the code, then run it again.

## keyboardActions

```mermaid
flowchart TD
  n1(["keyboardActions"])
  n2["const left = LEFT_KEYS.some((code) =#gt; held.has(code));"]
  n3["const right = RIGHT_KEYS.some((code) =#gt; held.has(code));"]
  n4(["return { steer: Number(right) - Number(left), accelerate: N…"])
  n1 --> n2
  n2 --> n3
  n3 --> n4
```

## listenToKeyboard

```mermaid
flowchart TD
  n1(["listenToKeyboard"])
  n2["const listening = new AbortController();"]
  n3["const options = { signal: listening.signal };"]
  n4["window.addEventListener(#quot;keydown#quot;, holdKey, options);"]
  n5["window.addEventListener(#quot;keyup#quot;, letGoOfKey, options);"]
  n6["window.addEventListener(#quot;blur#quot;, letGoOfAllKeys, options);"]
  n7["window.document.addEventListener(#quot;visibilitychange#quot;, letGoO…"]
  n8(["return () =#gt; listening.abort();"])
  n1 --> n2
  n2 --> n3
  n3 --> n4
  n4 --> n5
  n5 --> n6
  n6 --> n7
  n7 --> n8
```

## listenToKeyboard > holdKey

```mermaid
flowchart TD
  n1(["listenToKeyboard #gt; holdKey"])
  n2{"!DRIVING_KEYS.has(event.code)"}
  n3{"event.ctrlKey"}
  n4{"event.metaKey"}
  n5{"event.altKey"}
  n6(["return;"])
  n7["event.preventDefault();"]
  n8["held.add(event.code);"]
  n9(["end"])
  n1 --> n2
  n2 -->|"no"| n3
  n3 -->|"no"| n4
  n4 -->|"no"| n5
  n2 -->|"yes"| n6
  n3 -->|"yes"| n6
  n4 -->|"yes"| n6
  n5 -->|"yes"| n6
  n5 -->|"no"| n7
  n7 --> n8
  n8 --> n9
```

## listenToKeyboard > letGoOfKey

```mermaid
flowchart TD
  n1(["listenToKeyboard #gt; letGoOfKey"])
  n2["held.delete(event.code);"]
  n3(["end"])
  n1 --> n2
  n2 --> n3
```

## listenToKeyboard > letGoOfAllKeys

```mermaid
flowchart TD
  n1(["listenToKeyboard #gt; letGoOfAllKeys"])
  n2["held.clear();"]
  n3(["end"])
  n1 --> n2
  n2 --> n3
```
