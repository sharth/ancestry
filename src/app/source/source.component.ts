import type {ElementRef} from '@angular/core';
import {Component, computed, input, viewChild} from '@angular/core';
import {ancestryService} from '../ancestry.service';
import {RouterModule} from '@angular/router';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {SourceEditAbbrComponent} from './source-edit-abbr.component';
import {SourceEditTitleComponent} from './source-edit-title.component';
import {SourceEditTextComponent} from './source-edit-text.component';
import {SourceEditRepositoryCitationsComponent} from './source-edit-repository-citations.component';
import {SourceEditUnknownsComponent} from './source-edit-unknowns.component';
import type {GedcomSource} from '../../gedcom/gedcomSource';
import {serializeGedcomRecordToText} from '../../gedcom/gedcomRecord.serializer';
import {serializeGedcomSourceToGedcomRecord} from '../../gedcom/gedcomSource.serializer';
import {combineLatest, map} from 'rxjs';
import {liveQuery} from 'dexie';
import {toObservable, toSignal} from '@angular/core/rxjs-interop';
import {ancestryDatabase} from '../../database/ancestry.database';

@Component({
  selector: 'app-source',
  standalone: true,
  templateUrl: './source.component.html',
  styleUrl: './source.component.css',
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    SourceEditAbbrComponent,
    SourceEditTitleComponent,
    SourceEditTextComponent,
    SourceEditRepositoryCitationsComponent,
    SourceEditUnknownsComponent,
  ],
})
export class SourceComponent {
  readonly xref = input.required<string>();
  readonly source = computed(() => ancestryService.source(this.xref()));

  readonly vm$ = toSignal(combineLatest([
    toObservable(this.xref),
    liveQuery(() => ancestryDatabase.sources.get(this.xref())), // weird. depends on the signal.
    liveQuery(() => ancestryDatabase.individuals.toArray()),
    liveQuery(() => ancestryDatabase.repositories.toArray()),
  ]).pipe(
      map(([xref, source, individuals, repositories]) => ({xref, source, individuals, repositories})),
      map(({xref, source, individuals, repositories}) => (source == null ? null : {
        xref,
        abbr: source.abbr,
        title: source.title,
        text: source.text,
        citations: individuals
            .flatMap((individual) => individual.events.map((event) => ({individual, event})))
            .flatMap(({individual, event}) => event.citations.map((citation) => ({individual, event, citation})))
            .filter(({citation}) => citation.sourceXref == xref),
        repositoryCitations: source.repositoryCitations.map((repositoryCitation) => ({
          repositoryXref: repositoryCitation.repositoryXref,
          callNumbers: repositoryCitation.callNumbers,
          repository: repositories.find((repository) => repository.xref == repositoryCitation.repositoryXref),
        })),
        unknownRecords: this.source().unknownRecords.map((unknownRecord) => ({
          ...unknownRecord,
          gedcom: serializeGedcomRecordToText(unknownRecord),
        })),
        gedcom: serializeGedcomRecordToText(serializeGedcomSourceToGedcomRecord(source)),
      })),
  ));


  get vm() {
    return this.vm$();
  }

  model?: GedcomSource;
  editDialog = viewChild.required<ElementRef<HTMLDialogElement>>('editDialog');

  openForm() {
    this.model = structuredClone(this.source());
    this.editDialog().nativeElement.showModal();
  }

  submitForm() {
    ancestryService.records.update((records) => records.set(this.xref(), this.model!));
    this.editDialog().nativeElement.close();
  }
}
