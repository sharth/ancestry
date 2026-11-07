import { Component, computed, input } from "@angular/core";
import { RouterModule } from "@angular/router";

import type { GedcomDatabase } from "../../gedcom/gedcomDatabase";
import { RepositoryCallNumberComponent } from "../repository-call-number/repository-call-number.component";

@Component({
  selector: "app-source-overview",
  templateUrl: "./source-overview.component.html",
  styleUrl: "./source.component.css",
  imports: [RouterModule, RepositoryCallNumberComponent],
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
      multimediaLinks: source.multimediaLinks.map((multimediaLink) => {
        const multimedia = ancestryDatabase.multimedias[multimediaLink.xref];
        return {
          multimedia,
          xref: multimediaLink.xref,
          // The link's TITL overrides the multimedia record's own title.
          title: multimediaLink.title || multimedia?.title,
        };
      }),
      repositoryCitations: source.repositoryLinks.map((repositoryLink) => ({
        repositoryXref: repositoryLink.repositoryXref,
        callNumbers: repositoryLink.callNumbers,
        repository:
          ancestryDatabase.repositories[repositoryLink.repositoryXref],
      })),
    };
  });
}
