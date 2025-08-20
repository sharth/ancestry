import type { GedcomEventSharedWith } from "../gedcom/gedcomEvent";
import { Component, inject } from "@angular/core";
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
  readonly formBuilder = inject(NonNullableFormBuilder);
  readonly form = this.formBuilder.array<
    FormGroup<{
      xref: FormControl<string>;
      role: FormControl<string>;
    }>
  >([]);

  constructor() {
    this.form.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      this.onChange(
        this.form.getRawValue().map((friend) => ({
          xref: friend.xref,
          role: friend.role || undefined,
        })),
      );
    });

    this.form.statusChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      if (this.form.touched) {
        this.onTouch();
      }
    });
  }

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

  registerOnChange(fn: (sharedWith: GedcomEventSharedWith[]) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouch = fn;
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

  private onChange!: (sharedWith: GedcomEventSharedWith[]) => void;
  private onTouch!: () => void;
}
