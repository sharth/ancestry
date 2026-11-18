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
import type { GedcomSource } from "../../gedcom/gedcomSource";
import { GedcomDiffComponent } from "../gedcom-diff/gedcom-diff.component";
import { GedcomEditorDialogComponent } from "../gedcom-editor-dialog/gedcom-editor-dialog.component";
import type { TabInformation } from "../gedcom-editor/gedcom-editor-interface";
import type { ComponentWithUnsavedChanges } from "../unsaved-changes.guard";
import {
  applyBibliographyTitleSuggestion,
  bibliographyForMissingTitle,
} from "./apply-bibliography-title-suggestion.util";

/** Lists the sources that have a `_BIBL` (bibliography, e.g. from an
 * Ancestry.com export) but no TITL, and suggests moving the bibliography
 * into the title -- together with any repository links for URLs in the
 * source, as one edit. */
@Component({
  selector: "app-bibliography-without-title",
  imports: [RouterModule, GedcomDiffComponent, GedcomEditorDialogComponent],
  templateUrl: "./bibliography-without-title.component.html",
})
export class BibliographyWithoutTitleComponent implements ComponentWithUnsavedChanges {
  private readonly ancestryService = inject(AncestryService);

  readonly gedcom = input.required<GedcomResourceValue>();
  readonly ancestryDatabase = computed(() => this.gedcom().gedcomDatabase);

  readonly editDialog =
    viewChild.required<GedcomEditorDialogComponent>("editDialog");

  // The source whose suggestion is open in the editor dialog, if any.
  readonly reviewing = signal<GedcomSource | undefined>(undefined);

  // The editor dialog opens with the suggested fix already applied, so it
  // can be reviewed and edited further before saving.
  readonly reviewSuggestion = computed(() => {
    const source = this.reviewing();
    if (source === undefined) return undefined;
    return applyBibliographyTitleSuggestion(this.ancestryDatabase(), source);
  });

  readonly reviewDatabase = computed(
    () => this.reviewSuggestion()?.database ?? this.ancestryDatabase(),
  );

  // The source first, then each repository the suggestion creates, so both
  // can be reviewed without going to find the new repository.
  readonly reviewTabs = computed<TabInformation[]>(() => {
    const source = this.reviewing();
    if (source === undefined) return [];
    return [
      { type: "SOUR", xref: source.xref },
      ...(this.reviewSuggestion()?.createdRepositoryXrefs ?? []).map(
        (xref): TabInformation => ({ type: "REPO", xref }),
      ),
    ];
  });

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

  hasUnsavedChanges(): boolean {
    return this.editDialog().hasUnsavedChanges();
  }

  async review(source: GedcomSource) {
    this.reviewing.set(source);
    await this.editDialog().showModal();
  }

  // Applies the suggested fix directly and saves it, without opening the
  // editor dialog.
  async submit(source: GedcomSource) {
    const granted = await this.ancestryService.requestWritePermission();
    if (!granted) return;

    const { database } = applyBibliographyTitleSuggestion(
      this.ancestryDatabase(),
      source,
    );
    await this.ancestryService.updateGedcomDatabase(database);
  }
}
