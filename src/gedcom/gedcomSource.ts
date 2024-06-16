import type {GedcomRecord} from './gedcomRecord';

export class GedcomSource {
  constructor(
    public xref: string) { }

  shortTitle?: string;
  fullTitle?: string;
  text?: string;
  bibl?: string;
  gedcomRecord?: GedcomRecord;

  repositories: {
    repositoryXref: string,
    callNumbers: string[],
  }[] = [];
};
