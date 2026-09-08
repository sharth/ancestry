import { Component, input, model } from "@angular/core";
import { FormField, form, type FormValueControl } from "@angular/forms/signals";
import type { GedcomDatabase } from "../../gedcom/gedcomDatabase";
import { newGedcomFact, type GedcomFact } from "../../gedcom/gedcomFact";
import {
  gedcomIndividualAttributes,
  gedcomIndividualEvents,
} from "../../gedcom/gedcomFactMetadata";
import { InputNotesComponent } from "./input-notes.component";
import { InputSharedWithComponent } from "./input-shared-with.component";
import { InputSourceCitationsComponent } from "./input-source-citations.component";

@Component({
  selector: "app-input-individual-fact",
  imports: [
    FormField,
    InputSourceCitationsComponent,
    InputNotesComponent,
    InputSharedWithComponent,
  ],
  templateUrl: "./input-individual-fact.component.html",
  styleUrl: "./input.component.css",
})
export class InputIndividualFactComponent implements FormValueControl<GedcomFact> {
  readonly workingDatabase = input.required<GedcomDatabase>();
  readonly open = input<boolean>(false);
  readonly value = model<GedcomFact>(newGedcomFact());
  readonly form = form(this.value);

  focus(options?: FocusOptions) {
    this.form.tag().focusBoundControl(options);
  }

  readonly gedcomEventTags = Object.entries({
    ...gedcomIndividualEvents,
    ...gedcomIndividualAttributes,
  }).map(([tag, metadata]) => ({ tag, ...metadata }));
}
