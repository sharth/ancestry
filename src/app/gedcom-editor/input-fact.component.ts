import { Component, computed, input, model } from "@angular/core";
import { FormField, form, type FormValueControl } from "@angular/forms/signals";

import type { GedcomDatabase } from "../../gedcom/gedcomDatabase";
import { newGedcomFact, type GedcomFact } from "../../gedcom/gedcomFact";
import type { GedcomEventMetadata } from "../../gedcom/gedcomFactMetadata";
import { InputNotesComponent } from "./input-notes.component";
import { InputSharedWithComponent } from "./input-shared-with.component";
import { InputSourceCitationsComponent } from "./input-source-citations.component";

// Edits one fact (event or attribute) of an individual or a family. `tags`
// lists the fact types to offer, e.g. gedcomIndividualFacts.
@Component({
  selector: "app-input-fact",
  imports: [
    FormField,
    InputSourceCitationsComponent,
    InputNotesComponent,
    InputSharedWithComponent,
  ],
  templateUrl: "./input-fact.component.html",
  styleUrl: "./input.component.css",
})
export class InputFactComponent implements FormValueControl<GedcomFact> {
  readonly workingDatabase = input.required<GedcomDatabase>();
  readonly tags = input.required<Record<string, GedcomEventMetadata>>();
  readonly open = input<boolean>(true);
  readonly value = model<GedcomFact>(newGedcomFact());
  readonly form = form(this.value);

  focus(options?: FocusOptions) {
    this.form.tag().focusBoundControl(options);
  }

  readonly gedcomEventTags = computed(() =>
    Object.entries(this.tags())
      .map(([tag, metadata]) => ({ tag, ...metadata }))
      .sort((a, b) =>
        a.humanReadableDescription.localeCompare(b.humanReadableDescription),
      ),
  );
}
