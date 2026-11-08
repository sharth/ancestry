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

export function newGedcomChangeDate(
  fieldsToUpdate: Partial<GedcomChangeDate> = {},
): GedcomChangeDate {
  return {
    value: "",
    ...fieldsToUpdate,
  };
}

/** A change date of `now` (today, by default), for stamping a record's CHAN
 * when an edit is made to it. */
export function generateGedcomChangeDate(now = new Date()): GedcomChangeDate {
  const day = now.getDate();
  const month = monthNames[now.getMonth()];
  const year = now.getFullYear();
  return newGedcomChangeDate({ value: `${day} ${month} ${year}` });
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
