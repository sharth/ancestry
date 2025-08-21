import { AncestryService } from "../database/ancestry.service";
import { Component, DestroyRef, computed, inject } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import type { ControlValueAccessor } from "@angular/forms";
import {
  NG_VALUE_ACCESSOR,
  NonNullableFormBuilder,
  ReactiveFormsModule,
} from "@angular/forms";

@Component({
  selector: "app-input-repository-xref",
  imports: [ReactiveFormsModule],
  templateUrl: "./input-repository-xref.component.html",
  styleUrl: "./input.component.css",
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: InputRepositoryXrefComponent,
      multi: true,
    },
  ],
})
export class InputRepositoryXrefComponent implements ControlValueAccessor {
  private readonly destroyRef = inject(DestroyRef);
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly ancestryService = inject(AncestryService);

  public vm = computed(() => {
    const ancestry = this.ancestryService.contents();
    if (ancestry == undefined) {
      return undefined;
    }

    return {
      repositories: ancestry.repositories,
    };
  });

  readonly formGroup = this.formBuilder.group({
    repositoryXref: "",
  });

  writeValue(repositoryXref: string): void {
    this.formGroup.setValue({ repositoryXref }, { emitEvent: false });
  }

  registerOnChange(onChange: (repositoryXref: string) => void): void {
    this.formGroup.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        onChange(this.formGroup.getRawValue().repositoryXref);
      });
  }

  registerOnTouched(onTouch: () => void): void {
    this.formGroup.statusChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (this.formGroup.touched) {
          onTouch();
        }
      });
  }
}
