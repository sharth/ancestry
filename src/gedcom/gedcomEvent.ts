import { type GedcomCitation } from './gedcomCitation'
import { type GedcomRecord } from './gedcomRecord'

export class GedcomEvent {
  constructor (
    public type: string) {}

  address?: string
  place?: string
  cause?: string
  date?: string
  dateDescriptive?: string
  value?: string
  citations = new Array<GedcomCitation>()
  record?: GedcomRecord

  gedcom (): string | undefined {
    return this.record?.gedcom()?.join('\n')
  }
}
