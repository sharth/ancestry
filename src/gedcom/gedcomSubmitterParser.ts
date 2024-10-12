import { reportUnparsedRecord } from "../util/record-unparsed-records";
import type { GedcomRecord } from "./gedcomRecord";
import { GedcomSubmitter } from "./gedcomSubmitter";

export function parseGedcomSubmitter(
  gedcomRecord: GedcomRecord
): GedcomSubmitter {
  if (gedcomRecord.tag !== "SUBM") throw new Error();
  if (gedcomRecord.xref == null) throw new Error();
  if (gedcomRecord.value != null) throw new Error();

  const gedcomSubmitter = new GedcomSubmitter(gedcomRecord.xref, gedcomRecord);

  for (const childRecord of gedcomRecord.children) {
    switch (childRecord.tag) {
      case "NAME":
        if (childRecord.xref != null) throw new Error();
        if (childRecord.value == null) throw new Error();
        gedcomSubmitter.name = childRecord.value;
        break;
      case "_EMAIL":
        if (childRecord.xref != null) throw new Error();
        if (childRecord.value == null) throw new Error();
        gedcomSubmitter.email = childRecord.value;
        break;
      default:
        reportUnparsedRecord(childRecord);
        break;
    }
  }

  return gedcomSubmitter;
}
