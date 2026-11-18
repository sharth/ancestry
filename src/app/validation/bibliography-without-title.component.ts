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
 * into the title. */
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
  readonly reviewDatabase = computed(() => {
    const source = this.reviewing();
    if (source === undefined) return this.ancestryDatabase();
    return applyBibliographyTitleSuggestion(this.ancestryDatabase(), source);
  });

  readonly reviewTabs = computed<TabInformation[]>(() => {
    const source = this.reviewing();
    return source === undefined ? [] : [{ type: "SOUR", xref: source.xref }];
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
    return this.ancestryService.gedcomDatabaseDifferences(
      applyBibliographyTitleSuggestion(this.ancestryDatabase(), source),
    );
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

    await this.ancestryService.updateGedcomDatabase(
      applyBibliographyTitleSuggestion(this.ancestryDatabase(), source),
    );
  }
}
