import { serializeGedcomRecordToText } from "../gedcom/gedcomRecord";
import type { GedcomRecord } from "../gedcom/gedcomRecord";
import { Component, inject } from "@angular/core";
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
  private readonly formBuilder = inject(NonNullableFormBuilder);
  readonly formArray = this.formBuilder.array<GedcomRecord[]>([]);

  constructor() {
    this.formArray.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((formValue) => {
        this.onChange(formValue);
      });
    this.formArray.statusChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      if (this.formArray.touched) {
        this.onTouch();
      }
    });
  }

  writeValue(unknownRecords: GedcomRecord[]): void {
    this.formArray.clear({ emitEvent: false });
    unknownRecords.forEach((unknownRecord) => {
      this.formArray.push(
        this.formBuilder.control<GedcomRecord>(unknownRecord),
        { emitEvent: false },
      );
    });
  }

  registerOnChange(fn: (unknownRecords: GedcomRecord[]) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouch = fn;
  }

  removeUnknownRecord(index: number) {
    this.formArray.removeAt(index);
  }

  private onChange!: (unknownRecords: GedcomRecord[]) => void;
  private onTouch!: () => void;

  readonly serializeGedcomRecordToText = serializeGedcomRecordToText;
}
