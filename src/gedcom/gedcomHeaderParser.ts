import { GedcomHeader } from "./gedcomHeader";
import type { GedcomRecord } from "./gedcomRecord";

export function parseGedcomHeader(record: GedcomRecord): GedcomHeader {
  if (record.abstag !== "HEAD") throw new Error();
  if (record.xref != null) throw new Error();
  if (record.value != null) throw new Error();

  return new GedcomHeader(record);
}
