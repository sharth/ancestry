import {type GedcomSource} from './gedcomSource';

export class GedcomCitation {
  constructor(public source: GedcomSource) { }
  name?: string;
  obje?: string;
  note?: string;
  text?: string;
  page?: string;
}
