import type { AncestryDatabase } from "../database/ancestry.service";
import type { GedcomNote } from "../gedcom/gedcomNote";
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
import type { ControlValueAccessor } from "@angular/forms";
import {
  NG_VALUE_ACCESSOR,
  NonNullableFormBuilder,
  ReactiveFormsModule,
} from "@angular/forms";
import { startWith } from "rxjs/operators";

@Component({
  selector: "app-input-notes",
  imports: [ReactiveFormsModule],
  templateUrl: "./input-notes.component.html",
  styleUrl: "./input.component.css",
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: InputNotesComponent,
      multi: true,
    },
  ],
})
export class InputNotesComponent implements ControlValueAccessor {
  private readonly destroyRef = inject(DestroyRef);
  private readonly formBuilder = inject(NonNullableFormBuilder);

  readonly open = input<boolean>(false);

  readonly ancestryDatabase = model.required<AncestryDatabase>();

  readonly formArray = this.formBuilder.array([
    this.formBuilder.group({
      text: "",
    }),
  ]);

  writeValue(gedcomNotes: GedcomNote[]): void {
    this.formArray.clear({ emitEvent: false });
    this.formArray.push(
      gedcomNotes.map((gedcomNote) =>
        this.formBuilder.group({
          text: gedcomNote.text,
        }),
      ),
      { emitEvent: false },
    );
  }

  registerOnChange(onChange: (gedcomNotes: GedcomNote[]) => void): void {
    this.formArray.valueChanges
      .pipe(startWith(this.formArray.value))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        onChange(this.formArray.getRawValue());
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

  @ViewChildren("focusTarget")
  private focusTargets!: QueryList<ElementRef<HTMLElement>>;

  appendNote() {
    this.formArray.push(
      this.formBuilder.group({
        text: "",
      }),
    );
    setTimeout(() => {
      this.focusTargets.last.nativeElement.focus();
    });
  }

  removeNote(index: number) {
    this.formArray.removeAt(index);
  }
}
