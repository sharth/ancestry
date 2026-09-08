import { Component, input, model } from "@angular/core";
import { FormField, form, type FormValueControl } from "@angular/forms/signals";
import type { GedcomDatabase } from "../../gedcom/gedcomDatabase";
import { newGedcomSex, type GedcomSex } from "../../gedcom/gedcomSex";
import { InputSourceCitationsComponent } from "./input-source-citations.component";

@Component({
  selector: "app-input-individual-sex",
  imports: [FormField, InputSourceCitationsComponent],
  templateUrl: "./input-individual-sex.component.html",
  styleUrl: "./input.component.css",
})
export class InputIndividualSexComponent implements FormValueControl<GedcomSex> {
  readonly open = input<boolean>(false);
  readonly workingDatabase = input.required<GedcomDatabase>();

  readonly value = model<GedcomSex>(newGedcomSex());
  readonly form = form(this.value);
}
