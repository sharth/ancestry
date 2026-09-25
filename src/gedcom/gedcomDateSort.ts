// Interpretation of GEDCOM date values for sorting and display.
//
// GEDCOM 5.5.1 and 7.0 date values share the same general shape:
//
//   DateValue = [ date / DatePeriod / dateRange / dateApprox ]
//   date      = [calendar D] [[day D] month D] year [D epoch]
//   DatePeriod = FROM date [TO date] / TO date
//   dateRange  = BET date AND date / AFT date / BEF date
//   dateApprox = (ABT / CAL / EST) date
//
// GEDCOM 5.5.1 also permits `INT date (phrase)`, `(phrase)`, calendar escapes
// such as `@#DJULIAN@`, dual years such as `1699/00`, and the `B.C.` epoch.
//
// All dates are assumed to be in the Gregorian calendar. Calendar escapes and
// names are ignored.
//
// Real-world files are much messier than either grammar (e.g. "abt. 1850 BC
// (or 1851)"), so this parser is deliberately lenient: it only needs to find
// a reasonable point in time to sort on.
import type { GedcomDate } from "./gedcomDate";
import type { GedcomFact } from "./gedcomFact";

export type GedcomDateQualifier =
  | "" // An exact date.
  | "ABT" // ABT, CAL, EST, INT: approximately the given date.
  | "BEF"
  | "AFT"
  | "BET" // BET x AND y.
  | "FROM" // FROM x [TO y].
  | "TO"; // TO x.

export interface ParsedGedcomDate {
  qualifier: GedcomDateQualifier;
  // The year, using astronomical numbering where 1 BCE is year 0.
  year: number;
  hasMonth: boolean;
  hasDay: boolean;
  // Fractional years at the beginning and end of the first date's precision.
  // For example "1900" starts at 1900.0 and ends just before 1901.0.
  start: number;
  end: number;
}

const DAYS_PER_YEAR = 365.2425;
const DAYS_BEFORE_MONTH = [
  0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334, 365,
];

const MONTHS = [
  "JANUARY",
  "FEBRUARY",
  "MARCH",
  "APRIL",
  "MAY",
  "JUNE",
  "JULY",
  "AUGUST",
  "SEPTEMBER",
  "OCTOBER",
  "NOVEMBER",
  "DECEMBER",
];

const QUALIFIERS: Record<string, GedcomDateQualifier> = {
  ABT: "ABT",
  ABOUT: "ABT",
  CAL: "ABT",
  EST: "ABT",
  INT: "ABT",
  C: "ABT",
  CA: "ABT",
  CIRCA: "ABT",
  BEF: "BEF",
  BEFORE: "BEF",
  BY: "BEF",
  AFT: "AFT",
  AFTER: "AFT",
  BET: "BET",
  BETWEEN: "BET",
  FROM: "FROM",
  TO: "TO",
};

const BCE_EPOCHS = new Set(["BC", "BCE"]);

// Accepts standard three letter abbreviations as well as any longer
// abbreviation or full English month name ("SEPT", "SEPTEMBER").
function monthNumber(token: string): number | undefined {
  if (token.length < 3) return undefined;
  const index = MONTHS.findIndex((name) => name.startsWith(token));
  return index >= 0 ? index + 1 : undefined;
}

// Converts a date to a fractional year, e.g. 1 JUL 1900 is about 1900.5.
// Month 13 is treated as January of the following year.
function toFractionalYear(year: number, month: number, day: number): number {
  const daysBeforeMonth = DAYS_BEFORE_MONTH[month - 1] ?? 365;
  return year + (daysBeforeMonth + day - 1) / DAYS_PER_YEAR;
}

function tokenize(value: string): string[] {
  return value
    .toUpperCase()
    .replace(/@#D[^@]*@/g, " ")
    .replace(/\bB\.\s*C\.\s*(E\.)?/g, " BC ")
    .replace(/[.?,]/g, " ")
    .split(/\s+/)
    .map((token) => token.replace(/[^A-Z0-9/]/g, ""))
    .filter((token) => token !== "");
}

function parseTokens(tokens: string[]): ParsedGedcomDate | undefined {
  let qualifier: GedcomDateQualifier | undefined;
  let day: number | undefined;
  let month: number | undefined;

  for (const [i, token] of tokens.entries()) {
    const next = tokens.at(i + 1) ?? "";

    const tokenQualifier = QUALIFIERS[token];
    if (tokenQualifier !== undefined) {
      qualifier ??= tokenQualifier;
      continue;
    }

    const tokenMonth = monthNumber(token);
    if (tokenMonth !== undefined) {
      month = tokenMonth;
      continue;
    }

    const numberMatch = /^(\d+)(\/\d+)?$/.exec(token);
    if (numberMatch?.[1] === undefined) {
      // An unrecognized word, which is ignored.
      continue;
    }

    const number = parseInt(numberMatch[1], 10);
    if (month === undefined && monthNumber(next) !== undefined) {
      day = number;
      continue;
    }

    // This is the year, which completes the first date.
    let year = number;
    if (numberMatch[2] !== undefined) {
      // A dual year such as 1699/00, from when the year began on March 25.
      // The second year is the one used by the modern reckoning.
      year += 1;
    }
    if (BCE_EPOCHS.has(next)) {
      year = 1 - year;
    }

    const hasMonth = month !== undefined;
    const hasDay = hasMonth && day !== undefined;
    const start = toFractionalYear(year, month ?? 1, day ?? 1);
    const end =
      hasDay ? toFractionalYear(year, month ?? 1, (day ?? 1) + 1)
      : hasMonth ? toFractionalYear(year, (month ?? 1) + 1, 1)
      : toFractionalYear(year + 1, 1, 1);

    return {
      qualifier: qualifier ?? "",
      year: Math.floor(start),
      hasMonth,
      hasDay,
      start,
      end,
    };
  }

  return undefined;
}

// Parses the first date within a GEDCOM date value, returning undefined if the
// value doesn't contain a recognizable year.
export function parseGedcomDateValue(
  value: string,
): ParsedGedcomDate | undefined {
  // Date phrases are enclosed in parentheses. Prefer the date outside of the
  // phrase, but fall back to one within it, e.g. "(about 1850)".
  const withoutPhrases = value.replace(/\([^)]*\)?/g, " ");
  return parseTokens(tokenize(withoutPhrases)) ?? parseTokens(tokenize(value));
}

// Returns a number suitable for chronologically ordering the given date, or
// undefined if it can't be interpreted.
export function gedcomDateSortKey(date: GedcomDate): number | undefined {
  const parsed = parseGedcomDateValue(date.value);
  if (parsed === undefined) return undefined;
  if (parsed.qualifier === "BEF") {
    // Just before the first moment covered by the date.
    return parsed.start - 1e-6;
  }
  if (parsed.qualifier === "AFT") {
    // Just after the last moment covered by the date.
    return parsed.end;
  }
  return parsed.start;
}

// Returns the sort key for a fact, preferring its sort date (SDATE) over its
// date (DATE), as recommended by GEDCOM 7.
export function gedcomFactSortKey(fact: GedcomFact): number | undefined {
  return gedcomDateSortKey(fact.sortDate) ?? gedcomDateSortKey(fact.date);
}

// Returns a copy of `items` sorted chronologically. Items without an
// interpretable date are kept in their original relative order at the end.
export function sortChronologically<T>(
  items: readonly T[],
  factOf: (item: T) => GedcomFact,
): T[] {
  return items
    .map((item, index) => ({
      item,
      index,
      key: gedcomFactSortKey(factOf(item)),
    }))
    .sort((a, b) => {
      if (a.key !== undefined && b.key !== undefined && a.key !== b.key) {
        return a.key - b.key;
      }
      if (a.key === undefined && b.key !== undefined) return 1;
      if (a.key !== undefined && b.key === undefined) return -1;
      return a.index - b.index;
    })
    .map(({ item }) => item);
}

// Returns the age, in whole years, at `event` of someone born at `birth`, or
// undefined if it can't be determined.
export function ageAt(
  birth: ParsedGedcomDate,
  event: ParsedGedcomDate,
): number | undefined {
  const age =
    birth.hasDay && event.hasDay ?
      Math.floor(event.start - birth.start + 1e-9)
    : event.year - birth.year;
  return age >= 0 ? age : undefined;
}

// Formats a year for display, e.g. 1900 or 44 BC.
export function formatYear(year: number): string {
  return year > 0 ? `${year}` : `${1 - year} BC`;
}

const DISPLAY_WORDS: Record<string, string> = {
  ABT: "Abt.",
  CAL: "Calc.",
  EST: "Est.",
  INT: "Int.",
  BEF: "Bef.",
  AFT: "Aft.",
  BET: "Bet.",
  AND: "and",
  FROM: "From",
  TO: "to",
  JAN: "Jan",
  FEB: "Feb",
  MAR: "Mar",
  APR: "Apr",
  MAY: "May",
  JUN: "Jun",
  JUL: "Jul",
  AUG: "Aug",
  SEP: "Sep",
  OCT: "Oct",
  NOV: "Nov",
  DEC: "Dec",
  BCE: "BC",
  "B.C.": "BC",
};

// Formats a GEDCOM date value for display, e.g. "ABT 11 DEC 1878" becomes
// "Abt. 11 Dec 1878". Unrecognized words are left untouched.
export function formatGedcomDateValue(value: string): string {
  return value
    .split(/(\s+)/)
    .map((word) => DISPLAY_WORDS[word] ?? word)
    .join("")
    .replace(/^to /, "To ");
}
