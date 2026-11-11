import type { Immutable } from "immer";

import {
  filterTrivialGedcomRecord,
  newGedcomRecord,
  type GedcomRecord,
} from "./gedcomRecord";

export interface GedcomDate {
  value: string;
}

export const monthNames = [
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MAY",
  "JUN",
  "JUL",
  "AUG",
  "SEP",
  "OCT",
  "NOV",
  "DEC",
];

/** `now` as a GEDCOM DateExact (e.g. `2 JAN 2030`), for stamping HEAD's
 * DATE and records' CHAN and CREA. */
export function gedcomDateExact(now: Date): string {
  return `${now.getDate()} ${monthNames[now.getMonth()]} ${now.getFullYear()}`;
}

export function newGedcomDate(
  fieldsToUpdate: Partial<GedcomDate> = {},
): GedcomDate {
  return {
    value: "",
    ...fieldsToUpdate,
  };
}

export function parseGedcomDate(gedcomRecord: GedcomRecord): GedcomDate {
  if (gedcomRecord.xref != "") throw new Error();
  if (gedcomRecord.value == "") throw new Error();
  if (gedcomRecord.children.length != 0) throw new Error();

  return newGedcomDate({
    value: gedcomRecord.value,
  });
}

export function serializeGedcomDate(
  gedcomDate: Immutable<GedcomDate>,
): GedcomRecord | null {
  return filterTrivialGedcomRecord(
    newGedcomRecord({
      tag: "DATE",
      value: gedcomDate.value,
    }),
  );
}

export function serializeGedcomSortDate(
  gedcomDate: Immutable<GedcomDate>,
): GedcomRecord | null {
  return filterTrivialGedcomRecord(
    newGedcomRecord({
      tag: "SDATE",
      value: gedcomDate.value,
    }),
  );
}
