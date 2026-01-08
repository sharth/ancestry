import type { AncestryDatabase } from "../database/ancestry.service";
import { ChangeDetectionStrategy, Component, model } from "@angular/core";
import { FormField, type FormValueControl, form } from "@angular/forms/signals";

@Component({
  selector: "app-input-repository-call-number",
  imports: [FormField],
  templateUrl: "./input-repository-call-number.component.html",
  styleUrl: "./input.component.css",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InputRepositoryCallNumberComponent implements FormValueControl<string> {
  readonly ancestryDatabase = model.required<AncestryDatabase>();

  readonly value = model<string>("");
  readonly form = form(this.value);
}
