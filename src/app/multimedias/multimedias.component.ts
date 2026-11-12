import { Component, computed, input, viewChild } from "@angular/core";
import { RouterLink } from "@angular/router";

import type { GedcomDatabase } from "../../gedcom/gedcomDatabase";
import type { GedcomMultimedia } from "../../gedcom/gedcomMultimedia";
import { GedcomEditorDialogComponent } from "../gedcom-editor-dialog/gedcom-editor-dialog.component";
import type { ComponentWithUnsavedChanges } from "../unsaved-changes.guard";

@Component({
  selector: "app-multimedias",
  imports: [RouterLink, GedcomEditorDialogComponent],
  templateUrl: "./multimedias.component.html",
  styleUrl: "./multimedias.component.css",
})
export class MultimediasComponent implements ComponentWithUnsavedChanges {
  readonly ancestryDatabase = input.required<GedcomDatabase>();

  readonly editDialog = viewChild<GedcomEditorDialogComponent>("editDialog");

  hasUnsavedChanges(): boolean {
    return this.editDialog()?.hasUnsavedChanges() ?? false;
  }

  readonly vm = computed(() => {
    const ancestryDatabase = this.ancestryDatabase();
    const multimedias = Object.values(ancestryDatabase.multimedias);
    // Sort by the same label the template shows for each multimedia.
    const label = (multimedia: GedcomMultimedia) =>
      multimedia.title || multimedia.filePath || multimedia.xref;
    multimedias.sort((lhs, rhs) => label(lhs).localeCompare(label(rhs)));

    return { multimedias };
  });
}
