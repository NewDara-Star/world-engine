// `npm run decisions -- check "<text>" --tags a,b`: lists the decisions in
// force that share a tag or close wording with what the orchestrator is about
// to do (scope 004, item 4). It prints and nothing else; it never changes the
// log. Designs: docs/designs/tools/decisions/cli.md. Exit code 0 when the
// check ran, found or not; 1 when it could not run. Results go to stdout,
// problems and warnings to stderr.
// Plumbing: node:fs, node:path, node:url and process (Node.js 22 API).
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { stemmer } from "stemmer";
import { editDistance } from "../../src/place/closest-word.js";
import { findClashes, type Match } from "./clash.js";
import { entriesInForce, readDecisionLog, type Decision } from "./log.js";

type CheckArguments = { text: string; tags: string[] } | { problem: string };

interface UnknownTag {
  tag: string;
  closest: string | undefined;
}

// Found from this file's own folder, not from where the command was run.
const LOG_PATH = resolve(dirname(fileURLToPath(import.meta.url)), "../../docs/DECISIONS.md");
const USAGE = 'usage: npm run decisions -- check "<text in quotes>" [--tags a,b]';
const TEXT_PROBLEM: Record<`${boolean}`, string> = {
  false: "there is no text to check",
  true: "there is more than one text; put the text in quotes",
};
// A tag nobody uses is still named as the one meant when it is at most this
// many letter-changes from one in use (the design: edit distance ≤ 2).
const TAG_SUGGESTION_LIMIT = 2;
// Command-line words: --tags and --tags=..., an option that is not --tags,
// and a --tags with no tag after it.
const TAGS_OPTION = /^--tags(=|$)/;
const OTHER_OPTION = /^--(?!tags(=|$))/;
const EMPTY_TAGS = /^--tags=?[\s,]*$/;

// The design (cli.md, parseCheckArguments). "--tags money" is first joined
// into "--tags=money", so both spellings are read the same way after that; a
// --tags followed by nothing, or by another option, is left alone and
// refused as empty. Command-line words cannot hold a NUL character (POSIX
// execve), so NUL safely joins and splits them.
function parseCheckArguments(words: readonly string[]): CheckArguments {
  if (words[0] !== "check") return { problem: USAGE };
  const joined = words.slice(1).join("\0").replace(/(^|\0)--tags\0(?!--)/g, "$1--tags=").split("\0");
  const texts = joined.filter((word) => word !== "").filter((word) => !word.startsWith("--"));
  const tagOptions = joined.filter((word) => TAGS_OPTION.test(word));
  if (texts.length !== 1 || String(texts[0]).trim() === "") return { problem: `${TEXT_PROBLEM[`${texts.length > 1}` as const]}\n${USAGE}` };
  const optionProblems = [
    ...joined.filter((word) => OTHER_OPTION.test(word)).map((word) => `${word.split("=")[0]} is not an option this command knows`),
    ...tagOptions.slice(1).map(() => "--tags is given more than once; put every tag in one, like --tags money,server"),
    ...tagOptions.filter((word) => EMPTY_TAGS.test(word)).map(() => "--tags needs at least one tag after it, like --tags money,server"),
  ];
  if (optionProblems.length > 0) return { problem: `${optionProblems.join("\n")}\n${USAGE}` };
  const tags = tagOptions.flatMap((word) => word.replace(TAGS_OPTION, "").split(",")).map((tag) => tag.trim().toLowerCase()).filter((tag) => tag !== "");
  return { text: String(texts[0]), tags };
}

// The design (cli.md, unknownTags). Tags in use are listed alphabetically, so
// "the first alphabetically on a tie" is simply the first one found: a tag
// with the same Porter stem (stemmer 2.0.1, MIT) before any other, then any
// tag within the letter-change limit (editDistance, src/place/closest-word.ts).
function unknownTags(queryTags: readonly string[], entries: readonly Decision[]): UnknownTag[] {
  const inUse = [...new Set(entries.flatMap((entry) => entry.tags))].sort();
  return queryTags
    .filter((tag) => !inUse.includes(tag))
    .map((tag) => ({
      tag,
      closest: [...inUse.filter((used) => stemmer(used) === stemmer(tag)), ...inUse.filter((used) => editDistance(tag, used) <= TAG_SUGGESTION_LIMIT)][0],
    }));
}

// The design (cli.md, describeMatch). The words shown are stems, as compared
// (so "pays" shows as "pai"); a match always shares a tag or words, so the
// last line is never empty.
function describeMatch(match: Match): string[] {
  const { entry } = match;
  const lines = [`${entry.id} (${entry.date}, decided by ${entry.decidedBy}): ${entry.decision}`, `  Why: ${entry.why}`];
  if (entry.replaces !== undefined) lines.push(`  Replaces ${entry.replaces}.`);
  const matched = [...match.sharedTags.map((tag) => `tag ${tag}`), ...match.sharedWords.map((word) => `word ${word}`)];
  lines.push(`  Matched on: ${matched.join(", ")}`);
  return lines;
}

// The design (cli.md, main). Returns the exit code.
function main(words: readonly string[]): number {
  const parsed = parseCheckArguments(words);
  if ("problem" in parsed) {
    console.error(parsed.problem);
    return 1;
  }
  let logText: string;
  try {
    logText = readFileSync(LOG_PATH, "utf8");
  } catch {
    console.error(`the decision log was not found at ${LOG_PATH}`);
    return 1;
  }
  const log = readDecisionLog(logText);
  if (log.problems.length > 0) {
    console.error([...log.problems.map((problem) => `${LOG_PATH} line ${problem.line}: ${problem.message}`), "Fix the log first: a broken entry could hide a clash."].join("\n"));
    return 1;
  }
  unknownTags(parsed.tags, log.entries).forEach((unknown) =>
    console.error(`warning: no decision uses the tag ${unknown.tag}${[unknown.closest].filter((closest) => closest !== undefined).map((closest) => `; did you mean ${closest}?`).join("")}`),
  );
  const found = findClashes(entriesInForce(log.entries), parsed.text, parsed.tags);
  if (found === undefined) {
    console.error("The text has no words to compare (they are all short or common) and no tags were given, so nothing was checked. Add --tags or more words.");
    return 1;
  }
  if (found.length === 0) {
    console.log("No decision in force shares these tags or close wording.");
    return 0;
  }
  console.log(`Decisions in force to check against: ${found.length}\n`);
  console.log(found.map((match) => describeMatch(match).join("\n")).join("\n\n"));
  return 0;
}

process.exitCode = main(process.argv.slice(2));
