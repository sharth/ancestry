import { reportUnparsedRecord } from "../util/record-unparsed-records";
import type { GedcomRecord } from "./gedcomRecord";

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

  const gedcomDate: GedcomDate = {
    value: gedcomRecord.value,
  };

  for (const childRecord of gedcomRecord.children) {
    switch (childRecord.tag) {
      default:
        reportUnparsedRecord(childRecord);
        break;
    }
  }
  return gedcomDate;
}

export function serializeGedcomDate(gedcomDate: GedcomDate): GedcomRecord {
  return {
    tag: "DATE",
    abstag: "",
    xref: "",
    value: gedcomDate.value,
    children: [],
  };
}

export function serializeGedcomSortDate(gedcomDate: GedcomDate): GedcomRecord {
  return {
    tag: "SDATE",
    abstag: "",
    xref: "",
    value: gedcomDate.value,
    children: [],
  };
}
