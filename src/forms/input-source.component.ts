import type { AncestryDatabase } from "../database/ancestry.service";
import type { GedcomMultimediaLink } from "../gedcom/gedcomMultimediaLink";
import type { GedcomRecord } from "../gedcom/gedcomRecord";
import type { GedcomRepositoryLink } from "../gedcom/gedcomRepositoryLink";
import type { GedcomSource } from "../gedcom/gedcomSource";
import { InputMultimediaLinksComponent } from "./input-multimedia-links.component";
import { InputRepositoryLinksComponent } from "./input-repository-links.component";
import { InputUnknownRecordsComponent } from "./input-unknown-records.component";
import { Component, DestroyRef, inject, model } from "@angular/core";
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
    InputMultimediaLinksComponent,
    InputRepositoryLinksComponent,
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

  readonly ancestryDatabase = model.required<AncestryDatabase>();

  readonly form = this.formBuilder.group({
    xref: "",
    abbr: "",
    title: "",
    text: "",
    repositoryLinks: this.formBuilder.control<GedcomRepositoryLink[]>([]),
    multimediaLinks: this.formBuilder.control<GedcomMultimediaLink[]>([]),
    unknownRecords: this.formBuilder.control<GedcomRecord[]>([]),
  });

  writeValue(source?: GedcomSource): void {
    this.form.setValue(
      {
        xref: source?.xref ?? "",
        abbr: source?.abbr ?? "",
        title: source?.title ?? "",
        text: source?.text ?? "",
        repositoryLinks: source?.repositoryLinks ?? [],
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
          repositoryLinks: formValue.repositoryLinks,
          multimediaLinks: formValue.multimediaLinks,
          unknownRecords: formValue.unknownRecords,
        });
      });
  }

  registerOnTouched(onTouch: () => void): void {
    this.form.statusChanges
      .pipe(startWith(this.form.status))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (this.form.touched) {
          onTouch();
        }
      });
  }
}
