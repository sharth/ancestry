import { computed, signal, Injectable } from '@angular/core'
import { type GedcomIndividual, type GedcomSource, type GedcomFamily, GedcomDatabase, GedcomParser, type GedcomRepository } from '../gedcom'

@Injectable({ providedIn: 'root' })
export class AncestryService {
  readonly database = signal(new GedcomDatabase())
  readonly individuals = computed(() => Array.from(this.database().individuals.values()))
  readonly families = computed(() => Array.from(this.database().families.values()))
  readonly sources = computed(() => Array.from(this.database().sources.values()))

  // Messing around with a loading signal to show when we are async calculating
  // a new database.
  readonly loading = signal(false)

  constructor () {
    const text = localStorage.getItem('text')
    if (text != null) {
      this.loading.set(true)
      const database = new GedcomDatabase()
      const parser = new GedcomParser(database)
      void parser.parseText(text).then(() => {
        this.database.set(database)
        this.loading.set(false)
      })
    }
  }

  reset (): void {
    localStorage.removeItem('text')
    this.database.set(new GedcomDatabase())
    this.loading.set(false)
  }

  resetAndLoadFile (file: File): void {
    const streams = file.stream().pipeThrough(new TextDecoderStream()).tee()

    let text = ''
    void streams[0]
      .pipeTo(new WritableStream({
        write (chunk: string) { text += chunk }
      }))
      .then(() => {
        localStorage.setItem('text', text)
      })

    this.loading.set(true)

    const database = new GedcomDatabase()
    const parser = new GedcomParser(database)
    void parser.parseStream(streams[1]).then(() => {
      this.database.set(database)
      this.loading.set(false)
    })
  }

  individual (xref: string): GedcomIndividual {
    const individual = this.database().individuals.get(xref)
    if (individual == null) throw new Error(`No individual with xref '${xref}'`)
    return individual
  }

  family (xref: string): GedcomFamily {
    const family = this.database().families.get(xref)
    if (family == null) throw new Error(`No family with xref '${xref}'`)
    return family
  }

  repository (xref: string): GedcomRepository {
    const repository = this.database().repositories.get(xref)
    if (repository == null) throw new Error(`No repository with xref '${xref}`)
    return repository
  }

  source (xref: string): GedcomSource {
    const source = this.database().sources.get(xref)
    if (source == null) throw new Error(`No source with xref '${xref}`)
    return source
  }
}
