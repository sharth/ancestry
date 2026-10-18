import { Component, computed, input } from "@angular/core";
import { RouterModule } from "@angular/router";

import type { GedcomDatabase } from "../../gedcom/gedcomDatabase";

@Component({
  selector: "app-source-overview",
  templateUrl: "./source-overview.component.html",
  styleUrl: "./source.component.css",
  imports: [RouterModule],
})
export class SourceOverviewComponent {
  readonly ancestryDatabase = input.required<GedcomDatabase>();
  readonly xref = input.required<string>();

  readonly vm = computed(() => {
    const ancestryDatabase = this.ancestryDatabase();
    const source = ancestryDatabase.sources[this.xref()];
    if (source == undefined) {
      return undefined;
    }

    return {
      source,
      multimediaLinks: source.multimediaLinks.map((multimediaLink) => ({
        multimedia: ancestryDatabase.multimedias[multimediaLink.xref],
        xref: multimediaLink.xref,
        title: multimediaLink.title,
      })),
    };
  });
}
