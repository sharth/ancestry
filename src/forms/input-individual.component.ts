import type { AncestryDatabase } from "../database/ancestry.service";
import type { GedcomEvent } from "../gedcom/gedcomEvent";
import type { GedcomIndividual } from "../gedcom/gedcomIndividual";
import type { GedcomName } from "../gedcom/gedcomName";
import type { GedcomNote } from "../gedcom/gedcomNote";
import type { GedcomRecord } from "../gedcom/gedcomRecord";
import type { GedcomSex } from "../gedcom/gedcomSex";
import { InputEventsComponent } from "./input-events.component";
import { InputNamesComponent } from "./input-names.component";
import { InputNotesComponent } from "./input-notes.component";
import { InputSexComponent } from "./input-sex.component";
import { InputUnknownRecordsComponent } from "./input-unknown-records.component";
import { Component, DestroyRef, inject, input } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import type { ControlValueAccessor } from "@angular/forms";
import {
  FormsModule,
  NG_VALUE_ACCESSOR,
  NonNullableFormBuilder,
  ReactiveFormsModule,
} from "@angular/forms";
import { startWith } from "rxjs/operators";

@Component({
  selector: "app-input-individual",
  imports: [
    FormsModule,
    ReactiveFormsModule,
    InputNamesComponent,
    InputEventsComponent,
    InputSexComponent,
    InputUnknownRecordsComponent,
    InputNotesComponent,
  ],
  templateUrl: "./input-individual.component.html",
  styleUrl: "./input.component.css",
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: InputIndividualComponent,
      multi: true,
    },
  ],
})
export class InputIndividualComponent implements ControlValueAccessor {
  private readonly destroyRef = inject(DestroyRef);
  private readonly formBuilder = inject(NonNullableFormBuilder);

  readonly ancestryDatabase = input.required<AncestryDatabase>();

  readonly form = this.formBuilder.group({
    xref: this.formBuilder.control<string>(""),
    sex: this.formBuilder.control<GedcomSex | null>(null),
    names: this.formBuilder.control<GedcomName[]>([]),
    events: this.formBuilder.control<GedcomEvent[]>([]),
    childOfFamilies: this.formBuilder.control<string[]>([]),
    parentOfFamilies: this.formBuilder.control<string[]>([]),
    notes: this.formBuilder.control<GedcomNote[]>([]),
    unknownRecords: this.formBuilder.control<GedcomRecord[]>([]),
  });

  writeValue(individual: GedcomIndividual | undefined): void {
    this.form.setValue(
      {
        // FIXME: If the xref (or individual) is not set, we should discover a new one.
        xref: individual?.xref ?? "",
        sex: individual?.sex ?? null,
        names: individual?.names ?? [],
        events: individual?.events ?? [],
        childOfFamilies: individual?.childOfFamilyXrefs ?? [],
        parentOfFamilies: individual?.parentOfFamilyXrefs ?? [],
        notes: individual?.notes ?? [],
        unknownRecords: individual?.unknownRecords ?? [],
      },
      { emitEvent: false },
    );
  }

  registerOnChange(
    onChange: (individual: GedcomIndividual | undefined) => void,
  ): void {
    this.form.valueChanges
      .pipe(startWith(this.form.value))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        const formValue = this.form.getRawValue();
        onChange({
          xref: formValue.xref,
          changeDate: {
            value: new Date()
              .toLocaleString("en-gb", { dateStyle: "medium" })
              .toLocaleUpperCase(),
          },
          sex: formValue.sex ?? undefined,
          names: formValue.names,
          events: formValue.events,
          childOfFamilyXrefs: formValue.childOfFamilies,
          parentOfFamilyXrefs: formValue.parentOfFamilies,
          notes: formValue.notes,
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
