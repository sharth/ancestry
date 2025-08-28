import type { AncestryDatabase } from "../database/ancestry.service";
import { displayGedcomName } from "../gedcom/gedcomName";
import { Component, DestroyRef, inject, input } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import type { ControlValueAccessor } from "@angular/forms";
import {
  NG_VALUE_ACCESSOR,
  NonNullableFormBuilder,
  ReactiveFormsModule,
} from "@angular/forms";
import { startWith } from "rxjs/operators";

@Component({
  selector: "app-input-individual-xref",
  imports: [ReactiveFormsModule],
  templateUrl: "./input-individual-xref.component.html",
  styleUrl: "./input.component.css",
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: InputIndividualXrefComponent,
      multi: true,
    },
  ],
})
export class InputIndividualXrefComponent implements ControlValueAccessor {
  private readonly destroyRef = inject(DestroyRef);
  private readonly formBuilder = inject(NonNullableFormBuilder);

  readonly ancestryDatabase = input.required<AncestryDatabase>();

  readonly formGroup = this.formBuilder.group({
    individualXref: "",
  });

  writeValue(individualXref: string): void {
    this.formGroup.setValue({ individualXref }, { emitEvent: false });
  }

  registerOnChange(onChange: (individualXref: string) => void): void {
    this.formGroup.valueChanges
      .pipe(startWith(this.formGroup.value))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        onChange(this.formGroup.getRawValue().individualXref);
      });
  }

  registerOnTouched(onTouch: () => void): void {
    this.formGroup.statusChanges
      .pipe(startWith(this.formGroup.status))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (this.formGroup.touched) {
          onTouch();
        }
      });
  }

  public readonly displayGedcomName = displayGedcomName;
}
