# src/measure/measure.ts

Drawn from the code by `npm run diagrams` (TypeScript compiler, no AI). Do not edit by hand: change the code, then run it again.

## bytesBeforeDriving

```mermaid
flowchart TD
  n1(["bytesBeforeDriving"])
  n2["const before = entries.filter((entry) =#gt; entry.responseEnd …"]
  n3["const unsized = before.filter((entry) =#gt; entry.transferSize…"]
  n4(["return { bytesTransferred: before.reduce((sum, entry) =#gt; su…"])
  n1 --> n2
  n2 --> n3
  n3 --> n4
```

## askedSize

```mermaid
flowchart TD
  n1(["askedSize"])
  n2["try"]
  n3["const answer = await fetcher(url, { method: #quot;HEAD#quot;, cache: …<br/>calls fetcher"]
  n4{"answer.headers.get(#quot;Content-Length#quot;) is missing?"}
  n5["Number.NaN"]
  n6["const length = Number(answer.headers.get(#quot;Content-Length#quot;) …"]
  n7{"answer.ok"}
  n8{"Number.isInteger(length)"}
  n9{"length #gt; 0"}
  n10["length"]
  n11["undefined"]
  n12(["return answer.ok && Number.isInteger(length) && length #gt; 0 …"])
  n13["catch"]
  n14(["return undefined;"])
  n1 --> n2
  n2 --> n3
  n3 --> n4
  n4 -->|"yes"| n5
  n4 -->|"no"| n6
  n5 --> n6
  n6 --> n7
  n7 -->|"yes"| n8
  n8 -->|"yes"| n9
  n9 -->|"yes"| n10
  n7 -->|"no"| n11
  n8 -->|"no"| n11
  n9 -->|"no"| n11
  n10 --> n12
  n11 --> n12
  n2 -->|"throws"| n13
  n13 --> n14
```

## countedSize

```mermaid
flowchart TD
  n1(["countedSize"])
  n2["try"]
  n3["const answer = await fetcher(url, { method: #quot;GET#quot;, cache: #quot;…<br/>calls fetcher"]
  n4{"answer.ok"}
  n5["(await answer.arrayBuffer()).byteLength"]
  n6["undefined"]
  n7(["return answer.ok ? (await answer.arrayBuffer()).byteLength …"])
  n8["catch"]
  n9(["return undefined;"])
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

## serverSizeOf

```mermaid
flowchart TD
  n1(["serverSizeOf"])
  n2["const asked = await askedSize(url, fetcher);<br/>calls askedSize"]
  n3{"asked !== undefined"}
  n4(["return { method: #quot;asked#quot;, bytes: asked };"])
  n5["const counted = await countedSize(url, fetcher);<br/>calls countedSize"]
  n6{"counted === undefined"}
  n7["{ method: #quot;unknown#quot;, bytes: 0 }"]
  n8["{ method: #quot;counted#quot;, bytes: counted }"]
  n9(["return counted === undefined ? { method: #quot;unknown#quot;, bytes: …"])
  n1 --> n2
  n2 --> n3
  n3 -->|"yes"| n4
  n3 -->|"no"| n5
  n5 --> n6
  n6 -->|"yes"| n7
  n6 -->|"no"| n8
  n7 --> n9
  n8 --> n9
```

## serverSizes

```mermaid
flowchart TD
  n1(["serverSizes"])
  n2["const found: ServerSize[] = [];"]
  n3["let from = 0"]
  n4{"from #lt; urls.length"}
  n5["found.push(...(await Promise.all(urls.slice(from, from + AT…<br/>calls serverSizeOf"]
  n6["from += AT_ONCE"]
  n7["const asked = foundBy(found, #quot;asked#quot;);<br/>calls foundBy"]
  n8["const counted = foundBy(found, #quot;counted#quot;);<br/>calls foundBy"]
  n9(["return { askedFiles: asked.files, askedBytes: asked.bytes, …<br/>calls foundBy"])
  n1 --> n2
  n2 --> n3
  n3 --> n4
  n4 -->|"yes"| n5
  n5 --> n6
  n6 --> n4
  n4 -->|"no"| n7
  n7 --> n8
  n8 --> n9
```

## foundBy

```mermaid
flowchart TD
  n1(["foundBy"])
  n2["const these = found.filter((size) =#gt; size.method === method…"]
  n3(["return { files: these.length, bytes: these.reduce((sum, siz…"])
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

## megabytes

```mermaid
flowchart TD
  n1(["megabytes"])
  n2(["return #96;${(bytes / BYTES_IN_MB).toFixed(1)} MB#96;;"])
  n1 --> n2
```

## downloadLines

```mermaid
flowchart TD
  n1(["downloadLines"])
  n2["const unsized = bytes.unsizedUrls.length;"]
  n3["const sized = bytes.fileCount - unsized;"]
  n4{"unsized === 0"}
  n5(["return [#96;Downloaded before driving: ${megabytes(bytes.bytes…<br/>calls megabytes"])
  n6["const fromBrowser = #96;The browser gave sizes for ${sized} of…<br/>calls megabytes"]
  n7{"server === undefined"}
  n8(["return [#96;${fromBrowser}; asking the server for the other ${…"])
  n9["const total = bytes.bytesTransferred + server.askedBytes + …"]
  n10(["return [ #96;Downloaded before driving: about ${megabytes(tota…<br/>calls megabytes, serverLines"])
  n1 --> n2
  n2 --> n3
  n3 --> n4
  n4 -->|"yes"| n5
  n4 -->|"no"| n6
  n6 --> n7
  n7 -->|"yes"| n8
  n7 -->|"no"| n9
  n9 --> n10
```

## serverLines

```mermaid
flowchart TD
  n1(["serverLines"])
  n2["const lines: string[] = [];"]
  n3{"server.askedFiles #gt; 0"}
  n4["lines.push(#96;${server.askedFiles} files: size asked from the…<br/>calls megabytes"]
  n5{"server.countedFiles #gt; 0"}
  n6["lines.push(#96;${server.countedFiles} files: downloaded again …<br/>calls megabytes"]
  n7{"server.unknownFiles #gt; 0"}
  n8["lines.push(#96;${server.unknownFiles} files: no size could be …"]
  n9(["return lines;"])
  n1 --> n2
  n2 --> n3
  n3 -->|"yes"| n4
  n4 --> n5
  n3 -->|"no"| n5
  n5 -->|"yes"| n6
  n6 --> n7
  n5 -->|"no"| n7
  n7 -->|"yes"| n8
  n8 --> n9
  n7 -->|"no"| n9
```

## measureReportLines

```mermaid
flowchart TD
  n1(["measureReportLines"])
  n2["const lines = downloadLines(bytes, server);<br/>calls downloadLines"]
  n3{"bytes.cachedFileCount #gt; 0"}
  n4["lines.push(#96;${bytes.cachedFileCount} files came from the br…"]
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
