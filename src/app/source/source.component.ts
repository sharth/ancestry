import type { ElementRef} from '@angular/core';
import {signal} from '@angular/core';
import {Component, input, viewChild} from '@angular/core';
import {RouterModule} from '@angular/router';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {SourceEditAbbrComponent} from './source-edit-abbr.component';
import {SourceEditTitleComponent} from './source-edit-title.component';
import {SourceEditTextComponent} from './source-edit-text.component';
import {SourceEditRepositoryCitationsComponent} from './source-edit-repository-citations.component';
import {SourceEditUnknownsComponent} from './source-edit-unknowns.component';
import {serializeGedcomRecordToText} from '../../gedcom/gedcomRecord.serializer';
import {serializeGedcomSourceToGedcomRecord} from '../../gedcom/gedcomSource.serializer';
import {toObservable} from '@angular/core/rxjs-interop';
import {ancestryDatabase} from '../../database/ancestry.database';
import * as rxjs from 'rxjs';
import * as dexie from 'dexie';
import type { GedcomSource } from '../../gedcom/gedcomSource';

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
  readonly source$ = toObservable(this.xref).pipe(
    rxjs.switchMap((xref) => dexie.liveQuery(() => ancestryDatabase.sources.get(xref))),
  );

  readonly vm$ = toObservable(this.xref).pipe(
    rxjs.switchMap((xref) => dexie.liveQuery(() => ancestryDatabase.sources.get(xref))),
    rxjs.combineLatestWith(
      dexie.liveQuery(() => ancestryDatabase.individuals.toArray()),
      dexie.liveQuery(() => ancestryDatabase.repositories.toArray()),
    ),
    rxjs.map(([source, individuals, repositories]) => {
      if (source == null)
        return null;
      return {
        ...source,
        citations: individuals
            .flatMap((individual) => individual.events.map((event) => ({individual, event})))
            .flatMap(({individual, event}) => event.citations.map((citation) => ({individual, event, citation})))
            .filter(({citation}) => citation.sourceXref == source.xref),
        repositoryCitations: source.repositoryCitations.map((repositoryCitation) => ({
          repositoryXref: repositoryCitation.repositoryXref,
          callNumbers: repositoryCitation.callNumbers,
          repository: repositories.find((repository) => repository.xref == repositoryCitation.repositoryXref),
        })),
        unknownRecords: source.unknownRecords.map((unknownRecord) => ({
          ...unknownRecord,
          gedcom: serializeGedcomRecordToText(unknownRecord),
        })),
        gedcom: serializeGedcomRecordToText(serializeGedcomSourceToGedcomRecord(source)),
      }
    }),
  );

  readonly model$ = signal<GedcomSource | undefined>(undefined);
  readonly editDialog = viewChild.required<ElementRef<HTMLDialogElement>>('editDialog');

  openForm() {
    void rxjs.firstValueFrom(this.source$).then((source) => {
      if (source == null) throw new Error();
      this.model$.set(source);
      this.editDialog().nativeElement.showModal();
    })
  }

  submitForm() {
    const model = this.model$();
    if (model != null)
      void ancestryDatabase.sources.put(model);
    this.editDialog().nativeElement.close();
  }
}
