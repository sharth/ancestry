import type { AncestryDatabase } from "../database/ancestry.service";
import type { GedcomCitation } from "../gedcom/gedcomCitation";
import type { GedcomSex } from "../gedcom/gedcomSex";
import { InputSourceCitationsComponent } from "./input-source-citations.component";
import { Component, DestroyRef, inject, input, model } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import type { ControlValueAccessor } from "@angular/forms";
import {
  NG_VALUE_ACCESSOR,
  NonNullableFormBuilder,
  ReactiveFormsModule,
} from "@angular/forms";
import { startWith } from "rxjs/operators";

@Component({
  selector: "app-input-individual-sex",
  imports: [ReactiveFormsModule, InputSourceCitationsComponent],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: InputIndividualSexComponent,
      multi: true,
    },
  ],
  templateUrl: "./input-individual-sex.component.html",
  styleUrl: "./input.component.css",
})
export class InputIndividualSexComponent implements ControlValueAccessor {
  private readonly destroyRef = inject(DestroyRef);
  private readonly formBuilder = inject(NonNullableFormBuilder);

  readonly open = input<boolean>(false);

  readonly ancestryDatabase = model.required<AncestryDatabase>();

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
      .subscribe(() => {
        const rawFormValue = this.form.getRawValue();
        if (rawFormValue.sex == "" && rawFormValue.citations.length == 0) {
          onChange(null);
        } else {
          onChange({
            sex: rawFormValue.sex,
            citations: rawFormValue.citations,
          });
        }
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
