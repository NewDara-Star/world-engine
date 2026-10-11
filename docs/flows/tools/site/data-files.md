# tools/site/data-files.ts

Drawn from the code by `npm run diagrams` (TypeScript compiler, no AI). Do not edit by hand: change the code, then run it again.

## isShippedDataFile

```mermaid
flowchart TD
  n1(["isShippedDataFile"])
  n2{"path === #quot;start.json#quot;"}
  n3(["return true;"])
  n4{"TOP_DATA_FILE.test(path)"}
  n5(["return true;"])
  n6(["return MAP_FILE.test(path);"])
  n1 --> n2
  n2 -->|"yes"| n3
  n2 -->|"no"| n4
  n4 -->|"yes"| n5
  n4 -->|"no"| n6
```
