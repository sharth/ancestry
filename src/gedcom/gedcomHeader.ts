import type { GedcomRecord } from "./gedcomRecord";

export interface GedcomHeader {
  record: GedcomRecord;
}

export function parseGedcomHeader(record: GedcomRecord): GedcomHeader {
  if (record.abstag !== "HEAD") throw new Error();
  if (record.xref != "") throw new Error();
  if (record.value != "") throw new Error();

  return {
    record,
  };
}

export function serializeGedcomHeader(
  gedcomHeader: GedcomHeader,
): GedcomRecord {
  return gedcomHeader.record;
}
