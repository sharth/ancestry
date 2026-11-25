import { Component, input, model, inject } from "@angular/core";
import { FormField, form, type FormValueControl } from "@angular/forms/signals";

import type { GedcomDatabase } from "../../gedcom/gedcomDatabase";
import { newGedcomNote, type GedcomNote } from "../../gedcom/gedcomNote";
import { IdGenerator } from "../../util/id-generator";

@Component({
  selector: "app-input-notes",
  imports: [FormField],
  templateUrl: "./input-notes.component.html",
  styleUrl: "./input.component.css",
  host: { "[class.empty-list]": "form.length === 0" },
})
export class InputNotesComponent implements FormValueControl<GedcomNote[]> {
  readonly id = inject(IdGenerator).getId("input-notes");
  readonly workingDatabase = input.required<GedcomDatabase>();
  readonly value = model<GedcomNote[]>([]);
  readonly form = form(this.value);

  appendNote() {
    this.value.update((notes) => [...notes, newGedcomNote()]);
  }

  removeNote(index: number) {
    this.value.update((notes) => notes.toSpliced(index, 1));
  }
}
