import type { GedcomCitation } from "../gedcom/gedcomCitation";
import type { GedcomName } from "../gedcom/gedcomName";
import { InputCitationsComponent } from "./input-citations.component";
import { Component, inject } from "@angular/core";
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

  readonly formValueChanges = this.formArray.valueChanges.subscribe(() => {
    this.onChange(
      this.formArray.getRawValue().map((formValue) => ({
        prefix: formValue.prefix || undefined,
        givenName: formValue.givenName || undefined,
        nickName: formValue.nickName || undefined,
        surnamePrefix: formValue.surnamePrefix || undefined,
        surname: formValue.surname || undefined,
        suffix: formValue.suffix || undefined,
        citations: formValue.citations,
      })),
    );
  });

  readonly formStatusChanges = this.formArray.statusChanges.subscribe(() => {
    if (this.formArray.touched) {
      this.onTouch();
    }
  });

  ngOnDestroy(): void {
    this.formValueChanges.unsubscribe();
    this.formStatusChanges.unsubscribe();
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

  onChange!: (names: GedcomName[]) => void;
  onTouch!: () => void;
}
