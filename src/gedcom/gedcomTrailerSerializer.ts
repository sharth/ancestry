import type { GedcomRecord } from "./gedcomRecord";
import type { GedcomTrailer } from "./gedcomTrailer";

export function serializeGedcomTrailer(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  gedcomTrailer: GedcomTrailer
): GedcomRecord {
  return {
    tag: "TRLR",
    abstag: "TRLR",
    children: [],
  };
}
