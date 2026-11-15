import { Component, computed, input, viewChild } from "@angular/core";
import { RouterLink } from "@angular/router";

import type { GedcomResourceValue } from "../../database/ancestry.service";
import { GedcomEditorDialogComponent } from "../gedcom-editor-dialog/gedcom-editor-dialog.component";
import type { ComponentWithUnsavedChanges } from "../unsaved-changes.guard";

@Component({
  selector: "app-repositories",
  imports: [RouterLink, GedcomEditorDialogComponent],
  templateUrl: "./repositories.component.html",
  styleUrl: "./repositories.component.css",
})
export class RepositoriesComponent implements ComponentWithUnsavedChanges {
  readonly gedcom = input.required<GedcomResourceValue>();
  readonly ancestryDatabase = computed(() => this.gedcom().gedcomDatabase);

  readonly editDialog = viewChild<GedcomEditorDialogComponent>("editDialog");

  hasUnsavedChanges(): boolean {
    return this.editDialog()?.hasUnsavedChanges() ?? false;
  }

  readonly vm = computed(() => {
    const ancestryDatabase = this.ancestryDatabase();
    return {
      repositories: Object.values(ancestryDatabase.repositories),
    };
  });
}
