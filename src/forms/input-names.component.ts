import type { AncestryDatabase } from "../database/ancestry.service";
import type { GedcomCitation } from "../gedcom/gedcomCitation";
import type { GedcomName } from "../gedcom/gedcomName";
import { InputCitationsComponent } from "./input-citations.component";
import type { ElementRef, QueryList } from "@angular/core";
import {
  Component,
  DestroyRef,
  ViewChildren,
  inject,
  input,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import type { ControlValueAccessor } from "@angular/forms";
import {
  NG_VALUE_ACCESSOR,
  NonNullableFormBuilder,
  ReactiveFormsModule,
} from "@angular/forms";
import { startWith } from "rxjs/operators";

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
  private readonly destroyRef = inject(DestroyRef);
  private readonly formBuilder = inject(NonNullableFormBuilder);

  readonly ancestryDatabase = input.required<AncestryDatabase>();

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
    this.formArray.push(
      names.map((name) =>
        this.formBuilder.group({
          prefix: name.prefix ?? "",
          givenName: name.givenName ?? "",
          nickName: name.nickName ?? "",
          surnamePrefix: name.surnamePrefix ?? "",
          surname: name.surname ?? "",
          suffix: name.suffix ?? "",
          citations: this.formBuilder.control<GedcomCitation[]>(name.citations),
        }),
      ),
      { emitEvent: false },
    );
  }
  registerOnChange(onChange: (names: GedcomName[]) => void): void {
    this.formArray.valueChanges
      .pipe(startWith(this.formArray.value))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        onChange(
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
  }
  registerOnTouched(onTouch: () => void): void {
    this.formArray.statusChanges
      .pipe(startWith(this.formArray.status))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (this.formArray.touched) {
          onTouch();
        }
      });
  }

  @ViewChildren("focusTarget") private focusTargets!: QueryList<
    ElementRef<HTMLElement>
  >;

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
    setTimeout(() => {
      this.focusTargets.last.nativeElement.focus();
    });
  }

  removeName(index: number) {
    this.formArray.removeAt(index);
  }
}
