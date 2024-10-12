import type { GedcomMultimedia } from "./gedcomMultimedia";
import { GedcomRecord } from "./gedcomRecord";

export function serializeGedcomMultimedia(
  gedcomMultimedia: GedcomMultimedia
): GedcomRecord {
  return new GedcomRecord(gedcomMultimedia.xref, "OBJE", "OBJE", undefined, [
    new GedcomRecord(
      undefined,
      "FILE",
      "OBJE.FILE",
      gedcomMultimedia.filePath,
      [
        new GedcomRecord(
          undefined,
          "FORM",
          "OBJE.FILE.FORM",
          gedcomMultimedia.mediaType,
          []
        ),
      ]
    ),
  ]);
}
