import { reportUnparsedRecord } from "../util/record-unparsed-records";
import { monthNames } from "./gedcomDate";
import {
  filterTrivialGedcomRecord,
  filterTrivialGedcomRecords,
  newGedcomRecord,
  type GedcomRecord,
} from "./gedcomRecord";

export interface GedcomChangeDate {
  value: string;
}

// The CHAN.DATE value for "now", in the GEDCOM DATE_EXACT format used
// throughout this file (e.g. "9 OCT 2026").
export function formatGedcomChangeDate(now = new Date()): string {
  const day = now.getDate();
  const month = monthNames[now.getMonth()];
  const year = now.getFullYear();
  return `${day} ${month} ${year}`;
}

export function newGedcomChangeDate(
  fieldsToUpdate: Partial<GedcomChangeDate> = {},
): GedcomChangeDate {
  return {
    value: "",
    ...fieldsToUpdate,
  };
}

export function parseGedcomChangeDate(
  gedcomRecord: GedcomRecord,
): GedcomChangeDate {
  if (gedcomRecord.tag !== "CHAN") throw new Error();
  if (gedcomRecord.xref !== "") throw new Error();
  if (gedcomRecord.value !== "") throw new Error();

  const gedcomChangeDate = newGedcomChangeDate();

  for (const childRecord of gedcomRecord.children) {
    switch (childRecord.tag) {
      case "DATE":
        if (childRecord.xref !== "") throw new Error();
        if (childRecord.value === "") throw new Error();
        if (childRecord.children.length) throw new Error();
        gedcomChangeDate.value = childRecord.value;
        break;

      default:
        reportUnparsedRecord(childRecord);
        break;
    }
  }

  return gedcomChangeDate;
}

export function serializeGedcomChangeDate(
  gedcomChangeDate: GedcomChangeDate,
): GedcomRecord | null {
  return filterTrivialGedcomRecord(
    newGedcomRecord({
      tag: "CHAN",
      children: filterTrivialGedcomRecords([
        newGedcomRecord({
          tag: "DATE",
          value: gedcomChangeDate.value,
        }),
      ]),
    }),
  );
}
