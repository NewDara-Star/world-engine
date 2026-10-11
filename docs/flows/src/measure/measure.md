# src/measure/measure.ts

Drawn from the code by `npm run diagrams` (TypeScript compiler, no AI). Do not edit by hand: change the code, then run it again.

## bytesBeforeDriving

```mermaid
flowchart TD
  n1(["bytesBeforeDriving"])
  n2["const before = [page, ...files].filter((entry) =#gt; entry.res…"]
  n3(["return { bytesTransferred: before.reduce((sum, entry) =#gt; su…"])
  n1 --> n2
  n2 --> n3
```

## percentileOf

```mermaid
flowchart TD
  n1(["percentileOf"])
  n2{"sorted.length === 0"}
  n3(["return undefined;"])
  n4(["return sorted[Math.max(1, Math.ceil(fraction * sorted.lengt…"])
  n1 --> n2
  n2 -->|"yes"| n3
  n2 -->|"no"| n4
```

## frameRateSummary

```mermaid
flowchart TD
  n1(["frameRateSummary"])
  n2{"lengthsMs.length === 0"}
  n3(["return undefined;"])
  n4["const sorted = lengthsMs.toSorted((a, b) =#gt; a - b);"]
  n5{"percentileOf(sorted, 0.5) is missing?<br/>calls percentileOf"}
  n6["Number.NaN"]
  n7{"percentileOf(sorted, 0.95) is missing?<br/>calls percentileOf"}
  n8["Number.NaN"]
  n9(["return { medianFps: 1000 / (percentileOf(sorted, 0.5) ?? Nu…<br/>calls percentileOf"])
  n1 --> n2
  n2 -->|"yes"| n3
  n2 -->|"no"| n4
  n4 --> n5
  n5 -->|"yes"| n6
  n5 -->|"no"| n7
  n6 --> n7
  n7 -->|"yes"| n8
  n7 -->|"no"| n9
  n8 --> n9
```

## recordFrame

```mermaid
flowchart TD
  n1(["recordFrame"])
  n2{"recorder.drivableAtMs === undefined"}
  n3{"recorder.finished"}
  n4(["return;"])
  n5["recorder.lengthsMs.push(lengthMs);"]
  n6["recorder.collectedS += lengthMs / 1000;"]
  n7{"recorder.collectedS #gt;= MEASURE_FOR_S"}
  n8["recorder.finished = true;"]
  n9(["end"])
  n1 --> n2
  n2 -->|"no"| n3
  n2 -->|"yes"| n4
  n3 -->|"yes"| n4
  n3 -->|"no"| n5
  n5 --> n6
  n6 --> n7
  n7 -->|"yes"| n8
  n8 --> n9
  n7 -->|"no"| n9
```

## measureReportLines

```mermaid
flowchart TD
  n1(["measureReportLines"])
  n2["const lines = [ #96;Downloaded before driving: ${(bytes.bytesT…"]
  n3{"bytes.cachedFileCount #gt; 0"}
  n4["lines.push(#96;${bytes.cachedFileCount} files came from the ca…"]
  n5{"frames === undefined"}
  n6(["return [...lines, #quot;Frame rate: still measuring; keep drivin…"])
  n7(["return [ ...lines, #96;Frame rate: ${frames.medianFps.toFixed(…"])
  n1 --> n2
  n2 --> n3
  n3 -->|"yes"| n4
  n4 --> n5
  n3 -->|"no"| n5
  n5 -->|"yes"| n6
  n5 -->|"no"| n7
```
