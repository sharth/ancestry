import { reportUnparsedRecord } from "../util/record-unparsed-records";
import type { GedcomRecord } from "./gedcomRecord";

export interface GedcomMultimedia {
  xref: string;
  filePath: string;
  mediaType: string;
}

export function parseGedcomMultimedia(record: GedcomRecord): GedcomMultimedia {
  if (record.abstag !== "OBJE") throw new Error();
  if (record.xref == "") throw new Error();
  if (record.value != "") throw new Error();

  const gedcomMultimedia: GedcomMultimedia = {
    xref: record.xref,
    filePath: "",
    mediaType: "",
  };

  for (const childRecord of record.children) {
    switch (childRecord.tag) {
      case "FILE":
        if (childRecord.xref != "") throw new Error();
        if (gedcomMultimedia.filePath != "")
          throw new Error("Multiple filePaths are not supported.");
        gedcomMultimedia.filePath = childRecord.value;

        for (const grandchildRecord of childRecord.children) {
          switch (grandchildRecord.tag) {
            case "FORM":
              if (grandchildRecord.xref != "") throw new Error();
              if (grandchildRecord.value == "") throw new Error();
              if (gedcomMultimedia.mediaType != "")
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

export function serializeGedcomMultimedia(
  gedcomMultimedia: GedcomMultimedia,
): GedcomRecord {
  return {
    tag: "OBJE",
    abstag: "OBJE",
    xref: gedcomMultimedia.xref,
    value: "",
    children: [
      {
        tag: "FILE",
        abstag: "OBJE.FILE",
        xref: "",
        value: gedcomMultimedia.filePath,
        children: [
          {
            tag: "FORM",
            abstag: "OBJE.FILE.FORM",
            xref: "",
            value: gedcomMultimedia.mediaType,
            children: [],
          },
        ].filter((record) => record.value || record.children.length),
      },
    ].filter((record) => record.value || record.children.length),
  };
}
