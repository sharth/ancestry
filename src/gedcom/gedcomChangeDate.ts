import { reportUnparsedRecord } from "../util/record-unparsed-records";
import {
  filterTrivialGedcomRecord,
  filterTrivialGedcomRecords,
  newGedcomRecord,
  type GedcomRecord,
} from "./gedcomRecord";

export interface GedcomChangeDate {
  value: string;
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
