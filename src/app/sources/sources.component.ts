import { Component, computed, input, viewChild } from "@angular/core";
import { RouterLink } from "@angular/router";

import type { GedcomDatabase } from "../../gedcom/gedcomDatabase";
import { GedcomEditorDialogComponent } from "../gedcom-editor-dialog/gedcom-editor-dialog.component";
import type { ComponentWithUnsavedChanges } from "../unsaved-changes.guard";

@Component({
  selector: "app-sources",
  imports: [RouterLink, GedcomEditorDialogComponent],
  templateUrl: "./sources.component.html",
  styleUrl: "./sources.component.css",
})
export class SourcesComponent implements ComponentWithUnsavedChanges {
  readonly ancestryDatabase = input.required<GedcomDatabase>();

  readonly editDialog = viewChild<GedcomEditorDialogComponent>("editDialog");

  hasUnsavedChanges(): boolean {
    return this.editDialog()?.hasUnsavedChanges() ?? false;
  }

  vm = computed(() => {
    const ancestryDatabase = this.ancestryDatabase();
    const sources = Object.values(ancestryDatabase.sources);
    sources.sort((lhs, rhs) => lhs.abbr.localeCompare(rhs.abbr));

    return { sources };
  });
}
