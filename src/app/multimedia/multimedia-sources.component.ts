import { Component, computed, input } from "@angular/core";
import { RouterModule } from "@angular/router";

import type { GedcomDatabase } from "../../gedcom/gedcomDatabase";
import type { GedcomSource } from "../../gedcom/gedcomSource";

@Component({
  selector: "app-multimedia-sources",
  templateUrl: "./multimedia-sources.component.html",
  styleUrl: "./multimedia.component.css",
  imports: [RouterModule],
})
export class MultimediaSourcesComponent {
  readonly ancestryDatabase = input.required<GedcomDatabase>();
  readonly xref = input.required<string>();

  /** Sources whose own record links to this multimedia object (SOUR.OBJE). */
  readonly sources = computed(() => {
    const xref = this.xref();
    // Sort by the same label the template shows for each source.
    const label = (source: GedcomSource) =>
      source.abbr || source.title || source.xref;
    return Object.values(this.ancestryDatabase().sources)
      .filter((source) =>
        source.multimediaLinks.some(
          (multimediaLink) => multimediaLink.xref === xref,
        ),
      )
      .sort((lhs, rhs) => label(lhs).localeCompare(label(rhs)));
  });
}
