import type { AncestryDatabase } from "../database/ancestry.service";
import type { GedcomEventSharedWith } from "../gedcom/gedcomEvent";
import { InputIndividualXrefComponent } from "./input-individual-xref.component";
import type { QueryList } from "@angular/core";
import {
  Component,
  DestroyRef,
  ViewChildren,
  inject,
  model,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import type {
  AbstractControl,
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
  selector: "app-input-shared-with",
  imports: [ReactiveFormsModule, InputIndividualXrefComponent],
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

  readonly ancestryDatabase = model.required<AncestryDatabase>();

  readonly form = this.formBuilder.array<
    FormGroup<{
      xref: FormControl<string>;
      role: FormControl<string>;
    }>
  >([]);

  readonly newControls = new WeakSet<AbstractControl>([]);

  writeValue(sharedWith: GedcomEventSharedWith[]): void {
    this.form.clear({ emitEvent: false });
    this.form.push(
      sharedWith.map((friend) =>
        this.formBuilder.group({
          xref: friend.xref,
          role: friend.role ?? "",
        }),
      ),
      { emitEvent: false },
    );
  }

  registerOnChange(
    onChange: (sharedWith: GedcomEventSharedWith[]) => void,
  ): void {
    this.form.valueChanges
      .pipe(startWith(this.form.value))
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
      .pipe(startWith(this.form.status))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (this.form.touched) {
          onTouch();
        }
      });
  }

  @ViewChildren("focusTarget")
  private focusTargets!: QueryList<InputIndividualXrefComponent>;

  appendSharedEvent() {
    const formGroup = this.formBuilder.group({
      xref: this.formBuilder.control(""),
      role: this.formBuilder.control(""),
    });
    this.newControls.add(formGroup);
    this.form.push(formGroup);
    setTimeout(() => {
      this.focusTargets.last.focus();
    });
  }

  removeSharedEvent(index: number) {
    this.form.removeAt(index);
  }
}
