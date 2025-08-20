import type { GedcomCitation } from "../gedcom/gedcomCitation";
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
  selector: "app-input-citations",
  imports: [ReactiveFormsModule],
  templateUrl: "./input-citations.component.html",
  styleUrl: "./input.component.css",
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: InputCitationsComponent,
      multi: true,
    },
  ],
})
export class InputCitationsComponent implements ControlValueAccessor {
  readonly formBuilder = inject(NonNullableFormBuilder);
  readonly form = this.formBuilder.array<
    FormGroup<{
      sourceXref: FormControl<string>;
      name: FormControl<string>;
      obje: FormControl<string>;
      note: FormControl<string>;
      text: FormControl<string>;
      page: FormControl<string>;
      quality: FormControl<string>;
    }>
  >([]);

  constructor() {
    this.form.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      this.onChange(
        this.form.getRawValue().map((citation) => ({
          sourceXref: citation.sourceXref,
          name: citation.name || undefined,
          obje: citation.obje || undefined,
          note: citation.note || undefined,
          text: citation.text || undefined,
          page: citation.page || undefined,
          quality: citation.quality || undefined,
        })),
      );
    });

    this.form.statusChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      if (this.form.touched) {
        this.onTouch();
      }
    });
  }

  writeValue(citations: GedcomCitation[]): void {
    this.form.clear({ emitEvent: false });
    citations.forEach((citation: GedcomCitation) => {
      this.form.push(
        this.formBuilder.group({
          sourceXref: citation.sourceXref,
          name: citation.name ?? "",
          obje: citation.obje ?? "",
          note: citation.note ?? "",
          text: citation.text ?? "",
          page: citation.page ?? "",
          quality: citation.quality ?? "",
        }),
        { emitEvent: false },
      );
    });
  }

  registerOnChange(fn: (citations: GedcomCitation[]) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouch = fn;
  }

  appendCitation() {
    this.form.push(
      this.formBuilder.group({
        sourceXref: this.formBuilder.control(""),
        name: this.formBuilder.control(""),
        obje: this.formBuilder.control(""),
        note: this.formBuilder.control(""),
        text: this.formBuilder.control(""),
        page: this.formBuilder.control(""),
        quality: this.formBuilder.control(""),
      }),
    );
  }

  removeCitation(index: number) {
    this.form.removeAt(index);
  }

  private onChange!: (citations: GedcomCitation[]) => void;
  private onTouch!: () => void;
}
