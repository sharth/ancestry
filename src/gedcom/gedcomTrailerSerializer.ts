import { GedcomRecord } from "./gedcomRecord";
import type { GedcomTrailer } from "./gedcomTrailer";

export function serializeGedcomTrailer(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  gedcomTrailer: GedcomTrailer
): GedcomRecord {
  return new GedcomRecord(undefined, "TRLR", "TRLR", undefined, []);
}
