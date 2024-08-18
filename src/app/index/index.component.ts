import {Component} from '@angular/core';
import {ancestryService} from '../ancestry.service';
import {serializeGedcomRecordToText} from '../../gedcom/gedcomRecord.serializer';
import * as rxjs from 'rxjs';
import * as dexie from 'dexie';
import { toSignal } from '@angular/core/rxjs-interop';
import { ancestryDatabase } from '../../database/ancestry.database';
import { serializeGedcomHeaderToGedcomRecord } from '../../gedcom/gedcomHeader';
import { serializeGedcomTrailerToGedcomRecord } from '../../gedcom/gedcomTrailer';

@Component({
  selector: 'app-index',
  standalone: true,
  imports: [],
  templateUrl: './index.component.html',
  styleUrl: './index.component.css',
})
export class IndexComponent {
  readonly vm$ = rxjs.combineLatest([
    dexie.liveQuery(() => ancestryDatabase.headers.toArray()),
    dexie.liveQuery(() => ancestryDatabase.trailers.toArray()),
    dexie.liveQuery(() => ancestryDatabase.individuals.toArray()),
    dexie.liveQuery(() => ancestryDatabase.families.toArray()),
    dexie.liveQuery(() => ancestryDatabase.repositories.toArray()),
    dexie.liveQuery(() => ancestryDatabase.sources.toArray()),
  ]).pipe(
    rxjs.map(([headers, trailers, individuals, families, repositories, sources]) => ({
      headers: headers,
      headerText: headers
        .map(serializeGedcomHeaderToGedcomRecord)
        .flatMap(serializeGedcomRecordToText)
        .join('\n'),
      trailers: trailers,
      trailerText: trailers
        .map(serializeGedcomTrailerToGedcomRecord)
        .flatMap(serializeGedcomRecordToText)
        .join('\n'),
      individuals,
      families,
      repositories,
      sources,
    }))
  )
  
  readonly vm = toSignal(this.vm$);
}
