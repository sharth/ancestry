import { type GedcomEvent } from './gedcomEvent'
import { type GedcomFamily } from './gedcomFamily'

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

  censusEvents (): GedcomEvent[] {
    return this.events.filter(gedcomEvent => gedcomEvent.type === 'Census')
  }
};
