import type { AncestryDatabase } from "../database/ancestry.service";
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
  selector: "app-input-repository-call-number",
  imports: [ReactiveFormsModule],
  templateUrl: "./input-repository-call-number.component.html",
  styleUrl: "./input.component.css",
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: InputRepositoryCallNumberComponent,
      multi: true,
    },
  ],
})
export class InputRepositoryCallNumberComponent
  implements ControlValueAccessor
{
  private readonly destroyRef = inject(DestroyRef);
  private readonly formBuilder = inject(NonNullableFormBuilder);

  readonly ancestryDatabase = input.required<AncestryDatabase>();

  readonly formGroup = this.formBuilder.group({
    callNumber: "",
  });

  writeValue(callNumber: string): void {
    this.formGroup.setValue({ callNumber }, { emitEvent: false });
  }

  registerOnChange(onChange: (callNumber: string) => void): void {
    this.formGroup.valueChanges
      .pipe(startWith(this.formGroup.value))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        onChange(this.formGroup.getRawValue().callNumber);
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
}
