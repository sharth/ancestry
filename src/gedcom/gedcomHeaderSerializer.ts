import type { GedcomHeader } from "./gedcomHeader";
import type { GedcomRecord } from "./gedcomRecord";

export function serializeGedcomHeader(
  gedcomHeader: GedcomHeader
): GedcomRecord {
  return gedcomHeader.record;
}
