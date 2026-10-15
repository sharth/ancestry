import { Component, input, model } from "@angular/core";
import { FormField, form, type FormValueControl } from "@angular/forms/signals";

import type { GedcomDatabase } from "../../gedcom/gedcomDatabase";
import { InputIndividualXrefComponent } from "./input-individual-xref.component";

@Component({
  selector: "app-input-family-children",
  imports: [FormField, InputIndividualXrefComponent],
  templateUrl: "./input-family-children.component.html",
  styleUrl: "./input.component.css",
})
export class InputFamilyChildrenComponent implements FormValueControl<
  string[]
> {
  readonly workingDatabase = input.required<GedcomDatabase>();

  readonly value = model<string[]>([]);
  readonly form = form(this.value);

  appendChild() {
    this.value.update((childXrefs) => [...childXrefs, ""]);
  }

  removeChild(index: number) {
    this.value.update((childXrefs) => childXrefs.toSpliced(index, 1));
  }
}
