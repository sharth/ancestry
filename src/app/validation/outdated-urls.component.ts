import { Component, computed, input, viewChild } from "@angular/core";
import { RouterModule } from "@angular/router";

import type { GedcomResourceValue } from "../../database/ancestry.service";
import type { GedcomDatabase } from "../../gedcom/gedcomDatabase";
import type { GedcomSource } from "../../gedcom/gedcomSource";
import { RepositoryCallNumberComponent } from "../repository-call-number/repository-call-number.component";
import type { ComponentWithUnsavedChanges } from "../unsaved-changes.guard";
import {
  applyOutdatedUrlSuggestion,
  outdatedUrlsToUpdate,
} from "./apply-outdated-url-suggestion.util";
import {
  ValidationTableComponent,
  type ValidationRow,
} from "./validation-table.component";

/** The sources with a call number that is an outdated URL, one a site has
 * since moved (see `urlRewrites`). */
export function findOutdatedUrls(database: GedcomDatabase): GedcomSource[] {
  return Object.values(database.sources).filter(
    (source) => outdatedUrlsToUpdate(source).length > 0,
  );
}

/** Lists the call numbers that are outdated URLs, linking both the old and
 * the new URL so each can be checked, and suggests replacing them. */
@Component({
  selector: "app-outdated-urls",
  imports: [
    RouterModule,
    RepositoryCallNumberComponent,
    ValidationTableComponent,
  ],
  templateUrl: "./outdated-urls.component.html",
})
export class OutdatedUrlsComponent implements ComponentWithUnsavedChanges {
  readonly gedcom = input.required<GedcomResourceValue>();
  readonly ancestryDatabase = computed(() => this.gedcom().gedcomDatabase);

  readonly table = viewChild(ValidationTableComponent);

  readonly rows = computed(
    () =>
      findOutdatedUrls(this.ancestryDatabase()).map((source) => {
        const urls = outdatedUrlsToUpdate(source);
        // A call number whose new URL can't be told is listed, but there's
        // nothing to fix for it.
        const hasSuggestion = urls.some((url) => url.newUrl !== undefined);
        return {
          key: source.xref,
          source,
          urls,
          fixedDatabase: hasSuggestion
            ? applyOutdatedUrlSuggestion(this.ancestryDatabase(), [source.xref])
            : undefined,
          editorTabs: [{ type: "SOUR" as const, xref: source.xref }],
        };
      }) satisfies ValidationRow[],
  );

  readonly fixAll = () =>
    applyOutdatedUrlSuggestion(
      this.ancestryDatabase(),
      this.rows()
        .filter((row) => row.fixedDatabase !== undefined)
        .map((row) => row.source.xref),
    );

  hasUnsavedChanges(): boolean {
    return this.table()?.hasUnsavedChanges() ?? false;
  }
}
