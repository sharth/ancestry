import { CommonModule } from '@angular/common'
import { Component, inject, signal } from '@angular/core'
import { RouterLink, RouterOutlet } from '@angular/router'
import { AncestryService } from './ancestry.service'
import { ChunkStreamByNewline } from '../gedcom/chunkStreamByNewline'
import { ChunkStreamByRecord } from '../gedcom/chunkStreamByRecord'
import { GedcomDatabase } from '../gedcom/gedcomDatabase'
import { GedcomParser } from '../gedcom/gedcomParser'
import { GedcomRecord } from '../gedcom/gedcomRecord'

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  ancestryService = inject(AncestryService)
  loading = signal(false)

  ngOnInit() {
    const text = localStorage.getItem('text')
    if (text != null) {
      this.parseSomeText(text)
    }
  }

  gedcomFileChanged(el: EventTarget | null): void {
    if (!(el instanceof HTMLInputElement)) {
      throw new Error(`Expected el to be an HTMLInputElement, was ${el?.constructor?.name || el}`)
    }
    if (!(el.files instanceof FileList)) {
      throw new Error(`Expected el.files to be a FileList, was ${el?.constructor?.name || el}`)
    }

    if (el.files.length === 0) {
      this.reset()
    } else if (el.files.length === 1) {
      this.parseSomeFile(el.files[0])
    } else {
      throw new Error(`Expected el.files.length to be <= 1, was ${el.files.length}`)
    }
  }

  reset(): void {
    this.ancestryService.database.set(new GedcomDatabase())
  }

  async parseSomeText(text: string): Promise<void> {
    const stream = new ReadableStream<string>({
      start(controller) {
        controller.enqueue(text)
        controller.close()
      }
    })
    return this.parseSomeStream(stream)
  }

  async parseSomeFile(file: File): Promise<void> {
    const stream = file.stream().pipeThrough(new TextDecoderStream());
    return this.parseSomeStream(stream)
  }

  async parseSomeStream(stream: ReadableStream<string>): Promise<void> {
    this.loading.set(true)
    const [localStorageStream, databaseStream] = stream.tee()

    // One copy of the stream will be written to localStorage.
    let text = ''
    const localStoragePromise = localStorageStream
      .pipeTo(new WritableStream({
        write(chunk: string) { text += chunk }
      }))
      .then(() => {
        localStorage.setItem('text', text)
      })

    // One copy of the stream will be written to the ancestryService.
    const database = new GedcomDatabase()
    const parser = new GedcomParser(database)
    const databasePromise = databaseStream
      .pipeThrough(new ChunkStreamByNewline())
      .pipeThrough(new ChunkStreamByRecord())
      .pipeTo(new WritableStream({
        write: (gedcomRecord: GedcomRecord) => {
          parser.parse(gedcomRecord)
        }
      })).then(() => {
        this.ancestryService.database.set(database)
      })

    return Promise.all([localStoragePromise, databasePromise]).then(() => {
      this.loading.set(false);
    })
  }
}
