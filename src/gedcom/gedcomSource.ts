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

  canonicalGedcomRecord?: GedcomRecord;

  clone(): GedcomSource {
    const cloned = new GedcomSource(this.xref);
    cloned.abbr = structuredClone(this.abbr);
    cloned.title = structuredClone(this.title);
    cloned.text = structuredClone(this.text);
    cloned.repositoryCitations = structuredClone(this.repositoryCitations);
    cloned.unknownRecords = [...this.unknownRecords];
    cloned.canonicalGedcomRecord = undefined;
    return cloned;
  }
}
