import type { GedcomFamily } from "./gedcomFamily";
import { GedcomRecord } from "./gedcomRecord";

export function serializeGedcomFamily(gedcomFamily: GedcomFamily) {
  if (gedcomFamily.gedcomRecord) {
    return gedcomFamily.gedcomRecord;
  } else {
    return new GedcomRecord(gedcomFamily.xref, "FAM", "FAM", undefined, [
      // TODO: Fill in.
    ]);
  }
}
