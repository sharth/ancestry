import type { GedcomCitation } from "../gedcom/gedcomCitation";
import type { GedcomName } from "../gedcom/gedcomName";
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
  selector: "app-input-names",
  imports: [ReactiveFormsModule, InputCitationsComponent],
  templateUrl: "./input-names.component.html",
  styleUrl: "./input.component.css",
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: InputNamesComponent,
      multi: true,
    },
  ],
})
export class InputNamesComponent implements ControlValueAccessor {
  readonly formBuilder = inject(NonNullableFormBuilder);
  readonly formArray = this.formBuilder.array([
    this.formBuilder.group({
      prefix: "",
      givenName: "",
      nickName: "",
      surnamePrefix: "",
      surname: "",
      suffix: "",
      citations: this.formBuilder.control<GedcomCitation[]>([]),
    }),
  ]);

  constructor() {
    this.formArray.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      this.onChange(
        this.formArray.getRawValue().map((formValue) => ({
          prefix: formValue.prefix || undefined,
          givenName: formValue.givenName || undefined,
          nickName: formValue.nickName || undefined,
          surnamePrefix: formValue.surnamePrefix || undefined,
          surname: formValue.surname || undefined,
          suffix: formValue.suffix || undefined,
          citations: formValue.citations,
          notes: [],
        })),
      );
    });

    this.formArray.statusChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      if (this.formArray.touched) {
        this.onTouch();
      }
    });
  }

  writeValue(names: GedcomName[]): void {
    this.formArray.clear({ emitEvent: false });
    for (const name of names) {
      this.formArray.push(
        this.formBuilder.group({
          prefix: name.prefix ?? "",
          givenName: name.givenName ?? "",
          nickName: name.nickName ?? "",
          surnamePrefix: name.surnamePrefix ?? "",
          surname: name.surname ?? "",
          suffix: name.suffix ?? "",
          citations: this.formBuilder.control<GedcomCitation[]>(name.citations),
        }),
        { emitEvent: false },
      );
    }
  }
  registerOnChange(fn: (names: GedcomName[]) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouch = fn;
  }

  appendName() {
    this.formArray.push(
      this.formBuilder.group({
        prefix: "",
        givenName: "",
        nickName: "",
        surnamePrefix: "",
        surname: "",
        suffix: "",
        citations: this.formBuilder.control<GedcomCitation[]>([]),
      }),
    );
  }

  removeName(index: number) {
    this.formArray.removeAt(index);
  }

  private onChange!: (names: GedcomName[]) => void;
  private onTouch!: () => void;
}
