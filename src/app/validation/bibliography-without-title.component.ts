import { Component, computed, input, viewChild } from "@angular/core";
import { RouterModule } from "@angular/router";

import type { GedcomResourceValue } from "../../database/ancestry.service";
import type { ComponentWithUnsavedChanges } from "../unsaved-changes.guard";
import {
  applyBibliographyTitleSuggestion,
  bibliographyForMissingTitle,
} from "./apply-bibliography-title-suggestion.util";
import { ValidationTableComponent } from "./validation-table.component";

/** Lists the sources that have a `_BIBL` (bibliography, e.g. from an
 * Ancestry.com export) but no TITL, and suggests moving the bibliography
 * into the title. */
@Component({
  selector: "app-bibliography-without-title",
  imports: [RouterModule, ValidationTableComponent],
  templateUrl: "./bibliography-without-title.component.html",
})
export class BibliographyWithoutTitleComponent implements ComponentWithUnsavedChanges {
  readonly gedcom = input.required<GedcomResourceValue>();
  readonly ancestryDatabase = computed(() => this.gedcom().gedcomDatabase);

  readonly table = viewChild(ValidationTableComponent);

  readonly rows = computed(() =>
    Object.values(this.ancestryDatabase().sources).flatMap((source) => {
      const bibliography = bibliographyForMissingTitle(source);
      if (bibliography === undefined) return [];
      return [
        {
          key: source.xref,
          source,
          bibliography,
          fixedDatabase: applyBibliographyTitleSuggestion(
            this.ancestryDatabase(),
            source,
          ),
          editorTabs: [{ type: "SOUR" as const, xref: source.xref }],
        },
      ];
    }),
  );

  hasUnsavedChanges(): boolean {
    return this.table()?.hasUnsavedChanges() ?? false;
  }
}
