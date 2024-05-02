import { computed, signal, Injectable } from '@angular/core'
import { GedcomDatabase } from '../gedcom/gedcomDatabase'
import { GedcomFamily } from '../gedcom/gedcomFamily'
import { GedcomIndividual } from '../gedcom/gedcomIndividual'
import { GedcomRepository } from '../gedcom/gedcomRepository'
import { GedcomSource } from '../gedcom/gedcomSource'

@Injectable({ providedIn: 'root' })
export class AncestryService {
  readonly database = signal(new GedcomDatabase())
  readonly individuals = computed(() => Array.from(this.database().individuals.values()))
  readonly families = computed(() => Array.from(this.database().families.values()))
  readonly sources = computed(() => Array.from(this.database().sources.values()))

  individual(xref: string): GedcomIndividual {
    const individual = this.database().individuals.get(xref)
    if (individual == null) throw new Error(`No individual with xref '${xref}'`)
    return individual
  }

  family(xref: string): GedcomFamily {
    const family = this.database().families.get(xref)
    if (family == null) throw new Error(`No family with xref '${xref}'`)
    return family
  }

  repository(xref: string): GedcomRepository {
    const repository = this.database().repositories.get(xref)
    if (repository == null) throw new Error(`No repository with xref '${xref}`)
    return repository
  }

  source(xref: string): GedcomSource {
    const source = this.database().sources.get(xref)
    if (source == null) throw new Error(`No source with xref '${xref}`)
    return source
  }
}
