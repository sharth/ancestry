import { reportUnparsedRecord } from "../util/record-unparsed-records";
import {
  parseGedcomDate,
  serializeGedcomDate,
  type GedcomDate,
} from "./gedcomDate";
import {
  filterTrivialGedcomRecord,
  filterTrivialGedcomRecords,
  newGedcomRecord,
  type GedcomRecord,
} from "./gedcomRecord";

export interface GedcomChangeDate {
  date: GedcomDate;
}

export function parseGedcomChangeDate(
  gedcomRecord: GedcomRecord,
): GedcomChangeDate {
  if (gedcomRecord.tag !== "CHAN") throw new Error();
  if (gedcomRecord.xref !== "") throw new Error();
  if (gedcomRecord.value !== "") throw new Error();

  const gedcomChangeDate: GedcomChangeDate = { date: { value: "" } };

  for (const childRecord of gedcomRecord.children) {
    switch (childRecord.tag) {
      case "DATE":
        gedcomChangeDate.date = parseGedcomDate(childRecord);
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
        serializeGedcomDate(gedcomChangeDate.date),
      ]),
    }),
  );
}

export function newGedcomChangeDate(value = ""): GedcomChangeDate {
  return {
    date: { value: value },
  };
}
