import type { AncestryDatabase } from "../database/ancestry.service";
import type { GedcomSex } from "../gedcom/gedcomSex";
import type { GedcomSourceCitation } from "../gedcom/gedcomSourceCitation";
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
    citations: this.formBuilder.control<GedcomSourceCitation[]>([]),
  });

  writeValue(sex: GedcomSex): void {
    this.form.setValue(sex, { emitEvent: false });
  }

  registerOnChange(onChange: (sex: GedcomSex) => void): void {
    this.form.valueChanges
      .pipe(startWith(this.form.value))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        const rawFormValue = this.form.getRawValue();
        onChange({
          sex: rawFormValue.sex,
          citations: rawFormValue.citations,
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
