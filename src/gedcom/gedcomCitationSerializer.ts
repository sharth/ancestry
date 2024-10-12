import type { GedcomCitation } from "./gedcomCitation";
import { GedcomRecord } from "./gedcomRecord";

export function serializeGedcomCitation(
  gedcomCitation: GedcomCitation
): GedcomRecord {
  return new GedcomRecord(
    undefined,
    "SOUR",
    "",
    gedcomCitation.sourceXref,
    [
      gedcomCitation.obje
        ? new GedcomRecord(undefined, "OBJE", "", gedcomCitation.obje, [])
        : null,
      gedcomCitation.name
        ? new GedcomRecord(undefined, "NAME", "", gedcomCitation.name, [])
        : null,
      gedcomCitation.note
        ? new GedcomRecord(undefined, "NOTE", "", gedcomCitation.note, [])
        : null,
      gedcomCitation.page
        ? new GedcomRecord(undefined, "PAGE", "", gedcomCitation.page, [])
        : null,
      gedcomCitation.text
        ? new GedcomRecord(undefined, "DATA", "", undefined, [
            new GedcomRecord(undefined, "TEXT", "", gedcomCitation.text, []),
          ])
        : null,
      gedcomCitation.quality
        ? new GedcomRecord(undefined, "QUAY", "", gedcomCitation.quality, [])
        : null,
    ].filter((record) => record != null)
  );
}
