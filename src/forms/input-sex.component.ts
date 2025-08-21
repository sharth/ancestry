import type { GedcomCitation } from "../gedcom/gedcomCitation";
import type { GedcomSex } from "../gedcom/gedcomSex";
import { InputCitationsComponent } from "./input-citations.component";
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
  private readonly destroyRef = inject(DestroyRef);
  private readonly formBuilder = inject(NonNullableFormBuilder);

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

  registerOnChange(onChange: (sex: GedcomSex | null) => void): void {
    this.form.valueChanges
      .pipe(startWith(this.form.value))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((formValue) => {
        onChange({
          sex: formValue.sex ?? "",
          citations: formValue.citations ?? [],
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
