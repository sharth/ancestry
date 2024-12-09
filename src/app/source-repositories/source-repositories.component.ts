import { Component, computed, inject, input } from "@angular/core";
import { RouterModule } from "@angular/router";
import { CommonModule } from "@angular/common";
import { AncestryService } from "../../database/ancestry.service";

@Component({
  selector: "app-source-repositories",
  standalone: true,
  templateUrl: "./source-repositories.component.html",
  styleUrl: "./source-repositories.component.css",
  imports: [CommonModule, RouterModule],
})
export class SourceRepositoriesComponent {
  readonly xref = input.required<string>();
  private readonly ancestryService = inject(AncestryService);

  readonly vm = computed(() => {
    const ancestry = this.ancestryService.ancestryResource.value();
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
