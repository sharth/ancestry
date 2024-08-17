import type { ElementRef} from '@angular/core';
import {signal} from '@angular/core';
import {Component, input, viewChild} from '@angular/core';
import {RouterModule} from '@angular/router';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
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
  imports: [CommonModule,RouterModule, FormsModule],
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
        repositories,
      }
    }),
  );

  readonly formModel = signal<GedcomSource | undefined>(undefined);
  readonly editDialog = viewChild.required<ElementRef<HTMLDialogElement>>('editDialog');


  addRepositoryCitation() {
    this.formModel()?.repositoryCitations.push({
      repositoryXref: '',
      callNumbers: [''],
    });
  }

  removeRepositoryCitation(index: number) {
    this.formModel()?.repositoryCitations.splice(index, 1);
  }

  removeUnknownRecord(index: number) {
    this.formModel()?.unknownRecords.splice(index, 1);
  }

  openForm() {
    void rxjs.firstValueFrom(this.source$).then((source) => {
      console.log(source);
      if (source == null) throw new Error();
      this.formModel.set(source);
      this.editDialog().nativeElement.showModal();
    })
  }

  submitForm() {
    const source = this.formModel();
    if (source != null)
      void ancestryDatabase.sources.put(source);
    this.editDialog().nativeElement.close();
  }

  serializeGedcomRecordToText = serializeGedcomRecordToText;
}
