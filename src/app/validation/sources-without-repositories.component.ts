import { Component, computed, inject, input, output } from "@angular/core";
import { RouterModule } from "@angular/router";

import { AncestryService } from "../../database/ancestry.service";
import type { GedcomDatabase } from "../../gedcom/gedcomDatabase";
import type { GedcomSource } from "../../gedcom/gedcomSource";
import { GedcomDiffComponent } from "../gedcom-diff/gedcom-diff.component";
import { applyUrlSuggestions } from "./apply-url-suggestion.util";
import {
  sourceValidators,
  type UrlRepositorySuggestion,
} from "./source-validators";

/** Every URL suggestion for one source, applied together as one edit. */
export interface SourceUrlSuggestions {
  source: GedcomSource;
  suggestions: UrlRepositorySuggestion[];
}

/** Lists the sources that don't cite any repository (no REPO link), so
 * there's no record of where the original can be found, along with the
 * repositories suggested for each from URLs found in its text. Reviewing
 * or submitting a suggestion is handed back to the validation page, which
 * owns the editor dialog. */
import {
  databaseDifferences,
  suggestionDifferences,
} from "./suggestion-differences.util";

@Component({
  selector: "app-sources-without-repositories",
  imports: [RouterModule, GedcomDiffComponent],
  templateUrl: "./sources-without-repositories.component.html",
})
export class SourcesWithoutRepositoriesComponent {
  private readonly ancestryService = inject(AncestryService);

  readonly ancestryDatabase = input.required<GedcomDatabase>();

  // Every record that differs from the file before any fix is applied,
  // computed once and shared by every suggestion's preview.
  private readonly baselineDifferences = computed(() =>
    databaseDifferences(this.ancestryService, this.ancestryDatabase()),
  );

  readonly reviewUrlSuggestions = output<SourceUrlSuggestions>();
  readonly submitUrlSuggestions = output<SourceUrlSuggestions>();

  readonly sourcesWithoutRepositories = computed(() =>
    findSourcesWithoutRepositories(this.ancestryDatabase()).map((source) => {
      const suggestions = sourceValidators(
        source,
        this.ancestryDatabase(),
      ).warnings.flatMap((warning) => warning.urlSuggestion ?? []);
      return {
        source,
        suggestions,
        differences:
          suggestions.length > 0 ? this.differences(source, suggestions) : [],
      };
    }),
  );

  // The records that would actually change on disk if `suggestions` are
  // applied and saved, built from the same diff the save path uses.
  private differences(
    source: GedcomSource,
    suggestions: UrlRepositorySuggestion[],
  ) {
    const { database } = applyUrlSuggestions(
      this.ancestryDatabase(),
      source,
      suggestions,
    );
    return suggestionDifferences(
      this.ancestryService,
      this.ancestryDatabase(),
      this.baselineDifferences(),
      database,
    );
  }
}

export function findSourcesWithoutRepositories(gedcomDatabase: GedcomDatabase) {
  return Object.values(gedcomDatabase.sources).filter(
    (source) => source.repositoryLinks.length === 0,
  );
}
