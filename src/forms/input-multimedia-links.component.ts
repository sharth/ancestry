import type { AncestryDatabase } from "../database/ancestry.service";
import type { GedcomMultimediaLink } from "../gedcom/gedcomMultimediaLink";
import type { ElementRef, QueryList } from "@angular/core";
import {
  ChangeDetectionStrategy,
  Component,
  Injector,
  ViewChildren,
  afterNextRender,
  computed,
  inject,
  model,
} from "@angular/core";
import type { FieldTree } from "@angular/forms/signals";
import { Field, type FormValueControl, form } from "@angular/forms/signals";
import { RouterModule } from "@angular/router";

@Component({
  selector: "app-input-multimedia-links",
  templateUrl: "./input-multimedia-links.component.html",
  styleUrl: "./input.component.css",
  imports: [RouterModule, Field],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InputMultimediaLinksComponent implements FormValueControl<
  GedcomMultimediaLink[]
> {
  private readonly _injector = inject(Injector);

  readonly ancestryDatabase = model.required<AncestryDatabase>();
  readonly value = model<GedcomMultimediaLink[]>([]);
  readonly form = form(this.value);

  readonly multimedias = computed(() =>
    Object.values(this.ancestryDatabase().multimedias),
  );

  // Keep track of the controls that were added by a user interation.
  readonly newControls = new WeakSet<FieldTree<GedcomMultimediaLink, number>>();

  @ViewChildren("focusTarget") private focusTargets!: QueryList<
    ElementRef<HTMLElement>
  >;

  appendMultimediaLink() {
    this.value.update((multimediaLinks) => [
      ...multimediaLinks,
      { xref: "", title: "" },
    ]);
    this.newControls.add(this.form[this.form.length - 1]!);
    afterNextRender(
      {
        read: () => {
          this.focusTargets.last.nativeElement.focus();
        },
      },
      { injector: this._injector },
    );
  }

  removeMultimediaLink(index: number) {
    this.value.update((multimediaLinks) => multimediaLinks.toSpliced(index, 1));
  }
}
