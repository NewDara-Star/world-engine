# tools/decisions/clash.ts

Drawn from the code by `npm run diagrams` (TypeScript compiler, no AI). Do not edit by hand: change the code, then run it again.

## contentWords

```mermaid
flowchart TD
  n1(["contentWords"])
  n2["const lower = text.toLowerCase();"]
  n3["const words = lower.split(WORD_BREAK);"]
  n4["const kept = words.filter((word) =#gt; !COMMON_WORDS.has(word)…"]
  n5["const stems = kept.map((word) =#gt; stemmer(word));"]
  n6(["return new Set(stems);"])
  n1 --> n2
  n2 --> n3
  n3 --> n4
  n4 --> n5
  n5 --> n6
```

## matchOf

```mermaid
flowchart TD
  n1(["matchOf"])
  n2["const sharedTags = queryTags.filter((tag) =#gt; entry.tags.inc…"]
  n3["const entryWords = contentWords(entry.decision);<br/>calls contentWords"]
  n4["const sharedWords = [...queryWords].filter((word) =#gt; entryW…"]
  n5["const closeWording = sharedWords.length #gt;= CLOSE_WORDING;"]
  n6{"sharedTags.length === 0"}
  n7{"!closeWording"}
  n8(["return undefined;"])
  n9(["return { entry, sharedTags, sharedWords, strength: STRENGTH…"])
  n1 --> n2
  n2 --> n3
  n3 --> n4
  n4 --> n5
  n5 --> n6
  n6 -->|"yes"| n7
  n7 -->|"yes"| n8
  n6 -->|"no"| n9
  n7 -->|"no"| n9
```

## findClashes

```mermaid
flowchart TD
  n1(["findClashes"])
  n2["const queryTags = tags.map((tag) =#gt; tag.trim().toLowerCase(…"]
  n3["const queryWords = contentWords(text);<br/>calls contentWords"]
  n4{"queryWords.size === 0"}
  n5{"queryTags.length === 0"}
  n6(["return undefined;"])
  n7["const matches = entries.map((entry) =#gt; matchOf(entry, query…<br/>calls matchOf"]
  n8(["return matches .sort((first, second) =#gt; second.entry.id.loc…"])
  n1 --> n2
  n2 --> n3
  n3 --> n4
  n4 -->|"yes"| n5
  n5 -->|"yes"| n6
  n4 -->|"no"| n7
  n5 -->|"no"| n7
  n7 --> n8
```
