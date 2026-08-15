import { reportUnparsedRecord } from "../util/record-unparsed-records";
import {
  parseGedcomChangeDate,
  serializeGedcomChangeDate,
  type GedcomChangeDate,
} from "./gedcomChangeDate";
import {
  filterTrivialGedcomRecords,
  newGedcomRecord,
  type GedcomRecord,
} from "./gedcomRecord";

export interface GedcomMultimedia {
  xref: string;
  filePath: string;
  mediaType: string;
  title: string;
  changeDate?: GedcomChangeDate;
}

export function newGedcomMultimedia(xref: string): GedcomMultimedia {
  return {
    xref,
    filePath: "",
    mediaType: "",
    title: "",
  };
}

export function parseGedcomMultimedia(record: GedcomRecord): GedcomMultimedia {
  if (record.abstag !== "OBJE") throw new Error();
  if (record.xref == "") throw new Error();
  if (record.value != "") throw new Error();

  const gedcomMultimedia = newGedcomMultimedia(record.xref);

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
            case "TITL":
              if (grandchildRecord.xref != "") throw new Error();
              if (grandchildRecord.value == "") throw new Error();
              if (gedcomMultimedia.title)
                throw new Error("Multiple titles are not allowed");
              gedcomMultimedia.title = grandchildRecord.value;
              grandchildRecord.children.forEach(reportUnparsedRecord);
              break;
            default:
              reportUnparsedRecord(grandchildRecord);
              break;
          }
        }
        break;
      case "CHAN":
        if (gedcomMultimedia.changeDate)
          throw new Error("Multiple change dates are not allowed");
        gedcomMultimedia.changeDate = parseGedcomChangeDate(childRecord);
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
  return newGedcomRecord({
    tag: "OBJE",
    abstag: "OBJE",
    xref: gedcomMultimedia.xref,
    children: filterTrivialGedcomRecords([
      newGedcomRecord({
        tag: "FILE",
        abstag: "OBJE.FILE",
        value: gedcomMultimedia.filePath,
        children: filterTrivialGedcomRecords([
          newGedcomRecord({
            tag: "FORM",
            abstag: "OBJE.FILE.FORM",
            value: gedcomMultimedia.mediaType,
          }),
          newGedcomRecord({
            tag: "TITL",
            abstag: "OBJE.FILE.TITL",
            value: gedcomMultimedia.title,
          }),
        ]),
      }),
      gedcomMultimedia.changeDate
        ? serializeGedcomChangeDate(gedcomMultimedia.changeDate)
        : null,
    ]),
  });
}
