import { AncestryService } from "../database/ancestry.service";
import { displayGedcomName } from "../gedcom/gedcomName";
import { Component, DestroyRef, computed, inject } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import type { ControlValueAccessor } from "@angular/forms";
import {
  NG_VALUE_ACCESSOR,
  NonNullableFormBuilder,
  ReactiveFormsModule,
} from "@angular/forms";
import { startWith } from "rxjs/operators";

@Component({
  selector: "app-input-source-xref",
  imports: [ReactiveFormsModule],
  templateUrl: "./input-source-xref.component.html",
  styleUrl: "./input.component.css",
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: InputSourceXrefComponent,
      multi: true,
    },
  ],
})
export class InputSourceXrefComponent implements ControlValueAccessor {
  private readonly destroyRef = inject(DestroyRef);
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly ancestryService = inject(AncestryService);

  public vm = computed(() => {
    const ancestry = this.ancestryService.contents();
    if (ancestry == undefined) {
      return undefined;
    }

    return {
      sources: ancestry.sources,
    };
  });

  readonly formGroup = this.formBuilder.group({
    sourceXref: "",
  });

  writeValue(sourceXref: string): void {
    this.formGroup.setValue({ sourceXref }, { emitEvent: false });
  }

  registerOnChange(onChange: (sourceXref: string) => void): void {
    this.formGroup.valueChanges
      .pipe(startWith(this.formGroup.value))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        onChange(this.formGroup.getRawValue().sourceXref);
      });
  }

  registerOnTouched(onTouch: () => void): void {
    this.formGroup.statusChanges
      .pipe(startWith())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (this.formGroup.touched) {
          onTouch();
        }
      });
  }

  public readonly displayGedcomName = displayGedcomName;
}
