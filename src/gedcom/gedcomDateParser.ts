import { reportUnparsedRecord } from "../util/record-unparsed-records";
import type { GedcomDate } from "./gedcomDate";
import type { GedcomRecord } from "./gedcomRecord";

export function parseGedcomDate(gedcomRecord: GedcomRecord): GedcomDate {
  if (gedcomRecord.xref != null) throw new Error();
  if (gedcomRecord.value == null) throw new Error();

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
