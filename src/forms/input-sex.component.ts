import type { GedcomCitation } from "../gedcom/gedcomCitation";
import type { GedcomSex } from "../gedcom/gedcomSex";
import { InputCitationsComponent } from "./input-citations.component";
import { Component, inject } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import type { ControlValueAccessor } from "@angular/forms";
import {
  NG_VALUE_ACCESSOR,
  NonNullableFormBuilder,
  ReactiveFormsModule,
} from "@angular/forms";

@Component({
  selector: "app-input-sex",
  imports: [ReactiveFormsModule, InputCitationsComponent],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: InputSexComponent,
      multi: true,
    },
  ],
  templateUrl: "./input-sex.component.html",
  styleUrl: "./input.component.css",
})
export class InputSexComponent implements ControlValueAccessor {
  constructor() {
    this.form.valueChanges.pipe(takeUntilDestroyed()).subscribe((formValue) => {
      this.onChange({
        sex: formValue.sex ?? "",
        citations: formValue.citations ?? [],
      });
    });
    this.form.statusChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      if (this.form.touched) {
        this.onTouch();
      }
    });
  }

  readonly formBuilder = inject(NonNullableFormBuilder);
  readonly form = this.formBuilder.group({
    sex: "",
    citations: this.formBuilder.control<GedcomCitation[]>([]),
  });

  writeValue(sex: GedcomSex | null): void {
    this.form.setValue(
      {
        sex: sex?.sex ?? "",
        citations: sex?.citations ?? [],
      },
      { emitEvent: false },
    );
  }

  registerOnChange(fn: (sex: GedcomSex | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouch = fn;
  }

  onChange!: (sex: GedcomSex | null) => void;
  onTouch!: () => void;
}
