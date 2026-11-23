import { Component, computed, input, model } from "@angular/core";
import { FormField, form, type FormValueControl } from "@angular/forms/signals";

import {
  newGedcomDatabase,
  type GedcomDatabase,
} from "../../gedcom/gedcomDatabase";
import { InputExternalIdentifiersComponent } from "./input-external-identifiers.component";
import { InputIndividualFactsComponent } from "./input-individual-facts.component";
import { InputIndividualFamiliesComponent } from "./input-individual-families.component";
import { InputIndividualNamesComponent } from "./input-individual-names.component";
import { InputIndividualSexComponent } from "./input-individual-sex.component";
import { InputNotesComponent } from "./input-notes.component";
import { InputUnknownRecordsComponent } from "./input-unknown-records.component";

// Edits one individual, given by `individualXref`, within the database it is
// bound to. The value is the whole database so that the Families section can
// edit the individual's families (and their other members) too.
@Component({
  selector: "app-input-individual",
  imports: [
    FormField,
    InputExternalIdentifiersComponent,
    InputIndividualFamiliesComponent,
    InputIndividualFactsComponent,
    InputIndividualSexComponent,
    InputIndividualNamesComponent,
    InputUnknownRecordsComponent,
    InputNotesComponent,
  ],
  templateUrl: "./input-individual.component.html",
  styleUrl: "./input.component.css",
})
export class InputIndividualComponent implements FormValueControl<GedcomDatabase> {
  readonly workingDatabase = input.required<GedcomDatabase>();
  readonly individualXref = input.required<string>();
  readonly value = model<GedcomDatabase>(newGedcomDatabase());
  readonly form = form(this.value);
  readonly individual = computed(
    () => this.form.individuals[this.individualXref()],
  );
}
