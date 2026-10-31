import { Component, input, model } from "@angular/core";
import {
  FormField,
  form,
  type FieldTree,
  type FormValueControl,
} from "@angular/forms/signals";

import type { GedcomDatabase } from "../../gedcom/gedcomDatabase";
import {
  newGedcomIndividual,
  type GedcomIndividual,
} from "../../gedcom/gedcomIndividual";
import { InputChangeDateComponent } from "./input-change-date.component";
import { InputIndividualFactsComponent } from "./input-individual-facts.component";
import { InputIndividualFamiliesComponent } from "./input-individual-families.component";
import { InputIndividualNamesComponent } from "./input-individual-names.component";
import { InputIndividualSexComponent } from "./input-individual-sex.component";
import { InputNotesComponent } from "./input-notes.component";
import { InputUnknownRecordsComponent } from "./input-unknown-records.component";

@Component({
  selector: "app-input-individual",
  imports: [
    FormField,
    InputIndividualFamiliesComponent,
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
  readonly workingDatabase = input.required<GedcomDatabase>();
  // The editor's whole form, so the Families section can edit the
  // individual's families (and their other members) too.
  readonly database = input<FieldTree<GedcomDatabase>>();
  readonly value = model<GedcomIndividual>(newGedcomIndividual({ xref: "" }));
  readonly form = form(this.value);
}
