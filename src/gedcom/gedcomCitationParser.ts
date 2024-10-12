import type { GedcomRecord } from "./gedcomRecord";
import { GedcomCitation } from "./gedcomCitation";
import { reportUnparsedRecord } from "../util/record-unparsed-records";

export function parseGedcomCitation(
  gedcomRecord: GedcomRecord
): GedcomCitation {
  if (gedcomRecord.tag !== "SOUR") throw new Error();
  if (gedcomRecord.xref != null) throw new Error();
  if (gedcomRecord.value == null) throw new Error();

  const gedcomCitation = new GedcomCitation(gedcomRecord.value);

  for (const childRecord of gedcomRecord.children) {
    switch (childRecord.tag) {
      case "_TMPLT":
      case "_QUAL":
        break;
      case "QUAY":
        childRecord.children.forEach(reportUnparsedRecord);
        gedcomCitation.quality = childRecord.value;
        break;
      case "OBJE":
        childRecord.children.forEach(reportUnparsedRecord);
        gedcomCitation.obje = childRecord.value;
        break;
      case "NAME":
        childRecord.children.forEach(reportUnparsedRecord);
        gedcomCitation.name = childRecord.value;
        break;
      case "NOTE":
        childRecord.children.forEach(reportUnparsedRecord);
        gedcomCitation.note = childRecord.value;
        break;
      case "PAGE":
        childRecord.children.forEach(reportUnparsedRecord);
        gedcomCitation.page = childRecord.value;
        break;
      case "DATA":
        if (childRecord.xref != null) throw new Error();
        if (childRecord.value != null) throw new Error();
        for (const grandchildRecord of childRecord.children) {
          switch (grandchildRecord.tag) {
            case "TEXT":
              if (grandchildRecord.xref != null) throw new Error();
              if (grandchildRecord.value == null) throw new Error();
              gedcomCitation.text = grandchildRecord.value;
              break;
            default:
              reportUnparsedRecord(grandchildRecord);
          }
        }
        break;
      default:
        reportUnparsedRecord(childRecord);
        break;
    }
  }

  return gedcomCitation;
}
