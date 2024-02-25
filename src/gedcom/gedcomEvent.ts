import { type GedcomCitation } from './gedcomCitation'
import { type GedcomRecord } from './gedcomRecord'

export class GedcomEvent {
  constructor (
    public type: string,
    public gedcomRecord: GedcomRecord) {}

  address?: string
  place?: string
  cause?: string
  date?: string
  dateDescriptive?: string
  value?: string
  citations = new Array<GedcomCitation>()
}
