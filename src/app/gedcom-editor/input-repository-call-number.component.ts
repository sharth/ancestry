import { Component, input, model } from "@angular/core";
import { FormField, form, type FormValueControl } from "@angular/forms/signals";
import type { AncestryDatabase } from "../../database/ancestry.service";

@Component({
  selector: "app-input-repository-call-number",
  imports: [FormField],
  templateUrl: "./input-repository-call-number.component.html",
  styleUrl: "./input.component.css",
})
export class InputRepositoryCallNumberComponent implements FormValueControl<string> {
  readonly ancestryDatabase = input.required<AncestryDatabase>();

  readonly value = model<string>("");
  readonly form = form(this.value);
}
