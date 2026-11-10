import { reportUnparsedRecord } from "../util/record-unparsed-records";
import {
  parseGedcomChangeDate,
  serializeGedcomChangeDate,
  type GedcomChangeDate,
} from "./gedcomChangeDate";
import {
  parseGedcomCreationDate,
  serializeGedcomCreationDate,
  type GedcomCreationDate,
} from "./gedcomCreationDate";
import {
  filterTrivialGedcomRecords,
  gedcomRecordsEqual,
  newGedcomRecord,
  type GedcomRecord,
} from "./gedcomRecord";

export interface GedcomMultimedia {
  xref: string;
  filePath: string;
  mediaType: string;
  title: string;
  changeDate?: GedcomChangeDate;
  creationDate?: GedcomCreationDate;
}

export function newGedcomMultimedia(
  fieldsToUpdate: Partial<GedcomMultimedia> & Pick<GedcomMultimedia, "xref">,
): GedcomMultimedia {
  return {
    filePath: "",
    mediaType: "",
    title: "",
    ...fieldsToUpdate,
  };
}

export function parseGedcomMultimedia(record: GedcomRecord): GedcomMultimedia {
  if (record.tag !== "OBJE") throw new Error();
  if (record.xref == "") throw new Error();
  if (record.value != "") throw new Error();

  const gedcomMultimedia = newGedcomMultimedia({
    xref: record.xref,
  });

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
      case "CREA":
        if (gedcomMultimedia.creationDate)
          throw new Error("Multiple creation dates are not allowed");
        gedcomMultimedia.creationDate = parseGedcomCreationDate(childRecord);
        break;
      default:
        reportUnparsedRecord(childRecord);
        break;
    }
  }

  // Seed the serialization cache. When the multimedia record serializes back to
  // exactly the record it was parsed from, cache that record itself, so
  // comparing an unedited multimedia record against the file is an identity check.
  const serialized = serializeGedcomMultimedia(gedcomMultimedia);
  serializedMultimedias.set(
    gedcomMultimedia,
    gedcomRecordsEqual(serialized, record) ? record : serialized,
  );

  return gedcomMultimedia;
}

// Each multimedia record's serialization, by object. Multimedia records are
// only ever changed through immer, which makes a new object for an edited
// one and keeps an unedited one as the same object, so a cached
// serialization never goes stale. See serializeGedcomIndividual.
const serializedMultimedias = new WeakMap<GedcomMultimedia, GedcomRecord>();

export function serializeGedcomMultimedia(
  gedcomMultimedia: GedcomMultimedia,
): GedcomRecord {
  return serializedMultimedias.getOrInsertComputed(gedcomMultimedia, () =>
    newGedcomRecord({
      tag: "OBJE",
      xref: gedcomMultimedia.xref,
      children: filterTrivialGedcomRecords([
        newGedcomRecord({
          tag: "FILE",
          value: gedcomMultimedia.filePath,
          children: filterTrivialGedcomRecords([
            newGedcomRecord({
              tag: "FORM",
              value: gedcomMultimedia.mediaType,
            }),
            newGedcomRecord({
              tag: "TITL",
              value: gedcomMultimedia.title,
            }),
          ]),
        }),
        gedcomMultimedia.changeDate
          ? serializeGedcomChangeDate(gedcomMultimedia.changeDate)
          : null,
        gedcomMultimedia.creationDate
          ? serializeGedcomCreationDate(gedcomMultimedia.creationDate)
          : null,
      ]),
    }),
  );
}
