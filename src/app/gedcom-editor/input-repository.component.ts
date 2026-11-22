import { Component, input, model, inject } from "@angular/core";
import { FormField, form, type FormValueControl } from "@angular/forms/signals";

import type { GedcomDatabase } from "../../gedcom/gedcomDatabase";
import {
  newGedcomRepository,
  type GedcomRepository,
} from "../../gedcom/gedcomRepository";
import { IdGenerator } from "../../util/id-generator";

@Component({
  selector: "app-input-repository",
  imports: [FormField],
  templateUrl: "./input-repository.component.html",
  styleUrl: "./input.component.css",
})
export class InputRepositoryComponent implements FormValueControl<GedcomRepository> {
  readonly id = inject(IdGenerator).getId("input-repository");
  readonly workingDatabase = input.required<GedcomDatabase>();
  readonly value = model<GedcomRepository>(newGedcomRepository({ xref: "" }));
  readonly form = form(this.value);
}
