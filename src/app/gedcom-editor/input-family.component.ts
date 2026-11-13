import { Component, input, model } from "@angular/core";
import { FormField, form, type FormValueControl } from "@angular/forms/signals";
import type { Immutable } from "immer";

import type { GedcomDatabase } from "../../gedcom/gedcomDatabase";
import { newGedcomFamily, type GedcomFamily } from "../../gedcom/gedcomFamily";
import { InputFamilyChildrenComponent } from "./input-family-children.component";
import { InputFamilyFactsComponent } from "./input-family-facts.component";
import { InputIndividualXrefComponent } from "./input-individual-xref.component";
import { InputSourceCitationsComponent } from "./input-source-citations.component";

@Component({
  selector: "app-input-family",
  imports: [
    FormField,
    InputIndividualXrefComponent,
    InputFamilyChildrenComponent,
    InputFamilyFactsComponent,
    InputSourceCitationsComponent,
  ],
  templateUrl: "./input-family.component.html",
  styleUrl: "./input.component.css",
})
export class InputFamilyComponent implements FormValueControl<
  Immutable<GedcomFamily>
> {
  readonly workingDatabase = input.required<Immutable<GedcomDatabase>>();
  readonly value = model<Immutable<GedcomFamily>>(
    newGedcomFamily({ xref: "" }),
  );
  readonly form = form(this.value);
}
