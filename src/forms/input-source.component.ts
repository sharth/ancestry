import type { GedcomRecord } from "../gedcom/gedcomRecord";
import type { GedcomSource } from "../gedcom/gedcomSource";
import { InputSourceMultimediaLinksComponent } from "./input-source-multimedia-links.component";
import { InputSourceRepositoryCitationsComponent } from "./input-source-repository-citations";
import { InputUnknownRecordsComponent } from "./input-unknown-records.component";
import { Component, DestroyRef, inject } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import type { ControlValueAccessor } from "@angular/forms";
import {
  NG_VALUE_ACCESSOR,
  NonNullableFormBuilder,
  ReactiveFormsModule,
} from "@angular/forms";
import { startWith } from "rxjs/operators";

@Component({
  selector: "app-input-source",
  imports: [
    ReactiveFormsModule,
    InputSourceMultimediaLinksComponent,
    InputSourceRepositoryCitationsComponent,
    InputUnknownRecordsComponent,
  ],
  templateUrl: "./input-source.component.html",
  styleUrl: "./input.component.css",
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: InputSourceComponent,
      multi: true,
    },
  ],
})
export class InputSourceComponent implements ControlValueAccessor {
  private readonly destroyRef = inject(DestroyRef);
  private readonly formBuilder = inject(NonNullableFormBuilder);

  readonly form = this.formBuilder.group({
    xref: "",
    abbr: "",
    title: "",
    text: "",
    repositoryCitations: this.formBuilder.control<
      {
        repositoryXref: string;
        callNumber: string;
      }[]
    >([]),
    multimediaLinks: this.formBuilder.control<
      {
        multimediaXref: string;
        title?: string;
      }[]
    >([]),
    unknownRecords: this.formBuilder.control<GedcomRecord[]>([]),
  });

  writeValue(source?: GedcomSource): void {
    this.form.setValue(
      {
        xref: source?.xref ?? "",
        abbr: source?.abbr ?? "",
        title: source?.title ?? "",
        text: source?.text ?? "",
        repositoryCitations:
          source?.repositoryCitations.flatMap((repositoryCitation) =>
            repositoryCitation.callNumbers.map((callNumber) => ({
              repositoryXref: repositoryCitation.repositoryXref,
              callNumber,
            })),
          ) ?? [],
        multimediaLinks: source?.multimediaLinks ?? [],
        unknownRecords: source?.unknownRecords ?? [],
      },
      { emitEvent: false },
    );
  }

  registerOnChange(onChange: (source?: GedcomSource) => void): void {
    this.form.valueChanges
      .pipe(startWith(this.form.value))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        const formValue = this.form.getRawValue();
        onChange({
          xref: formValue.xref,
          abbr: formValue.abbr || undefined,
          title: formValue.title || undefined,
          text: formValue.text || undefined,
          repositoryCitations: formValue.repositoryCitations.map(
            (repositoryCitation) => ({
              repositoryXref: repositoryCitation.repositoryXref,
              callNumbers: repositoryCitation.callNumber
                ? [repositoryCitation.callNumber]
                : [],
            }),
          ),
          multimediaLinks: formValue.multimediaLinks,
          unknownRecords: formValue.unknownRecords,
        });
      });
  }

  registerOnTouched(onTouch: () => void): void {
    this.form.statusChanges
      .pipe(startWith())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (this.form.touched) {
          onTouch();
        }
      });
  }
}
