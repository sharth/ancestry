import type { ElementRef } from "@angular/core";
import { Component, computed, inject, input, viewChild } from "@angular/core";
import { RouterModule } from "@angular/router";
import { CommonModule } from "@angular/common";
import {
  FormArray,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
} from "@angular/forms";
import {
  GedcomRecord,
  GedcomSource,
  serializeGedcomRecordToText,
  serializeGedcomSource,
  parseGedcomRecords,
} from "../../gedcom";
import { toObservable } from "@angular/core/rxjs-interop";
import { ancestryDatabase } from "../../database/ancestry.database";
import * as rxjs from "rxjs";
import * as dexie from "dexie";
import { GedcomDiffComponent } from "../../util/gedcom-diff.component";
import { AncestryService } from "../../database/ancestry.service";
import { SourceCitationsComponent } from "../source-citations/source-citations.component";
import { SourceRepositoriesComponent } from "../source-repositories/source-repositories.component";

@Component({
  selector: "app-source",
  standalone: true,
  templateUrl: "./source.component.html",
  styleUrl: "./source.component.css",
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    GedcomDiffComponent,
    SourceCitationsComponent,
    SourceRepositoriesComponent,
  ],
})
export class SourceComponent {
  readonly xref = input.required<string>();
  private readonly ancestryService = inject(AncestryService);

  readonly source$ = toObservable(this.xref).pipe(
    rxjs.switchMap((xref) =>
      dexie.liveQuery(() => ancestryDatabase.sources.get(xref))
    )
  );

  readonly vm = computed(() => {
    const ancestry = this.ancestryService.ancestryResource.value();
    if (ancestry == undefined) {
      return undefined;
    }
    const source = ancestry.sources.get(this.xref());
    if (source == undefined) {
      return undefined;
    }

    return {
      ...source,
      multimedia: source.multimediaXrefs.map((multimediaXref) => ({
        ...ancestry.multimedia.get(multimediaXref),
        xref: multimediaXref,
      })),
      repositories: [...ancestry.repositories.values()],
      oldGedcomText: [ancestry.originalText]
        .flatMap((text) => parseGedcomRecords(text))
        .filter((r) => r.tag == "SOUR" && r.xref == source.xref)
        .flatMap((record) => serializeGedcomRecordToText(record))
        .join("\n"),
      newGedcomText: serializeGedcomRecordToText(
        serializeGedcomSource(source)
      ).join("\n"),
    };
  });

  readonly reactiveForm = new FormGroup({
    abbr: new FormControl<string>(""),
    title: new FormControl<string>(""),
    text: new FormControl<string>(""),
    repositoryCitations: new FormArray<
      FormGroup<{
        repositoryXref: FormControl<string>;
        callNumber: FormControl<string>;
      }>
    >([]),
    unknownRecords: new FormArray<FormControl<GedcomRecord>>([]),
  });

  readonly editDialog =
    viewChild.required<ElementRef<HTMLDialogElement>>("editDialog");

  addRepositoryCitation() {
    this.reactiveForm.controls.repositoryCitations.push(
      new FormGroup({
        repositoryXref: new FormControl("", { nonNullable: true }),
        callNumber: new FormControl("", { nonNullable: true }),
      })
    );
  }

  removeRepositoryCitation(index: number) {
    this.reactiveForm.controls.repositoryCitations.removeAt(index);
  }

  addUnknownRecord() {
    this.reactiveForm.controls.unknownRecords.push(
      new FormControl(new GedcomRecord(undefined, "", "", undefined, []), {
        nonNullable: true,
      })
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
      source.repositoryCitations.forEach(() => {
        this.addRepositoryCitation();
      });
      this.reactiveForm.controls.unknownRecords.clear();
      source.unknownRecords.forEach(() => {
        this.addUnknownRecord();
      });
      this.reactiveForm.setValue({
        abbr: source.abbr ?? "",
        title: source.title ?? "",
        text: source.text ?? "",
        repositoryCitations: source.repositoryCitations.map(
          (repositoryCitation) => ({
            repositoryXref: repositoryCitation.repositoryXref,
            callNumber: repositoryCitation.callNumbers.at(0) ?? "",
          })
        ),
        unknownRecords: source.unknownRecords,
      });
      this.reactiveForm.markAsDirty();
      this.reactiveForm.updateValueAndValidity();
      this.editDialog().nativeElement.showModal();
    });
  }

  submitForm() {
    const source = new GedcomSource(this.xref());
    source.abbr = this.reactiveForm.controls.abbr.value ?? undefined;
    source.title = this.reactiveForm.controls.title.value ?? undefined;
    source.text = this.reactiveForm.controls.text.value ?? undefined;
    source.repositoryCitations =
      this.reactiveForm.controls.repositoryCitations.controls.map(
        (repositoryCitation) => ({
          repositoryXref: repositoryCitation.controls.repositoryXref.value,
          callNumbers: [repositoryCitation.controls.callNumber.value],
        })
      );
    source.unknownRecords = this.reactiveForm.controls.unknownRecords.value;
    void ancestryDatabase.sources.put(source);
    this.editDialog().nativeElement.close();
  }

  serializeGedcomRecordToText = serializeGedcomRecordToText;
}
