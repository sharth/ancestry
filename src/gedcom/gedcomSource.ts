import { type GedcomRecord } from './gedcomRecord'
import { type GedcomRepository } from './gedcomRepository'

export class GedcomSource {
  constructor(
    public xref: string) { }

  shortTitle?: string
  fullTitle?: string
  text?: string
  bibl?: string
  gedcomRecord?: GedcomRecord

  repositories = new Array<{
    repository: GedcomRepository
    callNumbers: string[]
  }>()
};
