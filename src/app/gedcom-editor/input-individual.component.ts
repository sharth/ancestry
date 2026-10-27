import { Component, computed, inject, input, model } from "@angular/core";
import { FormField, form, type FormValueControl } from "@angular/forms/signals";

import type { GedcomDatabase } from "../../gedcom/gedcomDatabase";
import {
  newGedcomIndividual,
  type GedcomIndividual,
} from "../../gedcom/gedcomIndividual";
import { displayGedcomName } from "../../gedcom/gedcomName";
import { GEDCOM_EDITOR } from "./gedcom-editor-interface";
import { InputChangeDateComponent } from "./input-change-date.component";
import { InputIndividualFactsComponent } from "./input-individual-facts.component";
import { InputIndividualNamesComponent } from "./input-individual-names.component";
import { InputIndividualSexComponent } from "./input-individual-sex.component";
import { InputNotesComponent } from "./input-notes.component";
import { InputUnknownRecordsComponent } from "./input-unknown-records.component";

@Component({
  selector: "app-input-individual",
  imports: [
    FormField,
    InputIndividualFactsComponent,
    InputIndividualSexComponent,
    InputIndividualNamesComponent,
    InputUnknownRecordsComponent,
    InputNotesComponent,
    InputChangeDateComponent,
  ],
  templateUrl: "./input-individual.component.html",
  styleUrl: "./input.component.css",
})
export class InputIndividualComponent implements FormValueControl<GedcomIndividual> {
  readonly gedcomEditor = inject(GEDCOM_EDITOR, { optional: true });

  readonly workingDatabase = input.required<GedcomDatabase>();
  readonly value = model<GedcomIndividual>(newGedcomIndividual({ xref: "" }));
  readonly form = form(this.value);

  readonly familyLinks = computed(() => {
    const individual = this.value();
    return [
      ...individual.childOfFamilyXrefs.map((xref) => ({
        xref,
        relationship: "Child of",
        label: this.familyLabel(xref, individual.xref),
      })),
      ...individual.parentOfFamilyXrefs.map((xref) => ({
        xref,
        relationship: "Spouse in",
        label: this.familyLabel(xref, individual.xref),
      })),
    ];
  });

  openFamily(xref: string) {
    this.gedcomEditor?.openFamily(xref);
  }

  private familyLabel(familyXref: string, excludeXref: string): string {
    const database = this.workingDatabase();
    const family = database.families[familyXref];
    const names = [family?.husbandXref, family?.wifeXref]
      .filter((xref): xref is string => !!xref && xref !== excludeXref)
      .map((xref) => {
        const name = database.individuals[xref]?.names.at(0);
        return name ? displayGedcomName(name) : xref;
      });
    return `${names.join(" & ") || "Family"} (${familyXref})`;
  }
}
