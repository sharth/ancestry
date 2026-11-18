import { Component, computed, inject, input, output } from "@angular/core";
import { RouterModule } from "@angular/router";

import { AncestryService } from "../../database/ancestry.service";
import type { GedcomDatabase } from "../../gedcom/gedcomDatabase";
import type { GedcomSource } from "../../gedcom/gedcomSource";
import { GedcomDiffComponent } from "../gedcom-diff/gedcom-diff.component";
import { RepositoryCallNumberComponent } from "../repository-call-number/repository-call-number.component";
import {
  applyOutdatedUrlSuggestion,
  outdatedUrlsToUpdate,
} from "./apply-outdated-url-suggestion.util";

/** The sources with a call number that is an outdated URL, one a site has
 * since moved (see `urlRewrites`). */
export function findOutdatedUrls(database: GedcomDatabase): GedcomSource[] {
  return Object.values(database.sources).filter(
    (source) => outdatedUrlsToUpdate(source).length > 0,
  );
}

/** Lists the call numbers that are outdated URLs, linking both the old and
 * the new URL so each can be checked, and suggests replacing them.
 * Reviewing or submitting a suggestion is handed back to the validation
 * page, which owns the editor dialog. */
@Component({
  selector: "app-outdated-urls",
  imports: [RouterModule, GedcomDiffComponent, RepositoryCallNumberComponent],
  templateUrl: "./outdated-urls.component.html",
})
export class OutdatedUrlsComponent {
  private readonly ancestryService = inject(AncestryService);

  readonly ancestryDatabase = input.required<GedcomDatabase>();

  readonly reviewSuggestion = output<GedcomSource>();
  readonly submitSuggestion = output<GedcomSource>();
  readonly submitAllSuggestions = output<GedcomSource[]>();

  readonly sources = computed(() => findOutdatedUrls(this.ancestryDatabase()));

  // The sources with at least one new URL to suggest; a call number whose
  // new URL can't be told is listed, but there's nothing to submit for it.
  readonly sourcesWithSuggestions = computed(() =>
    this.rows()
      .filter((row) => row.hasSuggestion)
      .map((row) => row.source),
  );

  readonly rows = computed(() =>
    this.sources().map((source) => {
      const urls = outdatedUrlsToUpdate(source);
      const hasSuggestion = urls.some((url) => url.newUrl !== undefined);
      return {
        source,
        urls,
        hasSuggestion,
        // The records that would actually change on disk, built from the
        // same diff the save path uses.
        differences: hasSuggestion
          ? this.ancestryService.gedcomDatabaseDifferences(
              applyOutdatedUrlSuggestion(this.ancestryDatabase(), [
                source.xref,
              ]),
            )
          : [],
      };
    }),
  );
}
