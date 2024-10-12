import type { GedcomRecord } from "./gedcomRecord";
import { GedcomTrailer } from "./gedcomTrailer";

export function parseGedcomTrailer(gedcomRecord: GedcomRecord): GedcomTrailer {
  if (gedcomRecord.abstag !== "TRLR") throw new Error();
  if (gedcomRecord.xref != null) throw new Error();
  if (gedcomRecord.value != null) throw new Error();
  if (gedcomRecord.children.length != 0) throw new Error();

  return new GedcomTrailer();
}
