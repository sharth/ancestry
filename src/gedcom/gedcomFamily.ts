import type {GedcomEvent} from './gedcomEvent';
import type {GedcomIndividual} from './gedcomIndividual';
import type {GedcomRecord} from './gedcomRecord';

export class GedcomFamily {
  constructor(public xref: string) { }

  husbandXref?: string;
  wifeXref?: string;
  childXrefs: string[] = [];
  events: GedcomEvent[] = [];
  gedcomRecord?: GedcomRecord;

  parentXrefs(): string[] {
    return [this.husbandXref, this.wifeXref].filter((e): e is NonNullable<typeof e> => e != null);
  }
};
