import { type GedcomEvent } from './gedcomEvent'
import { type GedcomFamily } from './gedcomFamily'
import { type GedcomRecord } from './gedcomRecord'

export class GedcomIndividual {
  constructor (
    public xref: string) { }

  events = new Array<GedcomEvent>()
  name?: string
  surname?: string
  sex?: ('Male' | 'Female')
  familySearchId?: string
  childOfFamily?: GedcomFamily
  parentOfFamilies = new Array<GedcomFamily>()
  gedcomRecord?: GedcomRecord

  censusEvents (): GedcomEvent[] {
    return this.events.filter(gedcomEvent => gedcomEvent.type === 'Census')
  }
};
