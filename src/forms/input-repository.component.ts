import type { AncestryDatabase } from "../database/ancestry.service";
import {
  type GedcomRepository,
  newGedcomRepository,
} from "../gedcom/gedcomRepository";
import { ChangeDetectionStrategy, Component, model } from "@angular/core";
import type { FormValueControl } from "@angular/forms/signals";
import { FormField, form } from "@angular/forms/signals";

@Component({
  selector: "app-input-repository",
  imports: [FormField],
  templateUrl: "./input-repository.component.html",
  styleUrl: "./input.component.css",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InputRepositoryComponent implements FormValueControl<GedcomRepository> {
  readonly ancestryDatabase = model.required<AncestryDatabase>();
  readonly value = model<GedcomRepository>(newGedcomRepository(""));
  readonly form = form(this.value);
}
