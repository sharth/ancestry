import { AncestryService } from "../database/ancestry.service";
import { Component, DestroyRef, computed, inject } from "@angular/core";
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
  selector: "app-input-source-multimedia-links",
  templateUrl: "./input-source-multimedia-links.component.html",
  styleUrl: "./input.component.css",
  imports: [RouterModule, ReactiveFormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: InputSourceMultimediaLinksComponent,
      multi: true,
    },
  ],
})
export class InputSourceMultimediaLinksComponent
  implements ControlValueAccessor
{
  private readonly destroyRef = inject(DestroyRef);
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly ancestryService = inject(AncestryService);

  readonly vm = computed(() => {
    const ancestry = this.ancestryService.contents();
    if (ancestry == undefined) return undefined;

    return {
      multimedias: ancestry.multimedias,
    };
  });

  readonly formArray = this.formBuilder.array([
    this.formBuilder.group({
      multimediaXref: "",
      title: "",
    }),
  ]);

  writeValue(
    multimediaLinks: { multimediaXref: string; title?: string }[],
  ): void {
    this.formArray.clear();
    multimediaLinks.forEach((multimediaLink) => {
      this.formArray.push(
        this.formBuilder.group({
          multimediaXref: multimediaLink.multimediaXref,
          title: multimediaLink.title ?? "",
        }),
      );
    });
  }

  registerOnChange(
    onChange: (
      multimediaLinks: { multimediaXref: string; title?: string }[],
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

  appendMultimediaLink() {
    this.formArray.push(
      this.formBuilder.group({
        multimediaXref: "",
        title: "",
      }),
    );
  }

  removeMultimediaLink(index: number) {
    this.formArray.removeAt(index);
  }
}
