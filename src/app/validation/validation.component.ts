import { Component, computed, inject, input } from "@angular/core";
import { ActivatedRoute, Router, RouterModule } from "@angular/router";
import { produce } from "immer";

import { AncestryService } from "../../database/ancestry.service";
import type { GedcomDatabase } from "../../gedcom/gedcomDatabase";
import { newGedcomRepository } from "../../gedcom/gedcomRepository";
import { newGedcomRepositoryLink } from "../../gedcom/gedcomRepositoryLink";
import type { GedcomSource } from "../../gedcom/gedcomSource";
import { calculateNextRepositoryXref } from "../../util/next-xref";
import type { UrlRepositorySuggestion } from "./source-validators";
import { sourceValidators } from "./source-validators";

@Component({
  selector: "app-validation",
  imports: [RouterModule],
  templateUrl: "./validation.component.html",
  styleUrl: "./validation.component.css",
})
export class ValidationComponent {
  private readonly ancestryService = inject(AncestryService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly ancestryDatabase = input.required<GedcomDatabase>();

  readonly sourceScenarios = computed(() =>
    Object.values(this.ancestryDatabase().sources).map((source) => ({
      source,
      result: sourceValidators(source, this.ancestryDatabase()),
    })),
  );

  // Applies a suggested fix for a URL found in a source's text: links the
  // source to the matched repository (or a newly created one) and removes
  // the URL from the source's text, since it's now represented as a
  // repository link instead.
  async applyUrlSuggestion(
    source: GedcomSource,
    suggestion: UrlRepositorySuggestion,
  ) {
    await this.ancestryService.requestWritePermission();

    const updatedDatabase = produce(this.ancestryDatabase(), (draft) => {
      const repositoryXref =
        suggestion.matchedRepository?.xref ??
        calculateNextRepositoryXref(draft);
      draft.repositories[repositoryXref] ??= newGedcomRepository({
        xref: repositoryXref,
        name: suggestion.suggestedName,
      });

      const draftSource = draft.sources[source.xref];
      if (draftSource === undefined) return;
      if (
        !draftSource.repositoryLinks.some(
          (link) => link.repositoryXref === repositoryXref,
        )
      ) {
        draftSource.repositoryLinks.push(
          newGedcomRepositoryLink({ repositoryXref }),
        );
      }
      draftSource.text = draftSource.text.replace(suggestion.url, "").trim();
    });

    await this.ancestryService.updateGedcomDatabase(updatedDatabase);
    await this.router.navigate([], {
      relativeTo: this.route,
      onSameUrlNavigation: "reload",
      skipLocationChange: true,
    });
  }
}
