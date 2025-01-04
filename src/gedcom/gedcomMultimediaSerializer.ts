import type { GedcomMultimedia } from "./gedcomMultimedia";
import type { GedcomRecord } from "./gedcomRecord";

export function serializeGedcomMultimedia(
  gedcomMultimedia: GedcomMultimedia
): GedcomRecord {
  return {
    xref: gedcomMultimedia.xref,
    tag: "OBJE",
    abstag: "OBJE",
    children: [
      {
        tag: "FILE",
        abstag: "OBJE.FILE",
        value: gedcomMultimedia.filePath,
        children: [
          {
            tag: "FORM",
            abstag: "OBJE.FILE.FORM",
            value: gedcomMultimedia.mediaType,
            children: [],
          },
        ],
      },
    ],
  };
}
