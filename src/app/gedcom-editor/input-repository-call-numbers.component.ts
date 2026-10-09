import { Component, input, model } from "@angular/core";
import { FormField, form, type FormValueControl } from "@angular/forms/signals";

import type { GedcomDatabase } from "../../gedcom/gedcomDatabase";

@Component({
  selector: "app-input-repository-call-numbers",
  imports: [FormField],
  templateUrl: "./input-repository-call-numbers.component.html",
  styleUrl: "./input.component.css",
})
export class InputRepositoryCallNumbersComponent implements FormValueControl<
  string[]
> {
  readonly workingDatabase = input.required<GedcomDatabase>();

  readonly value = model<string[]>([]);
  readonly form = form(this.value);

  appendCallNumber() {
    this.value.update((callNumbers) => [...callNumbers, ""]);
  }

  removeCallNumber(index: number) {
    this.value.update((callNumbers) => callNumbers.toSpliced(index, 1));
  }
}
