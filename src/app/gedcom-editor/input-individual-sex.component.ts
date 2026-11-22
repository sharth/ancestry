import { Component, input, model, inject } from "@angular/core";
import { FormField, form, type FormValueControl } from "@angular/forms/signals";

import type { GedcomDatabase } from "../../gedcom/gedcomDatabase";
import { newGedcomSex, type GedcomSex } from "../../gedcom/gedcomSex";
import { IdGenerator } from "../../util/id-generator";
import { InputSourceCitationsComponent } from "./input-source-citations.component";

@Component({
  selector: "app-input-individual-sex",
  imports: [FormField, InputSourceCitationsComponent],
  templateUrl: "./input-individual-sex.component.html",
  styleUrl: "./input.component.css",
})
export class InputIndividualSexComponent implements FormValueControl<GedcomSex> {
  readonly id = inject(IdGenerator).getId("input-individual-sex");
  readonly workingDatabase = input.required<GedcomDatabase>();

  readonly value = model<GedcomSex>(newGedcomSex());
  readonly form = form(this.value);
}
