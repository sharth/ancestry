import { Component, computed, input, viewChild } from "@angular/core";
import { RouterModule } from "@angular/router";

import type { GedcomDatabase } from "../../gedcom/gedcomDatabase";
import { fullname } from "../../gedcom/gedcomIndividual";
import { GedcomEditorDialogComponent } from "../gedcom-editor-dialog/gedcom-editor-dialog.component";
import type { ComponentWithUnsavedChanges } from "../unsaved-changes.guard";

@Component({
  selector: "app-family",
  imports: [RouterModule, GedcomEditorDialogComponent],
  templateUrl: "./family.component.html",
  styleUrl: "./family.component.css",
})
export class FamilyComponent implements ComponentWithUnsavedChanges {
  readonly ancestryDatabase = input.required<GedcomDatabase>();
  readonly xref = input.required<string>();

  readonly editDialog = viewChild<GedcomEditorDialogComponent>("editDialog");

  hasUnsavedChanges(): boolean {
    return this.editDialog()?.hasUnsavedChanges() ?? false;
  }

  readonly vm = computed(() => {
    const ancestryDatabase = this.ancestryDatabase();
    const family = ancestryDatabase.families[this.xref()];
    if (family == undefined) {
      return undefined;
    }

    const name = (xref: string) => {
      const individual = ancestryDatabase.individuals[xref];
      return individual ? fullname(individual) : xref;
    };
    const title =
      [family.husbandXref, family.wifeXref]
        .filter((xref) => xref !== "")
        .map(name)
        .join(" & ") || family.xref;

    return {
      title,
    };
  });
}
