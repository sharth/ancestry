import { Component, computed, inject, input } from "@angular/core";
import { RouterModule } from "@angular/router";

import { AncestryService } from "../../database/ancestry.service";
import { CallNumberComponent } from "../call-number/call-number.component";

@Component({
  selector: "app-repository-sources",
  imports: [RouterModule, CallNumberComponent],
  templateUrl: "./repository-sources.component.html",
  styleUrl: "./repository.component.css",
})
export class RepositorySourcesComponent {
  readonly xref = input.required<string>();
  private readonly ancestryService = inject(AncestryService);

  readonly vm = computed(() => {
    const ancestry = this.ancestryService.ancestryDatabase();
    if (ancestry == undefined) {
      return undefined;
    }

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
