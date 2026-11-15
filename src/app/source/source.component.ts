import { Component, computed, input, viewChild } from "@angular/core";
import { RouterModule } from "@angular/router";

import type { GedcomResourceValue } from "../../database/ancestry.service";
import { GedcomEditorDialogComponent } from "../gedcom-editor-dialog/gedcom-editor-dialog.component";
import type { ComponentWithUnsavedChanges } from "../unsaved-changes.guard";

@Component({
  selector: "app-source",
  templateUrl: "./source.component.html",
  styleUrl: "./source.component.css",
  imports: [RouterModule, GedcomEditorDialogComponent],
})
export class SourceComponent implements ComponentWithUnsavedChanges {
  readonly gedcom = input.required<GedcomResourceValue>();
  readonly ancestryDatabase = computed(() => this.gedcom().gedcomDatabase);
  readonly xref = input.required<string>();

  readonly editDialog = viewChild<GedcomEditorDialogComponent>("editDialog");

  hasUnsavedChanges(): boolean {
    return this.editDialog()?.hasUnsavedChanges() ?? false;
  }

  readonly vm = computed(() => {
    const ancestryDatabase = this.ancestryDatabase();
    const source = ancestryDatabase.sources[this.xref()];
    if (source == undefined) {
      return undefined;
    }

    return { source };
  });
}
