import {
  Component,
  computed,
  inject,
  input,
  signal,
  viewChild,
} from "@angular/core";
import { RouterModule } from "@angular/router";

import {
  AncestryService,
  type GedcomResourceValue,
} from "../../database/ancestry.service";
import type { GedcomDatabase } from "../../gedcom/gedcomDatabase";
import type { GedcomSource } from "../../gedcom/gedcomSource";
import { GedcomDiffComponent } from "../gedcom-diff/gedcom-diff.component";
import { GedcomEditorDialogComponent } from "../gedcom-editor-dialog/gedcom-editor-dialog.component";
import type { TabInformation } from "../gedcom-editor/gedcom-editor-interface";
import { RepositoryCallNumberComponent } from "../repository-call-number/repository-call-number.component";
import type { ComponentWithUnsavedChanges } from "../unsaved-changes.guard";
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
 * the new URL so each can be checked, and suggests replacing them. */
@Component({
  selector: "app-outdated-urls",
  imports: [
    RouterModule,
    GedcomDiffComponent,
    GedcomEditorDialogComponent,
    RepositoryCallNumberComponent,
  ],
  templateUrl: "./outdated-urls.component.html",
})
export class OutdatedUrlsComponent implements ComponentWithUnsavedChanges {
  private readonly ancestryService = inject(AncestryService);

  readonly gedcom = input.required<GedcomResourceValue>();
  readonly ancestryDatabase = computed(() => this.gedcom().gedcomDatabase);

  readonly editDialog =
    viewChild.required<GedcomEditorDialogComponent>("editDialog");

  // The source whose suggestion is open in the editor dialog, if any.
  readonly reviewing = signal<GedcomSource | undefined>(undefined);

  // The editor dialog opens with the suggested fix already applied, so it
  // can be reviewed and edited further before saving.
  readonly reviewDatabase = computed(() => {
    const source = this.reviewing();
    if (source === undefined) return this.ancestryDatabase();
    return applyOutdatedUrlSuggestion(this.ancestryDatabase(), [source.xref]);
  });

  readonly reviewTabs = computed<TabInformation[]>(() => {
    const source = this.reviewing();
    return source === undefined ? [] : [{ type: "SOUR", xref: source.xref }];
  });

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

  hasUnsavedChanges(): boolean {
    return this.editDialog().hasUnsavedChanges();
  }

  async review(source: GedcomSource) {
    this.reviewing.set(source);
    await this.editDialog().showModal();
  }

  // Applies the suggested fix directly and saves it, without opening the
  // editor dialog.
  async submit(sources: GedcomSource[]) {
    const granted = await this.ancestryService.requestWritePermission();
    if (!granted) return;

    await this.ancestryService.updateGedcomDatabase(
      applyOutdatedUrlSuggestion(
        this.ancestryDatabase(),
        sources.map((source) => source.xref),
      ),
    );
  }
}
