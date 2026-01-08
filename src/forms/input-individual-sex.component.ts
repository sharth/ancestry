import type { AncestryDatabase } from "../database/ancestry.service";
import type { GedcomSex } from "../gedcom/gedcomSex";
import { InputSourceCitationsComponent } from "./input-source-citations.component";
import {
  ChangeDetectionStrategy,
  Component,
  input,
  model,
} from "@angular/core";
import type { FormValueControl } from "@angular/forms/signals";
import { FormField, form } from "@angular/forms/signals";

@Component({
  selector: "app-input-individual-sex",
  imports: [FormField, InputSourceCitationsComponent],
  templateUrl: "./input-individual-sex.component.html",
  styleUrl: "./input.component.css",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InputIndividualSexComponent implements FormValueControl<GedcomSex> {
  readonly open = input<boolean>(false);

  readonly ancestryDatabase = model.required<AncestryDatabase>();

  readonly value = model<GedcomSex>({ sex: "", citations: [] });
  readonly form = form(this.value);
}
