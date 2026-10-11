// Tests for tools/decisions/log.ts, written blind from the approved design
// docs/designs/tools/decisions/log.md (readDecisionLog, parseEntry,
// entriesInForce). parseEntry is reached through readDecisionLog, which is how
// the clash check uses it.
import { describe, expect, it } from "vitest";
import { entriesInForce, readDecisionLog } from "../../tools/decisions/log.js";
import { block, entry, goodFields, lineOf, logText, realLogText, without } from "./log-text.js";

type Problem = { line: number; message: string };

function problemLines(problems: readonly Problem[]): number[] {
  return problems.map((problem) => problem.line);
}

function problemAt(problems: readonly Problem[], line: number): Problem {
  const found = problems.find((problem) => problem.line === line);
  if (!found) throw new Error(`no problem at line ${line}; problems: ${JSON.stringify(problems)}`);
  return found;
}

// Every problem message at one line, joined, since one line may hold several.
function messagesAt(problems: readonly Problem[], line: number): string {
  return problems.filter((problem) => problem.line === line).map((problem) => problem.message).join("\n");
}

function ids(entries: readonly { id: string }[]): string[] {
  return entries.map((decision) => decision.id);
}

describe("decision log: happy path", () => {
  it("reads every entry of the real docs/DECISIONS.md with no problems", () => {
    const text = realLogText();
    const headings = text.split("\n").filter((line) => line.startsWith("## D-")).length;
    const log = readDecisionLog(text);
    expect(log.problems).toEqual([]);
    expect(log.entries).toHaveLength(headings);
    expect(headings).toBeGreaterThanOrEqual(35);
  });

  it("reads D-0022 from the real log: only the owner pushes, decided by the owner on 2026-10-10", () => {
    const log = readDecisionLog(realLogText());
    const pushes = log.entries.find((decision: { id: string }) => decision.id === "D-0022");
    expect(pushes).toEqual({
      id: "D-0022",
      date: "2026-10-10",
      decision: "Only the owner pushes; sessions never push.",
      why: "The owner keeps control of what reaches GitHub; the cloud sessions also have no push access.",
      decidedBy: "owner",
      tags: ["process"],
    });
  });

  it("keeps a value that itself holds a colon whole, as D-0015 does", () => {
    const log = readDecisionLog(realLogText());
    const review = log.entries.find((decision: { id: string }) => decision.id === "D-0015");
    expect(review?.decision.startsWith("Push review: three Sonnet lenses")).toBe(true);
  });

  it("keeps who decided as free text, as D-0030 does", () => {
    const log = readDecisionLog(realLogText());
    const meshy = log.entries.find((decision: { id: string }) => decision.id === "D-0030");
    expect(meshy?.decidedBy).toBe("owner (on the orchestrator's recommendation)");
  });

  it("reads the entries in log order with their Replaces", () => {
    const log = readDecisionLog(logText(entry("D-0001"), entry("D-0002", { Replaces: "D-0001" })));
    expect(log.problems).toEqual([]);
    expect(ids(log.entries)).toEqual(["D-0001", "D-0002"]);
    expect(log.entries[0]?.replaces).toBeUndefined();
    expect(log.entries[1]?.replaces).toBe("D-0001");
  });

  it("ignores the introduction, even lines that mention ids or look like fields", () => {
    const text = ["# Decisions", "- Date: not a date", "See D-0001 and Replaces: D-0099.", "", entry("D-0001")].join("\n");
    const log = readDecisionLog(text);
    expect(log.problems).toEqual([]);
    expect(ids(log.entries)).toEqual(["D-0001"]);
  });
});

describe("decision log: in force", () => {
  it("leaves out a decision the owner has replaced", () => {
    const log = readDecisionLog(logText(entry("D-0001"), entry("D-0002"), entry("D-0003", { Replaces: "D-0001" })));
    expect(ids(entriesInForce(log.entries))).toEqual(["D-0002", "D-0003"]);
  });

  it("leaves only the newest of a chain of replacements", () => {
    const log = readDecisionLog(
      logText(entry("D-0001"), entry("D-0002", { Replaces: "D-0001" }), entry("D-0003", { Replaces: "D-0002" })),
    );
    expect(ids(entriesInForce(log.entries))).toEqual(["D-0003"]);
  });

  it("keeps every entry when nothing is replaced", () => {
    const log = readDecisionLog(realLogText());
    expect(entriesInForce(log.entries)).toEqual(log.entries);
  });

  it("returns nothing for no entries", () => {
    expect(entriesInForce([])).toEqual([]);
  });
});

describe("decision log: sad path", () => {
  it("says a file with no decisions in it has none, instead of returning an empty log quietly", () => {
    for (const text of ["", "# Decisions\n\nNothing yet.\n"]) {
      const log = readDecisionLog(text);
      expect(log.entries).toEqual([]);
      expect(log.problems).toHaveLength(1);
      expect(log.problems[0]?.message).toMatch(/## D-/);
    }
  });

  it("reports a missing Why at the heading's line and drops the broken entry", () => {
    const text = logText(entry("D-0001"), block("## D-0002", without("Why")));
    const log = readDecisionLog(text);
    expect(ids(log.entries)).toEqual(["D-0001"]);
    expect(problemAt(log.problems, lineOf(text, "## D-0002")).message).toMatch(/Why/);
  });

  it("reports every missing field, not just the first", () => {
    const text = logText(block("## D-0001", { Date: "2026-10-10", Tags: "process" }));
    const log = readDecisionLog(text);
    const messages = messagesAt(log.problems, lineOf(text, "## D-0001"));
    expect(messages).toMatch(/Decision/);
    expect(messages).toMatch(/Why/);
    expect(messages).toMatch(/Decided by/);
    expect(problemLines(log.problems).every((line) => line === lineOf(text, "## D-0001"))).toBe(true);
  });

  it("reports a field left empty at the heading's line", () => {
    const text = logText(entry("D-0001", { Why: "   " }));
    const log = readDecisionLog(text);
    expect(log.entries).toEqual([]);
    expect(problemAt(log.problems, lineOf(text, "## D-0001")).message).toMatch(/Why/);
  });

  it("reports a date that is not written YYYY-MM-DD at the date's line", () => {
    for (const date of ["10/10/2026", "2026-1-5", "yesterday", "2026-10-10T09:00"]) {
      const text = logText(entry("D-0001", { Date: date }));
      const log = readDecisionLog(text);
      expect(log.entries).toEqual([]);
      expect(problemLines(log.problems)).toEqual([lineOf(text, "- Date:")]);
    }
  });

  it("reports a line in an entry that is not a field", () => {
    const text = logText(entry("D-0001").replace("- Why:", "Some loose words here\n- Why:"));
    const log = readDecisionLog(text);
    expect(log.entries).toEqual([]);
    expect(problemLines(log.problems)).toEqual([lineOf(text, "Some loose words")]);
  });

  it("reports a field it does not know, with no suggestion when none is close", () => {
    const text = logText(entry("D-0001", { Mood: "cheerful" }));
    const log = readDecisionLog(text);
    expect(problemAt(log.problems, lineOf(text, "- Mood:")).message).toMatch(/Mood/);
  });
});

describe("decision log: idiot-proof path", () => {
  it("suggests Tags for a field written Tag, and still reports Tags as missing", () => {
    const text = logText(block("## D-0001", { ...without("Tags"), Tag: "process" }));
    const log = readDecisionLog(text);
    expect(problemAt(log.problems, lineOf(text, "- Tag:")).message).toMatch(/Tags/);
    expect(problemAt(log.problems, lineOf(text, "## D-0001")).message).toMatch(/Tags/);
  });

  it("suggests Decided by for a field with the wrong capitals, decided By", () => {
    const text = logText(block("## D-0001", { ...without("Decided by"), "decided By": "owner" }));
    const log = readDecisionLog(text);
    expect(problemAt(log.problems, lineOf(text, "- decided By:")).message).toMatch(/Decided by/);
  });

  it("reports a field written twice at the second copy's line", () => {
    const text = logText(entry("D-0001").replace("- Tags: process", "- Tags: process\n- Tags: money"));
    const log = readDecisionLog(text);
    expect(log.entries).toEqual([]);
    expect(problemLines(log.problems)).toEqual([lineOf(text, "- Tags: money")]);
  });

  it("reports a Replaces written twice at the second copy's line", () => {
    const text = logText(entry("D-0001"), entry("D-0002"), entry("D-0003", { Replaces: "D-0001" }).replace("- Replaces: D-0001", "- Replaces: D-0001\n- Replaces: D-0002"));
    const log = readDecisionLog(text);
    expect(problemLines(log.problems)).toEqual([lineOf(text, "- Replaces: D-0002")]);
  });

  it("reports a heading that is not an id like ## D-0001, and still checks the rest of that entry", () => {
    const text = logText(block("## D-12", { ...without("Why"), Date: "12 October" }));
    const log = readDecisionLog(text);
    const heading = lineOf(text, "## D-12");
    expect(log.entries).toEqual([]);
    expect(problemLines(log.problems)).toContain(heading);
    expect(problemLines(log.problems)).toContain(lineOf(text, "- Date:"));
    expect(messagesAt(log.problems, heading)).toMatch(/Why/);
  });

  it("allows spaces after the id in a heading", () => {
    const log = readDecisionLog(logText(block("## D-0001   ", goodFields)));
    expect(log.problems).toEqual([]);
    expect(ids(log.entries)).toEqual(["D-0001"]);
  });

  it("reports a Replaces that does not name one id like D-0001", () => {
    for (const replaces of ["D-1", "0001", "D-0001, D-0002", "the old one"]) {
      const text = logText(entry("D-0001"), entry("D-0002"), entry("D-0003", { Replaces: replaces }));
      const log = readDecisionLog(text);
      expect(problemLines(log.problems)).toEqual([lineOf(text, "- Replaces:")]);
    }
  });

  it("reads tags trimmed, in lower case, with empty ones dropped", () => {
    const log = readDecisionLog(logText(entry("D-0001", { Tags: " Money ,  SERVER,, cheating ," })));
    expect(log.problems).toEqual([]);
    expect(log.entries[0]?.tags).toEqual(["money", "server", "cheating"]);
  });

  it("reports Tags that hold only commas: at least one tag is needed", () => {
    const text = logText(entry("D-0001", { Tags: " , ," }));
    const log = readDecisionLog(text);
    expect(log.entries).toEqual([]);
    expect(problemLines(log.problems)).toEqual([lineOf(text, "- Tags:")]);
  });

  it("reports an id used twice, naming both lines", () => {
    const text = logText(entry("D-0001"), entry("D-0001", { Decision: "Something else entirely." }));
    const first = lineOf(text, "## D-0001");
    const second = lineOf(text, "## D-0001", first);
    const log = readDecisionLog(text);
    expect(log.problems).toHaveLength(1);
    expect(log.problems[0]?.message).toContain(String(first));
    expect(log.problems[0]?.message).toContain(String(second));
  });

  it("reports a Replaces naming an id that is not in the log, the entry itself, or a later entry, each told apart", () => {
    const missing = logText(entry("D-0001"), entry("D-0002", { Replaces: "D-0099" }));
    const itself = logText(entry("D-0001"), entry("D-0002", { Replaces: "D-0002" }));
    const later = logText(entry("D-0001", { Replaces: "D-0002" }), entry("D-0002"));
    const messages = [missing, itself, later].map((text) => {
      const log = readDecisionLog(text);
      expect(problemLines(log.problems)).toEqual([lineOf(text, "- Replaces:")]);
      return log.problems[0]?.message ?? "";
    });
    expect(messages[0]).toContain("D-0099");
    expect(messages[1]).toContain("D-0002");
    expect(messages[2]).toContain("D-0002");
    expect(new Set(messages).size).toBe(3);
  });

  it("lists the problems of the whole file in line order", () => {
    const text = logText(
      entry("D-0001", { Date: "soon" }),
      entry("D-0002", { Mood: "fine" }),
      entry("D-0003", { Tags: "," }),
    );
    const lines = problemLines(readDecisionLog(text).problems);
    expect(lines).toHaveLength(3);
    expect(lines).toEqual([...lines].sort((a, b) => a - b));
  });
});

describe("decision log: tragedy path", () => {
  it("reads a file saved with a byte-order mark and Windows line ends the same, with the same line numbers", () => {
    const plain = logText(entry("D-0001"), entry("D-0002", { Date: "someday" }));
    const windows = "﻿" + plain.replaceAll("\n", "\r\n");
    const fromPlain = readDecisionLog(plain);
    const fromWindows = readDecisionLog(windows);
    expect(fromWindows.entries).toEqual(fromPlain.entries);
    expect(fromWindows.problems).toEqual(fromPlain.problems);
    expect(fromWindows.entries[0]?.decision).toBe(goodFields.Decision);
  });

  it("reads the real log the same with Windows line ends", () => {
    const plain = readDecisionLog(realLogText());
    const windows = readDecisionLog(realLogText().replaceAll("\n", "\r\n"));
    expect(windows).toEqual(plain);
  });

  it("checks the calendar: 29 February only in a leap year, no month 13, no 31 November", () => {
    const dateProblems = (date: string) => readDecisionLog(logText(entry("D-0001", { Date: date }))).problems.length;
    expect(dateProblems("2028-02-29")).toBe(0);
    expect(dateProblems("2099-12-31")).toBe(0);
    expect(dateProblems("2027-02-29")).toBe(1);
    expect(dateProblems("2026-13-01")).toBe(1);
    expect(dateProblems("2026-11-31")).toBe(1);
    expect(dateProblems("2026-00-10")).toBe(1);
  });

  it("reads a log thousands of entries long in time that grows with its size, not faster", () => {
    const bigLog = (count: number) =>
      logText(...Array.from({ length: count }, (_, at) => entry(`D-${String(at + 1).padStart(4, "0")}`)));
    const timed = (text: string) => {
      const runs = [0, 1, 2].map(() => {
        const started = performance.now();
        readDecisionLog(text);
        return performance.now() - started;
      });
      return runs.sort((a, b) => a - b)[1] ?? 0;
    };
    const small = bigLog(1_000);
    const large = bigLog(8_000);
    timed(small);
    const smallTime = timed(small);
    const largeTime = timed(large);
    expect(readDecisionLog(large).entries).toHaveLength(8_000);
    // Eight times the entries; a straight read takes about eight times as
    // long, a read that compares every entry with every other takes sixty-four.
    expect(largeTime).toBeLessThan(Math.max(smallTime, 1) * 24);
    expect(largeTime).toBeLessThan(10_000);
  });
});
