import { NgTemplateOutlet } from "@angular/common";
import {
  Component,
  computed,
  contentChild,
  inject,
  input,
  signal,
  TemplateRef,
  viewChild,
  ViewEncapsulation,
} from "@angular/core";

import { AncestryService } from "../../database/ancestry.service";
import {
  newGedcomDatabase,
  type GedcomDatabase,
} from "../../gedcom/gedcomDatabase";
import { GedcomDiffComponent } from "../gedcom-diff/gedcom-diff.component";
import { GedcomEditorDialogComponent } from "../gedcom-editor-dialog/gedcom-editor-dialog.component";
import type { TabInformation } from "../gedcom-editor/gedcom-editor-interface";
import type { ComponentWithUnsavedChanges } from "../unsaved-changes.guard";

/** One finding in a validation tab, and the fix suggested for it, if any. */
export interface ValidationRow {
  /** Identifies the row across reloads, for `@for`'s track. */
  key: string;
  /** The whole database with this row's fix applied, or undefined when
   * there's nothing to fix. */
  fixedDatabase?: GedcomDatabase;
  /** The records the editor dialog opens, when reviewing the fix. */
  editorTabs?: TabInformation[];
  /** Says what the fix does, after "Open editor with proposed changes: ". */
  fixLabel?: string;
}

const emptyDatabase = newGedcomDatabase();

/** The table every validation tab lists its findings in. The tab gives the
 * column headers and an `<ng-template let-row>` holding one
 * `<div role="cell">` per column; this adds, for each row with a fix, the
 * buttons to review it in the editor dialog or submit it directly, and the
 * diff it would write.
 *
 * It's a CSS grid rather than a `<table>`, because `position: sticky`
 * behaves inconsistently on table rows: the header sticks below the page
 * header, and each row sticks below that while its own diff scrolls by. */
@Component({
  selector: "app-validation-table",
  imports: [NgTemplateOutlet, GedcomDiffComponent, GedcomEditorDialogComponent],
  templateUrl: "./validation-table.component.html",
  styleUrl: "./validation-table.component.css",
  // Not emulated: the cells come from each tab's own template, which
  // emulated styles here wouldn't reach. The selectors are all scoped
  // under app-validation-table instead.
  encapsulation: ViewEncapsulation.None,
})
export class ValidationTableComponent<
  Row extends ValidationRow,
> implements ComponentWithUnsavedChanges {
  private readonly ancestryService = inject(AncestryService);

  readonly columns = input.required<string[]>();
  /** Each column's CSS grid track size; every column gets an equal share
   * by default. */
  readonly columnSizes = input<string[]>();
  readonly rows = input.required<readonly Row[]>();
  /** Builds the database with every row's fix applied, for a "Submit all"
   * button; no button when left out. */
  readonly fixAll = input<() => GedcomDatabase>();

  readonly cells =
    contentChild.required<TemplateRef<{ $implicit: Row }>>(TemplateRef);

  readonly editDialog =
    viewChild.required<GedcomEditorDialogComponent>("editDialog");

  readonly hasFixes = computed(() =>
    this.rows().some((row) => row.fixedDatabase !== undefined),
  );

  readonly fixCount = computed(
    () => this.rows().filter((row) => row.fixedDatabase !== undefined).length,
  );

  readonly gridColumns = computed(() => {
    const sizes =
      this.columnSizes() ?? this.columns().map(() => "minmax(0, 1fr)");
    return [...sizes, ...(this.hasFixes() ? ["minmax(0, 14rem)"] : [])].join(
      " ",
    );
  });

  // Each row's preview of what its fix would write, by row index: the same
  // diff the save path writes from, so it shows everything that would
  // change (CHAN and HEAD included). Built once per set of rows rather
  // than from the template, which would rebuild every preview on every
  // change detection.
  readonly differences = computed(() =>
    this.rows().map((row) =>
      row.fixedDatabase === undefined
        ? []
        : this.ancestryService.gedcomDatabaseDifferences(row.fixedDatabase),
    ),
  );

  // The row whose fix is open in the editor dialog, if any.
  readonly reviewing = signal<Row | undefined>(undefined);

  hasUnsavedChanges(): boolean {
    return this.editDialog().hasUnsavedChanges();
  }

  // Opens the editor dialog with the fix already applied, so it can be
  // reviewed and edited further before saving.
  async review(row: Row) {
    this.reviewing.set(row);
    await this.editDialog().showModal();
  }

  // Saves a fix directly, without opening the editor dialog.
  async submit(database: GedcomDatabase) {
    const granted = await this.ancestryService.requestWritePermission();
    if (!granted) return;
    await this.ancestryService.updateGedcomDatabase(database);
  }

  protected readonly emptyDatabase = emptyDatabase;
}
