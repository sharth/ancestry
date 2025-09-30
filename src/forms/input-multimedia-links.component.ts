import type { AncestryDatabase } from "../database/ancestry.service";
import type { GedcomMultimediaLink } from "../gedcom/gedcomMultimediaLink";
import type { ElementRef, QueryList } from "@angular/core";
import {
  Component,
  DestroyRef,
  ViewChildren,
  inject,
  input,
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
  selector: "app-input-multimedia-links",
  templateUrl: "./input-multimedia-links.component.html",
  styleUrl: "./input.component.css",
  imports: [RouterModule, ReactiveFormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: InputMultimediaLinksComponent,
      multi: true,
    },
  ],
})
export class InputMultimediaLinksComponent implements ControlValueAccessor {
  private readonly destroyRef = inject(DestroyRef);
  private readonly formBuilder = inject(NonNullableFormBuilder);

  readonly ancestryDatabase = input.required<AncestryDatabase>();

  readonly formArray = this.formBuilder.array([
    this.formBuilder.group({
      xref: "",
      title: "",
    }),
  ]);

  writeValue(multimediaLinks: GedcomMultimediaLink[]): void {
    this.formArray.clear({ emitEvent: false });
    this.formArray.push(
      multimediaLinks.map((multimediaLink) =>
        this.formBuilder.group({
          xref: multimediaLink.xref,
          title: multimediaLink.title ?? "",
        }),
      ),
      { emitEvent: false },
    );
  }

  registerOnChange(
    onChange: (multimediaLinks: GedcomMultimediaLink[]) => void,
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

  appendMultimediaLink() {
    this.formArray.push(
      this.formBuilder.group({
        xref: "",
        title: "",
      }),
    );
    setTimeout(() => {
      this.focusTargets.last.nativeElement.focus();
    });
  }

  removeMultimediaLink(index: number) {
    this.formArray.removeAt(index);
  }
}
