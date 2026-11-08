import { Component, computed, inject, input, output } from "@angular/core";
import { RouterModule } from "@angular/router";

import { AncestryService } from "../../database/ancestry.service";
import type { GedcomDatabase } from "../../gedcom/gedcomDatabase";
import type { GedcomSource } from "../../gedcom/gedcomSource";
import { GedcomDiffComponent } from "../gedcom-diff/gedcom-diff.component";
import {
  applyBibliographyTitleSuggestion,
  bibliographyForMissingTitle,
} from "./apply-bibliography-title-suggestion.util";

/** Lists the sources that have a `_BIBL` (bibliography, e.g. from an
 * Ancestry.com export) but no TITL, and suggests moving the bibliography
 * into the title -- together with any repository links for URLs in the
 * source, as one edit. Reviewing or submitting a suggestion is handed back
 * to the validation page, which owns the editor dialog. */
@Component({
  selector: "app-bibliography-without-title",
  imports: [RouterModule, GedcomDiffComponent],
  templateUrl: "./bibliography-without-title.component.html",
})
export class BibliographyWithoutTitleComponent {
  private readonly ancestryService = inject(AncestryService);

  readonly ancestryDatabase = input.required<GedcomDatabase>();

  readonly reviewSuggestion = output<GedcomSource>();
  readonly submitSuggestion = output<GedcomSource>();

  readonly rows = computed(() =>
    Object.values(this.ancestryDatabase().sources).flatMap((source) => {
      const bibliography = bibliographyForMissingTitle(source);
      if (bibliography === undefined) return [];
      return [{ source, bibliography, differences: this.differences(source) }];
    }),
  );

  // The records that would actually change on disk if the suggestion is
  // applied and saved, built from the same diff the save path uses.
  private differences(source: GedcomSource) {
    const { database } = applyBibliographyTitleSuggestion(
      this.ancestryDatabase(),
      source,
    );
    return this.ancestryService.gedcomDatabaseDifferences(database);
  }
}
