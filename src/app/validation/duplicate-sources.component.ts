import { Component, computed, input, viewChild } from "@angular/core";
import { RouterModule } from "@angular/router";

import type { GedcomResourceValue } from "../../database/ancestry.service";
import type { GedcomDatabase } from "../../gedcom/gedcomDatabase";
import type { ComponentWithUnsavedChanges } from "../unsaved-changes.guard";
import {
  applyMergeDuplicateSources,
  mergeConflicts,
  type DuplicateSources,
} from "./apply-merge-duplicate-sources.util";
import { ValidationTableComponent } from "./validation-table.component";

/** The sources that share an abbreviation (ABBR, ignoring surrounding
 * whitespace) with another source, grouped by abbreviation. The first source
 * of each group, in file order, is the one the rest would be merged into. */
export function findDuplicateSources(
  database: GedcomDatabase,
): DuplicateSources[] {
  const byAbbr = Map.groupBy(
    Object.values(database.sources).filter(
      (source) => source.abbr.trim() !== "",
    ),
    (source) => source.abbr.trim(),
  );
  return byAbbr
    .entries()
    .flatMap(([, [kept, ...duplicates]]) =>
      kept !== undefined && duplicates.length > 0 ? [{ kept, duplicates }] : [],
    )
    .toArray();
}

/** Lists sources with the same abbreviation and suggests merging each group
 * into one source, repointing every citation at the source that's kept. */
@Component({
  selector: "app-duplicate-sources",
  imports: [RouterModule, ValidationTableComponent],
  templateUrl: "./duplicate-sources.component.html",
})
export class DuplicateSourcesComponent implements ComponentWithUnsavedChanges {
  readonly gedcom = input.required<GedcomResourceValue>();
  readonly ancestryDatabase = computed(() => this.gedcom().gedcomDatabase);

  readonly table = viewChild(ValidationTableComponent);

  readonly rows = computed(() =>
    findDuplicateSources(this.ancestryDatabase()).map((group) => ({
      key: group.kept.xref,
      abbr: group.kept.abbr.trim(),
      group,
      conflicts: mergeConflicts(group),
      fixedDatabase: applyMergeDuplicateSources(this.ancestryDatabase(), [
        group,
      ]),
      editorTabs: [{ type: "SOUR" as const, xref: group.kept.xref }],
    })),
  );

  hasUnsavedChanges(): boolean {
    return this.table()?.hasUnsavedChanges() ?? false;
  }
}
