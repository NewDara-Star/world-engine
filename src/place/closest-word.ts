// Finds the word someone most likely meant, for "Did you mean `name`?" (scope
// 002b, 2b). Designs: docs/designs/src/place/closest-word.md.
//
// The distance is the optimal string alignment distance, the restricted form of
// Damerau–Levenshtein: the fewest single-letter inserts, deletes, replacements
// and swaps of two neighbouring letters that turn one word into the other, no
// part edited twice. Technique as in talisman 1.1.4,
// metrics/damerau-levenshtein.js (MIT, Guillaume Plique), whose header cites
// Wikipedia's "Damerau–Levenshtein distance"; original idea F. J. Damerau,
// "A technique for computer detection and correction of spelling errors",
// Communications of the ACM 7(3), 1964. Neither the Wikipedia page nor the
// paper could be opened from here (research/33-json-lines.md); the two worked
// examples there (nmae → name, rihgt → right, 1 each) are tested.
// Words are compared by UTF-16 code units, the way JavaScript indexes text.

// The table, row after row in one list: the cell at (row, column) is at
// row * width + column. Every cell is filled before it is read; Number() turns
// the "might be missing" the type cannot rule out into a plain number.
type Table = number[];

// The first row, and the first cell of each row, cost one per letter: turning
// a word into nothing deletes every letter.
export function editDistance(typed: string, known: string): number {
  const width = known.length + 1;
  const table: Table = Array.from({ length: width }, (_, column) => column);
  for (let row = 1; row <= typed.length; row++) {
    table.push(row);
    for (let column = 1; column <= known.length; column++) table.push(editCostAt(table, width, typed, known, row, column));
  }
  return Number(table[typed.length * width + known.length]);
}

// One cell: the cheapest of delete, insert and replace (free when the letters
// match), and a swap of the previous two letters at one more than the cell two
// back on both words.
function editCostAt(table: Table, width: number, typed: string, known: string, row: number, column: number): number {
  const at = row * width + column;
  const replaceCost = typed[row - 1] === known[column - 1] ? 0 : 1;
  const cheapest = Math.min(Number(table[at - width]) + 1, Number(table[at - 1]) + 1, Number(table[at - width - 1]) + replaceCost);
  const swapped = row > 1 && column > 1 && typed[row - 1] === known[column - 2] && typed[row - 2] === known[column - 1];
  if (swapped) return Math.min(cheapest, Number(table[at - 2 * width - 2]) + 1);
  return cheapest;
}

// A guess is only offered when it is very likely right: at most 2 slips, and at
// most a third of the word's length, rounded down (scope 002b, 2b), so a word
// of one or two letters such as `id` is never "corrected".
export function closeEnoughLimit(word: string): number {
  return Math.min(2, Math.floor(word.length / 3));
}

// Ties give no hint: a wrong hint is worse than none. A word whose length
// differs by more than its limit is skipped before measuring (the distance is
// never less than the difference in length), so a pasted paragraph never
// builds a huge table (approver round 2, F8).
export function closestWord(typed: string, known: readonly string[]): string | undefined {
  const kept: { word: string; distance: number }[] = [];
  for (const word of known) {
    if (Math.abs(word.length - typed.length) > closeEnoughLimit(word)) continue;
    const distance = editDistance(typed, word);
    if (distance <= closeEnoughLimit(word)) kept.push({ word, distance });
  }
  const smallest = Math.min(...kept.map((entry) => entry.distance));
  const closest = kept.filter((entry) => entry.distance === smallest);
  return closest.length === 1 ? closest[0]?.word : undefined;
}
