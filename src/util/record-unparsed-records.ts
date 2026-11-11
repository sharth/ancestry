import type { Immutable } from "immer";

import type { GedcomRecord } from "../gedcom/gedcomRecord";

// Records the parsers didn't understand, waiting for warnUnparsedRecords.
// A record doesn't know where it sits in the file, so its path (such as
// INDI.BIRT._FOO) is found afterwards by walking the file's records.
const unparsedRecords = new Set<Immutable<GedcomRecord>>();
const unparsedTags = new Set<string>();

export function reportUnparsedRecord(
  gedcomRecord: Immutable<GedcomRecord>,
): void {
  unparsedRecords.add(gedcomRecord);
}

// Warn, once per path, about each reported record found in gedcomRecords.
export function warnUnparsedRecords(gedcomRecords: GedcomRecord[]): void {
  if (unparsedRecords.size == 0) return;
  const path: string[] = [];
  const visit = (gedcomRecord: GedcomRecord) => {
    path.push(gedcomRecord.tag);
    if (unparsedRecords.has(gedcomRecord)) {
      const abstag = path.join(".");
      if (!unparsedTags.has(abstag)) {
        console.warn("Unparsed tag ", abstag);
        unparsedTags.add(abstag);
      }
    }
    gedcomRecord.children.forEach(visit);
    path.pop();
  };
  gedcomRecords.forEach(visit);
  unparsedRecords.clear();
}
