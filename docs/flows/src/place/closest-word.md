# src/place/closest-word.ts

Drawn from the code by `npm run diagrams` (TypeScript compiler, no AI). Do not edit by hand: change the code, then run it again.

## editDistance

```mermaid
flowchart TD
  n1(["editDistance"])
  n2["const width = known.length + 1;"]
  n3["const table: Table = Array.from({ length: width }, (_, colu…"]
  n4["let row = 1"]
  n5{"row #lt;= typed.length"}
  n6["table.push(row);"]
  n7["let column = 1"]
  n8{"column #lt;= known.length"}
  n9["table.push(editCostAt(table, width, typed, known, row, colu…<br/>calls editCostAt"]
  n10["column++"]
  n11["row++"]
  n12(["return Number(table[typed.length * width + known.length]);"])
  n1 --> n2
  n2 --> n3
  n3 --> n4
  n4 --> n5
  n5 -->|"yes"| n6
  n6 --> n7
  n7 --> n8
  n8 -->|"yes"| n9
  n9 --> n10
  n10 --> n8
  n8 -->|"no"| n11
  n11 --> n5
  n5 -->|"no"| n12
```

## editCostAt

```mermaid
flowchart TD
  n1(["editCostAt"])
  n2["const at = row * width + column;"]
  n3{"typed[row - 1] === known[column - 1]"}
  n4["0"]
  n5["1"]
  n6["const replaceCost = typed[row - 1] === known[column - 1] ? …"]
  n7["const cheapest = Math.min(Number(table[at - width]) + 1, Nu…"]
  n8{"row #gt; 1"}
  n9{"column #gt; 1"}
  n10{"typed[row - 1] === known[column - 2]"}
  n11["typed[row - 2] === known[column - 1]"]
  n12["const swapped = row #gt; 1 && column #gt; 1 && typed[row - 1] ===…"]
  n13{"swapped"}
  n14(["return Math.min(cheapest, Number(table[at - 2 * width - 2])…"])
  n15(["return cheapest;"])
  n1 --> n2
  n2 --> n3
  n3 -->|"yes"| n4
  n3 -->|"no"| n5
  n4 --> n6
  n5 --> n6
  n6 --> n7
  n7 --> n8
  n8 -->|"yes"| n9
  n9 -->|"yes"| n10
  n10 -->|"yes"| n11
  n8 -->|"no"| n12
  n9 -->|"no"| n12
  n10 -->|"no"| n12
  n11 --> n12
  n12 --> n13
  n13 -->|"yes"| n14
  n13 -->|"no"| n15
```

## closeEnoughLimit

```mermaid
flowchart TD
  n1(["closeEnoughLimit"])
  n2(["return Math.min(2, Math.floor(word.length / 3));"])
  n1 --> n2
```

## closestWord

```mermaid
flowchart TD
  n1(["closestWord"])
  n2["const kept: { word: string; distance: number }[] = [];"]
  n3{"for each const word of known"}
  n4{"Math.abs(word.length - typed.length) #gt; closeEnoughLimit(wor…<br/>calls closeEnoughLimit"}
  n5["continue"]
  n6["const distance = editDistance(typed, word);<br/>calls editDistance"]
  n7{"distance #lt;= closeEnoughLimit(word)<br/>calls closeEnoughLimit"}
  n8["kept.push({ word, distance });"]
  n9["const smallest = Math.min(...kept.map((entry) =#gt; entry.dist…"]
  n10["const closest = kept.filter((entry) =#gt; entry.distance === s…"]
  n11{"closest.length === 1"}
  n12["closest[0]?.word"]
  n13["undefined"]
  n14(["return closest.length === 1 ? closest[0]?.word : undefined;"])
  n1 --> n2
  n2 --> n3
  n3 -->|"next item"| n4
  n4 -->|"yes"| n5
  n4 -->|"no"| n6
  n6 --> n7
  n7 -->|"yes"| n8
  n8 --> n3
  n7 -->|"no"| n3
  n5 --> n3
  n3 -->|"done"| n9
  n9 --> n10
  n10 --> n11
  n11 -->|"yes"| n12
  n11 -->|"no"| n13
  n12 --> n14
  n13 --> n14
```
