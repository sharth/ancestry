import { Component, computed, input } from "@angular/core";
import { RouterModule } from "@angular/router";

import type { GedcomResourceValue } from "../../database/ancestry.service";
import { RepositoryCallNumberComponent } from "../repository-call-number/repository-call-number.component";

@Component({
  selector: "app-repository-sources",
  imports: [RouterModule, RepositoryCallNumberComponent],
  templateUrl: "./repository-sources.component.html",
  styleUrl: "./repository.component.css",
})
export class RepositorySourcesComponent {
  readonly xref = input.required<string>();
  readonly gedcom = input.required<GedcomResourceValue>();

  readonly vm = computed(() => {
    const ancestry = this.gedcom().gedcomDatabase;

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
        })),
    };
  });
}
