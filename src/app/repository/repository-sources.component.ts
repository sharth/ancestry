import { Component, computed, input } from "@angular/core";
import { RouterModule } from "@angular/router";

import type { GedcomDatabase } from "../../gedcom/gedcomDatabase";
import { RepositoryCallNumberComponent } from "../repository-call-number/repository-call-number.component";

@Component({
  selector: "app-repository-sources",
  imports: [RouterModule, RepositoryCallNumberComponent],
  templateUrl: "./repository-sources.component.html",
  styleUrl: "./repository.component.css",
})
export class RepositorySourcesComponent {
  readonly xref = input.required<string>();
  readonly ancestryDatabase = input.required<GedcomDatabase>();

  readonly vm = computed(() => {
    const ancestry = this.ancestryDatabase();

    return {
      sources: Object.values(ancestry.sources)
        .flatMap((source) =>
          source.repositoryLinks.map((repositoryLink) => ({
            source,
            repositoryLink,
          })),
        )
        .filter(
          ({ repositoryLink }) => repositoryLink.repositoryXref == this.xref(),
        )
        .map(({ source, repositoryLink }) => ({
          xref: source.xref,
          abbr: source.abbr,
          callNumbers: repositoryLink.callNumbers,
        }))
        // Sort by the same label the template shows for each source.
        .sort((lhs, rhs) =>
          (lhs.abbr || lhs.xref).localeCompare(rhs.abbr || rhs.xref),
        ),
    };
  });
}
