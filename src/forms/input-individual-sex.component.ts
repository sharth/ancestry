import type { AncestryDatabase } from "../database/ancestry.service";
import type { GedcomSex } from "../gedcom/gedcomSex";
import { InputSourceCitationsComponent } from "./input-source-citations.component";
import { Component, input, model } from "@angular/core";
import type { FormValueControl } from "@angular/forms/signals";
import { Field, form } from "@angular/forms/signals";

@Component({
  selector: "app-input-individual-sex",
  imports: [Field, InputSourceCitationsComponent],
  templateUrl: "./input-individual-sex.component.html",
  styleUrl: "./input.component.css",
})
export class InputIndividualSexComponent implements FormValueControl<GedcomSex> {
  readonly open = input<boolean>(false);

  readonly ancestryDatabase = model.required<AncestryDatabase>();

  readonly value = model<GedcomSex>({ sex: "", citations: [] });
  readonly form = form(this.value);
}
