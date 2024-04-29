import { computed, signal, Injectable } from '@angular/core'
import { type GedcomIndividual, type GedcomSource, type GedcomFamily, GedcomDatabase, GedcomParser, type GedcomRepository, GedcomRecord } from '../gedcom'
import { ChunkStreamByNewline } from '../gedcom/chunkStreamByNewline'
import { ChunkStreamByRecord } from '../gedcom/chunkStreamByRecord'

@Injectable({ providedIn: 'root' })
export class AncestryService {
  readonly database = signal(new GedcomDatabase())
  readonly individuals = computed(() => Array.from(this.database().individuals.values()))
  readonly families = computed(() => Array.from(this.database().families.values()))
  readonly sources = computed(() => Array.from(this.database().sources.values()))

  // Messing around with a loading signal to show when we are async calculating
  // a new database.
  readonly loading = signal(false)

  constructor() {
    const text = localStorage.getItem('text')
    if (text != null) {
      this.loading.set(true)
      const database = new GedcomDatabase()
      const parser = new GedcomParser(database)
      void parseText(parser, text).then(() => {
        this.database.set(database)
        this.loading.set(false)
      })
    }
  }

  reset(): void {
    localStorage.removeItem('text')
    this.database.set(new GedcomDatabase())
  }

  resetAndLoadFile(file: File): void {
    const streams = file.stream().pipeThrough(new TextDecoderStream()).tee()

    // One copy of the stream will be written to localStorage.
    let text = ''
    void streams[0]
      .pipeTo(new WritableStream({
        write(chunk: string) { text += chunk }
      }))
      .then(() => {
        localStorage.setItem('text', text)
      })

    // The other copy will be written to the database.
    const database = new GedcomDatabase()
    const parser = new GedcomParser(database)
    void parseStream(parser, streams[1]).then(() => {
      this.database.set(database)
    })
  }

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

async function parseText(parser: GedcomParser, text: string): Promise<void> {
  const stream = new ReadableStream<string>({
    start(controller) {
      controller.enqueue(text)
      controller.close()
    }
  })
  await parseStream(parser, stream)
}

async function parseStream(parser: GedcomParser, stream: ReadableStream<string>): Promise<void> {
  await stream
    .pipeThrough(new ChunkStreamByNewline())
    .pipeThrough(new ChunkStreamByRecord())
    .pipeTo(new WritableStream({
      write: (gedcomRecord: GedcomRecord) => { parser.parse(gedcomRecord) }
    }))
}
