import type { GedcomRecord } from "./gedcomRecord";

export interface GedcomSource {
  xref: string;
  abbr?: string;
  title?: string;
  text?: string;
  repositoryCitations: {
    repositoryXref: string;
    callNumbers: string[];
  }[];
  unknownRecords: GedcomRecord[];
  multimediaLinks: {
    multimediaXref: string;
    title?: string;
  }[];
}
