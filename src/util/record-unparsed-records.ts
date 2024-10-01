import type { GedcomRecord } from "../gedcom/gedcomRecord";

const unparsedTags = new Set<string>();

export function reportUnparsedRecord(gedcomRecord: GedcomRecord): void {
  if (!unparsedTags.has(gedcomRecord.abstag)) {
    console.warn("Unparsed tag ", gedcomRecord.abstag);
    unparsedTags.add(gedcomRecord.abstag);
  }
}
