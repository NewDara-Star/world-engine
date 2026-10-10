#!/bin/sh
# Sourced by compiler-gate.sh. Prints a file's modified time in seconds with
# nanoseconds, so an edit in the same second as the typecheck still counts as
# after it. `stat -c` is GNU (Linux); macOS/BSD stat spells it `stat -f %Fm`.
mtime() {
  stat -c %.9Y "$1" 2>/dev/null || stat -f %Fm "$1"
}
