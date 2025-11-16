import type { AncestryDatabase } from "../database/ancestry.service";
import type { GedcomCitation } from "../gedcom/gedcomCitation";
import type { GedcomName } from "../gedcom/gedcomName";
import { InputSourceCitationsComponent } from "./input-source-citations.component";
import type { ElementRef, QueryList } from "@angular/core";
import {
  Component,
  DestroyRef,
  ViewChildren,
  inject,
  input,
  model,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import type { AbstractControl, ControlValueAccessor } from "@angular/forms";
import {
  NG_VALUE_ACCESSOR,
  NonNullableFormBuilder,
  ReactiveFormsModule,
} from "@angular/forms";
import { startWith } from "rxjs/operators";

@Component({
  selector: "app-input-names",
  imports: [ReactiveFormsModule, InputSourceCitationsComponent],
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

  readonly ancestryDatabase = model.required<AncestryDatabase>();

  // Set true to expand the details by default.
  readonly open = input<boolean>(false);

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

  // Keep track of the controls that were added by a user interation.
  readonly newControls = new WeakSet<AbstractControl>([]);

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
    const formGroup = this.formBuilder.group({
      prefix: "",
      givenName: "",
      nickName: "",
      surnamePrefix: "",
      surname: "",
      suffix: "",
      citations: this.formBuilder.control<GedcomCitation[]>([]),
    });
    this.formArray.push(formGroup);
    this.newControls.add(formGroup);
    setTimeout(() => {
      this.focusTargets.last.nativeElement.focus();
    });
  }

  removeName(index: number) {
    this.formArray.removeAt(index);
  }
}
