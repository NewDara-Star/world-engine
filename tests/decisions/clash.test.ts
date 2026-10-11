// Tests for tools/decisions/clash.ts, written blind from the approved design
// docs/designs/tools/decisions/clash.md (contentWords, matchOf, findClashes).
// Entries come from readDecisionLog (docs/designs/tools/decisions/log.md), the
// way the clash check gets them.
import { describe, expect, it } from "vitest";
import { contentWords, findClashes, matchOf } from "../../tools/decisions/clash.js";
import { entriesInForce, readDecisionLog } from "../../tools/decisions/log.js";
import { entry, logText, realLogText } from "./log-text.js";

type Found = ReturnType<typeof findClashes>;

function listOf(found: Found) {
  if (!Array.isArray(found)) throw new Error("findClashes said there was nothing to match against");
  return found;
}

function words(text: string): string[] {
  return [...contentWords(text)].sort();
}

function entriesOf(text: string) {
  const log = readDecisionLog(text);
  expect(log.problems).toEqual([]);
  return log.entries;
}

function inForce() {
  return entriesInForce(entriesOf(realLogText()));
}

function foundIds(text: string, tags: string[] = []): string[] {
  return listOf(findClashes(inForce(), text, tags)).map((match) => match.entry.id);
}

const sortingLog = logText(
  entry("D-0001", { Date: "2026-10-10", Decision: "Cars are invented makes and models.", Tags: "money" }),
  entry("D-0002", { Date: "2026-10-09", Decision: "The server pays for each delivery.", Tags: "money" }),
  entry("D-0003", { Date: "2026-10-12", Decision: "Each delivery pays coins from the server.", Tags: "art" }),
  entry("D-0004", { Date: "2026-10-11", Decision: "Cars are invented makes and models.", Tags: "money" }),
  entry("D-0005", { Date: "2026-10-10", Decision: "Cars are invented makes and models.", Tags: "money" }),
  entry("D-0006", { Date: "2026-10-12", Decision: "Sounds come from open libraries.", Tags: "audio" }),
);

describe("content words: happy path", () => {
  it("counts a push review and Push review: as the same words, whatever the capitals and punctuation", () => {
    expect(words("Push review:")).toEqual(words("a push review"));
    expect(words("PUSH, review!")).toEqual(words("push review"));
  });

  it("counts push and pushes, approve and approvals, as the same word", () => {
    expect(words("pushes")).toEqual(words("push"));
    expect(words("approvals")).toEqual(words("approve"));
    expect(words("designs")).toEqual(words("design"));
  });

  it("keeps the words that carry meaning", () => {
    expect(words("server payouts")).toHaveLength(2);
  });
});

describe("content words: sad path", () => {
  it("drops the fixed list of common words entirely", () => {
    const common =
      "the and every must for with not are but from that this into only its any all each one was has have will can our his her their than then when what which who why how also else never may let use own new off per via before after about under plus";
    expect(words(common)).toEqual([]);
  });

  it("finds no words in empty text, spaces or punctuation alone", () => {
    expect(words("")).toEqual([]);
    expect(words("   ")).toEqual([]);
    expect(words("!!! --- ...")).toEqual([]);
  });

  it("drops words shorter than three letters", () => {
    expect(words("go up to it on")).toEqual([]);
  });
});

describe("content words: idiot-proof path", () => {
  it("keeps short words that hold a digit, so 3D and 8 still count", () => {
    expect(words("3D")).toHaveLength(1);
    expect(words("8")).toHaveLength(1);
    expect(words("3D Tiles")).toHaveLength(2);
  });

  it("keeps letters with accents inside their word instead of splitting it", () => {
    expect(words("Ọmọlé road")).toHaveLength(2);
    expect(words("café")).toHaveLength(1);
  });

  it("gives each word once, however often it is written", () => {
    expect(words("push push pushes PUSH")).toHaveLength(1);
  });

  it("leaves never and only out, so never push has the same words as push", () => {
    expect(words("sessions never push")).toEqual(words("sessions push"));
    expect(words("only the owner pushes")).toEqual(words("owner push"));
  });
});

describe("content words: tragedy path", () => {
  it("reads a pasted wall of text quickly", () => {
    const wall = "The server decides every payout and the phone is never trusted. ".repeat(20_000);
    const started = performance.now();
    expect(words(wall).length).toBeGreaterThan(0);
    expect(performance.now() - started).toBeLessThan(10_000);
  });
});

describe("match of one entry: happy and sad paths", () => {
  const [moneyEntry] = entriesOf(logText(entry("D-0001", { Decision: "The server pays for each delivery.", Tags: "money, server" })));
  if (!moneyEntry) throw new Error("the test log has no entry");

  it("matches on a shared tag, and says which tag", () => {
    const match = matchOf(moneyEntry, contentWords("paint the cars"), ["money"]);
    expect(match?.entry).toEqual(moneyEntry);
    expect([...(match?.sharedTags ?? [])]).toEqual(["money"]);
    expect([...(match?.sharedWords ?? [])]).toEqual([]);
  });

  it("matches on two shared words, and says which words", () => {
    const match = matchOf(moneyEntry, contentWords("the server pays drivers"), []);
    expect([...(match?.sharedTags ?? [])]).toEqual([]);
    expect([...(match?.sharedWords ?? [])].sort()).toEqual(words("server pays"));
  });

  it("does not match on one shared word alone", () => {
    expect(matchOf(moneyEntry, contentWords("the server is slow"), [])).toBeFalsy();
  });

  it("does not match with nothing in common", () => {
    expect(matchOf(moneyEntry, contentWords("paint the cars"), ["art"])).toBeFalsy();
  });

  it("gives a match on tags and words a different strength from either alone", () => {
    const both = matchOf(moneyEntry, contentWords("the server pays drivers"), ["money"]);
    const tagsOnly = matchOf(moneyEntry, contentWords("paint the cars"), ["money"]);
    const wordsOnly = matchOf(moneyEntry, contentWords("the server pays drivers"), []);
    const strengths = new Set([both?.strength, tagsOnly?.strength, wordsOnly?.strength]);
    expect(strengths.size).toBe(3);
    expect(strengths.has(undefined)).toBe(false);
  });

  it("compares words with the Decision line only, not the Why", () => {
    const [entryWithWhy] = entriesOf(logText(entry("D-0001", { Decision: "Cars are invented makes and models.", Why: "Badges and logos belong to brands." })));
    if (!entryWithWhy) throw new Error("the test log has no entry");
    expect(matchOf(entryWithWhy, contentWords("badges logos brands"), [])).toBeFalsy();
  });
});

describe("find clashes: happy path, against the real docs/DECISIONS.md", () => {
  it("finds D-0022 for only the owner pushes", () => {
    expect(foundIds("only the owner pushes")).toContain("D-0022");
  });

  it("finds D-0022 for sessions may push to GitHub", () => {
    expect(foundIds("sessions may push to GitHub")).toContain("D-0022");
  });

  it("finds D-0008 for use 3D Tiles for streaming", () => {
    expect(foundIds("use 3D Tiles for streaming")).toContain("D-0008");
  });

  it("finds D-0024, D-0029 and D-0013 for approve designs without the owner", () => {
    expect(foundIds("approve designs without the owner")).toEqual(expect.arrayContaining(["D-0024", "D-0029", "D-0013"]));
  });

  it("finds D-0018 for buy coins with real money", () => {
    expect(foundIds("buy coins with real money")).toContain("D-0018");
  });

  it("finds D-0011 for use GPL code for traffic", () => {
    expect(foundIds("use GPL code for traffic")).toContain("D-0011");
  });

  it("finds D-0013 for drop the diagram gate for tools", () => {
    expect(foundIds("drop the diagram gate for tools")).toContain("D-0013");
  });

  it("finds D-0035 for speed test with a 1 second limit", () => {
    expect(foundIds("speed test with a 1 second limit")).toContain("D-0035");
  });

  it("finds D-0004 and D-0005 by their tags when the words differ: the phone decides the payout", () => {
    expect(foundIds("the phone decides the payout", ["money", "server"])).toEqual(expect.arrayContaining(["D-0004", "D-0005"]));
  });

  it("finds nothing for words no decision uses", () => {
    expect(foundIds("purple elephants dancing")).toEqual([]);
  });
});

describe("find clashes: order", () => {
  it("puts tags and words first, then tags only, then words only; within each the newest date, then the higher id", () => {
    const found = listOf(findClashes(entriesOf(sortingLog), "the server pays every delivery", ["money"]));
    expect(found.map((match) => match.entry.id)).toEqual(["D-0002", "D-0004", "D-0005", "D-0001", "D-0003"]);
  });

  it("says what matched for each", () => {
    const [first] = listOf(findClashes(entriesOf(sortingLog), "the server pays every delivery", ["money"]));
    expect([...(first?.sharedTags ?? [])]).toEqual(["money"]);
    expect([...(first?.sharedWords ?? [])].sort()).toEqual(words("server pays delivery"));
  });
});

describe("find clashes: sad path", () => {
  it("says there is nothing to match against when the text is all short or common words and no tags are given", () => {
    for (const text of ["do it", "the and every", "", "!!!", "🚗 🚗"]) {
      expect(Array.isArray(findClashes(inForce(), text, []))).toBe(false);
    }
  });

  it("says there is nothing to match against when the only tags are blank", () => {
    expect(Array.isArray(findClashes(inForce(), "do it", ["", "  "]))).toBe(false);
  });

  it("still checks tags when the text has no words", () => {
    expect(listOf(findClashes(inForce(), "do it", ["legal"])).map((match) => match.entry.id)).toContain("D-0012");
  });

  it("finds nothing in an empty log, rather than failing", () => {
    expect(listOf(findClashes([], "only the owner pushes", ["process"]))).toEqual([]);
  });
});

describe("find clashes: idiot-proof path", () => {
  it("reads tags in any capitals and with spaces around them", () => {
    const shouted = listOf(findClashes(inForce(), "do it", [" MONEY "])).map((match) => match.entry.id);
    const plain = listOf(findClashes(inForce(), "do it", ["money"])).map((match) => match.entry.id);
    expect(shouted).toEqual(plain);
    expect(plain).toEqual(expect.arrayContaining(["D-0004", "D-0005", "D-0018"]));
  });

  it("finds always push when the log says never push: the opposite is exactly the clash to catch", () => {
    const log = entriesOf(logText(entry("D-0001", { Decision: "Sessions never push.", Tags: "process" })));
    expect(listOf(findClashes(log, "sessions always push", [])).map((match) => match.entry.id)).toEqual(["D-0001"]);
  });

  it("does not find a decision the owner has replaced, only the one that replaced it", () => {
    const log = entriesOf(
      logText(
        entry("D-0001", { Decision: "Sessions push to GitHub.", Tags: "process" }),
        entry("D-0002", { Decision: "Only the owner pushes to GitHub.", Tags: "process", Replaces: "D-0001" }),
      ),
    );
    expect(listOf(findClashes(entriesInForce(log), "sessions push to GitHub", ["process"])).map((match) => match.entry.id)).toEqual(["D-0002"]);
  });
});

describe("find clashes: tragedy path", () => {
  it("checks a long text against a log thousands of entries long within a generous time", () => {
    const many = logText(...Array.from({ length: 5_000 }, (_, at) => entry(`D-${String(at + 1).padStart(4, "0")}`)));
    const started = performance.now();
    const found = listOf(findClashes(entriesOf(many), "only the owner pushes ".repeat(2_000), ["process"]));
    expect(found).toHaveLength(5_000);
    expect(performance.now() - started).toBeLessThan(20_000);
  });
});
