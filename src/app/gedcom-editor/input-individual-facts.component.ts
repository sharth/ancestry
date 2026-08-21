import { Component, input, model } from "@angular/core";
import { FormField, form, type FormValueControl } from "@angular/forms/signals";
import type { AncestryDatabase } from "../../database/ancestry.service";
import { newGedcomFact, type GedcomFact } from "../../gedcom/gedcomFact";
import {
  gedcomIndividualAttributes,
  gedcomIndividualEvents,
} from "../../gedcom/gedcomFactMetadata";
import { InputIndividualFactComponent } from "./input-individual-fact.component";

@Component({
  selector: "app-input-individual-facts",
  imports: [FormField, InputIndividualFactComponent],
  templateUrl: "./input-individual-facts.component.html",
  styleUrl: "./input.component.css",
})
export class InputIndividualFactsComponent implements FormValueControl<
  GedcomFact[]
> {
  readonly ancestryDatabase = input.required<AncestryDatabase>();
  readonly open = input<boolean>(false);
  readonly value = model<GedcomFact[]>([]);
  readonly form = form(this.value);

  appendEvent() {
    const event = newGedcomFact();
    this.value.update((events) => [...events, event]);
  }

  removeEvent(index: number) {
    this.value.update((events) => events.toSpliced(index, 1));
  }

  readonly gedcomEventTags = Object.entries({
    ...gedcomIndividualAttributes,
    ...gedcomIndividualEvents,
  }).map(([tag, metadata]) => ({
    tag,
    description: metadata.humanReadableDescription,
  }));
}
