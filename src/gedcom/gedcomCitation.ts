import type {GedcomRecord} from './gedcomRecord';

export class GedcomCitation {
  constructor(public sourceXref: string) {}

  name?: string;
  obje?: string;
  note?: string;
  text?: string;
  page?: string;

  gedcomRecord?: GedcomRecord;
}
