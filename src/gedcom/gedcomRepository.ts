import {type GedcomRecord} from './gedcomRecord';
import {type GedcomSource} from './gedcomSource';

export class GedcomRepository {
  constructor(
    public xref: string) { }

  name?: string;
  sources: GedcomSource[] = [];
  gedcomRecord?: GedcomRecord;
};
