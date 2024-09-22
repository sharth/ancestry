import { GedcomRecord } from "./gedcomRecord";

export class GedcomMultimedia {
  constructor(public xref: string) {}

  filePath?: string;
  mediaType?: string;
};

export function serializeGedcomMultimediaToGedcomRecord(gedcomMultimedia: GedcomMultimedia): GedcomRecord {
    return new GedcomRecord(0, gedcomMultimedia.xref, "OBJE", "OBJE", undefined, [
        new GedcomRecord(1, undefined, "FILE", "OBJE.FILE", gedcomMultimedia.filePath, [
            new GedcomRecord(2, undefined, "FORM", "OBJE.FILE.FORM", gedcomMultimedia.mediaType, [])
        ])
    ]);
}