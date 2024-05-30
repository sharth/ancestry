import {type GedcomEvent} from './gedcomEvent';
import {type GedcomIndividual} from './gedcomIndividual';
import {type GedcomRecord} from './gedcomRecord';

export class GedcomFamily {
  constructor(public xref: string) { }

  husband?: GedcomIndividual;
  wife?: GedcomIndividual;
  children: GedcomIndividual[] = [];
  events: GedcomEvent[] = [];
  gedcomRecord?: GedcomRecord;

  parents(): GedcomIndividual[] {
    return [this.husband, this.wife].filter((e): e is NonNullable<typeof e> => e != null);
  }
};
