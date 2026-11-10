import { reportUnparsedRecord } from "../util/record-unparsed-records";
import {
  filterTrivialGedcomRecord,
  filterTrivialGedcomRecords,
  newGedcomRecord,
  type GedcomRecord,
} from "./gedcomRecord";

/** GEDCOM 7's CREATION_DATE (CREA): when a record was first created. */
export interface GedcomCreationDate {
  value: string;
}

export function newGedcomCreationDate(
  fieldsToUpdate: Partial<GedcomCreationDate> = {},
): GedcomCreationDate {
  return {
    value: "",
    ...fieldsToUpdate,
  };
}

export function parseGedcomCreationDate(
  gedcomRecord: GedcomRecord,
): GedcomCreationDate {
  if (gedcomRecord.tag !== "CREA") throw new Error();
  if (gedcomRecord.xref !== "") throw new Error();
  if (gedcomRecord.value !== "") throw new Error();

  const gedcomCreationDate = newGedcomCreationDate();

  for (const childRecord of gedcomRecord.children) {
    switch (childRecord.tag) {
      case "DATE":
        if (childRecord.xref !== "") throw new Error();
        if (childRecord.value === "") throw new Error();
        if (childRecord.children.length) throw new Error();
        gedcomCreationDate.value = childRecord.value;
        break;

      default:
        reportUnparsedRecord(childRecord);
        break;
    }
  }

  return gedcomCreationDate;
}

export function serializeGedcomCreationDate(
  gedcomCreationDate: GedcomCreationDate,
): GedcomRecord | null {
  return filterTrivialGedcomRecord(
    newGedcomRecord({
      tag: "CREA",
      children: filterTrivialGedcomRecords([
        newGedcomRecord({
          tag: "DATE",
          value: gedcomCreationDate.value,
        }),
      ]),
    }),
  );
}
