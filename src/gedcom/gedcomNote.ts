import { reportUnparsedRecord } from "../util/record-unparsed-records";
import { newGedcomRecord, type GedcomRecord } from "./gedcomRecord";

export interface GedcomNote {
  text: string;
}

export function newGedcomNote(
  fieldsToUpdate: Partial<GedcomNote> = {},
): GedcomNote {
  return {
    text: "",
    ...fieldsToUpdate,
  };
}

export function parseGedcomNote(gedcomRecord: GedcomRecord): GedcomNote {
  if (gedcomRecord.tag !== "NOTE") throw new Error();
  if (gedcomRecord.xref != "") throw new Error();
  if (gedcomRecord.value == "") throw new Error();

  const gedcomNote = newGedcomNote({
    text: gedcomRecord.value,
  });

  for (const childRecord of gedcomRecord.children) {
    switch (childRecord.tag) {
      default:
        reportUnparsedRecord(childRecord);
        break;
    }
  }

  return gedcomNote;
}

export function serializeGedcomNote(gedcomNote: GedcomNote): GedcomRecord {
  return newGedcomRecord({ tag: "NOTE", value: gedcomNote.text });
}
