import type {GedcomRecord} from './gedcomRecord';

export class GedcomSource {
  constructor(public xref: string) {}

  abbr?: string;
  title?: string;
  text?: string;
  repositoryCitations: {
    repositoryXref: string,
    callNumbers: string[],
  }[] = [];
  unknownRecords: GedcomRecord[] = [];
  multimediaXrefs: string[] = [];

  canonicalGedcomRecord?: GedcomRecord;
}
