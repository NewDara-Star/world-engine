// Finds the decisions in force that share a tag with what the orchestrator is
// about to do, or are worded close to it (scope 004, item 4). It only finds
// candidates; a person judges whether they really clash. Designs:
// docs/designs/tools/decisions/clash.md.
//
// Words are reduced to their stem with the Porter stemmer from the npm package
// `stemmer` 2.0.1 (MIT, github.com/words/stemmer; algorithm: M. F. Porter, "An
// algorithm for suffix stripping", Program 14(3), 1980), credited in
// research/36-porter-stemmer.md. The thresholds and the list of common words
// are the delegated approver's choices of 2026-10-11, written in the design.
import { stemmer } from "stemmer";
import type { Decision } from "./log.js";

export type Strength = "both" | "tags only" | "words only";

export interface Match {
  entry: Decision;
  sharedTags: string[];
  sharedWords: string[];
  strength: Strength;
}

// Dropping "never" and "only" is deliberate: "always push" and "never push"
// must match each other, because that is exactly the clash to find.
const COMMON_WORDS = new Set(
  "the and every must for with not are but from that this into only its any all each one was has have will can our his her their than then when what which who why how also else never may let use own new off per via before after about under plus".split(" "),
);
// Anything that is not a letter, a mark (an accent written as its own
// character) or a digit ends a word, so "Ọmọlé" and "café" stay whole.
const WORD_BREAK = /[^\p{L}\p{M}\p{N}]+/u;
// A word is kept when it has three characters or more, or holds a digit
// (so "3d" and "8" count).
const KEPT_WORD = /\p{N}|^.{3,}$/u;
const CLOSE_WORDING = 2;
// Which strength a match has, by whether it shares a tag and whether it shares
// enough words. "false false" is never looked up: matchOf returns no match first.
const STRENGTH: Record<`${boolean} ${boolean}`, Strength> = {
  "true true": "both",
  "true false": "tags only",
  "false true": "words only",
  "false false": "words only",
};
const STRENGTH_ORDER: Record<Strength, number> = { both: 0, "tags only": 1, "words only": 2 };

// The design (clash.md, contentWords); string methods and Unicode property
// escapes are the ECMAScript standard's.
export function contentWords(text: string): Set<string> {
  const lower = text.toLowerCase();
  const words = lower.split(WORD_BREAK);
  const kept = words.filter((word) => !COMMON_WORDS.has(word)).filter((word) => KEPT_WORD.test(word));
  const stems = kept.map((word) => stemmer(word));
  return new Set(stems);
}

// The design (clash.md, matchOf): a shared tag, or at least CLOSE_WORDING
// shared words with the entry's Decision line (never its Why).
export function matchOf(entry: Decision, queryWords: ReadonlySet<string>, queryTags: readonly string[]): Match | undefined {
  const sharedTags = queryTags.filter((tag) => entry.tags.includes(tag));
  const entryWords = contentWords(entry.decision);
  const sharedWords = [...queryWords].filter((word) => entryWords.has(word));
  const closeWording = sharedWords.length >= CLOSE_WORDING;
  if (sharedTags.length === 0 && !closeWording) return undefined;
  return { entry, sharedTags, sharedWords, strength: STRENGTH[`${sharedTags.length > 0} ${closeWording}` as const] };
}

// The design (clash.md, findClashes). Returns undefined, not an empty list,
// when there is nothing to match against, so the caller never reports "no
// clash" for a check that compared nothing. The order comes from three stable
// sorts, the least important key first, so the last sort decides and the
// earlier ones break its ties (Array.prototype.sort is stable, ECMAScript 2019).
export function findClashes(entries: readonly Decision[], text: string, tags: readonly string[]): Match[] | undefined {
  const queryTags = tags.map((tag) => tag.trim().toLowerCase()).filter((tag) => tag !== "");
  const queryWords = contentWords(text);
  if (queryWords.size === 0 && queryTags.length === 0) return undefined;
  const matches = entries.map((entry) => matchOf(entry, queryWords, queryTags)).filter((match) => match !== undefined);
  return matches
    .sort((first, second) => second.entry.id.localeCompare(first.entry.id))
    .sort((first, second) => second.entry.date.localeCompare(first.entry.date))
    .sort((first, second) => STRENGTH_ORDER[first.strength] - STRENGTH_ORDER[second.strength]);
}
