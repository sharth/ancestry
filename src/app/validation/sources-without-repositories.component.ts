import { Component, computed, input, viewChild } from "@angular/core";
import { RouterModule } from "@angular/router";

import type { GedcomResourceValue } from "../../database/ancestry.service";
import type { GedcomDatabase } from "../../gedcom/gedcomDatabase";
import type { TabInformation } from "../gedcom-editor/gedcom-editor-interface";
import type { ComponentWithUnsavedChanges } from "../unsaved-changes.guard";
import { applyUrlSuggestions } from "./apply-url-suggestion.util";
import { sourceValidators } from "./source-validators";
import {
  ValidationTableComponent,
  type ValidationRow,
} from "./validation-table.component";

/** Lists the sources that don't cite any repository (no REPO link), so
 * there's no record of where the original can be found, along with the
 * repositories suggested for each from URLs found in its text. Every URL
 * suggestion for a source is applied together, as one edit. */
@Component({
  selector: "app-sources-without-repositories",
  imports: [RouterModule, ValidationTableComponent],
  templateUrl: "./sources-without-repositories.component.html",
})
export class SourcesWithoutRepositoriesComponent implements ComponentWithUnsavedChanges {
  readonly gedcom = input.required<GedcomResourceValue>();
  readonly ancestryDatabase = computed(() => this.gedcom().gedcomDatabase);

  readonly table = viewChild(ValidationTableComponent);

  readonly rows = computed(
    () =>
      findSourcesWithoutRepositories(this.ancestryDatabase()).map((source) => {
        const suggestions = sourceValidators(
          source,
          this.ancestryDatabase(),
        ).warnings.flatMap((warning) => warning.urlSuggestion ?? []);
        const fix =
          suggestions.length > 0
            ? applyUrlSuggestions(this.ancestryDatabase(), source, suggestions)
            : undefined;
        return {
          key: source.xref,
          source,
          suggestions,
          fixedDatabase: fix?.database,
          // The source first, then each repository the fix creates, so both
          // can be reviewed without going to find the new repository.
          editorTabs: [
            { type: "SOUR", xref: source.xref },
            ...(fix?.createdRepositoryXrefs ?? []).map(
              (xref): TabInformation => ({ type: "REPO", xref }),
            ),
          ] satisfies TabInformation[],
        };
      }) satisfies ValidationRow[],
  );

  hasUnsavedChanges(): boolean {
    return this.table()?.hasUnsavedChanges() ?? false;
  }
}

export function findSourcesWithoutRepositories(gedcomDatabase: GedcomDatabase) {
  return Object.values(gedcomDatabase.sources).filter(
    (source) => source.repositoryLinks.length === 0,
  );
}
