import { Component, computed, input, model } from "@angular/core";
import { FormField, form, type FormValueControl } from "@angular/forms/signals";
import type { AncestryDatabase } from "../../database/ancestry.service";

@Component({
  selector: "app-input-repository-xref",
  imports: [FormField],
  templateUrl: "./input-repository-xref.component.html",
  styleUrl: "./input.component.css",
})
export class InputRepositoryXrefComponent implements FormValueControl<string> {
  readonly workingDatabase = input.required<AncestryDatabase>();

  readonly value = model<string>("");
  readonly form = form(this.value);

  readonly repositories = computed(() =>
    Object.values(this.workingDatabase().repositories),
  );

  focus() {
    this.form().focusBoundControl();
  }
}
