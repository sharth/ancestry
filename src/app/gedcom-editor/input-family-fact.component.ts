import { Component, input, model } from "@angular/core";
import { FormField, form, type FormValueControl } from "@angular/forms/signals";

import type { GedcomDatabase } from "../../gedcom/gedcomDatabase";
import { newGedcomFact, type GedcomFact } from "../../gedcom/gedcomFact";
import {
  gedcomFamilyAttributes,
  gedcomFamilyEvents,
} from "../../gedcom/gedcomFactMetadata";
import { InputNotesComponent } from "./input-notes.component";
import { InputSharedWithComponent } from "./input-shared-with.component";
import { InputSourceCitationsComponent } from "./input-source-citations.component";

@Component({
  selector: "app-input-family-fact",
  imports: [
    FormField,
    InputSourceCitationsComponent,
    InputNotesComponent,
    InputSharedWithComponent,
  ],
  templateUrl: "./input-family-fact.component.html",
  styleUrl: "./input.component.css",
})
export class InputFamilyFactComponent implements FormValueControl<GedcomFact> {
  readonly workingDatabase = input.required<GedcomDatabase>();
  readonly open = input<boolean>(true);
  readonly value = model<GedcomFact>(newGedcomFact());
  readonly form = form(this.value);

  focus(options?: FocusOptions) {
    this.form.tag().focusBoundControl(options);
  }

  readonly gedcomEventTags = Object.entries({
    ...gedcomFamilyEvents,
    ...gedcomFamilyAttributes,
  }).map(([tag, metadata]) => ({ tag, ...metadata }));
}
