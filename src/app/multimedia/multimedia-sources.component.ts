import { Component, computed, input } from "@angular/core";
import { RouterModule } from "@angular/router";
import type { Immutable } from "immer";

import type { GedcomDatabase } from "../../gedcom/gedcomDatabase";

@Component({
  selector: "app-multimedia-sources",
  templateUrl: "./multimedia-sources.component.html",
  styleUrl: "./multimedia.component.css",
  imports: [RouterModule],
})
export class MultimediaSourcesComponent {
  readonly ancestryDatabase = input.required<Immutable<GedcomDatabase>>();
  readonly xref = input.required<string>();

  /** Sources whose own record links to this multimedia object (SOUR.OBJE). */
  readonly sources = computed(() => {
    const xref = this.xref();
    return Object.values(this.ancestryDatabase().sources).filter((source) =>
      source.multimediaLinks.some(
        (multimediaLink) => multimediaLink.xref === xref,
      ),
    );
  });
}
