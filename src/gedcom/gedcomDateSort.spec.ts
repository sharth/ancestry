import { describe, expect, it } from "vitest";
import { newGedcomDate } from "./gedcomDate";
import {
  formatGedcomDateValue,
  formatYear,
  gedcomDateSortKey,
  gedcomDateYear,
  sortChronologically,
} from "./gedcomDateSort";
import { newGedcomFact } from "./gedcomFact";

function key(value: string): number | undefined {
  return gedcomDateSortKey(newGedcomDate({ value }));
}

function year(value: string): number | undefined {
  return gedcomDateYear(newGedcomDate({ value }));
}

describe("gedcomDateYear", () => {
  it("returns the year of exact dates", () => {
    expect(year("11 DEC 1878")).toBe(1878);
    expect(year("DEC 1878")).toBe(1878);
    expect(year("1878")).toBe(1878);
  });

  it("returns the year as written, whatever the qualifier", () => {
    expect(year("ABT 1900")).toBe(1900);
    expect(year("CAL 1900")).toBe(1900);
    expect(year("EST 1900")).toBe(1900);
    expect(year("BEF 1900")).toBe(1900);
    expect(year("AFT 1900")).toBe(1900);
    expect(year("BET 1900 AND 1910")).toBe(1900);
    expect(year("FROM 1900 TO 1910")).toBe(1900);
    expect(year("TO 1910")).toBe(1910);
  });

  it("parses epochs", () => {
    expect(year("44 BCE")).toBe(-43);
    expect(year("44 B.C.")).toBe(-43);
    expect(year("ABT 44 BC")).toBe(-43);
    expect(year("1 BCE")).toBe(0);
  });

  it("parses dual years", () => {
    expect(year("10 FEB 1699/00")).toBe(1700);
  });

  it("parses date phrases", () => {
    expect(year("INT 1900 (about then)")).toBe(1900);
    expect(year("(sometime in 1900)")).toBe(1900);
    expect(year("(unknown)")).toBeUndefined();
    expect(year("")).toBeUndefined();
  });

  it("parses nonstandard dates leniently", () => {
    expect(year("abt. 1850 BC (or abt. 1851 BC)")).toBe(-1849);
    expect(year("1850 or 1851")).toBe(1850);
    expect(year("1850?")).toBe(1850);
    expect(year("1850 AD")).toBe(1850);
  });
});

describe("gedcomDateSortKey", () => {
  it("orders dates chronologically", () => {
    const ordered = [
      "45 BC",
      "44 BC",
      "BEF 1900",
      "1900",
      "ABT 1900",
      "1 JAN 1900",
      "2 JAN 1900",
      "FEB 1900",
      "31 DEC 1900",
      "AFT 1900",
      "1901",
    ];
    const keys = ordered.map(key);
    const sorted = keys.toSorted((a, b) => (a ?? 0) - (b ?? 0));
    expect(keys).toEqual(sorted);
    expect(key("BEF 1900")).toBeLessThan(key("1 JAN 1900") ?? 0);
    expect(key("AFT 1900")).toBeGreaterThan(key("31 DEC 1900") ?? 0);
    expect(key("AFT DEC 1900")).toBeLessThan(key("1 JAN 1901") ?? 0);
  });

  it("ignores calendars, assuming Gregorian", () => {
    expect(key("@#DJULIAN@ 1 JAN 1700")).toBe(key("1 JAN 1700"));
    expect(key("JULIAN 1 JAN 1700")).toBe(key("1 JAN 1700"));
  });

  it("accepts full and abbreviated month names", () => {
    expect(key("11 December 1878")).toBe(key("11 DEC 1878"));
    expect(key("11 Sept 1878")).toBe(key("11 SEP 1878"));
  });

  it("returns undefined for uninterpretable dates", () => {
    expect(key("")).toBeUndefined();
    expect(key("unknown")).toBeUndefined();
  });
});

describe("sortChronologically", () => {
  it("prefers the sort date over the date", () => {
    const a = newGedcomFact({
      tag: "A",
      date: newGedcomDate({ value: "1950" }),
      sortDate: newGedcomDate({ value: "1800" }),
    });
    const b = newGedcomFact({
      tag: "B",
      date: newGedcomDate({ value: "1900" }),
    });
    expect(sortChronologically([b, a], (f) => f).map((f) => f.tag)).toEqual([
      "A",
      "B",
    ]);
  });

  it("uses the sort date even if it is uninterpretable", () => {
    // A would sort first by its date, but its sort date makes it undated.
    const a = newGedcomFact({
      tag: "A",
      date: newGedcomDate({ value: "1850" }),
      sortDate: newGedcomDate({ value: "(unknown)" }),
    });
    const b = newGedcomFact({
      tag: "B",
      date: newGedcomDate({ value: "1900" }),
    });
    expect(sortChronologically([a, b], (f) => f).map((f) => f.tag)).toEqual([
      "B",
      "A",
    ]);
  });

  it("places undated facts last, preserving order", () => {
    const facts = [
      newGedcomFact({ tag: "U1" }),
      newGedcomFact({ tag: "D2", date: newGedcomDate({ value: "1902" }) }),
      newGedcomFact({ tag: "U2" }),
      newGedcomFact({ tag: "D1", date: newGedcomDate({ value: "1901" }) }),
      newGedcomFact({ tag: "S1", date: newGedcomDate({ value: "1901" }) }),
    ];
    expect(sortChronologically(facts, (f) => f).map((f) => f.tag)).toEqual([
      "D1",
      "S1",
      "D2",
      "U1",
      "U2",
    ]);
  });
});

describe("formatting", () => {
  it("formats years", () => {
    expect(formatYear(1900)).toBe("1900");
    expect(formatYear(-43)).toBe("44 BC");
  });

  it("formats date values", () => {
    expect(formatGedcomDateValue("11 DEC 1878")).toBe("11 Dec 1878");
    expect(formatGedcomDateValue("ABT 1900")).toBe("Abt. 1900");
    expect(formatGedcomDateValue("BET 1900 AND 1910")).toBe(
      "Bet. 1900 and 1910",
    );
    expect(formatGedcomDateValue("FROM 1900 TO 1910")).toBe(
      "From 1900 to 1910",
    );
    expect(formatGedcomDateValue("TO 1910")).toBe("To 1910");
    expect(formatGedcomDateValue("44 BCE")).toBe("44 BC");
    expect(formatGedcomDateValue("sometime")).toBe("sometime");
  });
});
