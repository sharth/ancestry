import { describe, expect, it } from "vitest";
import { newGedcomDate } from "./gedcomDate";
import {
  ageAt,
  formatGedcomDateValue,
  formatYear,
  gedcomDateSortKey,
  parseGedcomDateValue,
  sortChronologically,
} from "./gedcomDateSort";
import { newGedcomFact } from "./gedcomFact";

function key(value: string): number | undefined {
  return gedcomDateSortKey(newGedcomDate({ value }));
}

describe("parseGedcomDateValue", () => {
  it("parses exact dates", () => {
    expect(parseGedcomDateValue("11 DEC 1878")).toMatchObject({
      qualifier: "",
      year: 1878,
      hasMonth: true,
      hasDay: true,
    });
    expect(parseGedcomDateValue("DEC 1878")).toMatchObject({
      year: 1878,
      hasMonth: true,
      hasDay: false,
    });
    expect(parseGedcomDateValue("1878")).toMatchObject({
      year: 1878,
      hasMonth: false,
      hasDay: false,
    });
  });

  it("parses qualifiers", () => {
    expect(parseGedcomDateValue("ABT 1900")?.qualifier).toBe("ABT");
    expect(parseGedcomDateValue("CAL 1900")?.qualifier).toBe("ABT");
    expect(parseGedcomDateValue("EST 1900")?.qualifier).toBe("ABT");
    expect(parseGedcomDateValue("BEF 1900")?.qualifier).toBe("BEF");
    expect(parseGedcomDateValue("AFT 1900")?.qualifier).toBe("AFT");
    expect(parseGedcomDateValue("BET 1900 AND 1910")).toMatchObject({
      qualifier: "BET",
      year: 1900,
    });
    expect(parseGedcomDateValue("FROM 1900 TO 1910")).toMatchObject({
      qualifier: "FROM",
      year: 1900,
    });
    expect(parseGedcomDateValue("TO 1910")).toMatchObject({
      qualifier: "TO",
      year: 1910,
    });
  });

  it("parses epochs", () => {
    expect(parseGedcomDateValue("44 BCE")?.year).toBe(-43);
    expect(parseGedcomDateValue("44 B.C.")?.year).toBe(-43);
    expect(parseGedcomDateValue("ABT 44 BC")?.year).toBe(-43);
    expect(parseGedcomDateValue("1 BCE")?.year).toBe(0);
  });

  it("parses dual years", () => {
    expect(parseGedcomDateValue("10 FEB 1699/00")?.year).toBe(1700);
  });

  it("ignores calendars, assuming Gregorian", () => {
    expect(parseGedcomDateValue("@#DJULIAN@ 1 JAN 1700")).toMatchObject({
      year: 1700,
      hasDay: true,
    });
    expect(parseGedcomDateValue("JULIAN 1 JAN 1700")).toMatchObject({
      year: 1700,
      hasDay: true,
    });
  });

  it("parses date phrases", () => {
    expect(parseGedcomDateValue("INT 1900 (about then)")).toMatchObject({
      qualifier: "ABT",
      year: 1900,
    });
    expect(parseGedcomDateValue("(sometime in 1900)")?.year).toBe(1900);
    expect(parseGedcomDateValue("(unknown)")).toBeUndefined();
    expect(parseGedcomDateValue("")).toBeUndefined();
  });

  it("parses nonstandard dates leniently", () => {
    expect(
      parseGedcomDateValue("abt. 1850 BC (or abt. 1851 BC)"),
    ).toMatchObject({ qualifier: "ABT", year: -1849 });
    expect(parseGedcomDateValue("1850 or 1851")?.year).toBe(1850);
    expect(parseGedcomDateValue("1850?")?.year).toBe(1850);
    expect(parseGedcomDateValue("1850 AD")?.year).toBe(1850);
    expect(parseGedcomDateValue("11 December 1878")).toMatchObject({
      year: 1878,
      hasDay: true,
    });
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

  it("falls back to the date if the sort date is uninterpretable", () => {
    const a = newGedcomFact({
      tag: "A",
      date: newGedcomDate({ value: "1950" }),
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

function parse(value: string) {
  const parsed = parseGedcomDateValue(value);
  if (parsed === undefined) throw new Error(`Unparseable date: ${value}`);
  return parsed;
}

describe("ageAt", () => {
  const birth = parse("11 DEC 1878");

  it("uses whole years when both dates are exact", () => {
    expect(ageAt(birth, parse("10 DEC 1910"))).toBe(31);
    expect(ageAt(birth, parse("11 DEC 1910"))).toBe(32);
  });

  it("uses the difference in years otherwise", () => {
    expect(ageAt(birth, parse("1910"))).toBe(32);
    expect(ageAt(birth, parse("ABT 1940"))).toBe(62);
  });

  it("ignores events before birth", () => {
    expect(ageAt(birth, parse("1870"))).toBeUndefined();
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
