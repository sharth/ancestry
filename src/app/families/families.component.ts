import { Component, computed, input, viewChild } from "@angular/core";
import { RouterLink } from "@angular/router";

import type { GedcomDatabase } from "../../gedcom/gedcomDatabase";
import { fullname } from "../../gedcom/gedcomIndividual";
import { GedcomEditorDialogComponent } from "../gedcom-editor-dialog/gedcom-editor-dialog.component";
import { IndividualLinkComponent } from "../individual-link/individual-link.component";
import type { ComponentWithUnsavedChanges } from "../unsaved-changes.guard";

@Component({
  selector: "app-families",
  imports: [RouterLink, IndividualLinkComponent, GedcomEditorDialogComponent],
  templateUrl: "./families.component.html",
  styleUrl: "./families.component.css",
})
export class FamiliesComponent implements ComponentWithUnsavedChanges {
  readonly ancestryDatabase = input.required<GedcomDatabase>();

  readonly editDialog = viewChild<GedcomEditorDialogComponent>("editDialog");

  hasUnsavedChanges(): boolean {
    return this.editDialog()?.hasUnsavedChanges() ?? false;
  }

  readonly vm = computed(() => {
    const ancestryDatabase = this.ancestryDatabase();
    const name = (xref: string) => {
      const individual = ancestryDatabase.individuals[xref];
      return individual ? fullname(individual) : xref;
    };
    return {
      families: Object.values(ancestryDatabase.families).sort(
        (lhs, rhs) =>
          name(lhs.husbandXref).localeCompare(name(rhs.husbandXref)) ||
          name(lhs.wifeXref).localeCompare(name(rhs.wifeXref)),
      ),
    };
  });
}
