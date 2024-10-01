import { GedcomRecord } from "./gedcomRecord";

export class GedcomMultimedia {
  constructor(public xref: string) {}

  filePath?: string;
  mediaType?: string;
}
