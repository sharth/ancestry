import type {GedcomEvent} from './gedcomEvent';
import type {GedcomRecord} from './gedcomRecord';

export class GedcomIndividual {
  constructor(public xref: string) {}

  events: GedcomEvent[] = [];
  name?: string;
  surname?: string;
  sex?: ('Male' | 'Female');
  familySearchId?: string;

  gedcomRecord?: GedcomRecord;

  // readonly censusEvents = computed<GedcomEvent[]>(() => {
  //   return this.events.filter((gedcomEvent) => gedcomEvent.type === 'Census');
  // });
};
