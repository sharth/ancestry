import type { ElementRef} from '@angular/core';
import {Component, input, viewChild} from '@angular/core';
import {RouterModule} from '@angular/router';
import {CommonModule} from '@angular/common';
import {FormArray, FormControl, FormGroup, ReactiveFormsModule} from '@angular/forms';
import {serializeGedcomRecordToText} from '../../util/gedcom-serializer';
import {serializeGedcomSourceToGedcomRecord} from '../../util/gedcom-serializer';
import {toObservable} from '@angular/core/rxjs-interop';
import {ancestryDatabase} from '../../database/ancestry.database';
import * as rxjs from 'rxjs';
import * as dexie from 'dexie';
import * as gedcom from '../../gedcom';
import { GedcomDiffComponent } from "../../util/gedcom-diff.component";
import { GedcomLexer } from '../../util/gedcom-lexer';

@Component({
  selector: 'app-source',
  standalone: true,
  templateUrl: './source.component.html',
  styleUrl: './source.component.css',
  imports: [CommonModule, RouterModule, ReactiveFormsModule, GedcomDiffComponent],
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
      dexie.liveQuery(() => ancestryDatabase.multimedia.toArray()),
      dexie.liveQuery(() => ancestryDatabase.originalText.toArray()),
    ),
    rxjs.map(([source, individuals, repositories, multimedia, originalText]) => {
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
        multimedia: source.multimediaXrefs.map((multimediaXref) => ({
          ...multimedia.find((multimedia) => multimedia.xref == multimediaXref),
          xref: multimediaXref,
        })),
        repositories,
        oldGedcomText: originalText
          .map((originalText) => originalText.text)
          .flatMap((originalText) => new GedcomLexer().parseGedcomRecords(originalText))
          .filter((gedcomRecord) => gedcomRecord.tag == 'SOUR' && gedcomRecord.xref == source.xref)
          .flatMap(serializeGedcomRecordToText)
          .join("\n"),
        newGedcomText: serializeGedcomRecordToText(serializeGedcomSourceToGedcomRecord(source))
          .join('\n'),
      }
    }),
  );

  readonly reactiveForm = new FormGroup({
    abbr: new FormControl<string>(''),
    title: new FormControl<string>(''),
    text: new FormControl<string>(''),
    repositoryCitations: new FormArray<FormGroup<{
      repositoryXref: FormControl<string>,
      callNumber: FormControl<string>
    }>>([]),
    unknownRecords: new FormArray<FormControl<gedcom.GedcomRecord>>([]),
  });

  readonly editDialog = viewChild.required<ElementRef<HTMLDialogElement>>('editDialog');

  addRepositoryCitation() {
    this.reactiveForm.controls.repositoryCitations.push(new FormGroup({
      repositoryXref: new FormControl('', {nonNullable: true}),
      callNumber: new FormControl('', {nonNullable: true}),
    }));
  }

  removeRepositoryCitation(index: number) {
    this.reactiveForm.controls.repositoryCitations.removeAt(index);
  }

  addUnknownRecord() {
    this.reactiveForm.controls.unknownRecords.push(
      new FormControl(new gedcom.GedcomRecord(0, undefined, '', '', undefined, []), {nonNullable: true}),
    );
  }

  removeUnknownRecord(index: number) {
    this.reactiveForm.controls.unknownRecords.removeAt(index);
  }

  openForm() {
    void rxjs.firstValueFrom(this.source$).then((source) => {
      console.log(source);
      if (source == null) {
        throw new Error();
      }
      this.reactiveForm.controls.repositoryCitations.clear();
      source.repositoryCitations.forEach(() => { this.addRepositoryCitation(); });
      this.reactiveForm.controls.unknownRecords.clear();
      source.unknownRecords.forEach(() => { this.addUnknownRecord(); })
      this.reactiveForm.setValue({
        abbr: source.abbr ?? '',
        title: source.title ?? '',
        text: source.text ?? '',
        repositoryCitations: source.repositoryCitations.map((repositoryCitation) => ({
          repositoryXref: repositoryCitation.repositoryXref,
          callNumber: repositoryCitation.callNumbers.at(0) ?? '',
        })),
        unknownRecords: source.unknownRecords,
      });
      this.reactiveForm.markAsDirty();
      this.reactiveForm.updateValueAndValidity();
      this.editDialog().nativeElement.showModal();
    })
  }

  submitForm() {
    const source = new gedcom.GedcomSource(this.xref())
    source.abbr = this.reactiveForm.controls.abbr.value ?? undefined;
    source.title = this.reactiveForm.controls.title.value ?? undefined;
    source.text = this.reactiveForm.controls.text.value ?? undefined;
    source.repositoryCitations = this.reactiveForm.controls.repositoryCitations.controls.map((repositoryCitation) => ({
      repositoryXref: repositoryCitation.controls.repositoryXref.value,
      callNumbers: [repositoryCitation.controls.callNumber.value],
    }));
    source.unknownRecords = this.reactiveForm.controls.unknownRecords.value;
    void ancestryDatabase.sources.put(source);
    this.editDialog().nativeElement.close();
  }
  
  serializeGedcomRecordToText = serializeGedcomRecordToText;
}
