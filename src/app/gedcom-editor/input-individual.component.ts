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

  readonly familyLinks = computed(() => [
    ...this.value().childOfFamilyXrefs.map((xref) => ({
      xref,
      label: this.childOfFamilyLabel(xref),
    })),
    ...this.value().parentOfFamilyXrefs.map((xref) => ({
      xref,
      label: this.parentOfFamilyLabel(xref),
    })),
  ]);

  private childOfFamilyLabel(familyXref: string): string {
    const family = this.workingDatabase().families[familyXref];
    const parents = [family?.husbandXref, family?.wifeXref]
      .map((xref) => this.individualLabel(xref ?? ""))
      .filter((label) => label !== "");
    return `Child of: ${parents.join(" & ") || "Unknown"} (${familyXref})`;
  }

  private parentOfFamilyLabel(familyXref: string): string {
    const family = this.workingDatabase().families[familyXref];
    const spouseXref =
      family?.husbandXref === this.value().xref
        ? family.wifeXref
        : family?.husbandXref;
    const spouse = this.individualLabel(spouseXref ?? "");
    return `Spouse in: ${spouse || "Unknown"} (${familyXref})`;
  }

  private individualLabel(xref: string): string {
    const name = this.workingDatabase().individuals[xref]?.names.at(0);
    return (name ? displayGedcomName(name) : "") || xref;
  }
}
