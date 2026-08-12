import {
  ChangeDetectionStrategy,
  Component,
  input,
  model,
} from "@angular/core";
import { FormField, form, type FormValueControl } from "@angular/forms/signals";
import type { AncestryDatabase } from "../../database/ancestry.service";
import {
  gedcomEventTags,
  newGedcomEvent,
  type GedcomEvent,
} from "../../gedcom/gedcomEvent";
import { InputNotesComponent } from "./input-notes.component";
import { InputSharedWithComponent } from "./input-shared-with.component";
import { InputSourceCitationsComponent } from "./input-source-citations.component";

@Component({
  selector: "app-input-individual-events",
  imports: [
    FormField,
    InputSourceCitationsComponent,
    InputNotesComponent,
    InputSharedWithComponent,
  ],
  templateUrl: "./input-individual-events.component.html",
  styleUrl: "./input.component.css",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InputIndividualEventsComponent implements FormValueControl<
  GedcomEvent[]
> {
  readonly ancestryDatabase = input.required<AncestryDatabase>();
  readonly open = input<boolean>(false);
  readonly value = model<GedcomEvent[]>([]);
  readonly form = form(this.value);

  appendEvent() {
    const event = newGedcomEvent();
    this.value.update((events) => [...events, event]);
  }

  removeEvent(index: number) {
    this.value.update((events) => events.toSpliced(index, 1));
  }

  readonly gedcomEventTags = gedcomEventTags
    .entries()
    .toArray()
    .map(([tag, description]) => ({ tag, description }));
}
