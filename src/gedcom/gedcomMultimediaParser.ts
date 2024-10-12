import { reportUnparsedRecord } from "../util/record-unparsed-records";
import { GedcomMultimedia } from "./gedcomMultimedia";
import type { GedcomRecord } from "./gedcomRecord";

export function parseGedcomMultimedia(record: GedcomRecord): GedcomMultimedia {
  if (record.abstag !== "OBJE") throw new Error();
  if (record.xref == null) throw new Error();
  if (record.value != null) throw new Error();

  const gedcomMultimedia = new GedcomMultimedia(record.xref);

  for (const childRecord of record.children) {
    switch (childRecord.tag) {
      case "FILE":
        if (childRecord.xref != null) throw new Error();
        if (gedcomMultimedia.filePath != null)
          throw new Error("Multiple filePaths are not supported.");
        gedcomMultimedia.filePath = childRecord.value;

        for (const grandchildRecord of childRecord.children) {
          switch (grandchildRecord.tag) {
            case "FORM":
              if (grandchildRecord.xref != null) throw new Error();
              if (gedcomMultimedia.mediaType != null)
                throw new Error("Multiple mediaTypes are not allowed");
              gedcomMultimedia.mediaType = grandchildRecord.value;
              grandchildRecord.children.forEach(reportUnparsedRecord);
              break;
            default:
              reportUnparsedRecord(grandchildRecord);
              break;
          }
        }
        break;
      default:
        reportUnparsedRecord(childRecord);
        break;
    }
  }

  return gedcomMultimedia;
}
