# tools/diagrams/functions.ts

Status: approved by Daramola in chat, 2026-10-10 (batch approval of the diagram tool's own designs; written after the code, see Scope 002).

The design for each function, written in plain words. The pictures drawn from the code are in `docs/flows/tools/diagrams/functions.md`.

## isFunctionNode

Says whether a node is any kind of function.

```mermaid
flowchart TD
  s(["isFunctionNode"])
  a(["true for declarations, expressions, arrows, methods, constructors, getters and setters"])
  s --> a
```

## propertyText

The text of a property name.

```mermaid
flowchart TD
  s(["propertyText"])
  a(["return the name as written"])
  s --> a
```

## ownerName

The name a function gets from where it is stored.

```mermaid
flowchart TD
  s(["ownerName"])
  a{"is the parent a variable with a plain name"}
  b(["return the variable name"])
  c{"is the parent an object property or class property"}
  d(["return the property name"])
  e(["return nothing, the function has no name"])
  s --> a
  a -->|"yes"| b
  a -->|"no"| c
  c -->|"yes"| d
  c -->|"no"| e
```

## classPrefix

The class name and a dot, for a member of a named class.

```mermaid
flowchart TD
  s(["classPrefix"])
  a{"is the owner a class with a name"}
  b(["return the class name and a dot"])
  c(["return empty text"])
  s --> a
  a -->|"yes"| b
  a -->|"no"| c
```

## memberName

The name of a method, getter or setter, with its class.

```mermaid
flowchart TD
  s(["memberName"])
  a(["return the class prefix followed by the member name"])
  s --> a
```

## expressionName

The name of a function expression or arrow.

```mermaid
flowchart TD
  s(["expressionName"])
  a{"does the function carry its own name"}
  b(["return it"])
  c(["return the name from where it is stored, or nothing"])
  s --> a
  a -->|"yes"| b
  a -->|"no"| c
```

## declaredName

The name the code itself gives a function, if it gives one.

```mermaid
flowchart TD
  s(["declaredName"])
  a{"is it a constructor"}
  b(["return the class prefix and constructor"])
  c{"is it a function declaration"}
  d(["return its name, or default"])
  e{"is it a function expression or an arrow"}
  f(["return the expression name"])
  g(["return the member name"])
  s --> a
  a -->|"yes"| b
  a -->|"no"| c
  c -->|"yes"| d
  c -->|"no"| e
  e -->|"yes"| f
  e -->|"no"| g
```

## anyInside

Asks whether any part of a piece of code passes a test, without going into functions.

```mermaid
flowchart TD
  s(["anyInside"])
  a{"does the node itself pass"}
  b(["return true"])
  c["ask each child that is not a function"]
  d{"did any child say yes"}
  e(["return true"])
  f(["return false"])
  s --> a
  a -->|"yes"| b
  a -->|"no"| c
  c --> d
  d -->|"yes"| e
  d -->|"no"| f
```

## anyInside > inner function 1

Asks one child.

```mermaid
flowchart TD
  s(["child"])
  a{"is it a function"}
  b(["skip it"])
  c{"does anything inside it pass"}
  d(["say yes"])
  e(["say nothing"])
  s --> a
  a -->|"yes"| b
  a -->|"no"| c
  c -->|"yes"| d
  c -->|"no"| e
```

## containsDecision

Says whether a piece of code has a decision in it.

```mermaid
flowchart TD
  s(["containsDecision"])
  a(["return whether anything inside, outside nested functions, is a decision"])
  s --> a
```

## isGuard

Says whether a node is a &&, || or ??.

```mermaid
flowchart TD
  s(["isGuard"])
  a(["true for a binary expression with one of those three operators"])
  s --> a
```

## isDecision

Says whether a node is a decision.

```mermaid
flowchart TD
  s(["isDecision"])
  a(["true for an if, a ternary, a switch, a loop, a try, or a guard"])
  s --> a
```

## hasOwnFlow

Says whether a function gets its own picture.

```mermaid
flowchart TD
  s(["hasOwnFlow"])
  a{"does it have no body"}
  b(["no"])
  c{"does it have a name"}
  d(["yes"])
  e{"is the body a block"}
  f(["yes"])
  g(["yes if the one-line body contains a decision, else no"])
  s --> a
  a -->|"yes"| b
  a -->|"no"| c
  c -->|"yes"| d
  c -->|"no"| e
  e -->|"yes"| f
  e -->|"no"| g
```

## uniqueName

Makes sure two functions never share a heading.

```mermaid
flowchart TD
  s(["uniqueName"])
  a["count how many times this name was wanted"]
  b{"is it the first time"}
  c(["return the name"])
  d(["return the name with the count in brackets"])
  s --> a
  a --> b
  b -->|"yes"| c
  b -->|"no"| d
```

## entryName

Chooses the heading for a function.

```mermaid
flowchart TD
  s(["entryName"])
  a{"does the code name it"}
  b{"is there a parent name"}
  c(["parent, then a greater-than sign, then its name, made unique"])
  d(["its name, made unique"])
  e["count one more nameless function in this parent"]
  f{"is there a parent name"}
  g(["parent, then inner function and the count, made unique"])
  h(["module, then inner function and the count, made unique"])
  s --> a
  a -->|"yes"| b
  a -->|"no"| e
  b -->|"yes"| c
  b -->|"no"| d
  e --> f
  f -->|"yes"| g
  f -->|"no"| h
```

## visit

Walks the code looking for functions with their own picture.

```mermaid
flowchart TD
  s(["visit"])
  a{"is it a function with its own picture and a body"}
  b["choose its name and record it"]
  c["visit its children under that name"]
  d["visit the children under the same parent name"]
  s --> a
  a -->|"yes"| b
  a -->|"no"| d
  b --> c
```

## listFunctions

Lists every function of a file in the order they appear.

```mermaid
flowchart TD
  s(["listFunctions"])
  a["walk the file"]
  b(["return the functions found"])
  s --> a
  a --> b
```
