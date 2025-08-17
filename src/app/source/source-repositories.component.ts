import { AncestryService } from "../../database/ancestry.service";
import { Component, computed, inject, input } from "@angular/core";
import { RouterModule } from "@angular/router";

@Component({
  selector: "app-source-repositories",
  templateUrl: "./source-repositories.component.html",
  styleUrl: "./source.component.css",
  imports: [RouterModule],
})
export class SourceRepositoriesComponent {
  readonly xref = input.required<string>();

  private readonly ancestryService = inject(AncestryService);

  readonly vm = computed(() => {
    const ancestry = this.ancestryService.contents();
    if (ancestry == undefined) {
      return undefined;
    }
    const source = ancestry.sources.get(this.xref());
    if (source == undefined) {
      return undefined;
    }

    return {
      citations: source.repositoryCitations.map((citation) => ({
        repositoryXref: citation.repositoryXref,
        callNumbers: citation.callNumbers,
        repository: ancestry.repositories.get(citation.repositoryXref),
      })),
    };
  });
}
