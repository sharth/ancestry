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
  const gedcomRecord: GedcomRecord = {
    tag: "CHAN",
    abstag: "",
    xref: "",
    value: "",
    children: [serializeGedcomDate(gedcomChangeDate.date)].filter(
      (r) => r !== null,
    ),
  };
  if (gedcomRecord.xref || gedcomRecord.value || gedcomRecord.children.length) {
    return gedcomRecord;
  } else {
    return null;
  }
}
