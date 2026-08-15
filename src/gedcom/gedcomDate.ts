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

export function parseGedcomDate(gedcomRecord: GedcomRecord): GedcomDate {
  if (gedcomRecord.xref != "") throw new Error();
  if (gedcomRecord.value == "") throw new Error();
  if (gedcomRecord.children.length != 0) throw new Error();

  return {
    value: gedcomRecord.value,
  };
}

export function serializeGedcomDate(
  gedcomDate: GedcomDate,
): GedcomRecord | null {
  return filterTrivialGedcomRecord(
    newGedcomRecord({
      tag: "DATE",
      value: gedcomDate.value,
    }),
  );
}

export function serializeGedcomSortDate(
  gedcomDate: GedcomDate,
): GedcomRecord | null {
  return filterTrivialGedcomRecord(
    newGedcomRecord({
      tag: "SDATE",
      value: gedcomDate.value,
    }),
  );
}
