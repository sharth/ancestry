import { reportUnparsedRecord } from "../util/record-unparsed-records";
import type { GedcomRecord } from "./gedcomRecord";

export interface GedcomNote {
  text: string;
}

export function parseGedcomNote(gedcomRecord: GedcomRecord): GedcomNote {
  if (gedcomRecord.tag !== "NOTE") throw new Error();
  if (gedcomRecord.xref != "") throw new Error();
  if (gedcomRecord.value == "") throw new Error();

  const gedcomNote: GedcomNote = {
    text: gedcomRecord.value,
  };

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
  return {
    tag: "NOTE",
    abstag: "",
    xref: "",
    value: gedcomNote.text,
    children: [],
  };
}
