import type { AncestryDatabase } from "../database/ancestry.service";
import type { GedcomCitation } from "../gedcom/gedcomCitation";
import type { GedcomMultimediaLink } from "../gedcom/gedcomMultimediaLink";
import type { GedcomNote } from "../gedcom/gedcomNote";
import { InputMultimediaLinksComponent } from "./input-multimedia-links.component";
import { InputNotesComponent } from "./input-notes.component";
import { InputSourceXrefComponent } from "./input-source-xref.component";
import type { QueryList } from "@angular/core";
import {
  Component,
  DestroyRef,
  ViewChildren,
  inject,
  input,
} from "@angular/core";
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
import { startWith } from "rxjs/operators";

@Component({
  selector: "app-input-citations",
  imports: [
    ReactiveFormsModule,
    InputSourceXrefComponent,
    InputNotesComponent,
    InputMultimediaLinksComponent,
  ],
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
  private readonly destroyRef = inject(DestroyRef);
  private readonly formBuilder = inject(NonNullableFormBuilder);

  readonly ancestryDatabase = input.required<AncestryDatabase>();

  readonly form = this.formBuilder.array<
    FormGroup<{
      sourceXref: FormControl<string>;
      notes: FormControl<GedcomNote[]>;
      text: FormControl<string>;
      page: FormControl<string>;
      quality: FormControl<string>;
      multimediaLinks: FormControl<GedcomMultimediaLink[]>;
    }>
  >([]);

  writeValue(citations: GedcomCitation[]): void {
    this.form.clear({ emitEvent: false });
    this.form.push(
      citations.map((citation) =>
        this.formBuilder.group({
          sourceXref: citation.sourceXref,
          notes: this.formBuilder.control<GedcomNote[]>(citation.notes),
          text: citation.text ?? "",
          page: citation.page ?? "",
          quality: citation.quality ?? "",
          multimediaLinks: this.formBuilder.control<GedcomMultimediaLink[]>(
            citation.multimediaLinks,
          ),
        }),
      ),
      { emitEvent: false },
    );
  }

  registerOnChange(onChange: (citations: GedcomCitation[]) => void): void {
    this.form.valueChanges
      .pipe(startWith(this.form.value))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        onChange(
          this.form.getRawValue().map((citation) => ({
            sourceXref: citation.sourceXref,
            notes: citation.notes,
            text: citation.text || undefined,
            page: citation.page || undefined,
            quality: citation.quality || undefined,
            multimediaLinks: citation.multimediaLinks,
          })),
        );
      });
  }

  registerOnTouched(onTouch: () => void): void {
    this.form.statusChanges
      .pipe(startWith(this.form.status))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (this.form.touched) {
          onTouch();
        }
      });
  }

  @ViewChildren("focusTarget")
  private focusTargets!: QueryList<InputSourceXrefComponent>;

  appendCitation() {
    this.form.push(
      this.formBuilder.group({
        sourceXref: this.formBuilder.control(""),
        notes: this.formBuilder.control<GedcomNote[]>([]),
        text: this.formBuilder.control(""),
        page: this.formBuilder.control(""),
        quality: this.formBuilder.control(""),
        multimediaLinks: this.formBuilder.control<GedcomMultimediaLink[]>([]),
      }),
    );
    setTimeout(() => {
      this.focusTargets.last.focus();
    });
  }

  removeCitation(index: number) {
    this.form.removeAt(index);
  }
}
