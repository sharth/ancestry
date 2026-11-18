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
import { GedcomDiffComponent } from "../gedcom-diff/gedcom-diff.component";
import { GedcomEditorDialogComponent } from "../gedcom-editor-dialog/gedcom-editor-dialog.component";
import type { TabInformation } from "../gedcom-editor/gedcom-editor-interface";
import type { ComponentWithUnsavedChanges } from "../unsaved-changes.guard";
import {
  applyMergeDuplicateSources,
  mergeConflicts,
  type DuplicateSources,
} from "./apply-merge-duplicate-sources.util";

/** The sources that share a title (ignoring surrounding whitespace) with
 * another source, grouped by title. The first source of each group, in file
 * order, is the one the rest would be merged into. */
export function findDuplicateSources(
  database: GedcomDatabase,
): DuplicateSources[] {
  const byTitle = Map.groupBy(
    Object.values(database.sources).filter(
      (source) => source.title.trim() !== "",
    ),
    (source) => source.title.trim(),
  );
  return byTitle
    .entries()
    .flatMap(([title, [kept, ...duplicates]]) =>
      kept !== undefined && duplicates.length > 0
        ? [{ title, kept, duplicates }]
        : [],
    )
    .toArray();
}

/** Lists sources with the same title and suggests merging each group into
 * one source, repointing every citation at the source that's kept. */
@Component({
  selector: "app-duplicate-sources",
  imports: [RouterModule, GedcomDiffComponent, GedcomEditorDialogComponent],
  templateUrl: "./duplicate-sources.component.html",
})
export class DuplicateSourcesComponent implements ComponentWithUnsavedChanges {
  private readonly ancestryService = inject(AncestryService);

  readonly gedcom = input.required<GedcomResourceValue>();
  readonly ancestryDatabase = computed(() => this.gedcom().gedcomDatabase);

  readonly editDialog =
    viewChild.required<GedcomEditorDialogComponent>("editDialog");

  // The group whose merge is open in the editor dialog, if any.
  readonly reviewing = signal<DuplicateSources | undefined>(undefined);

  // The editor dialog opens with the merge already applied, so it can be
  // reviewed and edited further before saving.
  readonly reviewDatabase = computed(() => {
    const group = this.reviewing();
    if (group === undefined) return this.ancestryDatabase();
    return applyMergeDuplicateSources(this.ancestryDatabase(), [group]);
  });

  readonly reviewTabs = computed<TabInformation[]>(() => {
    const group = this.reviewing();
    return group === undefined ? [] : [{ type: "SOUR", xref: group.kept.xref }];
  });

  readonly rows = computed(() =>
    findDuplicateSources(this.ancestryDatabase()).map((group) => ({
      group,
      conflicts: mergeConflicts(group),
      // The records that would actually change on disk, built from the
      // same diff the save path uses.
      differences: this.ancestryService.gedcomDatabaseDifferences(
        applyMergeDuplicateSources(this.ancestryDatabase(), [group]),
      ),
    })),
  );

  hasUnsavedChanges(): boolean {
    return this.editDialog().hasUnsavedChanges();
  }

  async review(group: DuplicateSources) {
    this.reviewing.set(group);
    await this.editDialog().showModal();
  }

  // Applies the merge directly and saves it, without opening the editor
  // dialog.
  async submit(group: DuplicateSources) {
    const granted = await this.ancestryService.requestWritePermission();
    if (!granted) return;

    await this.ancestryService.updateGedcomDatabase(
      applyMergeDuplicateSources(this.ancestryDatabase(), [group]),
    );
  }
}
