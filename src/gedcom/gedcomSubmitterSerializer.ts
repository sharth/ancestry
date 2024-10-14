import { GedcomRecord } from "./gedcomRecord";
import type { GedcomSubmitter } from "./gedcomSubmitter";

export function serializeGedcomSubmitter(
  gedcomSubmitter: GedcomSubmitter
): GedcomRecord {
  const childRecords: GedcomRecord[] = [];
  if (gedcomSubmitter.name) {
    childRecords.push(
      new GedcomRecord(undefined, "NAME", "", gedcomSubmitter.name, [])
    );
  }
  if (gedcomSubmitter.email) {
    childRecords.push(
      new GedcomRecord(undefined, "_EMAIL", "", gedcomSubmitter.email, [])
    );
  }
  return new GedcomRecord(
    gedcomSubmitter.xref,
    "SUBM",
    "SUBM",
    undefined,
    childRecords
  );
}
