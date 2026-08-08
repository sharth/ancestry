import {
  ChangeDetectionStrategy,
  Component,
  input,
  model,
} from "@angular/core";
import { FormField, form, type FormValueControl } from "@angular/forms/signals";
import type { AncestryDatabase } from "../database/ancestry.service";
import {
  newGedcomIndividual,
  type GedcomIndividual,
} from "../gedcom/gedcomIndividual";
import { InputChangeDateComponent } from "./input-change-date.component";
import { InputIndividualEventsComponent } from "./input-individual-events.component";
import { InputIndividualNamesComponent } from "./input-individual-names.component";
import { InputIndividualSexComponent } from "./input-individual-sex.component";
import { InputNotesComponent } from "./input-notes.component";
import { InputUnknownRecordsComponent } from "./input-unknown-records.component";

@Component({
  selector: "app-input-individual",
  imports: [
    FormField,
    InputIndividualEventsComponent,
    InputIndividualSexComponent,
    InputIndividualNamesComponent,
    InputUnknownRecordsComponent,
    InputNotesComponent,
    InputChangeDateComponent,
  ],
  templateUrl: "./input-individual.component.html",
  styleUrl: "./input.component.css",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InputIndividualComponent implements FormValueControl<GedcomIndividual> {
  readonly ancestryDatabase = input.required<AncestryDatabase>();
  readonly value = model<GedcomIndividual>(newGedcomIndividual(""));
  readonly form = form(this.value);
}
