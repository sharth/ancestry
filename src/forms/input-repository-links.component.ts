import type { AncestryDatabase } from "../database/ancestry.service";
import type { GedcomRepositoryLink } from "../gedcom/gedcomRepositoryLink";
import { InputRepositoryCallNumberComponent } from "./input-repository-call-number.component";
import { InputRepositoryXrefComponent } from "./input-repository-xref.component";
import type { QueryList } from "@angular/core";
import {
  Component,
  DestroyRef,
  ViewChildren,
  inject,
  model,
} from "@angular/core";
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
  selector: "app-input-repository-links",
  templateUrl: "./input-repository-links.component.html",
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
      useExisting: InputRepositoryLinksComponent,
      multi: true,
    },
  ],
})
export class InputRepositoryLinksComponent implements ControlValueAccessor {
  private readonly destroyRef = inject(DestroyRef);
  private readonly formBuilder = inject(NonNullableFormBuilder);

  readonly ancestryDatabase = model.required<AncestryDatabase>();

  readonly formArray = this.formBuilder.array([
    this.formBuilder.group({
      repositoryXref: "",
      callNumber: "",
    }),
  ]);

  writeValue(repositoryLinks: GedcomRepositoryLink[]): void {
    this.formArray.clear({ emitEvent: false });
    this.formArray.push(
      repositoryLinks.flatMap((repositoryLink) =>
        repositoryLink.callNumbers.map((callNumber) =>
          this.formBuilder.group({
            repositoryXref: repositoryLink.repositoryXref,
            callNumber,
          }),
        ),
      ),
      { emitEvent: false },
    );
  }

  registerOnChange(
    onChange: (repositoryLink: GedcomRepositoryLink[]) => void,
  ): void {
    this.formArray.valueChanges
      .pipe(startWith(this.formArray.value))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        onChange(
          this.formArray.getRawValue().map((formGroup) => ({
            repositoryXref: formGroup.repositoryXref,
            callNumbers: formGroup.callNumber ? [formGroup.callNumber] : [],
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

  @ViewChildren("focusTarget")
  focusTargets!: QueryList<InputRepositoryXrefComponent>;

  appendCitation() {
    this.formArray.push(
      this.formBuilder.group({
        repositoryXref: "",
        callNumber: "",
      }),
    );
    setTimeout(() => {
      this.focusTargets.last.focus();
    });
  }

  removeCitation(index: number) {
    this.formArray.removeAt(index);
  }
}
