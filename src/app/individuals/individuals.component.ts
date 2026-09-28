import { Component, computed, input, viewChild } from "@angular/core";
import type { GedcomDatabase } from "../../gedcom/gedcomDatabase";
import {
  fullname,
  surname,
  type GedcomIndividual,
} from "../../gedcom/gedcomIndividual";
import { GedcomEditorDialogComponent } from "../gedcom-editor-dialog/gedcom-editor-dialog.component";
import { IndividualLinkComponent } from "../individual-link/individual-link.component";
import type { ComponentWithUnsavedChanges } from "../unsaved-changes.guard";

@Component({
  selector: "app-individuals",
  imports: [IndividualLinkComponent, GedcomEditorDialogComponent],
  templateUrl: "./individuals.component.html",
  styleUrl: "./individuals.component.css",
})
export class IndividualsComponent implements ComponentWithUnsavedChanges {
  readonly ancestryDatabase = input.required<GedcomDatabase>();

  readonly editDialog = viewChild<GedcomEditorDialogComponent>("editDialog");

  hasUnsavedChanges(): boolean {
    return this.editDialog()?.hasUnsavedChanges() ?? false;
  }

  readonly vm = computed(() => {
    const ancestryDatabase = this.ancestryDatabase();
    return {
      individuals: Object.values(ancestryDatabase.individuals),
      individualsBySurname: this.individualsBySurname(
        ancestryDatabase.individuals,
      ),
    };
  });

  private individualsBySurname(
    individuals: Record<string, GedcomIndividual>,
  ): { surname?: string; individuals: GedcomIndividual[] }[] {
    const individualsList = Object.values(individuals).sort(
      (lhs, rhs) =>
        surname(lhs).localeCompare(surname(rhs)) ||
        fullname(lhs).localeCompare(fullname(rhs)),
    );
    return Map.groupBy(individualsList, (individual) => surname(individual))
      .entries()
      .map(([surname, individuals]) => ({ surname, individuals }))
      .toArray();
  }

  readonly fullname = fullname;
}
