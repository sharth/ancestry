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

// Words placing a date just before or after the date that follows them. Other
// qualifiers (ABT, CAL, EST, INT, BET, FROM, TO) sort at the date itself.
const BEFORE_WORDS = new Set(["BEF", "BEFORE", "BY"]);
const AFTER_WORDS = new Set(["AFT", "AFTER"]);

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

interface ParsedGedcomDate {
  // The year as written, using astronomical numbering where 1 BCE is year 0.
  year: number;
  // A fractional year for ordering, e.g. about 1900.5 for 1 JUL 1900.
  sortKey: number;
}

function parseTokens(tokens: string[]): ParsedGedcomDate | undefined {
  let shift: "before" | "after" | undefined;
  let day: number | undefined;
  let month: number | undefined;

  for (const [i, token] of tokens.entries()) {
    const next = tokens.at(i + 1) ?? "";

    if (BEFORE_WORDS.has(token)) {
      shift ??= "before";
      continue;
    }
    if (AFTER_WORDS.has(token)) {
      shift ??= "after";
      continue;
    }

    const tokenMonth = monthNumber(token);
    if (tokenMonth !== undefined) {
      month = tokenMonth;
      continue;
    }

    const numberMatch = /^(\d+)(\/\d+)?$/.exec(token);
    if (numberMatch?.[1] === undefined) {
      // An unrecognized word, such as ABT or a phrase, which is ignored.
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

    let sortKey = toFractionalYear(year, month ?? 1, day ?? 1);
    if (shift === "before") {
      // Just before the first day the date covers.
      sortKey -= 1e-6;
    } else if (shift === "after") {
      // The day after the last day the date covers.
      sortKey =
        month === undefined ? year + 1
        : day === undefined ? toFractionalYear(year, month + 1, 1)
        : toFractionalYear(year, month, day + 1);
    }

    return { year, sortKey };
  }

  return undefined;
}

// Parses the first date within a GEDCOM date value, returning undefined if the
// value doesn't contain a recognizable year.
function parseGedcomDateValue(value: string): ParsedGedcomDate | undefined {
  // Date phrases are enclosed in parentheses. Prefer the date outside of the
  // phrase, but fall back to one within it, e.g. "(about 1850)".
  const withoutPhrases = value.replace(/\([^)]*\)?/g, " ");
  return parseTokens(tokenize(withoutPhrases)) ?? parseTokens(tokenize(value));
}

// Returns a fractional year for chronologically ordering the given date, or
// undefined if it can't be interpreted. BEF and AFT dates sort just before and
// after the date they qualify.
export function gedcomDateSortKey(date: GedcomDate): number | undefined {
  return parseGedcomDateValue(date.value)?.sortKey;
}

// Returns the year of the given date as written, e.g. 1900 for "BEF 1900", or
// undefined if it can't be interpreted. Years BCE are zero or negative, with
// 1 BCE as year 0.
export function gedcomDateYear(date: GedcomDate): number | undefined {
  return parseGedcomDateValue(date.value)?.year;
}

// Returns the sort key for a fact. When the fact has a sort date (SDATE), that
// is used, even if it can't be interpreted, as recommended by GEDCOM 7.
// Otherwise, the date (DATE) is used.
export function gedcomFactSortKey(fact: GedcomFact): number | undefined {
  return gedcomDateSortKey(fact.sortDate.value ? fact.sortDate : fact.date);
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
