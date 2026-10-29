import { Component, computed, input, viewChild } from "@angular/core";
import { RouterModule } from "@angular/router";

import type { GedcomDatabase } from "../../gedcom/gedcomDatabase";
import { fullname } from "../../gedcom/gedcomIndividual";
import { GedcomEditorDialogComponent } from "../gedcom-editor-dialog/gedcom-editor-dialog.component";
import type { ComponentWithUnsavedChanges } from "../unsaved-changes.guard";

@Component({
  selector: "app-individual",
  imports: [GedcomEditorDialogComponent, RouterModule],
  templateUrl: "./individual.component.html",
  styleUrl: "./individual.component.css",
})
export class IndividualComponent implements ComponentWithUnsavedChanges {
  readonly xref = input.required<string>();
  readonly ancestryDatabase = input.required<GedcomDatabase>();

  readonly editDialog = viewChild<GedcomEditorDialogComponent>("editDialog");

  hasUnsavedChanges(): boolean {
    return this.editDialog()?.hasUnsavedChanges() ?? false;
  }

  readonly vm = computed(() => {
    const ancestryDatabase = this.ancestryDatabase();
    const individual = ancestryDatabase.individuals[this.xref()];
    if (individual === undefined) {
      return undefined;
    }
    return {
      individual,
      name: fullname(individual),
      sex: individual.sex.sex || "Unknown",
    };
  });
}
