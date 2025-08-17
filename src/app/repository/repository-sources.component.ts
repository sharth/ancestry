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
    const ancestry = this.ancestryService.contents();
    if (ancestry == undefined) {
      return undefined;
    }

    return {
      sources: [...ancestry.sources.values()]
        .flatMap((source) =>
          source.repositoryCitations.map((repositoryCitation) => ({
            source,
            repositoryCitation,
          })),
        )
        .filter(
          ({ repositoryCitation }) =>
            repositoryCitation.repositoryXref == this.xref(),
        )
        .map(({ source, repositoryCitation }) => ({
          xref: source.xref,
          abbr: source.abbr,
          callNumbers: repositoryCitation.callNumbers,
        })),
    };
  });
}
