import { Component, computed, inject, input, output } from "@angular/core";
import { RouterModule } from "@angular/router";

import { AncestryService } from "../../database/ancestry.service";
import type { GedcomDatabase } from "../../gedcom/gedcomDatabase";
import { serializeGedcomRecordToText } from "../../gedcom/gedcomRecord";
import type { GedcomSource } from "../../gedcom/gedcomSource";
import { GedcomDiffComponent } from "../gedcom-diff/gedcom-diff.component";
import { applyUrlSuggestions } from "./apply-url-suggestion.util";
import { normalizeFamilySearchUrl } from "./source-url.util";
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
@Component({
  selector: "app-sources-without-repositories",
  imports: [RouterModule, GedcomDiffComponent],
  templateUrl: "./sources-without-repositories.component.html",
})
export class SourcesWithoutRepositoriesComponent {
  private readonly ancestryService = inject(AncestryService);

  readonly ancestryDatabase = input.required<GedcomDatabase>();

  readonly reviewUrlSuggestions = output<SourceUrlSuggestions>();
  readonly submitUrlSuggestions = output<SourceUrlSuggestions>();

  readonly sourcesWithoutRepositories = computed(() =>
    Object.values(this.ancestryDatabase().sources)
      .filter((source) => source.repositoryLinks.length === 0)
      .map((source) => {
        const suggestions = sourceValidators(
          source,
          this.ancestryDatabase(),
        ).warnings.flatMap((warning) => warning.urlSuggestion ?? []);
        return {
          source,
          suggestions,
          displayedSuggestions: uniqueByUrl(suggestions),
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

/** One entry per distinct URL, shown as the call number it would become.
 * The same URL often appears in more than one field (e.g. both the title
 * and the text), or as both the bare and www FamilySearch host; each
 * occurrence stays in `suggestions` so applying them strips it from every
 * field it's on its own line in, but the list shows it only once. */
function uniqueByUrl(
  suggestions: UrlRepositorySuggestion[],
): UrlRepositorySuggestion[] {
  const seen = new Map<string, UrlRepositorySuggestion>();
  for (const suggestion of suggestions) {
    const url = normalizeFamilySearchUrl(suggestion.url);
    if (!seen.has(url)) seen.set(url, { ...suggestion, url });
  }
  return [...seen.values()];
}
