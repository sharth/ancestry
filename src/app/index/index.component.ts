import type {Signal} from '@angular/core';
import {Component, computed} from '@angular/core';
import {ancestryService} from '../ancestry.service';
import {serializeGedcomRecordToText} from '../../gedcom/gedcomRecord.serializer';

@Component({
  selector: 'app-index',
  standalone: true,
  imports: [],
  templateUrl: './index.component.html',
  styleUrl: './index.component.css',
})
export class IndexComponent {
  readonly ancestryService = ancestryService;

  headerText: Signal<string> = computed(() =>
    this.ancestryService.headers()
        .map((header) => header.gedcomRecord())
        .flatMap(serializeGedcomRecordToText)
        .join('\n'));

  trailerText: Signal<string> = computed(() =>
    this.ancestryService.trailers()
        .map((header) => header.gedcomRecord)
        .flatMap(serializeGedcomRecordToText)
        .join('\n'));
}
