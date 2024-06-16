import type {GedcomEvent} from './gedcomEvent';
import type {GedcomFamily} from './gedcomFamily';
import type {GedcomRecord} from './gedcomRecord';

export class GedcomIndividual {
  constructor(public xref: string) { }

  events: GedcomEvent[] = [];
  name?: string;
  surname?: string;
  sex?: ('Male' | 'Female');
  familySearchId?: string;
  childOfFamilyXref?: string;
  parentOfFamilyXrefs: string[] = [];
  gedcomRecord?: GedcomRecord;

  censusEvents(): GedcomEvent[] {
    return this.events.filter((gedcomEvent) => gedcomEvent.type === 'Census');
  }
};
