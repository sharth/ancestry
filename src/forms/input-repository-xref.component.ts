import { AncestryService } from "../database/ancestry.service";
import { Component, computed, inject } from "@angular/core";
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
  private readonly ancestryService = inject(AncestryService);

  constructor() {
    this.formGroup.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      this.onChange(this.formGroup.getRawValue().repositoryXref);
    });
    this.formGroup.statusChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      if (this.formGroup.touched) {
        this.onTouch();
      }
    });
  }

  public vm = computed(() => {
    const ancestry = this.ancestryService.contents();
    if (ancestry == undefined) {
      return undefined;
    }

    return {
      repositories: ancestry.repositories,
    };
  });

  readonly formBuilder = inject(NonNullableFormBuilder);
  readonly formGroup = this.formBuilder.group({
    repositoryXref: "",
  });

  writeValue(repositoryXref: string): void {
    this.formGroup.setValue({ repositoryXref }, { emitEvent: false });
  }

  registerOnChange(fn: (repositoryXref: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouch = fn;
  }

  private onChange!: (repositoryXref: string) => void;
  private onTouch!: () => void;
}
