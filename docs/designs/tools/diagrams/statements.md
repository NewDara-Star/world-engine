# tools/diagrams/statements.ts

Status: draft. Waiting for the owner's approval; the approval commit changes this line to `Status: approved`.

The design for each function, written in plain words. The pictures drawn from the code are in `docs/flows/tools/diagrams/statements.md`.

## typed

Lets a handler for one kind of statement be stored with the others.

```mermaid
flowchart TD
  s(["typed"])
  a(["return a handler that passes the node on as that kind"])
  s --> a
```

## drawStatements

Draws a list of statements one after another.

```mermaid
flowchart TD
  s(["drawStatements"])
  a["start with the open arrows given"]
  b["draw each statement from the arrows left by the one before"]
  c(["return the arrows left by the last one"])
  s --> a
  a --> b
  b --> c
```

## drawStatement

Draws one statement by its kind.

```mermaid
flowchart TD
  s(["drawStatement"])
  a{"is there a handler for this kind of statement"}
  b["use it"]
  c["draw it as a simple statement"]
  d(["return the open arrows it leaves"])
  s --> a
  a -->|"yes"| b
  a -->|"no"| c
  b --> d
  c --> d
```

## drawSimple

Draws a statement that has no branch of its own.

```mermaid
flowchart TD
  s(["drawSimple"])
  a["draw any decisions hidden inside it"]
  b["add one box with its code and the calls note"]
  c(["return the arrow leaving the box"])
  s --> a
  a --> b
  b --> c
```

## drawNothing

Draws nothing for things that run no code here, such as a nested function declaration.

```mermaid
flowchart TD
  s(["drawNothing"])
  a(["return the open arrows unchanged"])
  s --> a
```

## drawBlock

Draws a block of statements.

```mermaid
flowchart TD
  s(["drawBlock"])
  a(["draw its statements in order"])
  s --> a
```

## drawIf

Draws an if.

```mermaid
flowchart TD
  s(["drawIf"])
  a["draw the condition as yes and no ways"]
  b["draw the then part from the yes way"]
  c{"is there an else part"}
  d["draw it from the no way"]
  e["the no way itself carries on"]
  f(["return the ends of the then part and of the else part"])
  s --> a
  a --> b
  b --> c
  c -->|"yes"| d
  c -->|"no"| e
  d --> f
  e --> f
```

## drawExit

Draws a return or a throw.

```mermaid
flowchart TD
  s(["drawExit"])
  a{"does it have an expression"}
  b["draw the decisions inside it"]
  c["add a return box or a throw box with its code and the calls note"]
  d["join the open arrows to it"]
  e(["return no open arrows, the path ends here"])
  s --> a
  a -->|"yes"| b
  a -->|"no"| c
  b --> c
  c --> d
  d --> e
```

## openTarget

Opens a place that a break or continue can jump to.

```mermaid
flowchart TD
  s(["openTarget"])
  a["make the target with the labels waiting for it and whether it is a loop"]
  b["clear the waiting labels"]
  c["put the target on the stack"]
  d(["return it"])
  s --> a
  a --> b
  b --> c
  c --> d
```

## findTarget

Finds where a break or continue jumps to.

```mermaid
flowchart TD
  s(["findTarget"])
  a["keep the targets that fit"]
  b(["return the innermost of them, or nothing"])
  s --> a
  a --> b
```

## findTarget > inner function 1

Whether one target fits.

```mermaid
flowchart TD
  s(["target"])
  a{"is there no label"}
  b{"does it need a loop and this is not one"}
  c(["no"])
  d(["yes"])
  e(["yes if the target carries that label"])
  s --> a
  a -->|"yes"| b
  a -->|"no"| e
  b -->|"yes"| c
  b -->|"no"| d
```

## drawJump

Draws a break or continue.

```mermaid
flowchart TD
  s(["drawJump"])
  a["add a box saying break or continue, with the label if any"]
  b["join the open arrows to it"]
  c["find the target"]
  d{"is it a break"}
  e["hand the box to the target breaks"]
  f["hand the box to the target continues"]
  g(["return no open arrows"])
  s --> a
  a --> b
  b --> c
  c --> d
  d -->|"yes"| e
  d -->|"no"| f
  e --> g
  f --> g
```

## drawLabeled

Draws a statement that has a label.

```mermaid
flowchart TD
  s(["drawLabeled"])
  a["remember the label for the loop or switch that follows"]
  b["draw the statement"]
  c["forget any labels still waiting"]
  d(["return its open arrows"])
  s --> a
  a --> b
  b --> c
  c --> d
```

## drawLoopBody

Draws a loop body and sends its ends back to the top.

```mermaid
flowchart TD
  s(["drawLoopBody"])
  a["open a loop target"]
  b["draw the body"]
  c["close the target"]
  d["find the top of the loop"]
  e{"is there one"}
  f["join the end of the body and every continue back to it"]
  g(["return the arrows of the breaks"])
  s --> a
  a --> b
  b --> c
  c --> d
  d --> e
  e -->|"yes"| f
  e -->|"no"| g
  f --> g
```

## firstNodeSince

The first box added since a mark.

```mermaid
flowchart TD
  s(["firstNodeSince"])
  a(["return its id, or nothing"])
  s --> a
```

## drawWhile

Draws a while loop.

```mermaid
flowchart TD
  s(["drawWhile"])
  a["note how many boxes exist"]
  b["draw the condition as yes and no ways"]
  c["draw the body from the yes way, going back to the condition"]
  d(["return the no way and the breaks"])
  s --> a
  a --> b
  b --> c
  c --> d
```

## drawDoWhile

Draws a do while loop.

```mermaid
flowchart TD
  s(["drawDoWhile"])
  a["note how many boxes exist"]
  b["open a loop target and draw the body first"]
  c["draw the condition from the end of the body and every continue"]
  d["join the yes way back to the start of the body"]
  e(["return the no way and the breaks"])
  s --> a
  a --> b
  b --> c
  c --> d
  d --> e
```

## drawForEach

Draws a for of or for in loop.

```mermaid
flowchart TD
  s(["drawForEach"])
  a["add a diamond saying for each item of the list"]
  b["join the open arrows to it"]
  c["draw the body from its next item way, going back to the diamond"]
  d(["return its done way and the breaks"])
  s --> a
  a --> b
  b --> c
  c --> d
```

## drawForInit

Draws the first part of a for loop.

```mermaid
flowchart TD
  s(["drawForInit"])
  a{"is there an initialiser"}
  b["draw its decisions and one box"]
  c(["carry on with the open arrows unchanged"])
  s --> a
  a -->|"yes"| b
  a -->|"no"| c
```

## drawFor

Draws a for loop.

```mermaid
flowchart TD
  s(["drawFor"])
  a["draw the initialiser"]
  b["note how many boxes exist"]
  c{"is there a condition"}
  d["draw it as yes and no ways"]
  e["with no condition, the loop always goes on and has no no way"]
  f["open a loop target and draw the body from the yes way"]
  g{"is there an incrementor"}
  h["draw it from the end of the body and every continue"]
  i["the end of the body and every continue go straight back"]
  j["join back to the top of the loop"]
  k(["return the no way and the breaks"])
  s --> a
  a --> b
  b --> c
  c -->|"yes"| d
  c -->|"no"| e
  d --> f
  e --> f
  f --> g
  g -->|"yes"| h
  g -->|"no"| i
  h --> j
  i --> j
  j --> k
```

## caseLabel

The words on the arrow to one case of a switch.

```mermaid
flowchart TD
  s(["caseLabel"])
  a{"is it a case"}
  b(["return case and its value"])
  c(["return default"])
  s --> a
  a -->|"yes"| b
  a -->|"no"| c
```

## drawSwitch

Draws a switch.

```mermaid
flowchart TD
  s(["drawSwitch"])
  a["draw the decisions inside the switched value"]
  b["add a diamond for the switch"]
  c["open a switch target"]
  d["for each case, draw its statements from the diamond and from the case before it, which is how falling through works"]
  e["close the target"]
  f{"is there a default"}
  g["the end of the last case and every break leave the switch"]
  h["also add a way out saying no case matches"]
  i(["return the open arrows"])
  s --> a
  a --> b
  b --> c
  c --> d
  d --> e
  e --> f
  f -->|"yes"| g
  f -->|"no"| h
  g --> i
  h --> i
```

## drawTry

Draws a try with its catch and finally.

```mermaid
flowchart TD
  s(["drawTry"])
  a["add a box saying try"]
  b["draw the try block"]
  c{"is there a catch"}
  d["draw it from a throws arrow of the try box"]
  e["no catch"]
  f["join the ends of the try and of the catch"]
  g{"is there a finally"}
  h["draw the finally block from the joined ends"]
  i(["return the joined ends"])
  j(["return the ends of the finally"])
  s --> a
  a --> b
  b --> c
  c -->|"yes"| d
  c -->|"no"| e
  d --> f
  e --> f
  f --> g
  g -->|"yes"| h
  g -->|"no"| i
  h --> j
```

## drawCatch

Draws a catch.

```mermaid
flowchart TD
  s(["drawCatch"])
  a["add a box saying catch and the name of the error, if any"]
  b["join the open arrows to it"]
  c(["draw the catch block after it"])
  s --> a
  a --> b
  b --> c
```
