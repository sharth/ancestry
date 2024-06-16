import type {GedcomRecord} from './gedcomRecord';

export class GedcomRepository {
  constructor(public xref: string) { }

  name?: string;
  sourceXrefs: string[] = [];
  gedcomRecord?: GedcomRecord;
};
