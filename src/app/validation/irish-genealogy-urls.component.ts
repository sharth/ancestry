import { Component, computed, inject, input, output } from "@angular/core";
import { RouterModule } from "@angular/router";

import { AncestryService } from "../../database/ancestry.service";
import type { GedcomDatabase } from "../../gedcom/gedcomDatabase";
import type { GedcomSource } from "../../gedcom/gedcomSource";
import { GedcomDiffComponent } from "../gedcom-diff/gedcom-diff.component";
import { RepositoryCallNumberComponent } from "../repository-call-number/repository-call-number.component";
import {
  applyIrishGenealogyUrlSuggestion,
  irishGenealogyUrlsToUpdate,
} from "./apply-irish-genealogy-url-suggestion.util";

/** The sources with a call number that is an old IrishGenealogy.ie civil
 * record URL. */
export function findIrishGenealogyUrlsToUpdate(
  database: GedcomDatabase,
): GedcomSource[] {
  return Object.values(database.sources).filter(
    (source) => irishGenealogyUrlsToUpdate(source).length > 0,
  );
}

/** Lists the call numbers that are old IrishGenealogy.ie civil record URLs,
 * linking both the old and the new URL so each can be checked, and suggests
 * replacing them. Reviewing or submitting a suggestion is handed back to the
 * validation page, which owns the editor dialog. */
@Component({
  selector: "app-irish-genealogy-urls",
  imports: [RouterModule, GedcomDiffComponent, RepositoryCallNumberComponent],
  templateUrl: "./irish-genealogy-urls.component.html",
})
export class IrishGenealogyUrlsComponent {
  private readonly ancestryService = inject(AncestryService);

  readonly ancestryDatabase = input.required<GedcomDatabase>();

  readonly reviewSuggestion = output<GedcomSource>();
  readonly submitSuggestion = output<GedcomSource>();
  readonly submitAllSuggestions = output<GedcomSource[]>();

  readonly sources = computed(() =>
    findIrishGenealogyUrlsToUpdate(this.ancestryDatabase()),
  );

  readonly rows = computed(() =>
    this.sources().map((source) => ({
      source,
      urls: irishGenealogyUrlsToUpdate(source),
      // The records that would actually change on disk, built from the
      // same diff the save path uses.
      differences: this.ancestryService.gedcomDatabaseDifferences(
        applyIrishGenealogyUrlSuggestion(this.ancestryDatabase(), [
          source.xref,
        ]),
      ),
    })),
  );
}
