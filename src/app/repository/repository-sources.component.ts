import { AncestryService } from "../../database/ancestry.service";
import { Component, computed, inject, input } from "@angular/core";
import { RouterModule } from "@angular/router";

@Component({
  selector: "app-repository-sources",
  imports: [RouterModule],
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
      sources: ancestry.sources
        .values()
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
        .toArray(),
    };
  });
}
