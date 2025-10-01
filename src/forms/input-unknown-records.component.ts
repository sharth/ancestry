import type { AncestryDatabase } from "../database/ancestry.service";
import { serializeGedcomRecordToText } from "../gedcom/gedcomRecord";
import type { GedcomRecord } from "../gedcom/gedcomRecord";
import { Component, DestroyRef, inject, model } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import type { ControlValueAccessor } from "@angular/forms";
import {
  NG_VALUE_ACCESSOR,
  NonNullableFormBuilder,
  ReactiveFormsModule,
} from "@angular/forms";
import { RouterModule } from "@angular/router";
import { startWith } from "rxjs/operators";

@Component({
  selector: "app-input-unknown-records",
  templateUrl: "./input-unknown-records.component.html",
  styleUrl: "./input.component.css",
  imports: [RouterModule, ReactiveFormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: InputUnknownRecordsComponent,
      multi: true,
    },
  ],
})
export class InputUnknownRecordsComponent implements ControlValueAccessor {
  private readonly destroyRef = inject(DestroyRef);
  private readonly formBuilder = inject(NonNullableFormBuilder);

  readonly ancestryDatabase = model.required<AncestryDatabase>();

  readonly formArray = this.formBuilder.array<GedcomRecord[]>([]);

  writeValue(unknownRecords: GedcomRecord[]): void {
    this.formArray.clear({ emitEvent: false });
    this.formArray.push(
      unknownRecords.map((unknownRecord) =>
        this.formBuilder.control<GedcomRecord>(unknownRecord),
      ),
      { emitEvent: false },
    );
  }

  registerOnChange(onChange: (unknownRecords: GedcomRecord[]) => void): void {
    this.formArray.valueChanges
      .pipe(startWith(this.formArray.value))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((formValue) => {
        onChange(formValue);
      });
  }

  registerOnTouched(onTouch: () => void): void {
    this.formArray.statusChanges
      .pipe(startWith(this.formArray.status))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (this.formArray.touched) {
          onTouch();
        }
      });
  }

  removeUnknownRecord(index: number) {
    this.formArray.removeAt(index);
  }

  readonly serializeGedcomRecordToText = serializeGedcomRecordToText;
}
