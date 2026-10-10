# src/place/parse.ts

Status: draft. Waiting for the owner's approval; the approval commit changes this line to `Status: approved`.

The design for each function, written in plain words. The pictures drawn from the code are in `docs/flows/src/place/parse.md`.

## show

Turns any value into a short piece of text for an error message.

```mermaid
flowchart TD
  s(["show a value"])
  a["write the value as JSON text, or the word nothing if it cannot be written"]
  b{"is the text longer than the limit"}
  c["cut it and add an ellipsis"]
  d["keep it whole"]
  e(["return the text"])
  s --> a
  a --> b
  b -->|"yes"| c
  b -->|"no"| d
  c --> e
  d --> e
```

## good

Wraps a value as a success.

```mermaid
flowchart TD
  s(["good"])
  a(["return ok with the value"])
  s --> a
```

## bad

Builds a failure carrying one sentence: the path, what was wanted, what was got.

```mermaid
flowchart TD
  s(["bad"])
  a["show the value that was got"]
  b(["return failure with the sentence path must be wanted got value"])
  s --> a
  a --> b
```

## someText

Builds a checker for text that is not blank.

```mermaid
flowchart TD
  s(["someText"])
  a(["return the checker"])
  s --> a
```

## someText > inner function 1

The checker.

```mermaid
flowchart TD
  s(["check value"])
  a{"is it a string that is not blank"}
  b(["return good with the value"])
  c(["return bad wanted some text"])
  s --> a
  a -->|"yes"| b
  a -->|"no"| c
```

## textMatching

Builds a checker for text that matches a pattern.

```mermaid
flowchart TD
  s(["textMatching"])
  a(["return the checker"])
  s --> a
```

## textMatching > inner function 1

The checker.

```mermaid
flowchart TD
  s(["check value"])
  a{"is it a string that matches the pattern"}
  b(["return good with the value"])
  c(["return bad with the wanted words given by the caller"])
  s --> a
  a -->|"yes"| b
  a -->|"no"| c
```

## numberBetween

Builds a checker for a real number inside a range.

```mermaid
flowchart TD
  s(["numberBetween"])
  a(["return the checker"])
  s --> a
```

## numberBetween > inner function 1

The checker.

```mermaid
flowchart TD
  s(["check value"])
  a{"is it a number, finite, at least the minimum and at most the maximum"}
  b(["return good with the value"])
  c(["return bad wanted a number from min to max with its unit"])
  s --> a
  a -->|"yes"| b
  a -->|"no"| c
```

## oneOf

Builds a checker for one word out of a fixed list.

```mermaid
flowchart TD
  s(["oneOf"])
  a(["return the checker"])
  s --> a
```

## oneOf > isOption

Says whether a value is one of the allowed words.

```mermaid
flowchart TD
  s(["isOption"])
  a(["return true if any allowed word equals the value"])
  s --> a
```

## oneOf > inner function 1

The checker.

```mermaid
flowchart TD
  s(["check value"])
  a{"is it one of the allowed words"}
  b(["return good with the value"])
  c(["return bad wanted one of the quoted allowed words"])
  s --> a
  a -->|"yes"| b
  a -->|"no"| c
```

## listOf

Builds a checker for a list with at least a minimum number of items.

```mermaid
flowchart TD
  s(["listOf"])
  a(["return the checker"])
  s --> a
```

## listOf > inner function 1

The checker.

```mermaid
flowchart TD
  s(["check value"])
  a{"is it not a list, or shorter than the minimum"}
  b(["return bad wanted a list with at least that many items"])
  c["check every item, naming each by its place in the list"]
  d(["return collect of all the item results"])
  s --> a
  a -->|"yes"| b
  a -->|"no"| c
  c --> d
```

## collect

Joins the results of several checks into one.

```mermaid
flowchart TD
  s(["collect"])
  a["gather the errors of every failed result"]
  b{"is there any error"}
  c(["return failure with all the errors"])
  d(["return success with all the values"])
  s --> a
  a --> b
  b -->|"yes"| c
  b -->|"no"| d
```

## collect > inner function 1

Picks the errors out of one result.

```mermaid
flowchart TD
  s(["one result"])
  a{"did it fail"}
  b(["its errors"])
  c(["no errors"])
  s --> a
  a -->|"yes"| b
  a -->|"no"| c
```

## collect > inner function 2

Picks the value out of one result.

```mermaid
flowchart TD
  s(["one result"])
  a{"did it succeed"}
  b(["a list holding its value"])
  c(["an empty list"])
  s --> a
  a -->|"yes"| b
  a -->|"no"| c
```

## isPlainObject

Says whether a value is an object that is not null and not a list.

```mermaid
flowchart TD
  s(["isPlainObject"])
  a(["return true only for a real object, never null, never a list"])
  s --> a
```

## unknownKeyErrors

Lists every field in the value that the shape does not know.

```mermaid
flowchart TD
  s(["unknownKeyErrors"])
  a["take the keys of the value that are not in the shape"]
  b(["return one error for each, naming the field and the fields that are allowed"])
  s --> a
  a --> b
```

## join

Adds a field name to a path.

```mermaid
flowchart TD
  s(["join"])
  a{"is the path empty"}
  b(["return just the field name"])
  c(["return path dot field name"])
  s --> a
  a -->|"yes"| b
  a -->|"no"| c
```

## object

Builds a checker for an object with known fields.

```mermaid
flowchart TD
  s(["object"])
  a(["return the checker"])
  s --> a
```

## object > inner function 1

The checker.

```mermaid
flowchart TD
  s(["check value"])
  a{"is it not a plain object"}
  b(["return bad wanted an object, calling the top level the file"])
  c["check every field with its own checker, at its own path"]
  d["add an error for every field the shape does not know"]
  e{"is there any error, from unknown fields or from field checks"}
  f(["return failure with all the errors"])
  g(["return success with the object built from the field values"])
  s --> a
  a -->|"yes"| b
  a -->|"no"| c
  c --> d
  d --> e
  e -->|"yes"| f
  e -->|"no"| g
```

## object > inner function 1 > inner function 1

Picks the errors out of one field result.

```mermaid
flowchart TD
  s(["one field result"])
  a{"did it fail"}
  b(["its errors"])
  c(["no errors"])
  s --> a
  a -->|"yes"| b
  a -->|"no"| c
```

## object > inner function 1 > inner function 2

Picks the key and value out of one field result.

```mermaid
flowchart TD
  s(["one field result"])
  a{"did it succeed"}
  b(["the key with its value"])
  c(["nothing"])
  s --> a
  a -->|"yes"| b
  a -->|"no"| c
```

## refine

Builds a checker that also applies a rule spanning several fields.

```mermaid
flowchart TD
  s(["refine"])
  a(["return the checker"])
  s --> a
```

## refine > inner function 1

The checker.

```mermaid
flowchart TD
  s(["check value"])
  a["run the plain checker first"]
  b{"did it fail"}
  c(["return that failure unchanged"])
  d["ask the rule for a problem sentence"]
  e{"did the rule find a problem"}
  f(["return failure with the sentence, at the path or the file"])
  g(["return the plain result"])
  s --> a
  a --> b
  b -->|"yes"| c
  b -->|"no"| d
  d --> e
  e -->|"yes"| f
  e -->|"no"| g
```

## shortId

Builds a checker for a short lower-case name.

```mermaid
flowchart TD
  s(["shortId"])
  a(["return a pattern checker for letters, digits and dashes, starting with a letter"])
  s --> a
```
