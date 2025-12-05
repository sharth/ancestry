import type { AncestryDatabase } from "../database/ancestry.service";
import { Component, model } from "@angular/core";
import { Field, type FormValueControl, form } from "@angular/forms/signals";

@Component({
  selector: "app-input-repository-call-number",
  imports: [Field],
  templateUrl: "./input-repository-call-number.component.html",
  styleUrl: "./input.component.css",
})
export class InputRepositoryCallNumberComponent implements FormValueControl<string> {
  readonly ancestryDatabase = model.required<AncestryDatabase>();

  readonly value = model<string>("");
  readonly form = form(this.value);
}
