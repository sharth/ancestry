import { Component, computed, inject, input, model } from "@angular/core";
import { FormField, form, type FormValueControl } from "@angular/forms/signals";

import {
  newGedcomDatabase,
  type GedcomDatabase,
} from "../../gedcom/gedcomDatabase";
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
// Edits one individual, given by `xref`, within the database it is bound to.
// The database (rather than just the individual) is the value, so that the
// individual's couple events can be edited on their spouse families.
export class InputIndividualComponent implements FormValueControl<GedcomDatabase> {
  readonly gedcomEditor = inject(GEDCOM_EDITOR, { optional: true });

  readonly workingDatabase = input.required<GedcomDatabase>();
  readonly xref = input.required<string>();
  readonly value = model<GedcomDatabase>(newGedcomDatabase());
  readonly form = form(this.value);
  readonly individual = computed(() => this.form.individuals[this.xref()]);

  childOfFamilyLabel(familyXref: string): string {
    const family = this.workingDatabase().families[familyXref];
    const parents = [family?.husbandXref, family?.wifeXref]
      .map((xref) => this.individualLabel(xref ?? ""))
      .filter((label) => label !== "");
    return `Child of: ${parents.join(" & ") || "Unknown"} (${familyXref})`;
  }

  parentOfFamilyLabel(familyXref: string): string {
    const family = this.workingDatabase().families[familyXref];
    const spouseXref =
      family?.husbandXref === this.xref()
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
