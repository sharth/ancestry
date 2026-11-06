import { Component, computed, inject, input, output } from "@angular/core";
import { RouterModule } from "@angular/router";

import { AncestryService } from "../../database/ancestry.service";
import type { GedcomDatabase } from "../../gedcom/gedcomDatabase";
import { serializeGedcomRecordToText } from "../../gedcom/gedcomRecord";
import type { GedcomSource } from "../../gedcom/gedcomSource";
import { GedcomDiffComponent } from "../gedcom-diff/gedcom-diff.component";
import { applyUrlSuggestion } from "./apply-url-suggestion.util";
import {
  sourceValidators,
  type UrlRepositorySuggestion,
} from "./source-validators";

export interface SourceUrlSuggestion {
  source: GedcomSource;
  suggestion: UrlRepositorySuggestion;
}

/** Lists the sources that don't cite any repository (no REPO link), so
 * there's no record of where the original can be found, along with the
 * repositories suggested for each from URLs found in its text. Reviewing
 * or submitting a suggestion is handed back to the validation page, which
 * owns the editor dialog. */
@Component({
  selector: "app-sources-without-repositories",
  imports: [RouterModule, GedcomDiffComponent],
  templateUrl: "./sources-without-repositories.component.html",
})
export class SourcesWithoutRepositoriesComponent {
  private readonly ancestryService = inject(AncestryService);

  readonly ancestryDatabase = input.required<GedcomDatabase>();

  readonly reviewUrlSuggestion = output<SourceUrlSuggestion>();
  readonly submitUrlSuggestion = output<SourceUrlSuggestion>();

  readonly sourcesWithoutRepositories = computed(() =>
    Object.values(this.ancestryDatabase().sources)
      .filter((source) => source.repositoryLinks.length === 0)
      .map((source) => ({
        source,
        suggestions: sourceValidators(source, this.ancestryDatabase())
          .warnings.flatMap((warning) => warning.urlSuggestion ?? [])
          .map((suggestion) => ({
            suggestion,
            differences: this.differences(source, suggestion),
          })),
      })),
  );

  // The records that would actually change on disk if `suggestion` is
  // applied and saved, built from the same diff the save path uses.
  private differences(
    source: GedcomSource,
    suggestion: UrlRepositorySuggestion,
  ) {
    const { database } = applyUrlSuggestion(
      this.ancestryDatabase(),
      source,
      suggestion,
    );
    return this.ancestryService
      .compareGedcomDatabase(database)
      .filter(
        ({ originalGedcomRecord, updatedGedcomRecord }) =>
          originalGedcomRecord == undefined ||
          updatedGedcomRecord == undefined ||
          serializeGedcomRecordToText(originalGedcomRecord).join("\n") !==
            serializeGedcomRecordToText(updatedGedcomRecord).join("\n"),
      );
  }
}
