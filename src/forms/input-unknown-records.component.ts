import { serializeGedcomRecordToText } from "../gedcom/gedcomRecord";
import type { GedcomRecord } from "../gedcom/gedcomRecord";
import { Component, DestroyRef, inject } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import type { ControlValueAccessor } from "@angular/forms";
import {
  NG_VALUE_ACCESSOR,
  NonNullableFormBuilder,
  ReactiveFormsModule,
} from "@angular/forms";
import { RouterModule } from "@angular/router";

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

  readonly formArray = this.formBuilder.array<GedcomRecord[]>([]);

  writeValue(unknownRecords: GedcomRecord[]): void {
    this.formArray.clear({ emitEvent: false });
    unknownRecords.forEach((unknownRecord) => {
      this.formArray.push(
        this.formBuilder.control<GedcomRecord>(unknownRecord),
        { emitEvent: false },
      );
    });
  }

  registerOnChange(onChange: (unknownRecords: GedcomRecord[]) => void): void {
    this.formArray.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((formValue) => {
        onChange(formValue);
      });
  }

  registerOnTouched(onTouch: () => void): void {
    this.formArray.statusChanges
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
