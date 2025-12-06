import type { AncestryDatabase } from "../database/ancestry.service";
import type { GedcomMultimediaLink } from "../gedcom/gedcomMultimediaLink";
import type { ElementRef, QueryList } from "@angular/core";
import { Component, ViewChildren, computed, model } from "@angular/core";
import { Field, type FormValueControl, form } from "@angular/forms/signals";
import { RouterModule } from "@angular/router";

@Component({
  selector: "app-input-multimedia-links",
  templateUrl: "./input-multimedia-links.component.html",
  styleUrl: "./input.component.css",
  imports: [RouterModule, Field],
})
export class InputMultimediaLinksComponent implements FormValueControl<
  GedcomMultimediaLink[]
> {
  readonly ancestryDatabase = model.required<AncestryDatabase>();
  readonly value = model<GedcomMultimediaLink[]>([]);
  readonly form = form(this.value);

  readonly multimedias = computed(() =>
    Object.values(this.ancestryDatabase().multimedias),
  );

  @ViewChildren("focusTarget") private focusTargets!: QueryList<
    ElementRef<HTMLElement>
  >;

  appendMultimediaLink() {
    this.value.update((multimediaLinks) => [
      ...multimediaLinks,
      { xref: "", title: "" },
    ]);
    setTimeout(() => {
      this.focusTargets.last.nativeElement.focus();
    });
  }

  removeMultimediaLink(index: number) {
    this.value.update((multimediaLinks) => multimediaLinks.toSpliced(index, 1));
  }
}
