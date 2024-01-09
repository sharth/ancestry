import { type GedcomEvent } from './gedcomEvent'
import { type GedcomIndividual } from './gedcomIndividual'

export class GedcomFamily {
  constructor (public xref: string) { }
  husband?: GedcomIndividual
  wife?: GedcomIndividual
  children = new Array<GedcomIndividual>()
  events = new Array<GedcomEvent>()

  parents (): GedcomIndividual[] {
    return [this.husband, this.wife].filter((e): e is NonNullable<typeof e> => e != null)
  }
};
