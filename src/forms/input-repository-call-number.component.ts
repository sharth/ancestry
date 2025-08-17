import { Component, inject } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import type { ControlValueAccessor } from "@angular/forms";
import {
  NG_VALUE_ACCESSOR,
  NonNullableFormBuilder,
  ReactiveFormsModule,
} from "@angular/forms";

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
  constructor() {
    this.formGroup.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      this.onChange(this.formGroup.getRawValue().callNumber);
    });
    this.formGroup.statusChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      if (this.formGroup.touched) {
        this.onTouch();
      }
    });
  }

  readonly formBuilder = inject(NonNullableFormBuilder);
  readonly formGroup = this.formBuilder.group({
    callNumber: "",
  });

  writeValue(callNumber: string): void {
    this.formGroup.setValue({ callNumber }, { emitEvent: false });
  }

  registerOnChange(fn: (callNumber: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouch = fn;
  }

  private onChange!: (callNumber: string) => void;
  private onTouch!: () => void;
}
