import {Component} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ancestryDatabase } from '../../database/ancestry.database';
import * as rxjs from 'rxjs';
import * as dexie from 'dexie';
import * as gedcom from '../../gedcom';

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
        .map(gedcom.serializeGedcomHeaderToGedcomRecord)
        .flatMap(gedcom.serializeGedcomRecordToText)
        .join('\n'),
      trailers: trailers,
      trailerText: trailers
        .map(gedcom.serializeGedcomTrailerToGedcomRecord)
        .flatMap(gedcom.serializeGedcomRecordToText)
        .join('\n'),
      individuals,
      families,
      repositories,
      sources,
    }))
  )
  
  readonly vm = toSignal(this.vm$);
}
