import { InputRepositoryCallNumberComponent } from "./input-repository-call-number.component";
import { InputRepositoryXrefComponent } from "./input-repository-xref.component";
import { Component, DestroyRef, inject } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import type { ControlValueAccessor } from "@angular/forms";
import {
  NG_VALUE_ACCESSOR,
  NonNullableFormBuilder,
  ReactiveFormsModule,
} from "@angular/forms";
import { RouterModule } from "@angular/router";
import { startWith } from "rxjs/operators";

@Component({
  selector: "app-input-source-repository-citations",
  templateUrl: "./input-source-repository-citations.component.html",
  styleUrl: "./input.component.css",
  imports: [
    RouterModule,
    ReactiveFormsModule,
    InputRepositoryCallNumberComponent,
    InputRepositoryXrefComponent,
  ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: InputSourceRepositoryCitationsComponent,
      multi: true,
    },
  ],
})
export class InputSourceRepositoryCitationsComponent
  implements ControlValueAccessor
{
  private readonly destroyRef = inject(DestroyRef);
  private readonly formBuilder = inject(NonNullableFormBuilder);

  readonly formArray = this.formBuilder.array([
    this.formBuilder.group({
      repositoryXref: "",
      callNumber: "",
    }),
  ]);

  writeValue(
    repositoryCitations: { repositoryXref: string; callNumber: string }[],
  ): void {
    this.formArray.clear({ emitEvent: false });
    this.formArray.push(
      repositoryCitations.map((repositoryCitation) =>
        this.formBuilder.group({
          repositoryXref: repositoryCitation.repositoryXref,
          callNumber: repositoryCitation.callNumber,
        }),
      ),
      { emitEvent: false },
    );
  }

  registerOnChange(
    onChange: (
      repositoryCitations: { repositoryXref: string; callNumber: string }[],
    ) => void,
  ): void {
    this.formArray.valueChanges
      .pipe(startWith(this.formArray.value))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        onChange(this.formArray.getRawValue());
      });
  }

  registerOnTouched(onTouch: () => void): void {
    this.formArray.statusChanges
      .pipe(startWith())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (this.formArray.touched) {
          onTouch();
        }
      });
  }

  appendCitation() {
    this.formArray.push(
      this.formBuilder.group({
        repositoryXref: "",
        callNumber: "",
      }),
    );
  }

  removeCitation(index: number) {
    this.formArray.removeAt(index);
  }
}
