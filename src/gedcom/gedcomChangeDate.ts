import { reportUnparsedRecord } from "../util/record-unparsed-records";
import type { GedcomDate } from "./gedcomDate";
import { parseGedcomDate, serializeGedcomDate } from "./gedcomDate";
import type { GedcomRecord } from "./gedcomRecord";

export interface GedcomChangeDate {
  date: GedcomDate;
}

export function parseGedcomChangeDate(
  gedcomRecord: GedcomRecord,
): GedcomChangeDate {
  if (gedcomRecord.tag !== "CHAN") throw new Error();
  if (gedcomRecord.xref !== "") throw new Error();
  if (gedcomRecord.value !== "") throw new Error();

  let date: GedcomDate | null = null;

  for (const childRecord of gedcomRecord.children) {
    switch (childRecord.tag) {
      case "DATE":
        if (date) throw new Error();
        date = parseGedcomDate(childRecord);
        break;

      default:
        reportUnparsedRecord(childRecord);
        break;
    }
  }

  if (date == null) {
    throw new Error("A GedcomChangeDate must have a DATE record");
  }
  return { date };
}

export function serializeGedcomChangeDate(
  gedcomChangeDate: GedcomChangeDate,
): GedcomRecord {
  return {
    tag: "CHAN",
    abstag: "",
    xref: "",
    value: "",
    children: [serializeGedcomDate(gedcomChangeDate.date)],
  };
}
