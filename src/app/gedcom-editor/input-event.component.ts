import { Component, input, model } from "@angular/core";
import { FormField, form, type FormValueControl } from "@angular/forms/signals";
import type { AncestryDatabase } from "../../database/ancestry.service";
import { newGedcomEvent, type GedcomEvent } from "../../gedcom/gedcomEvent";
import {
  gedcomIndividualAttributes,
  gedcomIndividualEvents,
} from "../../gedcom/gedcomEventMetadata";
import { InputNotesComponent } from "./input-notes.component";
import { InputSharedWithComponent } from "./input-shared-with.component";
import { InputSourceCitationsComponent } from "./input-source-citations.component";

@Component({
  selector: "app-input-event",
  imports: [
    FormField,
    InputSourceCitationsComponent,
    InputNotesComponent,
    InputSharedWithComponent,
  ],
  templateUrl: "./input-event.component.html",
  styleUrl: "./input.component.css",
})
export class InputEventComponent implements FormValueControl<GedcomEvent> {
  readonly ancestryDatabase = input.required<AncestryDatabase>();
  readonly open = input<boolean>(false);
  readonly value = model<GedcomEvent>(newGedcomEvent());
  readonly form = form(this.value);

  readonly gedcomEventTags = Object.entries({
    ...gedcomIndividualEvents,
    ...gedcomIndividualAttributes,
  }).map(([tag, description]) => ({ tag, description }));
}
