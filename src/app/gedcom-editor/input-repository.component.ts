import {
  ChangeDetectionStrategy,
  Component,
  input,
  model,
} from "@angular/core";
import { FormField, form, type FormValueControl } from "@angular/forms/signals";
import type { AncestryDatabase } from "../../database/ancestry.service";
import {
  newGedcomRepository,
  type GedcomRepository,
} from "../../gedcom/gedcomRepository";

@Component({
  selector: "app-input-repository",
  imports: [FormField],
  templateUrl: "./input-repository.component.html",
  styleUrl: "./input.component.css",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InputRepositoryComponent implements FormValueControl<GedcomRepository> {
  readonly ancestryDatabase = input.required<AncestryDatabase>();
  readonly value = model<GedcomRepository>(newGedcomRepository(""));
  readonly form = form(this.value);
}
