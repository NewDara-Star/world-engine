# src/place/json-text.ts

Status: approved. Judged by the delegated approver (docs/roles/approver.md, rounds in docs/reviews/002b/), with the owner's decisions of 2026-10-11.

New in scope 002b (item 2d). Reads the raw text of a place or vehicle file once, with jsonc-parser 3.3.1 (MIT, see `research/33-json-lines.md`), and keeps where every field sits so each message can name its line. The pictures drawn from the code will be in `docs/flows/src/place/json-text.md`.

Round 2 (after the approver's report): a byte-order mark, an empty file and a file nested too deeply are each handled; a line break is defined; every broken-JSON sentence is written out below; and a field written twice is reported, with every message pointing at the copy that is used. What jsonc-parser does in each case was run, not guessed: `research/33-json-lines.md`, "Round 2 measurements".

## readJsonText

Why the game needs it: a place-maker edits the file by hand, so a missing comma must come back as "line 7", not as a crash or a vague "bad file". A file the game can read must also pass here: the browser drops an invisible byte-order mark at the start of a file (Windows Notepad writes one), so we accept it too. Only "out of room" becomes the "nested too deeply" message; any other crash is a fault in our code and stays a crash, so it is seen and fixed.

```mermaid
flowchart TD
  s(["readJsonText with the file's text"])
  a["replace a byte-order mark at the very start, if there is one, with a space: the reader refuses the mark, and a space keeps every place in the text where it was, so lines still count right"]
  b{"is the text empty, or only spaces, tabs and line breaks"}
  c(["return not read, kind: empty, at the start of the file"])
  d["read the text into a tree with jsonc-parser, strict: no comments, no trailing commas"]
  e{"did the reader run out of room, which happens when brackets are nested thousands deep"}
  f(["return not read, kind: nested too deeply, at the start of the file"])
  g{"did the reader report any syntax error, or make no tree at all"}
  h(["return not read, with the first error's kind and where in the text it is"])
  i["turn the tree into plain values; a field called __proto__ stays an ordinary field. A file that is just null does make a tree, so it is read, and the checker answers it: the file must be an object"]
  k{"did turning the tree into values run out of room"}
  j(["return read, with the tree and the values"])
  s --> a
  a --> b
  b -->|"yes"| c
  b -->|"no"| d
  d --> e
  e -->|"yes"| f
  e -->|"no"| g
  g -->|"yes"| h
  g -->|"no"| i
  i --> k
  k -->|"yes"| f
  k -->|"no"| j
```

## lineStartOffsets

Why the game needs it: finding a line must stay quick in a very large place file with many problems, so the line starts are listed once. A line break is what the place-maker's editor shows as one: CR then LF, `\r\n` (Windows), counts once, and LF `\n` alone (Mac, Linux) or CR `\r` alone (old Macs) count once each. Counting `\r` and `\n` separately would double every line number in a file saved on Windows. This is TypeScript's `computeLineStarts` (Apache-2.0, technique only), except that TypeScript also breaks lines at two rare Unicode characters (line separator and paragraph separator); we do not, because common editors keep those on the same line, and the line we name must be the line the place-maker sees.

```mermaid
flowchart TD
  s(["lineStartOffsets of the text"])
  a["the first line starts at the very beginning"]
  b{"for each character in the text"}
  c{"is it a carriage return, CR"}
  d{"is the next character a line feed, LF"}
  e["step over the LF too: CR then LF is one line break"]
  f["note that the next line starts after it"]
  g{"is it a line feed, LF"}
  h(["return the list of line starts"])
  s --> a
  a --> b
  b -->|"next character"| c
  c -->|"yes"| d
  d -->|"yes"| e
  d -->|"no"| f
  e --> f
  c -->|"no"| g
  g -->|"yes"| f
  g -->|"no"| b
  f --> b
  b -->|"done"| h
```

## lineAtOffset

Why the game needs it: turns a place in the text into the line number the place-maker sees in their editor, counting from 1.

```mermaid
flowchart TD
  s(["lineAtOffset with the line starts and a place in the text"])
  a["search the line starts by halving: find the last line that starts at or before that place"]
  b(["return its number, counting the first line as 1"])
  s --> a
  a --> b
```

## lineOfPath

Why the game needs it: every message points at the line of the field it is about; a missing field points at the line where its object starts. For a field written twice, it points at the copy whose value is used (the last), so the line named is the line the checker read.

```mermaid
flowchart TD
  s(["lineOfPath with the tree, the line starts and a field path"])
  a["find the part of the tree at that path with usedNodeAtPath"]
  b{"is there nothing at that path"}
  c["use the start of the whole file"]
  d{"is that part the value of a field"}
  e["use where the field's name starts"]
  f["use where that part starts, such as an item in a list"]
  g(["return lineAtOffset of that place"])
  s --> a
  a --> b
  b -->|"yes"| c
  b -->|"no"| d
  d -->|"yes"| e
  d -->|"no"| f
  c --> g
  e --> g
  f --> g
```

## usedNodeAtPath

Why the game needs it: when a field is written twice, the reader keeps the value of the last copy, so the line we name must be the last copy's too; otherwise a message about `98` would point at a line that says `9.8`. jsonc-parser's own `findNodeAtLocation` (MIT) finds the first copy; this is the same walk, technique only, taking the last.

```mermaid
flowchart TD
  s(["usedNodeAtPath with the tree and a field path"])
  a["start at the top of the tree, at the first step of the path"]
  b{"have we reached nothing"}
  n(["return nothing"])
  c{"is there a step of the path left"}
  r(["return the part reached"])
  d{"what kind of part, for what kind of step"}
  e["move to the value of the last field written with that name, the copy that is used, or to nothing if there is none; go to the next step"]
  g["move to the item at that position, or to nothing if the list is shorter; go to the next step"]
  s --> a
  a --> b
  b -->|"yes"| n
  b -->|"no"| c
  c -->|"no"| r
  c -->|"yes"| d
  d -->|"an object, and a field name"| e
  d -->|"a list, and a position"| g
  d -->|"anything else"| n
  e --> b
  g --> b
```

## problemsForRepeatedFields

Why the game needs it: a field written twice (`"gravityMs2": 9.8` near the top, `"gravityMs2": 98` further down) is read as the last one with no word said, so the place-maker would never know which number the game uses. Like two players wearing the same shirt number: we name both and ask them to keep one. It looks in every object, including objects inside lists.

```mermaid
flowchart TD
  s(["problemsForRepeatedFields in a part of the tree, at its field path, with the line starts"])
  a{"is the part an object"}
  b["group its fields by name, in the order they are written"]
  c["problemForRepeatedField for every name written more than once"]
  d["for every name, problemsForRepeatedFields inside the copy that is used, the last one, at pathToField of the name"]
  e(["return all those problems"])
  f{"is the part a list"}
  g["problemsForRepeatedFields inside every item, at pathToField of its position"]
  h(["return no problems"])
  s --> a
  a -->|"yes"| b
  b --> c
  c --> d
  d --> e
  a -->|"no"| f
  f -->|"yes"| g
  g --> e
  f -->|"no"| h
```

## problemForRepeatedField

Why the game needs it: one plain sentence names every line the field is written on, so the place-maker can find each copy: "`gravityMs2` is written twice, on lines 9 and 31; keep one." The message itself is put on the line of the copy that is used (line 31 here), like every other message about that field.

```mermaid
flowchart TD
  s(["problemForRepeatedField with a field name, its copies, the object's path and the line starts"])
  a["find the line of each copy's name with lineAtOffset, each line named once, in order"]
  b{"are there exactly two copies"}
  c["the count in words: twice"]
  d["the count in words: the number, then times, such as 3 times"]
  e{"are all the copies on one line"}
  f["the sentence: labelForPath of pathToField of the name, is written, the count in words, on line, that line; keep one."]
  g["the sentence: labelForPath of pathToField of the name, is written, the count in words, on lines, the lines joined with commas and a final and; keep one."]
  h(["return problemAt pathToField of the name, with that sentence"])
  s --> a
  a --> b
  b -->|"yes"| c
  b -->|"no"| d
  c --> e
  d --> e
  e -->|"yes"| f
  e -->|"no"| g
  f --> h
  g --> h
```

## syntaxProblemInWords

Why the game needs it: the reader's error codes ("CommaExpected") mean nothing to a place-maker; each one becomes a plain sentence that says what to fix. The subject comes from `labelForPath`, the one place that calls the top of the file "the file" (item 2d), so these messages name it the same way as every other message.

```mermaid
flowchart TD
  s(["syntaxProblemInWords for an error kind"])
  a["the subject is labelForPath of the top of the file: the file"]
  b["look the kind up in the table of plain sentences below"]
  c{"is the kind in the table"}
  d(["return: the subject, then the table's words for that kind"])
  e(["return: the subject, then: is not valid JSON here."])
  s --> a
  a --> b
  b --> c
  c -->|"yes"| d
  c -->|"no"| e
```

### The table of broken-JSON sentences

For the owner to read once. Every row was tried on jsonc-parser 3.3.1 with our strict settings (`research/33-json-lines.md`, "Round 2 measurements"); "Line named" says which line the message points at, because the reader often notices a mistake only after it.

A message reads `yaba.json line 8:` and then the words in the last column, which follow "the file". For example:

> yaba.json line 8: the file is not valid JSON here: a comma is missing before this point, at the end of the line above or earlier on this line. A number that starts with 0, such as `01`, or a list opened with `[` and not closed with `]`, also causes this.

| Kind (the reader's code) | When it happens | Line named | The file … |
| --- | --- | --- | --- |
| CommaExpected | A comma left out between two fields or two items. Also `01`, and a list whose `]` is missing before a `}`. | The **next** field's line, not the line missing the comma. | is not valid JSON here: a comma is missing before this point, at the end of the line above or earlier on this line. A number that starts with 0, such as `01`, or a list opened with `[` and not closed with `]`, also causes this. |
| ColonExpected | `"name" "Yaba"`, with no colon. | That line. | is not valid JSON here: a colon `:` is missing between a field's name and its value. |
| PropertyNameExpected | A comma after the last field before `}`, or two commas in a row. | The line of the `}` (usually the line after the extra comma). | is not valid JSON here: a field name in double quotes is expected here. If a comma just before this has no field after it, take that comma away. |
| ValueExpected | A field with no value (`"gravityMs2": ,`), or a comma after the last item of a list. | That line, or the line of the `]`. | is not valid JSON here: a value is expected: a number, text in double quotes, `true`, `false`, `null`, a list in `[ ]` or an object in `{ }`. If a comma just before this has nothing after it, take that comma away. |
| InvalidSymbol | Single quotes `'Yaba'`; curly quotes “Yaba” (from Word or a phone); a name with no quotes; `True`; `NaN`; `+1`; `.5`; `0x10`; a stray letter. | That line. | is not valid JSON here: something here is not allowed in JSON. Names and text need straight double quotes, `"like this"`, not single quotes or curly “ ” quotes; `true`, `false` and `null` are written in lower case; a number is plain digits, such as `9.8` or `0.5`. |
| InvalidNumberFormat | A number the reader cannot turn into a value. We could not make this happen; it has a sentence so no code is ever shown. | That line. | is not valid JSON here: this number cannot be read; write it in plain digits, such as `9.8`. |
| UnexpectedEndOfNumber | `1.` or `1e`. | That line. | is not valid JSON here: this number stops too soon, such as `1.` or `1e`; finish it (`1.5`) or take off the last character (`1`). |
| UnexpectedEndOfString | Text with no closing `"`, or text that runs onto the next line. | The line where the text starts. | is not valid JSON here: text that starts here is never closed with a `"`. Text must start and end with a double quote on the same line. |
| InvalidCharacter | A tab or another invisible control character inside text, often pasted in. | That line. | is not valid JSON here: this text holds a tab or another invisible character that is not allowed between quote marks; delete it (write a tab as `\t` if you need one). |
| InvalidEscapeCharacter | A backslash followed by a letter JSON does not know, such as `"C:\places"`. | That line. | is not valid JSON here: a backslash `\` in this text is followed by a letter JSON does not know. To write a backslash itself, write two: `\\`. |
| InvalidUnicode | A broken `\u` code, such as `\u12G4`. | That line. | is not valid JSON here: a `\u` code in this text needs exactly four characters from 0 to 9 and a to f, such as `\u00e9`; or type the letter itself, such as `é`. |
| CloseBraceExpected | A `{` never closed with `}`. | The **last** line of the file, far from the open `{`. | is not valid JSON here: a `{` opened earlier is never closed with `}`. This is only noticed at the end of the file, so the missing `}` can be anywhere above; check that every `{` has its `}`. |
| CloseBracketExpected | A `[` never closed with `]`, at the end of the file. | The **last** line of the file. | is not valid JSON here: a list opened earlier with `[` is never closed with `]`. This is only noticed at the end of the file, so the missing `]` can be anywhere above; check that every `[` has its `]`. |
| EndOfFileExpected | Something after the last `}`: an extra `}`, or a second object. | The line where the extra part starts. | is not valid JSON here: the file should end before this. A file holds one object, from its first `{` to its matching `}`, and something comes after it, such as an extra `}` or a second object. |
| InvalidCommentToken | A comment, `// …` or `/* … */`. | That line. | is not valid JSON here: comments (`//` or `/* */`) are not allowed in this file; take the comment out. |
| UnexpectedEndOfComment | A `/*` comment never closed. With our strict reading the comment is refused first, so this should not appear; it has a sentence so no code is ever shown. | That line. | is not valid JSON here: a comment `/*` is never closed, and comments are not allowed in this file; take it out. |
| empty (ours) | The file is empty, or only spaces and blank lines. | Line 1. | is empty. A place or vehicle file starts with `{` and ends with `}`. |
| nested too deeply (ours) | Brackets inside brackets thousands deep, so the reader runs out of room (about 2,560 deep in Node 22; a browser may differ). | Line 1. | has brackets nested too deeply to read: thousands of `{` or `[` inside one another. A place or vehicle file needs only a few levels. |
| (any kind not in this table) | Only if a later jsonc-parser adds a new code. | Where the reader says. | is not valid JSON here. |

A byte-order mark at the start is no longer an error at all (see `readJsonText`), so it has no row.
