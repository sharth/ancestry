import {Component} from '@angular/core';
import {ancestryService} from '../ancestry.service';
import {serializeGedcomRecordToText} from '../../gedcom/gedcomRecord.serializer';
import * as rxjs from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-index',
  standalone: true,
  imports: [],
  templateUrl: './index.component.html',
  styleUrl: './index.component.css',
})
export class IndexComponent {
  readonly vm$ = rxjs.combineLatest([
    ancestryService.headers(),
    ancestryService.trailers(),
    ancestryService.individuals(),
    ancestryService.families(),
    ancestryService.repositories(),
    ancestryService.sources(),
  ]).pipe(
    rxjs.map(([headers, trailers, individuals, families, repositories, sources]) => ({
      headers: headers,
      headerText: headers
        .map((header) => header.gedcomRecord())
        .flatMap(serializeGedcomRecordToText)
        .join('\n'),
      trailers: trailers,
      trailerText: trailers
        .map((trailer) => trailer.gedcomRecord)
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
