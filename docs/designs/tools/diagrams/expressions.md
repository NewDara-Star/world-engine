# tools/diagrams/expressions.ts

Status: draft. Waiting for the owner's approval; the approval commit changes this line to `Status: approved`.

The design for each function, written in plain words. The pictures drawn from the code are in `docs/flows/tools/diagrams/expressions.md`.

## step

One open arrow leaving a box, with an optional label.

```mermaid
flowchart TD
  s(["step"])
  a(["return a list with the one arrow"])
  s --> a
```

## drawBox

Draws a box for a piece of code and joins the open arrows to it.

```mermaid
flowchart TD
  s(["drawBox"])
  a["add a box whose text is the code, then the calls note"]
  b["join every open arrow to the box"]
  c(["return the one arrow leaving the box"])
  s --> a
  a --> b
  b --> c
```

## unwrap

Removes brackets round an expression.

```mermaid
flowchart TD
  s(["unwrap"])
  a{"is the expression in brackets"}
  b["unwrap what is inside"]
  c(["return the expression"])
  s --> a
  a -->|"yes"| b
  a -->|"no"| c
  b --> c
```

## splitGuard

Draws a && or a || as two questions.

```mermaid
flowchart TD
  s(["splitGuard"])
  a["draw the left side as a question"]
  b{"is it a &&"}
  c["the right side is asked only when the left was yes"]
  d(["yes if both yes, no if either no"])
  e["the right side is asked only when the left was no"]
  f(["yes if either yes, no if both no"])
  s --> a
  a --> b
  b -->|"yes"| c
  c --> d
  b -->|"no"| e
  e --> f
```

## isAndOr

Says whether an expression is a && or a ||.

```mermaid
flowchart TD
  s(["isAndOr"])
  a(["return true for those two operators only"])
  s --> a
```

## lowerCondition

Draws a condition as yes and no ways out.

```mermaid
flowchart TD
  s(["lowerCondition"])
  a["remove brackets"]
  b{"is it a && or a ||"}
  c(["split it into one question per side"])
  d["draw any decisions hidden inside the condition"]
  e["add one diamond with the condition text and the calls note"]
  f(["return the yes arrow and the no arrow of the diamond"])
  s --> a
  a --> b
  b -->|"yes"| c
  b -->|"no"| d
  d --> e
  e --> f
```

## drawBranch

Draws one side of a ternary or a guard.

```mermaid
flowchart TD
  s(["drawBranch"])
  a{"does the side contain a decision"}
  b(["draw the decisions inside it"])
  c(["draw one box for it"])
  s --> a
  a -->|"yes"| b
  a -->|"no"| c
```

## drawTernary

Draws a c ? x : y.

```mermaid
flowchart TD
  s(["drawTernary"])
  a["draw the condition as a question"]
  b["draw the yes side from the yes arrow"]
  c["draw the no side from the no arrow"]
  d(["return the ends of both sides"])
  s --> a
  a --> b
  b --> c
  c --> d
```

## drawMissingCheck

Draws a ?? b.

```mermaid
flowchart TD
  s(["drawMissingCheck"])
  a["draw any decisions inside the left side"]
  b["add a diamond asking whether the left side is missing"]
  c["draw the right side from the yes arrow"]
  d(["return the no arrow and the end of the right side"])
  s --> a
  a --> b
  b --> c
  c --> d
```

## drawAndOr

Draws a && or a || that is part of a value.

```mermaid
flowchart TD
  s(["drawAndOr"])
  a["draw the left side as a question"]
  b{"is it a &&"}
  c["the skipped way is the no arrow, the right side hangs on the yes arrow"]
  d["the skipped way is the yes arrow, the right side hangs on the no arrow"]
  e(["return the skipped way and the end of the right side"])
  s --> a
  a --> b
  b -->|"yes"| c
  b -->|"no"| d
  c --> e
  d --> e
```

## drawGuard

Draws a guard, choosing by its operator.

```mermaid
flowchart TD
  s(["drawGuard"])
  a{"is the operator ??"}
  b(["draw the missing check"])
  c(["draw the && or || as a value"])
  s --> a
  a -->|"yes"| b
  a -->|"no"| c
```

## drawInnerDecisions

Draws every decision hidden inside an expression, in the order the code runs them.

```mermaid
flowchart TD
  s(["drawInnerDecisions"])
  a{"is it a function, or has no decision inside"}
  b(["draw nothing, return the open arrows"])
  c{"is it in brackets"}
  d(["look inside the brackets"])
  e{"is it a ternary"}
  f(["draw the ternary"])
  g{"is it a guard"}
  h(["draw the guard"])
  i(["draw the decisions of each child in turn, passing the open arrows along"])
  s --> a
  a -->|"yes"| b
  a -->|"no"| c
  c -->|"yes"| d
  c -->|"no"| e
  e -->|"yes"| f
  e -->|"no"| g
  g -->|"yes"| h
  g -->|"no"| i
```

## drawInnerDecisions > inner function 1

Draws one child.

```mermaid
flowchart TD
  s(["child"])
  a(["draw the decisions of the child, from the arrows so far"])
  s --> a
```
