import type { GedcomEventSharedWith } from "../gedcom/gedcomEvent";
import { Component, DestroyRef, inject } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import type {
  ControlValueAccessor,
  FormControl,
  FormGroup,
} from "@angular/forms";
import {
  NG_VALUE_ACCESSOR,
  NonNullableFormBuilder,
  ReactiveFormsModule,
} from "@angular/forms";

@Component({
  selector: "app-input-shared-with",
  imports: [ReactiveFormsModule],
  templateUrl: "./input-shared-with.component.html",
  styleUrl: "./input.component.css",
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: InputSharedWithComponent,
      multi: true,
    },
  ],
})
export class InputSharedWithComponent implements ControlValueAccessor {
  private readonly destroyRef = inject(DestroyRef);
  private readonly formBuilder = inject(NonNullableFormBuilder);

  readonly form = this.formBuilder.array<
    FormGroup<{
      xref: FormControl<string>;
      role: FormControl<string>;
    }>
  >([]);

  writeValue(sharedWith: GedcomEventSharedWith[]): void {
    this.form.clear({ emitEvent: false });
    sharedWith.forEach((friend) => {
      this.form.push(
        this.formBuilder.group({
          xref: friend.xref,
          role: friend.role ?? "",
        }),
        { emitEvent: false },
      );
    });
  }

  registerOnChange(
    onChange: (sharedWith: GedcomEventSharedWith[]) => void,
  ): void {
    this.form.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        onChange(
          this.form.getRawValue().map((friend) => ({
            xref: friend.xref,
            role: friend.role || undefined,
          })),
        );
      });
  }

  registerOnTouched(onTouch: () => void): void {
    this.form.statusChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (this.form.touched) {
          onTouch();
        }
      });
  }

  appendSharedEvent() {
    this.form.push(
      this.formBuilder.group({
        xref: this.formBuilder.control(""),
        role: this.formBuilder.control(""),
      }),
    );
  }

  removeSharedEvent(index: number) {
    this.form.removeAt(index);
  }
}
